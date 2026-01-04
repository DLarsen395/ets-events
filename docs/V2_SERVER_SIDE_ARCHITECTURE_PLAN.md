# V2 Server-Side Architecture Plan

**Document Created**: January 4, 2026
**Version**: 1.0 FINAL
**Status**: ✅ APPROVED - Ready for Implementation

---

## 📋 Executive Summary

This document outlines the architectural plan for transitioning the ETS Events application from a client-side data fetching model to a server-side database architecture. The goal is to:

1. **Centralize earthquake data** in a server-side database
2. **Fetch USGS data once** to prevent API rate limiting from multiple users
3. **Serve pre-aggregated charts** to clients on demand
4. **Prepare for multi-source data integration** (USGS, EMSC, etc.)
5. **Support intelligent duplicate detection** across sources

### Approved Scope
| Parameter | Decision |
|-----------|----------|
| Historical Range | **1500-present** (full catalog) |
| Magnitude Range | **M-2+** (all events) |
| Geographic Scope | **Worldwide** |
| Sync Frequency | **5 minutes** + manual trigger |
| ETS Map View | **Stays client-side** (PNSN) |

---

## 🏗️ Current Architecture (V1.x)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Application                                         │ │
│  │  ├── earthquakeStore (Zustand)                            │ │
│  │  ├── earthquake-cache.ts (IndexedDB)                       │ │
│  │  └── usgs-earthquake-api.ts (Direct API calls)            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     USGS FDSN API                               │
│            earthquake.usgs.gov/fdsnws/event/1/                  │
│                 (20,000 events/query limit)                     │
└─────────────────────────────────────────────────────────────────┘

Issues:
- Each user downloads full dataset to their browser
- Multiple users = multiple redundant API calls
- Risk of rate limiting USGS API
- ~10-50MB data transfer per user for large date ranges
- Historical data re-downloaded repeatedly
```

---

## 🎯 Proposed Architecture (V2.x)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Application                                         │ │
│  │  ├── API calls to server (chart data only)                │ │
│  │  └── No raw earthquake data storage                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ETS EVENTS API SERVER                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Backend API (Fastify/NestJS + TypeScript)                 │ │
│  │  ├── /api/charts/daily-counts                              │ │
│  │  ├── /api/charts/magnitude-distribution                    │ │
│  │  ├── /api/charts/energy-release                            │ │
│  │  ├── /api/earthquakes (filtered)                           │ │
│  │  └── /api/sync/status                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Background Scheduler                                       │ │
│  │  ├── Initial historical sync (1500→present)                │ │
│  │  └── Periodic updates (every 5 minutes)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           TimescaleDB + PostGIS (Docker Container)              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  earthquakes table (hypertable, partitioned by time)       │ │
│  │  ├── Geospatial indexes (location queries)                 │ │
│  │  ├── Time-series compression (90%+ reduction)              │ │
│  │  └── Source tracking for multi-source deduplication        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Data Sources                        │
│  ├── USGS FDSN API (primary, today)                            │
│  ├── EMSC SeismicPortal (future)                               │
│  └── Other sources (JMA, GeoNet, etc. - future)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Recommendation: TimescaleDB + PostGIS

### Why This Combination?

| Feature | TimescaleDB Benefit | PostGIS Benefit |
|---------|---------------------|-----------------|
| **Time-range queries** | Hypertables auto-partition by time, chunk exclusion | - |
| **Geospatial queries** | - | Industry-standard spatial queries (ST_DWithin, etc.) |
| **Compression** | 80-95% compression on historical data | - |
| **Duplicate detection** | Efficient time-window JOINs | Spatial proximity queries |
| **Scale** | Handles billions of events | Optimized spatial indexes |
| **Ecosystem** | PostgreSQL compatibility | Full GIS ecosystem |

### Estimated Storage

**Note**: With M-2+ worldwide from 1500, volumes are significantly higher than initial estimates.

| Dataset | Records | Uncompressed | Compressed |
|---------|---------|--------------|------------|
| USGS 1500-2026 (M-2+) | ~10-12 million | ~10-15 GB | ~2-3 GB |
| + EMSC (future) | ~3-5 million | +4 GB | +500 MB |
| Total (future) | ~15-17 million | ~20 GB | ~4 GB |

**Infrastructure Available**: 16GB RAM, NFS volume (2TB SSD), Docker Swarm

---

## 🔧 Backend Technology Recommendation

### Primary: Fastify + TypeScript + Kysely

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Fastify 5.x | 2-3x faster than Express, excellent TypeScript, streaming support |
| **Database Driver** | Kysely + pg | Type-safe query builder with raw SQL for PostGIS |
| **Scheduling** | node-cron (simple) or BullMQ (HA) | Built-in scheduling for data sync |
| **Validation** | TypeBox | JSON Schema → TypeScript types |

### Alternative: NestJS

Consider NestJS if:
- You prefer opinionated structure
- You need built-in WebSockets
- The team grows to 3+ backend developers

---

## 📊 API Endpoints (Proposed)

### Chart Data Endpoints
```
GET /api/charts/daily-counts
  ?startDate=2024-01-01
  &endDate=2024-12-31
  &minMagnitude=4
  &regionScope=us|worldwide

GET /api/charts/magnitude-distribution
  ?startDate=2024-01-01
  &endDate=2024-12-31
  &aggregation=daily|weekly|monthly
  &regionScope=us|worldwide

GET /api/charts/energy-release
  ?startDate=2024-01-01
  &endDate=2024-12-31
  &aggregation=daily|weekly|monthly
  &regionScope=us|worldwide
```

### Sync Status Endpoints
```
GET /api/sync/status
  → { lastSync, recordCount, oldestEvent, newestEvent, sources }

GET /api/sync/sources
  → [{ source: 'USGS', recordCount, lastFetch, coverage: { start, end } }]
```

### Raw Data Endpoints (Optional)
```
GET /api/earthquakes
  ?startDate=2024-01-01
  &endDate=2024-01-02
  &minMagnitude=4
  &bbox=-125,32,-114,49
  &limit=1000
  &offset=0
```

---

## 🐳 Docker Deployment Structure

```yaml
# docker-compose.v2.yml
version: '3.8'

services:
  # Frontend (existing, modified)
  frontend:
    image: ghcr.io/dlarsen395/ets-events:v2
    depends_on:
      - api
    networks:
      - npm-proxy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]

  # New: API Server
  api:
    image: ghcr.io/dlarsen395/ets-events-api:latest
    environment:
      - DATABASE_URL=postgresql://ets:${DB_PASSWORD}@db:5432/ets_events
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
    networks:
      - npm-proxy
      - internal
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]

  # New: Database
  db:
    image: timescale/timescaledb-ha:pg16-ts2.14-postgis
    environment:
      - POSTGRES_USER=ets
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=ets_events
    volumes:
      - ets_pgdata:/home/postgres/pgdata
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ets -d ets_events"]

volumes:
  ets_pgdata:

networks:
  npm-proxy:
    external: true
  internal:
    driver: overlay
```

---

## 🔄 Data Sync Strategy

### Initial Historical Load (One-Time)

**IMPORTANT**: With M-2+ worldwide, this is a large dataset requiring careful chunking.

```
Phase 1: Pre-Modern Era (1500-1900)
  - ~50,000 events
  - Chunk by century
  - Estimated time: 30 minutes

Phase 2: Early Modern (1900-1970)
  - ~500,000 events
  - Chunk by decade
  - Estimated time: 2-4 hours

Phase 3: Modern Instrumentation (1970-2000)
  - ~2,000,000 events
  - Chunk by year
  - Estimated time: 6-10 hours

Phase 4: High-Density Modern (2000-present)
  - ~8,000,000+ events (M-2+ captures many micro-quakes)
  - Chunk by month or use magnitude tiers
  - Estimated time: 12-24 hours

Total initial sync: 24-48 hours (can run in background)
```

### Chunking Strategy for M-2+ Data
```
For very small magnitudes (M-2 to M0):
  - USGS returns up to 20,000 events per query
  - Need to chunk by 1-3 day windows
  - May need to run in parallel with rate limiting

For larger magnitudes (M2.5+):
  - Can use larger time windows (months/years)
  - Much faster to sync
```

### Ongoing Sync (Every 5 Minutes)

```
1. Query USGS: ?starttime={lastSync}&minmagnitude=-2&orderby=time
2. USGS may return 1000-5000 events per 5-min window (M-2+ worldwide)
3. Upsert new/updated events
4. Update sync timestamp

Note: M-2+ includes many micro-earthquakes that occur constantly.
Daily volume: ~5,000-15,000 events worldwide.
```

### Manual Sync Trigger

API endpoint to manually trigger sync for specific date ranges:
```
POST /api/sync/trigger
{
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "minMagnitude": -2
}
```

---

## 🔍 Multi-Source Duplicate Detection (Future-Ready)

### Proposed Schema Design

```sql
CREATE TABLE seismic_events (
    id BIGSERIAL,
    source TEXT NOT NULL,              -- 'USGS', 'EMSC', 'JMA', etc.
    source_event_id TEXT NOT NULL,     -- Original ID from source
    time TIMESTAMPTZ NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    depth_km REAL,
    magnitude REAL,
    magnitude_type TEXT,
    place TEXT,

    -- Future: Canonical event linking
    canonical_event_id BIGINT,         -- Links duplicates to same event
    is_canonical BOOLEAN DEFAULT FALSE, -- Is this the "primary" record?

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (id, time),
    UNIQUE (source, source_event_id)
);

-- Duplicate detection query
SELECT e1.id, e2.id,
       ST_Distance(e1.location, e2.location) as dist_m,
       ABS(EXTRACT(EPOCH FROM e1.time - e2.time)) as time_diff_s
FROM seismic_events e1
JOIN seismic_events e2 ON
    e2.time BETWEEN e1.time - INTERVAL '5 minutes' AND e1.time + INTERVAL '5 minutes'
    AND e1.source < e2.source  -- Avoid self-joins
    AND ST_DWithin(e1.location, e2.location, 50000)  -- 50km
    AND ABS(e1.magnitude - e2.magnitude) < 0.5;
```

---

## ✅ Approved Decisions Summary

All questions have been answered. See [V2_QUESTIONS_FOR_REVIEW.md](./V2_QUESTIONS_FOR_REVIEW.md) for full responses.

| Decision | Choice |
|----------|--------|
| Historical Scope | **1500-present** (full catalog) |
| Magnitude Range | **M-2+** (all events) |
| Geographic Scope | **Worldwide** |
| Sync Interval | **5 minutes + Manual trigger** |
| Chart Strategy | **Hybrid** (pre-compute + on-demand) |
| Client Changes | **Full replacement** for Charts |
| ETS Map View | **Stays client-side** |
| Infrastructure | 16GB RAM, NFS (2TB SSD), Docker Swarm |
| API Auth | **API Key** |
| Backup | **Re-sync from USGS** (data on NFS) |
| Multi-source | Decide implementation later |

---

## 📝 Implementation Plan

### Phase 1: Database + API Skeleton (1-2 weeks)
- [ ] Create `api/` directory structure
- [ ] Set up Fastify + TypeScript project
- [ ] Configure Kysely with PostgreSQL
- [ ] Create TimescaleDB Docker container
- [ ] Define database schema and migrations
- [ ] Implement basic health/status endpoints
- [ ] Create `docker-compose.v2.yml`

### Phase 2: USGS Sync Integration (2-3 weeks)
- [ ] Port USGS API client from frontend
- [ ] Implement chunked historical sync
- [ ] Add progress tracking for initial load
- [ ] Set up node-cron for 5-minute sync
- [ ] Add manual sync trigger endpoint
- [ ] Handle USGS rate limiting gracefully
- [ ] Test with full M-2+ data volume

### Phase 3: Chart API + Frontend Migration (2-3 weeks)
- [ ] Implement `/api/charts/daily-counts`
- [ ] Implement `/api/charts/magnitude-distribution`
- [ ] Implement `/api/charts/energy-release`
- [ ] Add TimescaleDB continuous aggregates
- [ ] Update frontend to use API
- [ ] Remove IndexedDB for earthquake charts
- [ ] Add API key authentication
- [ ] Update error handling

### Phase 4: Multi-Source Preparation (1-2 weeks)
- [ ] Add canonical_event_id support
- [ ] Create duplicate detection queries
- [ ] Document EMSC integration plan
- [ ] Performance testing at scale

---

## 🔗 Related Documents

- [V2_ARCHITECTURE_DECISION_RECORD.md](./V2_ARCHITECTURE_DECISION_RECORD.md) - Decision tracking
- [V2_QUESTIONS_FOR_REVIEW.md](./V2_QUESTIONS_FOR_REVIEW.md) - Original questions with answers
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) - Current V1.x status
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Original V1 plan
- `.github/copilot-instructions.md` - Development standards

---

## 📚 External References

### USGS FDSN API
- Documentation: https://earthquake.usgs.gov/fdsnws/event/1/
- Rate limit: 20,000 events per query
- No explicit rate limiting documented, but recommends using feeds for real-time

### EMSC SeismicPortal (Future)
- Documentation: https://www.seismicportal.eu/fdsn-wsevent.html
- Same FDSN standard as USGS
- 20,000 events per query limit
- CC BY 4.0 license

### TimescaleDB
- Docker image: `timescale/timescaledb-ha:pg16-ts2.14-postgis`
- Documentation: https://docs.timescale.com/

### PostGIS
- Documentation: https://postgis.net/documentation/
- Included in TimescaleDB-HA image
