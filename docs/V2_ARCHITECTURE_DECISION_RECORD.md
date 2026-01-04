# V2 Architecture Decision Record

**Status**: ✅ APPROVED - Ready for Implementation
**Created**: January 4, 2026
**Last Updated**: January 4, 2026
**Approved By**: Stakeholder

---

## Summary

This ADR documents the architectural decisions for V2 of the ETS Events application, transitioning from client-side data fetching to a server-side database architecture.

---

## Finalized Decisions

### Data Scope
| Decision | Choice | Notes |
|----------|--------|-------|
| **Historical Range** | 1500-present | Full USGS catalog |
| **Magnitude Range** | M-2+ | All events including micro-quakes |
| **Geographic Scope** | Worldwide | No regional filtering |
| **Sync Interval** | 5 minutes + Manual trigger | Both automatic and on-demand |

### Architecture
| Decision | Choice | Notes |
|----------|--------|-------|
| **Database** | TimescaleDB + PostGIS | Time-series + geospatial |
| **Backend** | Fastify + TypeScript | Performance + type safety |
| **Query Builder** | Kysely | Type-safe SQL with PostGIS |
| **Scheduling** | node-cron | Simple, single instance |
| **Chart Strategy** | Hybrid | Pre-compute common, compute rare |
| **API Auth** | API Key | Trackable, prevents abuse |

### Infrastructure
| Resource | Specification |
|----------|---------------|
| **RAM** | 16 GB per node |
| **Storage** | NFS volume (2TB SSD available) |
| **Orchestration** | Docker Swarm via Portainer |
| **SSL** | Nginx Proxy Manager |
| **Backup** | Re-sync from USGS (data on NFS) |

### Scope Boundaries
| Item | In Scope | Notes |
|------|----------|-------|
| Earthquake Charts | ✅ Yes | Full server-side migration |
| ETS Map View | ❌ No | Stays client-side (PNSN API) |
| Multi-source (EMSC) | 🔮 Future | Schema ready, decide implementation later |

---

## Revised Data Volume Estimates

With M-2+ worldwide from 1500, volumes are significantly higher:

| Period | Estimated Records | Notes |
|--------|-------------------|-------|
| 1500-1900 | ~50,000 | Historical records, sparse |
| 1900-1970 | ~500,000 | Pre-modern instrumentation |
| 1970-2000 | ~2,000,000 | Modern seismic network |
| 2000-present | ~8,000,000+ | Dense modern coverage |
| **Total** | **~10-12 million** | M-2+ includes micro-quakes |

### Storage Estimates
| State | Size |
|-------|------|
| Uncompressed | ~10-15 GB |
| Compressed (TimescaleDB) | ~2-3 GB |
| With indexes | ~4-5 GB total |

### Initial Sync Time
| Approach | Estimated Time |
|----------|----------------|
| Sequential (safe) | 24-48 hours |
| Parallel (faster) | 12-24 hours |
| Chunked by decade | Recommended approach |

---

## Technology Decisions

### Database: TimescaleDB + PostGIS
**Status**: Recommended ✅

**Rationale**:
- Best-in-class geospatial support (PostGIS)
- Purpose-built time-series optimization (hypertables, compression)
- 80-95% compression on historical data
- Familiar PostgreSQL ecosystem
- Docker-ready with official images
- Excellent for cross-source duplicate detection queries

**Alternatives Considered**:
- PostgreSQL + PostGIS (good but no time-series optimization)
- MongoDB (weaker geospatial, less elegant JOINs for dedup)
- ClickHouse (overkill, weak geospatial)
- SQLite + SpatiaLite (won't scale to millions of records)

### Backend Framework: Fastify + TypeScript
**Status**: Recommended ✅

**Rationale**:
- 2-3x faster than Express
- First-class TypeScript support
- JSON Schema validation generates types
- Excellent streaming for large datasets
- Same mental model as frontend (React + TS)
- Lower complexity than NestJS for this scope

**Alternatives Considered**:
- Express (slower, less type-safe)
- NestJS (more complex, better for larger teams)
- Python + FastAPI (context switching, different tooling)
- Go (steep learning curve for JS/TS team)

### Query Builder: Kysely
**Status**: Recommended ✅

**Rationale**:
- Type-safe query building
- Direct SQL access for PostGIS functions
- No ORM magic/abstractions
- Excellent TypeScript integration

**Alternatives Considered**:
- Prisma (limited PostGIS support)
- TypeORM (magic, less type-safe)
- Raw pg (no type safety)

### Scheduling: node-cron
**Status**: Approved ✅

**Rationale**:
- Simple, zero dependencies
- Single instance deployment (Docker Swarm with 1 replica)
- Can upgrade to BullMQ later if HA needed

---

## Implementation Phases

| Phase | Scope | Estimate | Status |
|-------|-------|----------|--------|
| 1 | Database + API skeleton | 1-2 weeks | 🔜 Next |
| 2 | Historical sync, USGS integration | 2-3 weeks | Pending |
| 3 | Frontend migration | 2-3 weeks | Pending |
| 4 | Multi-source prep (schema, dedup) | 1-2 weeks | Pending |
| **Total** | | **6-10 weeks** | Flexible |

---

## Architecture Diagrams

### Current (V1.x)
```
Browser → USGS API
         ↓
       IndexedDB
```

### Proposed (V2.x)
```
Browser → API Server → TimescaleDB+PostGIS
                              ↑
                        Scheduler → USGS API
```

---

## File Changes Tracking

### Files Created
- `docs/V2_SERVER_SIDE_ARCHITECTURE_PLAN.md` - Full architecture plan
- `docs/V2_QUESTIONS_FOR_REVIEW.md` - Stakeholder questions
- `docs/V2_ARCHITECTURE_DECISION_RECORD.md` - This file

### Files Updated
- `.github/copilot-instructions.md` - Added V2 context and standards
- `PROJECT_STATUS.md` - Added V2 planning section

### Files to Create (After Decisions)
- `api/` - Backend directory structure
- `docker-compose.v2.yml` - Full stack compose
- Database migrations
- API route handlers

---

## References

- [USGS FDSN API](https://earthquake.usgs.gov/fdsnws/event/1/)
- [EMSC SeismicPortal](https://www.seismicportal.eu/fdsn-wsevent.html)
- [TimescaleDB Docs](https://docs.timescale.com/)
- [PostGIS Docs](https://postgis.net/documentation/)
- [Fastify Docs](https://fastify.dev/)
- [Kysely Docs](https://kysely.dev/)

---

## Approval

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Owner | DLarsen395 | ✅ Approved | January 4, 2026 |

---

*This is a living document. Update as implementation progresses.*
