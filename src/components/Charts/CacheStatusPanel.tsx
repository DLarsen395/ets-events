/**
 * Cache Status Panel
 * Shows cache statistics and management controls
 */

import { useEffect } from 'react';
import { useCacheStore } from '../../stores/cacheStore';
import { format } from 'date-fns';

export function CacheStatusPanel() {
  const { 
    isEnabled, 
    stats, 
    info, 
    setEnabled, 
    refreshStats, 
    clearAllCache, 
    clearStale,
    progress,
  } = useCacheStore();
  
  // Refresh stats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);
  
  const isProcessing = progress.operation !== 'idle';
  
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        borderRadius: '0.5rem',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.75rem',
      }}>
        <h3 style={{ 
          color: '#d1d5db', 
          fontSize: '0.875rem', 
          fontWeight: 600, 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>💾</span>
          Cache
        </h3>
        
        {/* Enable/Disable toggle */}
        <button
          onClick={() => setEnabled(!isEnabled)}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.7rem',
            color: isEnabled ? '#86efac' : '#fca5a5',
            backgroundColor: isEnabled 
              ? 'rgba(34, 197, 94, 0.2)' 
              : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${isEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          {isEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>
      
      {isEnabled && stats ? (
        <>
          {/* Stats grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}>
            <StatItem label="Total Events" value={stats.totalEvents.toLocaleString()} />
            <StatItem label="Days Cached" value={stats.totalDays.toString()} />
            <StatItem 
              label="Historical" 
              value={stats.historicalEvents.toLocaleString()} 
              subtext="(>4 weeks)"
            />
            <StatItem 
              label="Recent" 
              value={stats.recentEvents.toLocaleString()} 
              subtext="(<4 weeks)"
            />
            <StatItem 
              label="Est. Size" 
              value={stats.sizeEstimateKB > 1024 
                ? `${(stats.sizeEstimateKB / 1024).toFixed(1)} MB`
                : `${stats.sizeEstimateKB} KB`
              } 
            />
            {stats.staleDays > 0 && (
              <StatItem 
                label="Stale Days" 
                value={stats.staleDays.toString()} 
                highlight
              />
            )}
          </div>
          
          {/* Last updated */}
          {info?.lastUpdated && (
            <p style={{ 
              fontSize: '0.7rem', 
              color: '#6b7280', 
              marginBottom: '0.75rem',
            }}>
              Last updated: {format(new Date(info.lastUpdated), 'MMM d, h:mm a')}
            </p>
          )}
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {stats.staleDays > 0 && (
              <button
                onClick={clearStale}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '0.375rem 0.5rem',
                  fontSize: '0.75rem',
                  color: isProcessing ? '#6b7280' : '#fbbf24',
                  backgroundColor: 'transparent',
                  border: `1px solid ${isProcessing ? '#374151' : '#fbbf24'}`,
                  borderRadius: '0.25rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                Clear Stale
              </button>
            )}
            <button
              onClick={clearAllCache}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '0.375rem 0.5rem',
                fontSize: '0.75rem',
                color: isProcessing ? '#6b7280' : '#f87171',
                backgroundColor: 'transparent',
                border: `1px solid ${isProcessing ? '#374151' : '#f87171'}`,
                borderRadius: '0.25rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1,
              }}
            >
              Clear All
            </button>
          </div>
        </>
      ) : isEnabled ? (
        <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          No cached data yet
        </p>
      ) : (
        <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          Cache is disabled. Data will be fetched from USGS API on every request.
        </p>
      )}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
}

function StatItem({ label, value, subtext, highlight }: StatItemProps) {
  return (
    <div>
      <p style={{ 
        fontSize: '0.7rem', 
        color: '#9ca3af', 
        marginBottom: '0.125rem',
      }}>
        {label}
        {subtext && <span style={{ color: '#6b7280' }}> {subtext}</span>}
      </p>
      <p style={{ 
        fontSize: '0.875rem', 
        fontWeight: 600, 
        color: highlight ? '#fbbf24' : 'white',
        margin: 0,
      }}>
        {value}
      </p>
    </div>
  );
}
