                                                                                                                                                                                                                                                                                                                                                                                                                                              /**
 * IndexedDB Cache Service for Earthquake Data
 * 
 * Caching Strategy:
 * - Historical data (> 4 weeks old): Cached permanently until manually cleared
 * - Recent data (< 4 weeks old): Has 24-hour freshness window
 * - Data is stored in daily chunks for efficient retrieval and updates
 * 
 * Schema:
 * - earthquakes: Individual earthquake events keyed by USGS ID
 * - dailyMeta: Metadata about what days have been fetched and when
 * - cacheInfo: Global cache statistics and status
 */

import { openDB, type IDBPDatabase } from 'idb';
import { subDays, startOfDay, format } from 'date-fns';
import type { EarthquakeFeature } from './usgs-earthquake-api';

// =============================================================================
// Types
// =============================================================================

export interface DailyMeta {
  /** Date string in YYYY-MM-DD format */
  date: string;
  /** When this day's data was last fetched */
  fetchedAt: number;
  /** Number of events for this day */
  eventCount: number;
  /** Min magnitude filter used when fetching */
  minMagnitude: number;
  /** Max magnitude filter used when fetching */
  maxMagnitude: number;
  /** Region scope used when fetching */
  regionScope: 'us' | 'worldwide';
}

export interface CacheInfo {
  /** Total number of cached events */
  totalEvents: number;
  /** Oldest cached date */
  oldestDate: string | null;
  /** Newest cached date */
  newestDate: string | null;
  /** Last time cache was updated */
  lastUpdated: number | null;
  /** Cache version for migrations */
  version: number;
}

export interface CacheProgress {
  /** Current operation */
  operation: 'idle' | 'fetching' | 'storing' | 'validating';
  /** Current step in multi-step operation */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Human-readable message */
  message: string;
  /** Timestamp when operation started */
  startedAt: number | null;
  /** Current date being processed */
  currentDate?: string;
}

export interface CacheQuery {
  startDate: Date;
  endDate: Date;
  minMagnitude: number;
  maxMagnitude: number;
  regionScope: 'us' | 'worldwide';
}

export interface CacheResult {
  /** Earthquakes from cache */
  earthquakes: EarthquakeFeature[];
  /** Days that need fetching (not in cache or stale) */
  staleDays: string[];
  /** Days that were served from cache */
  cachedDays: string[];
  /** Whether all requested data was in cache */
  isComplete: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DB_NAME = 'earthquake-cache';
const DB_VERSION = 1;

/** Days before today where data is considered "historical" and cached permanently */
const HISTORICAL_THRESHOLD_DAYS = 28;

/** Maximum age in hours for "recent" data before it's considered stale */
const RECENT_DATA_MAX_AGE_HOURS = 24;

// =============================================================================
// Database Setup
// =============================================================================

interface EarthquakeCacheDB {
  earthquakes: {
    key: string;
    value: EarthquakeFeature & { 
      _cacheDate: string;  // YYYY-MM-DD for indexing
      _cachedAt: number;   // When this event was cached
    };
    indexes: {
      'by-date': string;
      'by-time': number;
    };
  };
  dailyMeta: {
    key: string;  // Format: YYYY-MM-DD|region|minMag|maxMag
    value: DailyMeta;
    indexes: {
      'by-date': string;
    };
  };
  cacheInfo: {
    key: string;
    value: CacheInfo;
  };
}

let dbPromise: Promise<IDBPDatabase<EarthquakeCacheDB>> | null = null;

/**
 * Get or create the database connection
 */
async function getDB(): Promise<IDBPDatabase<EarthquakeCacheDB>> {
  if (!dbPromise) {
    dbPromise = openDB<EarthquakeCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Earthquakes store
        if (!db.objectStoreNames.contains('earthquakes')) {
          const eqStore = db.createObjectStore('earthquakes', { keyPath: 'id' });
          eqStore.createIndex('by-date', '_cacheDate');
          eqStore.createIndex('by-time', 'properties.time');
        }
        
        // Daily metadata store
        if (!db.objectStoreNames.contains('dailyMeta')) {
          const metaStore = db.createObjectStore('dailyMeta', { keyPath: 'date' });
          metaStore.createIndex('by-date', 'date');
        }
        
        // Cache info store
        if (!db.objectStoreNames.contains('cacheInfo')) {
          db.createObjectStore('cacheInfo');
        }
      },
    });
  }
  return dbPromise;
}

// =============================================================================
// Cache Key Helpers
// =============================================================================

/**
 * Generate a unique key for daily metadata based on query parameters
 */
function getDailyMetaKey(date: string, regionScope: string, minMag: number, maxMag: number): string {
  return `${date}|${regionScope}|${minMag}|${maxMag}`;
}

/**
 * Get date string from earthquake timestamp
 */
function getDateFromTimestamp(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd');
}

/**
 * Check if a date is in the "historical" range (older than threshold)
 */
function isHistoricalDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const threshold = subDays(startOfDay(new Date()), HISTORICAL_THRESHOLD_DAYS);
  return date < threshold;
}

/**
 * Check if cached data is stale based on when it was fetched
 */
function isDataStale(fetchedAt: number, dateStr: string): boolean {
  // Historical data never goes stale
  if (isHistoricalDate(dateStr)) {
    return false;
  }
  
  // Recent data is stale after 24 hours
  const hoursSinceFetch = (Date.now() - fetchedAt) / (1000 * 60 * 60);
  return hoursSinceFetch > RECENT_DATA_MAX_AGE_HOURS;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Query the cache for earthquakes matching the given criteria
 */
export async function queryCache(query: CacheQuery): Promise<CacheResult> {
  const db = await getDB();
  const { startDate, endDate, minMagnitude, maxMagnitude, regionScope } = query;
  
  const earthquakes: EarthquakeFeature[] = [];
  const staleDays: string[] = [];
  const cachedDays: string[] = [];
  
  // Generate list of days to check
  const days: string[] = [];
  let current = startOfDay(startDate);
  const end = startOfDay(endDate);
  
  while (current <= end) {
    days.push(format(current, 'yyyy-MM-dd'));
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  
  // Check each day's metadata
  for (const day of days) {
    const metaKey = getDailyMetaKey(day, regionScope, minMagnitude, maxMagnitude);
    const meta = await db.get('dailyMeta', metaKey);
    
    if (!meta || isDataStale(meta.fetchedAt, day)) {
      staleDays.push(day);
    } else {
      cachedDays.push(day);
      
      // Get earthquakes for this day from cache
      const dayEarthquakes = await db.getAllFromIndex('earthquakes', 'by-date', day);
      
      // Filter by magnitude range and add to results
      for (const eq of dayEarthquakes) {
        const mag = eq.properties.mag ?? 0;
        if (mag >= minMagnitude && mag <= maxMagnitude) {
          earthquakes.push(eq);
        }
      }
    }
  }
  
  return {
    earthquakes,
    staleDays,
    cachedDays,
    isComplete: staleDays.length === 0,
  };
}

/**
 * Store earthquakes in the cache
 */
export async function storeEarthquakes(
  earthquakes: EarthquakeFeature[],
  query: CacheQuery,
  onProgress?: (progress: CacheProgress) => void
): Promise<void> {
  const db = await getDB();
  const { minMagnitude, maxMagnitude, regionScope } = query;
  
  // Group earthquakes by date
  const byDate = new Map<string, EarthquakeFeature[]>();
  
  for (const eq of earthquakes) {
    const dateStr = getDateFromTimestamp(eq.properties.time);
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, []);
    }
    byDate.get(dateStr)!.push(eq);
  }
  
  const dates = Array.from(byDate.keys()).sort();
  let step = 0;
  const totalSteps = dates.length;
  
  // Store earthquakes and update metadata for each day
  const tx = db.transaction(['earthquakes', 'dailyMeta'], 'readwrite');
  
  for (const dateStr of dates) {
    step++;
    
    onProgress?.({
      operation: 'storing',
      currentStep: step,
      totalSteps,
      message: `Caching ${dateStr}...`,
      startedAt: Date.now(),
      currentDate: dateStr,
    });
    
    const dayEarthquakes = byDate.get(dateStr)!;
    const now = Date.now();
    
    // Store each earthquake
    for (const eq of dayEarthquakes) {
      await tx.objectStore('earthquakes').put({
        ...eq,
        _cacheDate: dateStr,
        _cachedAt: now,
      });
    }
    
    // Update daily metadata
    const metaKey = getDailyMetaKey(dateStr, regionScope, minMagnitude, maxMagnitude);
    await tx.objectStore('dailyMeta').put({
      date: metaKey,
      fetchedAt: now,
      eventCount: dayEarthquakes.length,
      minMagnitude,
      maxMagnitude,
      regionScope,
    });
  }
  
  await tx.done;
  
  // Update global cache info
  await updateCacheInfo();
}

/**
 * Get cache statistics
 */
export async function getCacheInfo(): Promise<CacheInfo> {
  const db = await getDB();
  const info = await db.get('cacheInfo', 'main');
  
  return info ?? {
    totalEvents: 0,
    oldestDate: null,
    newestDate: null,
    lastUpdated: null,
    version: DB_VERSION,
  };
}

/**
 * Update global cache statistics
 */
async function updateCacheInfo(): Promise<void> {
  const db = await getDB();
  
  // Count total events
  const totalEvents = await db.count('earthquakes');
  
  // Get date range from index
  let oldestDate: string | null = null;
  let newestDate: string | null = null;
  
  const dateIndex = db.transaction('earthquakes').store.index('by-date');
  const oldestCursor = await dateIndex.openCursor();
  if (oldestCursor) {
    oldestDate = oldestCursor.value._cacheDate;
  }
  
  const newestCursor = await dateIndex.openCursor(null, 'prev');
  if (newestCursor) {
    newestDate = newestCursor.value._cacheDate;
  }
  
  await db.put('cacheInfo', {
    totalEvents,
    oldestDate,
    newestDate,
    lastUpdated: Date.now(),
    version: DB_VERSION,
  }, 'main');
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  const db = await getDB();
  
  const tx = db.transaction(['earthquakes', 'dailyMeta', 'cacheInfo'], 'readwrite');
  await tx.objectStore('earthquakes').clear();
  await tx.objectStore('dailyMeta').clear();
  await tx.objectStore('cacheInfo').clear();
  await tx.done;
}

/**
 * Clear stale data from cache (recent data older than 24 hours)
 */
export async function clearStaleData(): Promise<number> {
  const db = await getDB();
  const threshold = subDays(startOfDay(new Date()), HISTORICAL_THRESHOLD_DAYS);
  const thresholdStr = format(threshold, 'yyyy-MM-dd');
  
  let clearedCount = 0;
  
  // Get all daily metadata
  const allMeta = await db.getAll('dailyMeta');
  
  const tx = db.transaction(['earthquakes', 'dailyMeta'], 'readwrite');
  
  for (const meta of allMeta) {
    // Extract date from the key (format: YYYY-MM-DD|region|minMag|maxMag)
    const dateStr = meta.date.split('|')[0];
    
    // Only check non-historical dates
    if (dateStr >= thresholdStr && isDataStale(meta.fetchedAt, dateStr)) {
      // Delete metadata
      await tx.objectStore('dailyMeta').delete(meta.date);
      
      // Delete earthquakes for this date
      const earthquakes = await db.getAllFromIndex('earthquakes', 'by-date', dateStr);
      for (const eq of earthquakes) {
        await tx.objectStore('earthquakes').delete(eq.id);
        clearedCount++;
      }
    }
  }
  
  await tx.done;
  await updateCacheInfo();
  
  return clearedCount;
}

/**
 * Get cache statistics summary
 */
export async function getCacheStats(): Promise<{
  totalEvents: number;
  historicalEvents: number;
  recentEvents: number;
  totalDays: number;
  staleDays: number;
  sizeEstimateKB: number;
}> {
  const db = await getDB();
  const threshold = subDays(startOfDay(new Date()), HISTORICAL_THRESHOLD_DAYS);
  const thresholdStr = format(threshold, 'yyyy-MM-dd');
  
  let historicalEvents = 0;
  let recentEvents = 0;
  let staleDays = 0;
  
  // Count events by date category
  const allMeta = await db.getAll('dailyMeta');
  const seenDates = new Set<string>();
  
  for (const meta of allMeta) {
    const dateStr = meta.date.split('|')[0];
    
    if (!seenDates.has(dateStr)) {
      seenDates.add(dateStr);
      
      if (dateStr < thresholdStr) {
        historicalEvents += meta.eventCount;
      } else {
        recentEvents += meta.eventCount;
        if (isDataStale(meta.fetchedAt, dateStr)) {
          staleDays++;
        }
      }
    }
  }
  
  // Estimate size (rough: ~500 bytes per event)
  const totalEvents = historicalEvents + recentEvents;
  const sizeEstimateKB = Math.round((totalEvents * 500) / 1024);
  
  return {
    totalEvents,
    historicalEvents,
    recentEvents,
    totalDays: seenDates.size,
    staleDays,
    sizeEstimateKB,
  };
}
