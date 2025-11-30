import React, { useState } from 'react';
import { usePlaybackStore } from '../../stores/playbackStore';
import { getSpeedOptionsForRange } from '../../services/tremor-api';
import { useIsMobileDevice, useIsShortScreen } from '../../hooks/useIsMobile';
import type { ETSEvent } from '../../types/event';
import { MAP_STYLES, type MapStyleKey } from '../../config/mapStyles';

interface RightPanelLayoutProps {
  events: ETSEvent[];
  visibleCount: number;
  isPlaying: boolean;
  // Map tools props
  currentStyle: MapStyleKey;
  onStyleChange: (style: MapStyleKey) => void;
  showPlateBoundaries: boolean;
  onPlateBoundariesChange: (show: boolean) => void;
}

// Collapsible section component
const CollapsibleSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => (
  <div style={{
    background: 'rgba(30, 30, 40, 0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  }}>
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#e5e7eb',
        fontSize: '11px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {title}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </button>
    {isOpen && (
      <div style={{ padding: '0 12px 12px' }}>
        {children}
      </div>
    )}
  </div>
);

// Tools content (Basemap selector + Plate Boundaries toggle)
const ToolsContent: React.FC<{
  currentStyle: MapStyleKey;
  onStyleChange: (style: MapStyleKey) => void;
  showPlateBoundaries: boolean;
  onPlateBoundariesChange: (show: boolean) => void;
}> = ({ currentStyle, onStyleChange, showPlateBoundaries, onPlateBoundariesChange }) => {
  return (
    <>
      {/* Basemap Selector */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '10px',
          color: '#888',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Basemap
        </div>
        <select
          value={currentStyle}
          onChange={(e) => onStyleChange(e.target.value as MapStyleKey)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 500,
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            backgroundColor: 'rgba(55, 65, 81, 0.8)',
            color: '#e5e7eb',
            outline: 'none',
          }}
        >
          {Object.entries(MAP_STYLES).map(([key, style]) => (
            <option key={key} value={key} style={{ backgroundColor: '#1f2937' }}>
              {style.name}
            </option>
          ))}
        </select>
      </div>

      {/* Plate Boundaries Toggle */}
      <div>
        <div style={{
          fontSize: '10px',
          color: '#888',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Layers
        </div>
        <button
          onClick={() => onPlateBoundariesChange(!showPlateBoundaries)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 500,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: showPlateBoundaries ? '#3b82f6' : 'rgba(55, 65, 81, 0.8)',
            color: showPlateBoundaries ? 'white' : '#9ca3af',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '2px',
            backgroundColor: showPlateBoundaries ? 'white' : 'transparent',
            border: showPlateBoundaries ? 'none' : '1px solid #9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
          }}>
            {showPlateBoundaries && '✓'}
          </span>
          Plate Boundaries
        </button>
      </div>
    </>
  );
};

// Mode & Speed Controls content
const ControlsContent: React.FC = () => {
  const { showAllEvents, speed, dataRangePreset, setShowAllEvents, setSpeed } = usePlaybackStore();
  const speedOptions = getSpeedOptionsForRange(dataRangePreset);

  return (
    <>
      {/* Mode Toggle */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          fontSize: '10px', 
          color: '#888', 
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Mode
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setShowAllEvents(true)}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: showAllEvents ? '#3b82f6' : 'rgba(55, 65, 81, 0.8)',
              color: showAllEvents ? 'white' : '#9ca3af',
            }}
          >
            All
          </button>
          <button
            onClick={() => setShowAllEvents(false)}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: !showAllEvents ? '#3b82f6' : 'rgba(55, 65, 81, 0.8)',
              color: !showAllEvents ? 'white' : '#9ca3af',
            }}
          >
            Play
          </button>
        </div>
      </div>

      {/* Speed Controls */}
      <div>
        <div style={{ 
          fontSize: '10px', 
          color: '#888', 
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Speed
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {speedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSpeed(option.value)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: speed === option.value ? '#3b82f6' : 'rgba(55, 65, 81, 0.8)',
                color: speed === option.value ? 'white' : '#9ca3af',
                textAlign: 'left',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Stats content
const StatsContent: React.FC<{ events: ETSEvent[]; visibleCount: number; isPlaying: boolean }> = ({
  events,
  visibleCount,
  isPlaying,
}) => {
  const stats = React.useMemo(() => {
    if (events.length === 0) {
      return {
        total: 0,
        avgMagnitude: 0,
        maxMagnitude: 0,
        minMagnitude: 0,
        avgDepth: 0,
        dateRange: { start: null as Date | null, end: null as Date | null },
      };
    }

    const magnitudes = events.map(e => e.properties.magnitude);
    const depths = events.map(e => e.properties.depth);
    const times = events.map(e => new Date(e.properties.time).getTime()).sort((a, b) => a - b);

    return {
      total: events.length,
      avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      maxMagnitude: Math.max(...magnitudes),
      minMagnitude: Math.min(...magnitudes),
      avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
      dateRange: {
        start: new Date(times[0]),
        end: new Date(times[times.length - 1]),
      },
    };
  }, [events]);

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#9ca3af' }}>{isPlaying ? 'Visible' : 'Total'}</span>
        <span style={{ fontWeight: 600, color: '#fff' }}>
          {isPlaying ? visibleCount.toLocaleString() : stats.total.toLocaleString()}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#9ca3af' }}>Mag Range</span>
        <span style={{ color: '#fff' }}>
          {stats.minMagnitude.toFixed(1)} - {stats.maxMagnitude.toFixed(1)}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#9ca3af' }}>Avg Depth</span>
        <span style={{ color: '#fff' }}>{stats.avgDepth.toFixed(1)} km</span>
      </div>
      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '2px 0' }} />
      <div style={{ fontSize: '10px', color: '#888' }}>
        {formatDate(stats.dateRange.start)} - {formatDate(stats.dateRange.end)}
      </div>
    </div>
  );
};

export const RightPanelLayout: React.FC<RightPanelLayoutProps> = ({
  events,
  visibleCount,
  isPlaying,
  currentStyle,
  onStyleChange,
  showPlateBoundaries,
  onPlateBoundariesChange,
}) => {
  const isMobileDevice = useIsMobileDevice();
  const isShortScreen = useIsShortScreen(650);
  
  // For short screens, use collapsible accordion mode
  const [openSection, setOpenSection] = useState<'tools' | 'controls' | 'stats' | null>('controls');

  // Don't render on mobile - use MobileInfoPanel instead
  if (isMobileDevice) return null;

  // Short screen mode: collapsible accordion
  if (isShortScreen) {
    return (
      <div style={{
        position: 'absolute',
        right: '16px',
        top: '180px',
        bottom: '100px',
        width: '150px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
      }}>
        <CollapsibleSection
          title="Tools"
          isOpen={openSection === 'tools'}
          onToggle={() => setOpenSection(openSection === 'tools' ? null : 'tools')}
        >
          <ToolsContent
            currentStyle={currentStyle}
            onStyleChange={onStyleChange}
            showPlateBoundaries={showPlateBoundaries}
            onPlateBoundariesChange={onPlateBoundariesChange}
          />
        </CollapsibleSection>
        
        <CollapsibleSection
          title="Controls"
          isOpen={openSection === 'controls'}
          onToggle={() => setOpenSection(openSection === 'controls' ? null : 'controls')}
        >
          <ControlsContent />
        </CollapsibleSection>
        
        <CollapsibleSection
          title="Statistics"
          isOpen={openSection === 'stats'}
          onToggle={() => setOpenSection(openSection === 'stats' ? null : 'stats')}
        >
          <StatsContent events={events} visibleCount={visibleCount} isPlaying={isPlaying} />
        </CollapsibleSection>
      </div>
    );
  }

  // Normal screen: flex column layout with panels distributed vertically
  return (
    <div style={{
      position: 'absolute',
      right: '16px',
      top: '180px',
      bottom: '100px',
      width: '150px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      gap: '12px',
    }}>
      {/* Tools (Basemap + Layers) */}
      <div style={{
        background: 'rgba(30, 30, 40, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 500,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
        }}>
          Tools
        </div>
        <ToolsContent
          currentStyle={currentStyle}
          onStyleChange={onStyleChange}
          showPlateBoundaries={showPlateBoundaries}
          onPlateBoundariesChange={onPlateBoundariesChange}
        />
      </div>
      
      {/* Mode & Speed */}
      <div style={{
        background: 'rgba(30, 30, 40, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <ControlsContent />
      </div>
      
      {/* Stats */}
      <div style={{
        background: 'rgba(30, 30, 40, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 500,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
        }}>
          Statistics
        </div>
        <StatsContent events={events} visibleCount={visibleCount} isPlaying={isPlaying} />
      </div>
    </div>
  );
};
