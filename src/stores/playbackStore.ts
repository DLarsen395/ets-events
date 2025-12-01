import { create } from 'zustand';
import type { DataRangePreset } from '../services/tremor-api';

// Speed is now a number (days per second) - can be fractional for sub-day speeds
export type PlaybackSpeed = number;

// Compute fade duration based on speed: 1.2s at 1 day/s, scaling to 0.3s at 365 days/s
// Using logarithmic scale for smooth transition
export const getFadeOutDuration = (speed: PlaybackSpeed): number => {
  const minFade = 0.3;
  const maxFade = 1.2;
  // Clamp speed to avoid log(0) or negative values
  const clampedSpeed = Math.max(0.01, Math.min(speed, 365));
  const logSpeed = Math.log(clampedSpeed);
  const logMax = Math.log(365);
  const t = Math.max(0, logSpeed / logMax); // 0 to 1
  return maxFade - t * (maxFade - minFade);
};

// Custom date range stored in state for reactivity
export interface CustomDateRange {
  starttime: string;
  endtime: string;
}

interface PlaybackState {
  // Playback controls
  isPlaying: boolean;
  speed: PlaybackSpeed; // days per second
  
  // Time management
  currentTime: Date | null;
  startTime: Date | null;  // Earliest event in data
  endTime: Date | null;    // Latest event in data
  rangeStart: Date | null; // User-selected playback start (bracket slider)
  rangeEnd: Date | null;   // User-selected playback end (bracket slider)
  
  // Data range
  dataRangePreset: DataRangePreset;
  customDateRange: CustomDateRange | null;
  dataVersion: number; // Increment to force refetch even if preset unchanged
  
  // Display settings
  showAllEvents: boolean;  // toggle between playback mode and show-all mode
  
  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setCurrentTime: (time: Date) => void;
  setTimeRange: (start: Date, end: Date) => void;
  setRangeStart: (time: Date) => void;
  setRangeEnd: (time: Date) => void;
  setShowAllEvents: (show: boolean) => void;
  setDataRangePreset: (preset: DataRangePreset) => void;
  setCustomDateRange: (range: CustomDateRange) => void;
  forceRefetch: () => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  // Initial state
  isPlaying: false,
  speed: 1, // Default: 1 day per second (will be updated based on preset)
  currentTime: null,
  startTime: null,
  endTime: null,
  rangeStart: null,
  rangeEnd: null,
  dataRangePreset: 'lastWeek', // Default to last week
  customDateRange: null,
  dataVersion: 0,
  showAllEvents: true, // Start showing all events
  
  // Actions
  play: () => set((state) => {
    // If at end of range, restart from beginning
    const effectiveEnd = state.rangeEnd || state.endTime;
    const effectiveStart = state.rangeStart || state.startTime;
    if (state.currentTime && effectiveEnd && effectiveStart && 
        state.currentTime.getTime() >= effectiveEnd.getTime()) {
      return { isPlaying: true, showAllEvents: false, currentTime: effectiveStart };
    }
    return { isPlaying: true, showAllEvents: false };
  }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => {
    // If currently playing, just pause
    if (state.isPlaying) {
      return { isPlaying: false };
    }
    // If at end of range, restart from beginning
    const effectiveEnd = state.rangeEnd || state.endTime;
    const effectiveStart = state.rangeStart || state.startTime;
    if (state.currentTime && effectiveEnd && effectiveStart && 
        state.currentTime.getTime() >= effectiveEnd.getTime()) {
      return { isPlaying: true, showAllEvents: false, currentTime: effectiveStart };
    }
    return { isPlaying: true, showAllEvents: false };
  }),
  setSpeed: (speed) => set({ speed }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setTimeRange: (startTime, endTime) => set({ 
    startTime, 
    endTime, 
    rangeStart: startTime,
    rangeEnd: endTime,
    currentTime: startTime 
  }),
  setRangeStart: (rangeStart) => set((state) => ({ 
    rangeStart,
    currentTime: state.currentTime && state.currentTime < rangeStart ? rangeStart : state.currentTime
  })),
  setRangeEnd: (rangeEnd) => set((state) => ({
    rangeEnd,
    currentTime: state.currentTime && state.currentTime > rangeEnd ? rangeEnd : state.currentTime
  })),
  setShowAllEvents: (showAllEvents) => set({ showAllEvents, isPlaying: false }),
  setDataRangePreset: (dataRangePreset) => set((state) => ({ 
    dataRangePreset,
    dataVersion: state.dataVersion + 1 // Force refetch even if preset same
  })),
  setCustomDateRange: (customDateRange) => set({ customDateRange }),
  forceRefetch: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),
  reset: () => set((state) => ({ 
    isPlaying: false, 
    currentTime: state.rangeStart || state.startTime
    // Keep showAllEvents unchanged - just reset playhead
  })),
}));
