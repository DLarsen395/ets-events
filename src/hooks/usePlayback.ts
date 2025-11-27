import { useEffect, useRef, useCallback } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';
import type { ETSEvent } from '../types/event';

// How many real-world milliseconds represent one day in playback
const MS_PER_DAY_AT_1X = 1000; // 1 second = 1 day at 1x speed

interface UsePlaybackProps {
  events: ETSEvent[];
  onFilteredEventsChange: (events: ETSEvent[], currentTime: Date | null) => void;
}

export const usePlayback = ({ events, onFilteredEventsChange }: UsePlaybackProps) => {
  const { 
    isPlaying, 
    speed, 
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
    const fadeWindowMs = fadeOutDuration * 24 * 60 * 60 * 1000; // fadeOutDuration in days
    const windowStart = currentMs - fadeWindowMs;

    return events.filter(event => {
      const eventTime = new Date(event.properties.time).getTime();
      return eventTime <= currentMs && eventTime >= windowStart;
    });
  }, [events, currentTime, fadeOutDuration, showAllEvents]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !currentTime || !endTime) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;

      // Calculate time advancement
      // At 1x speed: 1 real second = 1 day of event time
      const daysAdvanced = (deltaMs / MS_PER_DAY_AT_1X) * speed;
      const msAdvanced = daysAdvanced * 24 * 60 * 60 * 1000;

      const newTime = new Date(currentTime.getTime() + msAdvanced);

      if (newTime >= endTime) {
        setCurrentTime(endTime);
        usePlaybackStore.getState().pause();
      } else {
        setCurrentTime(newTime);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTickRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTime, endTime, speed, setCurrentTime]);

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
