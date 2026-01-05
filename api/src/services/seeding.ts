/**
 * Database Seeding Service
 * Handles controlled initial population of historical earthquake data
 * with rate limiting to avoid hammering data providers
 */

import { sql } from 'kysely';
import { config } from '../config/index.js';
import { syncFromUSGS } from './usgs-sync.js';
import { getDb } from '../db/index.js';

export interface SeedingOptions {
  /** Start date for seeding (default: 1 year ago) */
  startDate?: Date;
  /** End date for seeding (default: now) */
  endDate?: Date;
  /** Minimum magnitude (default: 2.5 for efficiency) */
  minMagnitude?: number;
  /** Days per chunk (default: 30) */
  chunkDays?: number;
  /** Delay between chunks in ms (default: 2000) */
  delayMs?: number;
}

export interface SeedingProgress {
  status: 'idle' | 'running' | 'complete' | 'error';
  totalChunks: number;
  completedChunks: number;
  currentChunk?: {
    startDate: string;
    endDate: string;
  };
  totalEventsSeeded: number;
  startTime?: Date;
  estimatedCompletion?: Date;
  error?: string;
}

// Singleton state for tracking progress
let seedingProgress: SeedingProgress = {
  status: 'idle',
  totalChunks: 0,
  completedChunks: 0,
  totalEventsSeeded: 0,
};

/**
 * Get current seeding progress
 */
export function getSeedingProgress(): SeedingProgress {
  return { ...seedingProgress };
}

/**
 * Check if seeding is currently in progress
 */
export function isSeedingInProgress(): boolean {
  return seedingProgress.status === 'running';
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Seed the database with historical earthquake data
 * 
 * This function:
 * 1. Breaks the date range into chunks (default 30 days)
 * 2. Fetches each chunk sequentially with delays to avoid rate limiting
 * 3. Tracks progress for status reporting
 * 4. Can be safely interrupted (already-seeded data persists)
 */
export async function seedDatabase(options: SeedingOptions = {}): Promise<SeedingProgress> {
  if (isSeedingInProgress()) {
    throw new Error('Seeding already in progress');
  }

  const {
    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    endDate = new Date(),
    minMagnitude = 2.5, // Default to 2.5+ for efficiency
    chunkDays = config.usgs.seedChunkDays,
    delayMs = config.usgs.seedDelayMs,
  } = options;

  // Calculate chunks (working backwards from endDate to startDate)
  const chunks: Array<{ start: Date; end: Date }> = [];
  let chunkEnd = new Date(endDate);
  
  while (chunkEnd > startDate) {
    const chunkStart = new Date(chunkEnd);
    chunkStart.setDate(chunkStart.getDate() - chunkDays);
    
    // Don't go before startDate
    if (chunkStart < startDate) {
      chunkStart.setTime(startDate.getTime());
    }
    
    chunks.push({ start: chunkStart, end: chunkEnd });
    
    // Move to previous chunk
    chunkEnd = new Date(chunkStart);
  }

  // Reverse to process oldest first (more predictable)
  chunks.reverse();

  // Initialize progress
  seedingProgress = {
    status: 'running',
    totalChunks: chunks.length,
    completedChunks: 0,
    totalEventsSeeded: 0,
    startTime: new Date(),
  };

  console.log(`[Seeding] Starting database seed: ${chunks.length} chunks, ${minMagnitude}+ magnitude`);
  console.log(`[Seeding] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log(`[Seeding] Delay between chunks: ${delayMs}ms`);

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      seedingProgress.currentChunk = {
        startDate: chunk.start.toISOString(),
        endDate: chunk.end.toISOString(),
      };

      // Estimate completion time
      const elapsed = Date.now() - seedingProgress.startTime!.getTime();
      const avgTimePerChunk = i > 0 ? elapsed / i : delayMs + 5000; // Estimate 5s per chunk
      const remaining = (chunks.length - i) * avgTimePerChunk;
      seedingProgress.estimatedCompletion = new Date(Date.now() + remaining);

      console.log(`[Seeding] Chunk ${i + 1}/${chunks.length}: ${chunk.start.toISOString().split('T')[0]} to ${chunk.end.toISOString().split('T')[0]}`);

      // Fetch and store this chunk
      const eventsSeeded = await syncFromUSGS({
        startDate: chunk.start,
        endDate: chunk.end,
        minMagnitude,
      });

      seedingProgress.completedChunks = i + 1;
      seedingProgress.totalEventsSeeded += eventsSeeded;

      console.log(`[Seeding] Chunk ${i + 1} complete: ${eventsSeeded} events (total: ${seedingProgress.totalEventsSeeded})`);

      // Delay before next chunk (except for last chunk)
      if (i < chunks.length - 1) {
        console.log(`[Seeding] Waiting ${delayMs}ms before next chunk...`);
        await sleep(delayMs);
      }
    }

    seedingProgress.status = 'complete';
    seedingProgress.currentChunk = undefined;
    console.log(`[Seeding] Complete! Total events seeded: ${seedingProgress.totalEventsSeeded}`);

  } catch (error) {
    seedingProgress.status = 'error';
    seedingProgress.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Seeding] Error:', error);
  }

  return getSeedingProgress();
}

/**
 * Get database coverage statistics
 * Useful for determining what data is already seeded
 */
export async function getDatabaseCoverage(): Promise<{
  totalEvents: number;
  oldestEvent: Date | null;
  newestEvent: Date | null;
  countsByMagnitude: Array<{ range: string; count: number }>;
}> {
  const db = getDb();

  // Basic stats
  const stats = await db
    .selectFrom('earthquakes')
    .select(({ fn }) => [
      fn.count('id').as('totalEvents'),
      fn.min('time').as('oldestEvent'),
      fn.max('time').as('newestEvent'),
    ])
    .executeTakeFirst();

  // Counts by magnitude range using raw SQL for floor
  const magCounts = await db
    .selectFrom('earthquakes')
    .select([
      sql<number>`floor(magnitude)`.as('magFloor'),
      sql<number>`count(*)`.as('count'),
    ])
    .groupBy(sql`floor(magnitude)`)
    .orderBy(sql`floor(magnitude)`)
    .execute();

  // Handle date conversion properly
  let oldestEvent: Date | null = null;
  let newestEvent: Date | null = null;
  
  if (stats?.oldestEvent) {
    oldestEvent = stats.oldestEvent instanceof Date 
      ? stats.oldestEvent 
      : new Date(stats.oldestEvent as unknown as string);
  }
  if (stats?.newestEvent) {
    newestEvent = stats.newestEvent instanceof Date 
      ? stats.newestEvent 
      : new Date(stats.newestEvent as unknown as string);
  }

  return {
    totalEvents: Number(stats?.totalEvents || 0),
    oldestEvent,
    newestEvent,
    countsByMagnitude: magCounts.map((m) => ({
      range: `M${m.magFloor} to M${Number(m.magFloor) + 1}`,
      count: Number(m.count),
    })),
  };
}

/**
 * Cancel ongoing seeding (gracefully - will finish current chunk)
 */
export function cancelSeeding(): void {
  if (seedingProgress.status === 'running') {
    seedingProgress.status = 'idle';
    seedingProgress.error = 'Cancelled by user';
    console.log('[Seeding] Cancellation requested - will complete current chunk');
  }
}
