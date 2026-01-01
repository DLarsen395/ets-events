/**
 * Zustand store for earthquake cache state and progress
 */

import { create } from 'zustand';
import type { CacheProgress, CacheInfo } from '../services/earthquake-cache';
import { 
  getCacheInfo, 
  getCacheStats, 
  clearCache, 
  clearStaleData 
} from '../services/earthquake-cache';

interface CacheStats {
  totalEvents: number;
  historicalEvents: number;
  recentEvents: number;
  totalDays: number;
  staleDays: number;
  sizeEstimateKB: number;
}

interface CacheStore {
  // Cache state
  isEnabled: boolean;
  info: CacheInfo | null;
  stats: CacheStats | null;
  
  // Progress tracking
  progress: CacheProgress;
  
  // Actions
  setEnabled: (enabled: boolean) => void;
  setProgress: (progress: CacheProgress) => void;
  refreshInfo: () => Promise<void>;
  refreshStats: () => Promise<void>;
  clearAllCache: () => Promise<void>;
  clearStale: () => Promise<number>;
}

const initialProgress: CacheProgress = {
  operation: 'idle',
  currentStep: 0,
  totalSteps: 0,
  message: '',
  startedAt: null,
};

export const useCacheStore = create<CacheStore>((set, get) => ({
  // Initial state
  isEnabled: true,
  info: null,
  stats: null,
  progress: initialProgress,
  
  // Actions
  setEnabled: (enabled) => set({ isEnabled: enabled }),
  
  setProgress: (progress) => set({ progress }),
  
  refreshInfo: async () => {
    try {
      const info = await getCacheInfo();
      set({ info });
    } catch (error) {
      console.error('Failed to get cache info:', error);
    }
  },
  
  refreshStats: async () => {
    try {
      const stats = await getCacheStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  },
  
  clearAllCache: async () => {
    try {
      set({ 
        progress: { 
          ...initialProgress, 
          operation: 'validating', 
          message: 'Clearing cache...' 
        } 
      });
      
      await clearCache();
      
      set({ 
        info: null, 
        stats: null, 
        progress: initialProgress 
      });
      
      // Refresh to get updated empty state
      await get().refreshInfo();
      await get().refreshStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      set({ progress: initialProgress });
    }
  },
  
  clearStale: async () => {
    try {
      set({ 
        progress: { 
          ...initialProgress, 
          operation: 'validating', 
          message: 'Clearing stale data...' 
        } 
      });
      
      const cleared = await clearStaleData();
      
      set({ progress: initialProgress });
      
      // Refresh stats
      await get().refreshStats();
      
      return cleared;
    } catch (error) {
      console.error('Failed to clear stale data:', error);
      set({ progress: initialProgress });
      return 0;
    }
  },
}));
