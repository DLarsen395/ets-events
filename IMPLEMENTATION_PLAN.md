# ETS Events Visualization - Implementation Plan

## Overview
A React + TypeScript + Vite application for visualizing Pacific Northwest ETS (Episodic Tremor and Slip) seismic events with temporal playback capabilities.

**Version**: 1.0.0
**Status**: ✅ Complete and Deployed
**Production URL**: https://seismistats.home.hushrush.com

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Map**: Mapbox GL JS
- **State Management**: Zustand
- **Styling**: Tailwind CSS (dark mode)
- **Date Utilities**: date-fns
- **Container**: Docker (Nginx Alpine)
- **Registry**: GitHub Container Registry
- **Deployment**: Docker Swarm + Portainer
- **Proxy/Auth**: Nginx Proxy Manager

## Phase 1: Foundation ✅
- [x] Project scaffolding (Vite + React + TypeScript)
- [x] Tailwind CSS configuration with dark mode
- [x] Mapbox GL integration
- [x] Load and display GeoJSON events
- [x] Basic event markers with magnitude-based styling
- [x] Click popups with event details

## Phase 2: Playback Engine ✅
- [x] Zustand store for playback state
- [x] Temporal filtering of events
- [x] Play/Pause functionality
- [x] Speed control (0.1x, 0.5x, 1x, 2x, 5x, 10x)
- [x] Current time display
- [x] Event fade-out animation

## Phase 3: Controls & UI ✅
- [x] Glassmorphism control panel
- [x] Timeline scrubber with range brackets
- [x] Date range picker with presets
- [x] Speed selector
- [x] Mode toggle (Show All vs Playback)
- [x] Legend and statistics panels

## Phase 4: Mobile & Polish ✅
- [x] Mobile responsive layout
- [x] Collapsible Info panel for mobile/tablet
- [x] Orientation detection (portrait/landscape)
- [x] Touch interactions
- [x] Loading states and error handling
- [x] Mapbox logo preservation

## Phase 5: Docker & Deployment ✅
- [x] Multi-stage Dockerfile
- [x] docker-compose.yml for Swarm
- [x] Nginx configuration (SPA routing, health check)
- [x] GitHub Container Registry (ghcr.io)
- [x] Portainer stack deployment
- [x] Nginx Proxy Manager (SSL + authentication)

## Future Phases

### Phase 6: Enhancements (V1.1.0)
- [ ] User-selectable color schemes
- [ ] Keyboard shortcuts
- [ ] Event details popup

### Phase 7: Advanced Features (V2.0.0)
- [ ] Event clustering at low zoom
- [ ] URL state persistence
- [ ] Export/share functionality

## Data Structure
```typescript
interface ETSEventProperties {
  depth: number;      // km
  duration: number;   // seconds
  energy: number;     // relative units
  id: number;
  magnitude: number;  // 0.4 - 1.9 range
  num_stas: number;   // detecting stations
  time: string;       // ISO timestamp
}
```

## File Structure
```
src/
├── components/
│   ├── Map/
│   │   └── MapContainer.tsx
│   ├── Controls/
│   │   ├── PlaybackControls.tsx
│   │   ├── TimelineSlider.tsx
│   │   └── SettingsPanel.tsx
│   └── UI/
│       └── GlassPanel.tsx
├── hooks/
│   ├── useEventData.ts
│   └── usePlayback.ts
├── stores/
│   └── playbackStore.ts
├── types/
│   └── event.ts
├── utils/
│   └── dateUtils.ts
├── App.tsx
└── index.css
```
