# Changelog

All notable changes to the ETS Events Visualization project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-27

### 🎉 Initial Production Release

First stable release of the ETS Events Visualization application.

### Added

#### Core Features
- **Interactive Map Visualization** - Mapbox GL JS with custom dark theme centered on Cascadia Subduction Zone
- **Live Data Integration** - Real-time seismic events from PNSN Tremor API
- **Temporal Playback Engine** - Watch events unfold chronologically with smooth animations
- **Time Range Presets** - 48 hours, Week, Month, Year, or custom date range
- **Depth-Based Coloring** - Events colored by depth (25-45km, cyan→purple gradient)
- **Magnitude-Based Sizing** - Event markers sized by magnitude (0.4-1.6+)
- **Speed Controls** - Playback speeds from 0.1x to 10x
- **Timeline Scrubbing** - Click or drag to jump to any point in time
- **Range Brackets** - Draggable start/end points to focus on specific time windows

#### UI Components
- **Legend Panel** - Visual guide for depth colors and magnitude sizes
- **Statistics Panel** - Real-time stats (total events, magnitude range, average depth, date range)
- **Mode Toggle** - Switch between "Show All Events" and "Playback" modes
- **Data Range Selector** - Compact time range selection with custom date picker
- **Loading States** - Spinner overlay during data fetches
- **Error Handling** - User-friendly error messages with retry functionality

#### Mobile Support
- **Responsive Layout** - Optimized for phones and tablets (< 1024px)
- **Mobile Info Panel** - Collapsible accordion with all controls
- **Orientation Handling** - Proper detection of portrait and landscape modes
- **Touch Interactions** - Tap and swipe support for timeline
- **Mapbox Logo Preserved** - Proper z-indexing for attribution

#### Deployment
- **Docker Multi-Stage Build** - Node.js build → Nginx production image (~50MB)
- **GitHub Container Registry** - Published to `ghcr.io/dlarsen395/ets-events`
- **Docker Swarm Support** - Stateless, swarm-safe configuration
- **Nginx Proxy Manager Integration** - SSL termination and authentication via Access Lists
- **Health Check Endpoint** - `/health` endpoint for container orchestration

### Technical Stack
- React 19.0.0
- TypeScript 5.6.2
- Vite 7.2.4
- Mapbox GL JS 3.9.0
- Zustand 5.0.2
- Tailwind CSS 3.4.1
- Nginx Alpine (production)

### Performance
- Initial load: ~2s
- Playback: 60fps
- Memory usage: ~120MB (browser), ~10-20MB (container)
- Bundle size: ~380KB
- Supports 5,000+ events

---

## [Unreleased]

### Planned for v1.1.0
- User-selectable color schemes
- Keyboard shortcuts (Space = play/pause, arrows = scrub)
- Event details popup on click

### Planned for v2.0.0
- Event clustering at low zoom levels
- URL state persistence
- Export/share functionality
- Screenshot and CSV export

---

## How to Update

### Development
```bash
# Make changes
npm run dev

# Build and push
docker build -t ets-events:latest --build-arg "VITE_MAPBOX_TOKEN=your_token" .
docker tag ets-events:latest ghcr.io/dlarsen395/ets-events:latest
docker push ghcr.io/dlarsen395/ets-events:latest
```

### Production (Portainer)
1. Go to **Stacks** → **ets-events**
2. Click **Update** on the service
3. Check **Pull latest image**
4. Deploy

---

[1.0.0]: https://github.com/DLarsen395/ets-events/releases/tag/v1.0.0
[Unreleased]: https://github.com/DLarsen395/ets-events/compare/v1.0.0...HEAD
