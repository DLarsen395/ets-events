import { create } from 'zustand';

export type PlaybackSpeed = 0.5 | 1 | 2 | 5 | 10 | 20;

interface PlaybackState {
  // Playback controls
  isPlaying: boolean;
  speed: PlaybackSpeed;
  
  // Time management
  currentTime: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  
  // Display settings
  fadeOutDuration: number; // seconds of real time before event fades
  showAllEvents: boolean;  // toggle between playback mode and show-all mode
  
  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setCurrentTime: (time: Date) => void;
  setTimeRange: (start: Date, end: Date) => void;
  setFadeOutDuration: (duration: number) => void;
  setShowAllEvents: (show: boolean) => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  // Initial state
  isPlaying: false,
  speed: 1,
  currentTime: null,
  startTime: null,
  endTime: null,
  fadeOutDuration: 30, // 30 seconds fade
  showAllEvents: true, // Start showing all events
  
  // Actions
  play: () => set({ isPlaying: true, showAllEvents: false }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ 
    isPlaying: !state.isPlaying,
    showAllEvents: state.isPlaying ? state.showAllEvents : false 
  })),
  setSpeed: (speed) => set({ speed }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setTimeRange: (startTime, endTime) => set({ startTime, endTime, currentTime: startTime }),
  setFadeOutDuration: (fadeOutDuration) => set({ fadeOutDuration }),
  setShowAllEvents: (showAllEvents) => set({ showAllEvents, isPlaying: false }),
  reset: () => set((state) => ({ 
    isPlaying: false, 
    currentTime: state.startTime,
    showAllEvents: true
  })),
}));
