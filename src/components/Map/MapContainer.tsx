import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { ETSEvent } from '../../types/event';
import type { ETSEventWithOpacity } from '../../hooks/usePlayback';

// Free basemap styles - no API key required
const MAP_STYLES = {
  // Carto free basemaps (reliable, fast)
  cartoDark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  cartoLight: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

// USGS Plate Boundaries tile service
const PLATE_BOUNDARIES_TILES = 'https://earthquake.usgs.gov/arcgis/rest/services/eq/map_plateboundaries/MapServer/tile/{z}/{y}/{x}';

interface MapContainerProps {
  events: ETSEventWithOpacity[];
}

export const MapContainer: React.FC<MapContainerProps> = ({ events }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showPlateBoundaries, setShowPlateBoundaries] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapContainer.current) return;

      try {
        const mapInstance = new maplibregl.Map({
          container: mapContainer.current,
          style: MAP_STYLES.cartoDark, // Dark theme for seismic visualization
          center: [-124.0, 44.5], // Centered on Oregon coast for full CSZ view
          zoom: 5.2, // Zoom to show Vancouver Island to Northern California
        });

        map.current = mapInstance;

        mapInstance.on('load', () => {
          // Add USGS Plate Boundaries as raster tile layer
          mapInstance.addSource('plate-boundaries', {
            type: 'raster',
            tiles: [PLATE_BOUNDARIES_TILES],
            tileSize: 256,
            attribution: '© USGS Earthquake Hazards Program',
          });

          mapInstance.addLayer({
            id: 'plate-boundaries-layer',
            type: 'raster',
            source: 'plate-boundaries',
            paint: {
              'raster-opacity': 0.7,
            },
          });

          setMapLoaded(true);
        });

        mapInstance.on('error', (e) => {
          console.error('MapLibre error:', e);
          setMapError(`Map error: ${e.error?.message || JSON.stringify(e)}`);
        });

        // Fallback: check if map is already loaded
        if (mapInstance.loaded()) {
          setMapLoaded(true);
        }

        // Add controls
        mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

      } catch (err) {
        console.error('Failed to initialize map:', err);
        setMapError(`Failed to initialize map: ${err}`);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      map.current?.remove();
    };
  }, []);

  // Toggle plate boundaries visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const layer = map.current.getLayer('plate-boundaries-layer');
    if (layer) {
      map.current.setLayoutProperty(
        'plate-boundaries-layer',
        'visibility',
        showPlateBoundaries ? 'visible' : 'none'
      );
    }
  }, [showPlateBoundaries, mapLoaded]);

  // Add events to map when loaded
  useEffect(() => {
    if (!map.current || !mapLoaded || events.length === 0) return;

    // Convert events to GeoJSON, including opacity in properties
    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: events.map(event => ({
        type: 'Feature' as const,
        geometry: event.geometry,
        properties: {
          ...event.properties,
          opacity: event.opacity,
        },
      })),
    };

    // Add source if it doesn't exist
    if (!map.current.getSource('events')) {
      map.current.addSource('events', {
        type: 'geojson',
        data: geojsonData,
      });

      // Add circle layer for events
      map.current.addLayer({
        id: 'events-circle',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'magnitude'], 0.5],
            0.4, 3,
            1.9, 10.5
          ],
          // Depth-based color: shallow (25km) = orange, deep (45km) = purple
          'circle-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'depth'], 35],
            25, '#FFA500',  // Orange (shallow)
            30, '#FF6B35',  // Coral
            35, '#FF3366',  // Hot pink
            40, '#E91E63',  // Magenta
            45, '#9C27B0'   // Deep purple (deep)
          ],
          'circle-opacity': ['coalesce', ['get', 'opacity'], 0.8],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': ['coalesce', ['get', 'opacity'], 0.8],
        },
      });

      // Add hover effect
      map.current.on('mouseenter', 'events-circle', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'events-circle', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Add click handler for popups
      map.current.on('click', 'events-circle', (e) => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const props = feature.properties as ETSEvent['properties'];

        new maplibregl.Popup({ className: 'dark-popup' })
          .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(`
            <div style="padding: 12px; color: #f3f4f6;">
              <h3 style="font-weight: bold; font-size: 1.1rem; margin-bottom: 8px; color: #fff;">Event #${props.id}</h3>
              <div style="font-size: 0.875rem; line-height: 1.6;">
                <p><strong>Magnitude:</strong> ${props.magnitude ?? 'N/A'}</p>
                <p><strong>Depth:</strong> ${props.depth?.toFixed(1) ?? 'N/A'} km</p>
                <p><strong>Energy:</strong> ${props.energy?.toLocaleString() ?? 'N/A'}</p>
                <p><strong>Duration:</strong> ${props.duration ?? 'N/A'}s</p>
                <p><strong>Stations:</strong> ${props.num_stas ?? 'N/A'}</p>
                <p><strong>Time:</strong> ${props.time ? new Date(props.time).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          `)
          .addTo(map.current!);
      });
    } else {
      // Update existing source
      const source = map.current.getSource('events') as maplibregl.GeoJSONSource;
      source.setData(geojsonData);
    }
  }, [events, mapLoaded]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      
      {/* Plate Boundaries Toggle */}
      {mapLoaded && !mapError && (
        <div style={{
          position: 'absolute',
          top: '120px',
          right: '10px',
          zIndex: 100,
          background: 'rgba(30, 30, 40, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '6px',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#e5e7eb',
          }}>
            <input
              type="checkbox"
              checked={showPlateBoundaries}
              onChange={(e) => setShowPlateBoundaries(e.target.checked)}
              style={{ 
                width: '14px', 
                height: '14px',
                accentColor: '#3b82f6',
              }}
            />
            Plate Boundaries
          </label>
        </div>
      )}
      
      {/* Error state */}
      {mapError && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#111827'
        }}>
          <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'rgba(127, 29, 29, 0.5)', borderRadius: '0.5rem' }}>
            <p style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '0.5rem' }}>Map Error</p>
            <p style={{ color: '#d1d5db' }}>{mapError}</p>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {!mapLoaded && !mapError && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#111827'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin" style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '2px solid transparent',
              borderBottomColor: '#3b82f6',
              borderRadius: '50%',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#9ca3af' }}>Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};
