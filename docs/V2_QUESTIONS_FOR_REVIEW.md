# V2 Architecture - Questions for Review

**Date**: January 4, 2026
**Status**: ✅ COMPLETED - All questions answered
**Full Details**: [V2_SERVER_SIDE_ARCHITECTURE_PLAN.md](./V2_SERVER_SIDE_ARCHITECTURE_PLAN.md)

---

## Summary of Proposed Changes

Moving from **client-side** (each browser downloads earthquake data from USGS) to **server-side** (one server database, clients get charts on demand).

### Recommended Stack
| Component | Recommendation |
|-----------|----------------|
| **Database** | TimescaleDB + PostGIS (time-series + geospatial) |
| **Backend** | Fastify + TypeScript |
| **Query Builder** | Kysely (type-safe SQL with PostGIS support) |
| **Scheduling** | node-cron (simple) or BullMQ (production) |

---

## Questions Requiring Your Input

Please review and provide your preferences:

### 1. Historical Data Scope
**How far back do you need data?**

- [X] **A) 1500-present** (full USGS catalog, ~3-5M records, 6-12 hour initial sync)
- [ ] **B) 1900-present** (recommended, ~2-3M records, 4-6 hour sync)
- [ ] **C) 1970-present** (modern instrumentation era, ~1-2M records, 2-3 hour sync)
- [ ] **D) 2000-present** (~500K records, 1-2 hour sync)

**Notes**: Pre-1900 data is sparse and less reliable. 1900+ covers most significant recorded earthquakes.

---

### 2. Magnitude Range
**What's the minimum magnitude to store?**

- [ ] **A) M2.5+** (recommended - felt earthquakes, USGS default, ~500/day worldwide)
- [ ] **B) M1.0+** (~2000/day - regional completeness)
- [ ] **C) M0+** (~5000/day - micro-earthquakes, research use)
- [X] **D) M-2+** (~10000/day - includes quarry blasts)

**Notes**: Lower magnitude = more data = more storage/sync time. M2.5+ covers all events people actually feel.

---

### 3. Geographic Scope
**Should we store worldwide or region-focused?**

- [X] **A) Worldwide only** (all earthquakes globally)
- [ ] **B) US detailed + worldwide M5+** (~40% less data)
- [ ] **C) Configurable regions** (admin can select)

**Current behavior**: V1 supports both "US" (5 regions) and "Worldwide" scope.

---

### 4. Real-Time Updates
**How quickly should new earthquakes appear?**

- [ ] **A) 1 minute** (near real-time, higher API load)
- [X] **B) 5 minutes** (recommended - matches USGS real-time feeds)
- [ ] **C) 15 minutes** (relaxed, lowest load)
- [X] **D) Manual/On-demand**

---

### 5. Chart Pre-Aggregation
**Should charts be pre-computed or on-demand?**

- [ ] **A) Pre-computed** (instant load, may be slightly stale)
- [ ] **B) On-demand** (always fresh, slightly slower for large ranges)
- [X] **C) Hybrid** (recommended - pre-compute common ranges, compute rare cases)

---

### 6. Client-Side Changes
**How should the frontend change?**

- [X] **A) Full replacement** (remove IndexedDB, all data from API) - recommended for Charts
- [ ] **B) Hybrid** (API main source, IndexedDB as cache)
- [ ] **C) Minimal** (keep existing, add API as alternative)

**Follow-up**: Should ETS Events (map view with PNSN data) also move server-side, or stay client-fetched? ETS Not part of this version.

---

### 7. Deployment Resources
**What server constraints exist?**

| Resource | Your Answer |
|----------|-------------|
| Available RAM | Each node has 16 GB |
| Available Storage | If I map an NFS volume I have up to 2 TB in SSD or 10 TB in HDD |
| Orchestration | Docker Swarm |
| SSL | NPM handles |

**Current**: Docker Swarm via Portainer, NPM for SSL.

---

### 8. API Authentication
**Should the API be restricted?**

- [ ] **A) Public** (simplest, anyone can query - it's public seismic data)
- [X] **B) API Key** (trackable, prevents abuse)
- [ ] **C) JWT/OAuth** (full auth - probably overkill)
- [ ] **D) Same-origin only** (CORS restricts to your domain)

**Question**: Do you need API access for other applications besides your frontend? Not currently.

---

### 9. Timeline
**Does this phased approach work?**

| Phase | Scope | Estimate |
|-------|-------|----------|
| 1 | Database + API skeleton | 1-2 weeks |
| 2 | Historical sync, USGS integration | 2-3 weeks |
| 3 | Frontend migration | 2-3 weeks |
| 4 | Multi-source prep (schema, dedup) | 1-2 weeks |
| **Total** | | **6-10 weeks** |

**Any deadlines or constraints?**: None currently. Flexible timeline is acceptable but it's not currently prod so we can just build it.

---

### 10. Backup Strategy
**How should we handle data recovery?**

- [X] **A) No backup** (re-sync from USGS if needed, 6-12 hours) - simplest for MVP
- [ ] **B) Daily dumps** (pg_dump to volume, minutes to restore)
- [ ] **C) Continuous** (WAL-based point-in-time recovery)

**Notes**: Data is re-fetchable from USGS, so A is viable for MVP. Data will be on NFS volume.

---

## Additional Questions

### Multi-Source Future
When adding EMSC (or other sources), should we:
- [ ] Store all data separately and link duplicates?
- [ ] Merge into canonical events (one record per earthquake)?
- [X] Let me decide later based on implementation complexity?

### ETS Events (PNSN Tremor Data)
Should the map view (tremor events) also move to server-side, or remain client-fetched from PNSN API?
- [ ] Server-side (consistent architecture)
- [X] Keep client-side (PNSN data is small, low volume)

---

## How to Respond

~~Please either:~~
~~1. Edit this file with your selections (checkboxes)~~
~~2. Reply with your choices numbered (e.g., "1: B, 2: A, 3: A, 4: B...")~~
~~3. Ask clarifying questions~~

**✅ All questions answered on January 4, 2026**

## Next Steps

1. ✅ ~~Finalize architecture document~~ - DONE
2. 🔜 Create `api/` directory structure
3. 🔜 Set up development environment
4. 🔜 Begin Phase 1 implementation

---

*Document completed January 4, 2026*
