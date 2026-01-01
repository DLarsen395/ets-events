/**
 * Filter controls for earthquake charts
 */

import { useEarthquakeStore } from '../../stores/earthquakeStore';
import { MAGNITUDE_FILTERS, TIME_RANGE_OPTIONS, REGION_SCOPE_OPTIONS } from '../../types/earthquake';
import type { ChartLibrary } from '../../types/earthquake';

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'white',
  backgroundColor: 'rgba(55, 65, 81, 0.8)',
  border: '1px solid rgba(75, 85, 99, 0.5)',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  outline: 'none',
  minWidth: '140px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#9ca3af',
  marginBottom: '0.25rem',
  display: 'block',
};

export function ChartFilters() {
  const {
    minMagnitude,
    timeRange,
    regionScope,
    chartLibrary,
    setMinMagnitude,
    setTimeRange,
    setRegionScope,
    setChartLibrary,
    isLoading,
  } = useEarthquakeStore();

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        borderRadius: '0.5rem',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
      }}
    >
      {/* Time Range */}
      <div>
        <label style={labelStyle}>Time Range</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          disabled={isLoading}
          style={{
            ...selectStyle,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Magnitude Filter */}
      <div>
        <label style={labelStyle}>Min Magnitude</label>
        <select
          value={minMagnitude ?? 'all'}
          onChange={(e) => {
            const value = e.target.value;
            setMinMagnitude(value === 'all' ? null : parseFloat(value));
          }}
          disabled={isLoading}
          style={{
            ...selectStyle,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {MAGNITUDE_FILTERS.map((filter) => (
            <option key={filter.label} value={filter.value ?? 'all'}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {/* Region Scope */}
      <div>
        <label style={labelStyle}>Region</label>
        <select
          value={regionScope}
          onChange={(e) => setRegionScope(e.target.value as typeof regionScope)}
          disabled={isLoading}
          style={{
            ...selectStyle,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {REGION_SCOPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Chart Library Toggle */}
      <div>
        <label style={labelStyle}>Chart Library</label>
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            padding: '0.25rem',
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            borderRadius: '0.375rem',
          }}
        >
          {(['recharts', 'chartjs'] as ChartLibrary[]).map((lib) => (
            <button
              key={lib}
              onClick={() => setChartLibrary(lib)}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: chartLibrary === lib ? '600' : '400',
                color: chartLibrary === lib ? 'white' : '#9ca3af',
                backgroundColor: chartLibrary === lib
                  ? 'rgba(59, 130, 246, 0.8)'
                  : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {lib === 'recharts' ? 'Recharts' : 'Chart.js'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
