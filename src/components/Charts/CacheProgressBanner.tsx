/**
 * Cache Progress Banner
 * Shows progress when earthquake data is being fetched and cached
 */

import { useState, useEffect, useRef } from 'react';
import { useCacheStore } from '../../stores/cacheStore';

export function CacheProgressBanner() {
  const { progress, isEnabled } = useCacheStore();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Update elapsed time every second while processing
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (progress.operation !== 'idle' && progress.startedAt) {
      // Start a new interval
      intervalRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - progress.startedAt!) / 1000));
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [progress.operation, progress.startedAt]);
  
  // Don't show if cache disabled or idle
  if (!isEnabled || progress.operation === 'idle') {
    return null;
  }
  
  // Calculate percentage
  const percentage = progress.totalSteps > 0
    ? Math.round((progress.currentStep / progress.totalSteps) * 100)
    : 0;
  
  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: '1.25rem',
          height: '1.25rem',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderTopColor: '#60a5fa',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          flexShrink: 0,
        }}
      />
      
      {/* Progress info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#93c5fd', fontSize: '0.875rem', fontWeight: 500 }}>
            {progress.operation === 'fetching' ? 'Fetching' : 
             progress.operation === 'storing' ? 'Caching' : 
             progress.operation === 'validating' ? 'Validating' : 'Processing'}
          </span>
          {progress.currentDate && (
            <span style={{ color: '#60a5fa', fontSize: '0.75rem' }}>
              {progress.currentDate}
            </span>
          )}
        </div>
        
        {/* Progress bar */}
        {progress.totalSteps > 0 && (
          <div
            style={{
              marginTop: '0.375rem',
              height: '4px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: '#60a5fa',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        )}
      </div>
      
      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
        {progress.totalSteps > 0 && (
          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            {progress.currentStep}/{progress.totalSteps} ({percentage}%)
          </span>
        )}
        {elapsed > 0 && (
          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
            {elapsed}s
          </span>
        )}
      </div>
      
      {/* Animation keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
