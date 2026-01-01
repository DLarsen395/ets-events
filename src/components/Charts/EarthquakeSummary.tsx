/**
 * Summary statistics card for earthquake data
 */

import { useEarthquakeStore } from '../../stores/earthquakeStore';
import { format } from 'date-fns';

export function EarthquakeSummary() {
  const { summary, earthquakes, isLoading } = useEarthquakeStore();

  if (isLoading) {
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
        <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Loading statistics...
        </div>
      </div>
    );
  }

  if (!summary || earthquakes.length === 0) {
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
        <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          No earthquake data available
        </div>
      </div>
    );
  }

  const statStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '0.5rem',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 1.2,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '0.25rem',
  };

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
      <h3
        style={{
          color: '#d1d5db',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Summary Statistics
      </h3>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0.5rem',
        }}
      >
        <div style={statStyle}>
          <div style={valueStyle}>{summary.total.toLocaleString()}</div>
          <div style={labelStyle}>Total Events</div>
        </div>
        
        <div style={statStyle}>
          <div style={{ ...valueStyle, color: '#fbbf24' }}>
            M{summary.maxMagnitude.toFixed(1)}
          </div>
          <div style={labelStyle}>Max Magnitude</div>
        </div>
        
        <div style={statStyle}>
          <div style={{ ...valueStyle, color: '#60a5fa' }}>
            M{summary.avgMagnitude.toFixed(1)}
          </div>
          <div style={labelStyle}>Avg Magnitude</div>
        </div>
        
        <div style={statStyle}>
          <div style={valueStyle}>
            {summary.avgDepth.toFixed(1)}km
          </div>
          <div style={labelStyle}>Avg Depth</div>
        </div>
      </div>

      {/* Date Range */}
      {summary.dateRange && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(75, 85, 99, 0.3)',
            fontSize: '0.75rem',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          Data from {format(summary.dateRange.start, 'MMM d, yyyy')} to{' '}
          {format(summary.dateRange.end, 'MMM d, yyyy')}
        </div>
      )}

      {/* Largest Event */}
      {summary.largestEvent && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '0.375rem',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: '#fbbf24',
              fontWeight: 600,
              marginBottom: '0.25rem',
            }}
          >
            Largest Event
          </div>
          <div style={{ fontSize: '0.875rem', color: 'white' }}>
            M{summary.largestEvent.properties.mag?.toFixed(1)} -{' '}
            {summary.largestEvent.properties.place}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            {format(new Date(summary.largestEvent.properties.time), 'MMM d, yyyy HH:mm')} UTC
          </div>
        </div>
      )}
    </div>
  );
}
