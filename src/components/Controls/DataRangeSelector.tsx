import React, { useState, useEffect } from 'react';
import { usePlaybackStore } from '../../stores/playbackStore';
import type { DataRangePreset } from '../../services/tremor-api';
import { getPresetDateRange } from '../../services/tremor-api';

interface DataRangeSelectorProps {
  isLoading?: boolean;
}

interface PresetOption {
  value: DataRangePreset;
  label: string;
  mobileLabel: string;
}

const presetOptions: PresetOption[] = [
  { value: 'lastDay', label: 'Last 24 Hours', mobileLabel: '24h' },
  { value: 'lastWeek', label: 'Last Week', mobileLabel: 'Week' },
  { value: 'lastMonth', label: 'Last Month', mobileLabel: 'Month' },
  { value: 'lastYear', label: 'Last Year', mobileLabel: 'Year' },
  { value: 'custom', label: 'Custom Range', mobileLabel: 'Custom' },
];

// Get today's date in YYYY-MM-DD format (local timezone)
const getTodayString = (): string => {
  const today = new Date();
  return today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
};

export const DataRangeSelector: React.FC<DataRangeSelectorProps> = ({ isLoading = false }) => {
  const dataRangePreset = usePlaybackStore((state) => state.dataRangePreset);
  const setDataRangePreset = usePlaybackStore((state) => state.setDataRangePreset);
  const setCustomDateRange = usePlaybackStore((state) => state.setCustomDateRange);
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const pause = usePlaybackStore((state) => state.pause);
  
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Mobile detection with orientation change support
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', () => {
      // Delay check for orientation change to get accurate dimensions
      setTimeout(checkMobile, 100);
    });
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Clear validation error when dates change
  useEffect(() => {
    setValidationError(null);
  }, [customStart, customEnd]);

  // Get the current custom date range from store
  const storeCustomDateRange = usePlaybackStore((state) => state.customDateRange);

  const handlePresetChange = (preset: DataRangePreset) => {
    // Pause playback when changing data range
    if (isPlaying) {
      pause();
    }
    
    if (preset === 'custom') {
      // If we already have a custom range in the store, use it
      // Otherwise initialize from current preset's dates
      if (dataRangePreset === 'custom' && storeCustomDateRange) {
        setCustomStart(storeCustomDateRange.starttime.split('T')[0]);
        setCustomEnd(storeCustomDateRange.endtime.split('T')[0]);
      } else {
        const { starttime, endtime } = getPresetDateRange(dataRangePreset);
        // Parse dates properly - extract date portion
        setCustomStart(starttime.split('T')[0]);
        // For end date, use today to avoid timezone issues
        const today = getTodayString();
        const endDateStr = endtime.split('T')[0];
        setCustomEnd(endDateStr > today ? today : endDateStr);
      }
      setValidationError(null);
      setShowCustomModal(true);
    } else {
      // Always trigger refresh, even if same preset (setDataRangePreset increments dataVersion)
      setDataRangePreset(preset);
    }
  };

  const validateDates = (): string | null => {
    if (!customStart || !customEnd) {
      return 'Please select both start and end dates';
    }
    
    const today = getTodayString();
    
    // Check for future dates
    if (customStart > today) {
      return 'Start date cannot be in the future';
    }
    if (customEnd > today) {
      return 'End date cannot be in the future';
    }
    
    // Check date order (same day is OK - we'll use full day range)
    if (customStart > customEnd) {
      return 'Start date must be before or equal to end date';
    }
    
    return null;
  };

  const handleCustomSubmit = () => {
    const error = validateDates();
    if (error) {
      setValidationError(error);
      return;
    }
    
    // Store custom dates in the Zustand store
    // For same-day selection, use full day (00:00:00 to 23:59:59)
    setCustomDateRange({
      starttime: `${customStart}T00:00:00`,
      endtime: `${customEnd}T23:59:59`
    });
    
    // Trigger data reload by setting preset (this increments dataVersion)
    setDataRangePreset('custom');
    setShowCustomModal(false);
  };

  const handleCustomCancel = () => {
    setShowCustomModal(false);
    setValidationError(null);
  };

  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? '8px' : '16px',
      left: isMobile ? '8px' : '16px',
      zIndex: 100,
    }}>
      {/* Dropdown button */}
      <div style={{
        background: 'rgba(30, 30, 40, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: isMobile ? '6px' : '8px',
        padding: isMobile ? '6px' : '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}>
          <label style={{
            fontSize: isMobile ? '9px' : '10px',
            fontWeight: 500,
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Data Range
          </label>
          {isLoading && (
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid transparent',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: isMobile ? '200px' : '300px' }}>
          {presetOptions.map(({ value, label, mobileLabel }) => (
            <button
              key={value}
              onClick={() => handlePresetChange(value)}
              disabled={isPlaying || isLoading}
              style={{
                padding: isMobile ? '4px 6px' : '6px 10px',
                fontSize: isMobile ? '10px' : '11px',
                fontWeight: 500,
                border: 'none',
                borderRadius: '4px',
                cursor: (isPlaying || isLoading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                background: dataRangePreset === value
                  ? 'rgba(59, 130, 246, 0.8)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: dataRangePreset === value ? '#fff' : '#ccc',
                opacity: isPlaying ? 0.5 : 1,
              }}
            >
              {isMobile ? mobileLabel : label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'rgba(30, 30, 40, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            minWidth: '320px',
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
            }}>
              Custom Date Range
            </h3>

            {/* Validation Error */}
            {validationError && (
              <div style={{
                marginBottom: '16px',
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '13px',
              }}>
                {validationError}
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: '#888',
                marginBottom: '6px',
              }}>
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                max={getTodayString()}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: '#888',
                marginBottom: '6px',
              }}>
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                max={getTodayString()}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCustomCancel}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#ccc',
                  transition: 'all 0.2s ease',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={!customStart || !customEnd}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: customStart && customEnd ? 'pointer' : 'not-allowed',
                  background: customStart && customEnd 
                    ? 'rgba(59, 130, 246, 0.8)' 
                    : 'rgba(59, 130, 246, 0.3)',
                  color: '#fff',
                  transition: 'all 0.2s ease',
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
