# GitHub Copilot Instructions for ETS Events Visualization Project

This is a React + TypeScript + Vite application for visualizing ETS seismic events with temporal playback.

## Project Versions

### V1.x (Current - Complete)
- **Frontend-only architecture** - Client fetches data directly from USGS/PNSN APIs
- **IndexedDB caching** - Browser-side data persistence
- **Status**: Production deployed at https://ets.home.hushrush.com

### V2.x (Planned)
- **Server-side database** - TimescaleDB + PostGIS for centralized earthquake storage
- **Backend API** - Fastify + TypeScript serving aggregated data
- **Single data fetch** - Server syncs USGS data once, clients query server
- **Multi-source ready** - Schema supports USGS, EMSC, future sources
- **Duplicate detection** - Cross-source earthquake matching

See `docs/V2_SERVER_SIDE_ARCHITECTURE_PLAN.md` for V2 planning details.

## Key Requirements
- **Dark Mode**: Included in V1
- **Event Colors**: User-selectable (not just magnitude-based)
- **Modern Design**: Glassmorphism UI with smooth animations
- **Docker**: Development on Docker Desktop (backed by WSL)

## TypeScript Standards
- Strict mode enabled
- Explicit types for all function parameters and return values
- Use interfaces for GeoJSON data structures

## React Patterns
- Functional components with hooks only
- Custom hooks for reusable logic
- Named exports preferred

## State Management (Zustand)
```typescript
import { create } from 'zustand';

interface Store {
  // State
  events: ETSEvent[];

  // Actions
  setEvents: (events: ETSEvent[]) => void;
}

export const useStore = create<Store>()((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
}));
```

## GeoJSON Types
```typescript
interface ETSEventProperties {
  depth: number;
  duration: number;
  energy: number;
  id: number;
  magnitude: number;
  num_stas: number;
  time: string;
}

interface ETSEvent {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: ETSEventProperties;
}
```

## Mapbox Integration
- Access token via `import.meta.env.VITE_MAPBOX_TOKEN`
- Initialize with Pacific Northwest viewport: `[-123.0, 47.0]`, zoom: 6.5
- Use data-driven styling for event markers

## Styling
- Tailwind CSS with dark mode support
- Glassmorphism for control panels
- High contrast for accessibility

## Development Workflow - CRITICAL
**BEFORE any build/test command (`npm run build`, `npm run dev`, `docker build`, etc.):**
1. **Save all files** - Ensure all changes are saved
2. **Update documentation** - Update CHANGELOG.md and PROJECT_STATUS.md with changes
3. **Commit changes** - Commit with descriptive message before building

This ensures changes are preserved and documented before testing.

---

## V2.x Backend Standards (When Implementing)

### Backend Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify 5.x with TypeScript
- **Database**: TimescaleDB + PostGIS
- **Query Builder**: Kysely (type-safe SQL)
- **Scheduling**: node-cron or BullMQ

### Backend TypeScript Patterns
```typescript
// Fastify route with TypeBox validation
import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

const QuerySchema = Type.Object({
  startDate: Type.String({ format: 'date-time' }),
  endDate: Type.String({ format: 'date-time' }),
  minMagnitude: Type.Optional(Type.Number({ minimum: 0, maximum: 10 })),
});

app.get('/api/earthquakes', {
  schema: { querystring: QuerySchema },
}, async (request, reply) => {
  // request.query is fully typed
});
```

### Database Schema Conventions
- Use `snake_case` for column names
- All tables include `created_at` and `updated_at`
- Use TIMESTAMPTZ for all timestamps (never TIMESTAMP)
- Store coordinates as PostGIS `GEOGRAPHY(POINT, 4326)`

### API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    count: number;
    page?: number;
    totalPages?: number;
  };
}
```

### Project Structure (V2)
```
/
├── api/                    # Backend (NEW)
│   ├── src/
│   │   ├── server.ts       # Fastify app entry
│   │   ├── config/         # Environment, DB config
│   │   ├── db/             # Kysely client, migrations
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   └── jobs/           # Scheduled tasks
│   ├── Dockerfile
│   └── package.json
├── src/                    # Frontend (existing)
├── docs/                   # Architecture docs (NEW)
├── docker-compose.v2.yml   # Full stack compose (NEW)
└── docker-compose.ets-events.yml  # V1 compose (existing)
```
