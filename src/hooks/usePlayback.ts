import { useEffect, useRef, useCallback } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';
import type { ETSEvent } from '../types/event';

// Milliseconds per day
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface UsePlaybackProps {
  events: ETSEvent[];
  onFilteredEventsChange: (events: ETSEvent[], currentTime: Date | null) => void;
}

export const usePlayback = ({ events, onFilteredEventsChange }: UsePlaybackProps) => {
  const { 
    isPlaying, 
    speed,  // Now represents days per second
    currentTime, 
    startTime, 
    endTime,
    fadeOutDuration,
    showAllEvents,
    setCurrentTime, 
    setTimeRange 
  } = usePlaybackStore();
  
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  
  // Use refs for values that change during animation to avoid effect restarts
  const currentTimeRef = useRef(currentTime);
  const endTimeRef = useRef(endTime);
  const speedRef = useRef(speed);
  
  // Keep refs in sync
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { endTimeRef.current = endTime; }, [endTime]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Initialize time range from events
  useEffect(() => {
    if (events.length === 0) return;
    
    const times = events
      .map(e => new Date(e.properties.time).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    
    if (times.length > 0) {
      const start = new Date(times[0]);
      const end = new Date(times[times.length - 1]);
      setTimeRange(start, end);
    }
  }, [events, setTimeRange]);

  // Filter events based on current playback time
  const getFilteredEvents = useCallback(() => {
    if (showAllEvents || !currentTime) {
      return events;
    }

    const currentMs = currentTime.getTime();
    // Fade window: events visible from (currentTime - fadeOutDuration days) to currentTime
    const fadeWindowMs = fadeOutDuration * MS_PER_DAY;
    const windowStart = currentMs - fadeWindowMs;

    return events.filter(event => {
      const eventTime = new Date(event.properties.time).getTime();
      return eventTime <= currentMs && eventTime >= windowStart;
    });
  }, [events, currentTime, fadeOutDuration, showAllEvents]);

  // Animation loop - only restart when isPlaying changes
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentT = currentTimeRef.current;
      const endT = endTimeRef.current;
      const spd = speedRef.current;

      if (!currentT || !endT) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaMs = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;

      // Calculate time advancement
      // speed = days per second
      const secondsElapsed = deltaMs / 1000;
      const daysAdvanced = secondsElapsed * spd;
      const msAdvanced = daysAdvanced * MS_PER_DAY;

      const newTime = new Date(currentT.getTime() + msAdvanced);

      if (newTime >= endT) {
        setCurrentTime(endT);
        usePlaybackStore.getState().pause();
      } else {
        setCurrentTime(newTime);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    lastTickRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, setCurrentTime]);

  // Update filtered events when playback state changes
  useEffect(() => {
    const filtered = getFilteredEvents();
    onFilteredEventsChange(filtered, showAllEvents ? null : currentTime);
  }, [currentTime, showAllEvents, getFilteredEvents, onFilteredEventsChange]);

  return {
    currentTime,
    startTime,
    endTime,
    isPlaying,
    speed,
    showAllEvents,
    filteredEvents: getFilteredEvents(),
  };
};
