/**
 * TypeScript types for Earthquake Charts feature
 * 
 * Core earthquake types are defined in the USGS API service.
 * This file contains chart-specific types and constants.
 */

// Re-export types from the service for convenience
export type {
  EarthquakeProperties,
  EarthquakeGeometry,
  EarthquakeFeature,
  USGSEarthquakeResponse,
  EarthquakeMetadata,
  GeoBounds,
  USRegion,
  EarthquakeQueryParams,
  DailyEarthquakeAggregate,
} from '../services/usgs-earthquake-api';

/**
 * Chart library options
 */
export type ChartLibrary = 'recharts' | 'chartjs';

/**
 * App view/page options
 */
export type AppView = 'ets-events' | 'earthquake-charts';

/**
 * Magnitude filter option
 */
export interface MagnitudeFilter {
  label: string;
  value: number | null;  // null = show all
}

/**
 * Available magnitude filter options
 */
export const MAGNITUDE_FILTERS: MagnitudeFilter[] = [
  { label: 'All Magnitudes', value: null },
  { label: 'M1.0+', value: 1.0 },
  { label: 'M2.0+', value: 2.0 },
  { label: 'M2.5+', value: 2.5 },
  { label: 'M3.0+', value: 3.0 },
  { label: 'M4.0+', value: 4.0 },
  { label: 'M4.5+', value: 4.5 },
  { label: 'M5.0+', value: 5.0 },
  { label: 'M6.0+', value: 6.0 },
];

/**
 * Time range options for earthquake queries
 */
export type TimeRange = '7days' | '30days' | '90days' | '365days';

/**
 * Time range configuration
 */
export interface TimeRangeOption {
  label: string;
  value: TimeRange;
  days: number;
}

/**
 * Available time range options
 */
export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: 'Last 7 Days', value: '7days', days: 7 },
  { label: 'Last 30 Days', value: '30days', days: 30 },
  { label: 'Last 90 Days', value: '90days', days: 90 },
  { label: 'Last Year', value: '365days', days: 365 },
];

/**
 * Region scope options
 */
export type RegionScope = 'us' | 'worldwide';

/**
 * Region scope configuration
 */
export interface RegionScopeOption {
  label: string;
  value: RegionScope;
}

/**
 * Available region scope options
 */
export const REGION_SCOPE_OPTIONS: RegionScopeOption[] = [
  { label: 'United States', value: 'us' },
  { label: 'Worldwide', value: 'worldwide' },
];
