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
  
  // Filter settings - now with min AND max magnitude
  minMagnitude: number;
  maxMagnitude: number;
  timeRange: TimeRange;
  regionScope: RegionScope;
  
  // Chart settings
  chartLibrary: ChartLibrary;
  
  // Actions
  setMinMagnitude: (mag: number) => void;
  setMaxMagnitude: (mag: number) => void;
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

/**
 * Fetch data in chunks to avoid API limits for large date ranges
 * USGS API can return max 20000 events per query
 */
async function fetchInChunks(
  startDate: Date,
  endDate: Date,
  regionScope: RegionScope,
  minMagnitude: number,
  maxMagnitude: number | undefined,
): Promise<EarthquakeFeature[]> {
  const allFeatures: EarthquakeFeature[] = [];
  const seenIds = new Set<string>();
  
  // Calculate total days
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  
  // Determine chunk size based on magnitude filter
  // Higher min magnitude = fewer events = larger chunks possible
  let chunkSizeDays: number;
  if (minMagnitude >= 5) {
    chunkSizeDays = 365; // Very few events, can do full year
  } else if (minMagnitude >= 4) {
    chunkSizeDays = 180; // Few events
  } else if (minMagnitude >= 3) {
    chunkSizeDays = 90;
  } else if (minMagnitude >= 2) {
    chunkSizeDays = 30;
  } else {
    chunkSizeDays = 14; // Many events for low magnitudes
  }
  
  // If total days <= chunk size, just do one request
  if (totalDays <= chunkSizeDays) {
    const fetchFn = regionScope === 'us' ? fetchUSGSEarthquakes : fetchWorldwideEarthquakes;
    const response = await fetchFn({
      starttime: startDate,
      endtime: endDate,
      minmagnitude: minMagnitude > -2 ? minMagnitude : undefined,
      maxmagnitude: maxMagnitude && maxMagnitude < 10 ? maxMagnitude : undefined,
      limit: 20000,
    });
    return response.features;
  }
  
  // Split into chunks
  let chunkStart = new Date(startDate);
  const fetchFn = regionScope === 'us' ? fetchUSGSEarthquakes : fetchWorldwideEarthquakes;
  
  while (chunkStart < endDate) {
    const chunkEnd = new Date(Math.min(
      chunkStart.getTime() + chunkSizeDays * 24 * 60 * 60 * 1000,
      endDate.getTime()
    ));
    
    console.log(`Fetching chunk: ${chunkStart.toISOString().split('T')[0]} to ${chunkEnd.toISOString().split('T')[0]}`);
    
    try {
      const response = await fetchFn({
        starttime: chunkStart,
        endtime: chunkEnd,
        minmagnitude: minMagnitude > -2 ? minMagnitude : undefined,
        maxmagnitude: maxMagnitude && maxMagnitude < 10 ? maxMagnitude : undefined,
        limit: 20000,
      });
      
      // Deduplicate as we go
      for (const feature of response.features) {
        if (!seenIds.has(feature.id)) {
          seenIds.add(feature.id);
          allFeatures.push(feature);
        }
      }
      
      // Small delay between requests to be nice to the API
      if (chunkEnd < endDate) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (err) {
      console.error(`Error fetching chunk ${chunkStart.toISOString()} to ${chunkEnd.toISOString()}:`, err);
      throw err;
    }
    
    chunkStart = chunkEnd;
  }
  
  // Sort by time descending (most recent first)
  allFeatures.sort((a, b) => b.properties.time - a.properties.time);
  
  return allFeatures;
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
  
  // Default filter settings - now M4+ to M9+ (no upper limit)
  minMagnitude: 4,
  maxMagnitude: 10,  // 10 = no upper limit
  timeRange: '7days',  // Default to 7 days for fast initial load
  regionScope: 'us',
  
  // Default chart settings
  chartLibrary: 'recharts',
  
  // View setter
  setCurrentView: (view) => set({ currentView: view }),
  
  // Filter setters - refetch when filters change
  setMinMagnitude: (mag) => {
    const { maxMagnitude } = get();
    // Ensure min doesn't exceed max
    if (mag > maxMagnitude) {
      set({ minMagnitude: mag, maxMagnitude: mag });
    } else {
      set({ minMagnitude: mag });
    }
    get().fetchEarthquakes();
  },
  
  setMaxMagnitude: (mag) => {
    const { minMagnitude } = get();
    // Ensure max doesn't go below min
    if (mag < minMagnitude) {
      set({ maxMagnitude: mag, minMagnitude: mag });
    } else {
      set({ maxMagnitude: mag });
    }
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
    const { minMagnitude, maxMagnitude, timeRange, regionScope } = get();
    
    set({ isLoading: true, error: null });
    
    try {
      const days = getTimeRangeDays(timeRange);
      const startTime = subDays(new Date(), days);
      const endTime = new Date();
      
      console.log(`Fetching earthquakes: ${days} days, M${minMagnitude} to M${maxMagnitude}, ${regionScope}`);
      
      // Use chunked fetching for large date ranges or low magnitude thresholds
      const earthquakes = await fetchInChunks(
        startTime,
        endTime,
        regionScope,
        minMagnitude,
        maxMagnitude,
      );
      
      const dailyAggregates = aggregateEarthquakesByDay(earthquakes);
      const summary = getEarthquakeSummary(earthquakes);
      
      console.log(`Fetched ${earthquakes.length} earthquakes`);
      
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
