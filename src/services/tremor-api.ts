// PNSN Tremor API Service
// API Documentation: https://tremorapi.pnsn.org/

import type { ETSEventCollection } from '../types/event';

const API_BASE_URL = 'https://tremorapi.pnsn.org/api/v3.0/events';

export interface TremorAPIParams {
  starttime: string;
  endtime: string;
}

// Format date for API (ISO 8601 format required by PNSN API)
const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('.')[0];
};

// Fetch tremor events from PNSN API
export const fetchTremorEvents = async (params: TremorAPIParams): Promise<ETSEventCollection> => {
  const url = new URL(API_BASE_URL);
  url.searchParams.set('starttime', params.starttime);
  url.searchParams.set('endtime', params.endtime);
  url.searchParams.set('format', 'json');

  console.log('Fetching tremor data:', url.toString());

  const response = await fetch(url.toString());
  
  // 404 means no data for the time range - return empty collection
  if (response.status === 404) {
    console.log('No events found for the specified time range');
    return { type: 'FeatureCollection', features: [] };
  }
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data: ETSEventCollection = await response.json();
  console.log(`Loaded ${data.features?.length || 0} events from API`);
  return data;
};

// Preset time ranges
export type DataRangePreset = 'lastDay' | 'lastWeek' | 'lastMonth' | 'lastYear' | 'custom';

// Store for custom date range
let customDateRange: { starttime: string; endtime: string } | null = null;

export const setCustomDateRange = (starttime: string, endtime: string) => {
  customDateRange = { starttime, endtime };
};

export const getCustomDateRange = () => customDateRange;

// Get date range for a preset
export const getPresetDateRange = (preset: DataRangePreset): { starttime: string; endtime: string } => {
  const now = new Date();
  const endTime = now;
  let startTime: Date;

  switch (preset) {
    case 'lastDay':
      // Look back 24 hours - empty results are handled gracefully
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'lastWeek':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'lastMonth':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'lastYear':
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      if (customDateRange) {
        return customDateRange;
      }
      // Default to last week if no custom range set
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return {
    starttime: formatDateForAPI(startTime),
    endtime: formatDateForAPI(endTime),
  };
};

// Speed options configuration
export interface SpeedOption {
  value: number;  // days per second
  label: string;
}

// Get recommended speed for a preset (default speed when preset selected)
export const getRecommendedSpeed = (preset: DataRangePreset): number => {
  switch (preset) {
    case 'lastDay':
      return 0.0417; // 1 hour/s
    case 'lastWeek':
      return 1; // 1 day/s
    case 'lastMonth':
      return 7; // 1 week/s
    case 'lastYear':
      return 30; // 1 month/s
    case 'custom':
      return 7; // Default 1 week/s
    default:
      return 1;
  }
};

// Get speed options appropriate for the data range
export const getSpeedOptionsForRange = (preset: DataRangePreset): SpeedOption[] => {
  switch (preset) {
    case 'lastDay':
      return [
        { value: 0.0417, label: '1 hr/s' },
        { value: 0.125, label: '3 hr/s' },
        { value: 0.25, label: '6 hr/s' },
        { value: 0.5, label: '12 hr/s' },
        { value: 1, label: '1 day/s' },
      ];
    case 'lastWeek':
      return [
        { value: 0.25, label: '6 hr/s' },
        { value: 0.5, label: '12 hr/s' },
        { value: 1, label: '1 day/s' },
        { value: 2, label: '2 day/s' },
        { value: 7, label: '1 wk/s' },
      ];
    case 'lastMonth':
      return [
        { value: 1, label: '1 day/s' },
        { value: 3, label: '3 day/s' },
        { value: 7, label: '1 wk/s' },
        { value: 14, label: '2 wk/s' },
        { value: 30, label: '1 mo/s' },
      ];
    case 'lastYear':
      return [
        { value: 7, label: '1 wk/s' },
        { value: 14, label: '2 wk/s' },
        { value: 30, label: '1 mo/s' },
        { value: 60, label: '2 mo/s' },
        { value: 120, label: '4 mo/s' },
        { value: 180, label: '6 mo/s' },
        { value: 365, label: '12 mo/s' },
      ];
    case 'custom':
      return [
        { value: 1, label: '1 day/s' },
        { value: 7, label: '1 wk/s' },
        { value: 14, label: '2 wk/s' },
        { value: 30, label: '1 mo/s' },
        { value: 60, label: '2 mo/s' },
        { value: 120, label: '4 mo/s' },
        { value: 365, label: '12 mo/s' },
      ];
    default:
      return [
        { value: 1, label: '1 day/s' },
        { value: 7, label: '1 wk/s' },
        { value: 30, label: '1 mo/s' },
      ];
  }
};
