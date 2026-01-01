/**
 * Zustand store for earthquake data and chart settings
 */

import { create } from 'zustand';
import { subDays } from 'date-fns';
import type { 
  EarthquakeFeature, 
  DailyEarthquakeAggregate,
} from '../services/usgs-earthquake-api';
import type { 
  ChartLibrary, 
  TimeRange, 
  RegionScope,
  AppView,
} from '../types/earthquake';
import { 
  fetchUSGSEarthquakes, 
  fetchWorldwideEarthquakes,
  aggregateEarthquakesByDay,
  getEarthquakeSummary,
} from '../services/usgs-earthquake-api';

interface EarthquakeSummary {
  total: number;
  avgMagnitude: number;
  maxMagnitude: number;
  minMagnitude: number;
  avgDepth: number;
  maxDepth: number;
  dateRange: { start: Date; end: Date } | null;
  largestEvent: EarthquakeFeature | null;
}

interface EarthquakeStore {
  // Current app view
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  
  // Earthquake data
  earthquakes: EarthquakeFeature[];
  dailyAggregates: DailyEarthquakeAggregate[];
  summary: EarthquakeSummary | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
  
  // Filter settings
  minMagnitude: number | null;  // null = all magnitudes
  timeRange: TimeRange;
  regionScope: RegionScope;
  
  // Chart settings
  chartLibrary: ChartLibrary;
  
  // Actions
  setMinMagnitude: (mag: number | null) => void;
  setTimeRange: (range: TimeRange) => void;
  setRegionScope: (scope: RegionScope) => void;
  setChartLibrary: (library: ChartLibrary) => void;
  
  // Data fetching
  fetchEarthquakes: () => Promise<void>;
  refreshData: () => Promise<void>;
}

/**
 * Get number of days for a time range
 */
function getTimeRangeDays(range: TimeRange): number {
  switch (range) {
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
    case '365days': return 365;
    default: return 30;
  }
}

export const useEarthquakeStore = create<EarthquakeStore>((set, get) => ({
  // Initial state
  currentView: 'ets-events',
  earthquakes: [],
  dailyAggregates: [],
  summary: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  
  // Default filter settings
  minMagnitude: 2.5,  // Default to M2.5+
  timeRange: '30days',
  regionScope: 'us',
  
  // Default chart settings
  chartLibrary: 'recharts',
  
  // View setter
  setCurrentView: (view) => set({ currentView: view }),
  
  // Filter setters
  setMinMagnitude: (mag) => {
    set({ minMagnitude: mag });
    // Refetch when filter changes
    get().fetchEarthquakes();
  },
  
  setTimeRange: (range) => {
    set({ timeRange: range });
    get().fetchEarthquakes();
  },
  
  setRegionScope: (scope) => {
    set({ regionScope: scope });
    get().fetchEarthquakes();
  },
  
  // Chart settings setter
  setChartLibrary: (library) => set({ chartLibrary: library }),
  
  // Fetch earthquake data based on current filters
  fetchEarthquakes: async () => {
    const { minMagnitude, timeRange, regionScope } = get();
    
    set({ isLoading: true, error: null });
    
    try {
      const days = getTimeRangeDays(timeRange);
      const startTime = subDays(new Date(), days);
      const endTime = new Date();
      
      let response;
      
      if (regionScope === 'us') {
        response = await fetchUSGSEarthquakes({
          starttime: startTime,
          endtime: endTime,
          minmagnitude: minMagnitude ?? undefined,
        });
      } else {
        response = await fetchWorldwideEarthquakes({
          starttime: startTime,
          endtime: endTime,
          minmagnitude: minMagnitude ?? undefined,
          limit: 20000,  // Higher limit for worldwide
        });
      }
      
      const earthquakes = response.features;
      const dailyAggregates = aggregateEarthquakesByDay(earthquakes);
      const summary = getEarthquakeSummary(earthquakes);
      
      set({
        earthquakes,
        dailyAggregates,
        summary,
        isLoading: false,
        lastFetched: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch earthquake data';
      set({
        error: message,
        isLoading: false,
      });
      console.error('Error fetching earthquakes:', err);
    }
  },
  
  // Force refresh data
  refreshData: async () => {
    await get().fetchEarthquakes();
  },
}));
