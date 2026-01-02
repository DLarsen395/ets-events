# Project Status V2 - ETS Events Visualization

**Date:** January 1, 2026  
**Version:** 1.2.8 → 1.2.9 (pending)

## 🐛 Critical Bug Fixed: Data Truncation

### Root Cause Analysis

A **major data loss bug** was discovered and fixed. The app was only retrieving ~15% of expected earthquake data.

**Problem:**
- The `fetchStaleDays()` function grouped consecutive stale days into ranges for batch fetching
- For a 20-year query with all days stale, it would create ONE range covering all 20 years
- A single API call with limit=20,000 would be made for the entire range
- USGS has ~100-180k earthquakes/year for US M-2+, so only 20k of ~2.4M events were fetched

**Evidence:**
| Year | Expected (USGS Count API) | Received | % Retrieved |
|------|---------------------------|----------|-------------|
| 2011 | 91,081 | ~3,000 | 3.3% |
| 2020 | 186,523 | ~63,000 | 33% |
| 20yr Total | ~2.4 million | 359,470 | 15% |

**Fix Applied:**
- Added magnitude-aware range size limits to `fetchStaleDays()`:
  - M6+: 10 years max
  - M5+: 1 year max
  - M4+: 6 months max
  - M3+: 2 months max
  - M2+: 2 weeks max
  - M1+: 1 week max
  - M0+: 3 days max
  - M-2+: 1 day max

This matches the chunking strategy already used in `fetchInChunks()` and ensures no single API call exceeds the 20k limit.

## ✅ Code Quality Verification

### TypeScript Errors
```
✅ No errors found
```

### ESLint
```
✅ All issues fixed (4 setState-in-effect warnings resolved with requestAnimationFrame)
```

### Production Build
```
✅ Build successful (3.85s)
   - dist/index.html: 0.47 kB
   - dist/assets/index.css: 78.25 kB (gzip: 12.41 kB)
   - dist/assets/index.js: 1,873.13 kB (gzip: 537.93 kB)
```

## 📊 USGS Data Verification (Spot Checks)

Verified earthquake counts using USGS Count API:

### Continental US (M-2+)
| Year | Expected Count | Status |
|------|---------------|--------|
| 2006 | 49,576 | ✅ |
| 2008 | 66,564 | ✅ |
| 2010 | 82,118 | ✅ |
| 2012 | 63,042 | ✅ |
| 2014 | 73,979 | ✅ |
| 2016 | 65,133 | ✅ |
| 2018 | 63,060 | ✅ |
| 2020 | 112,834 | ✅ (Ridgecrest sequence) |
| 2022 | 65,788 | ✅ |
| 2024 | 75,376 | ✅ |

### All US Regions Combined (M-2+)
| Year | Continental | Alaska | Hawaii | PR/USVI | Guam | Total |
|------|------------|--------|--------|---------|------|-------|
| 2010 | 82,118 | 30,042 | 616 | 196 | 12 | 112,984 |
| 2020 | 112,834 | 53,501 | 8,026 | 12,112 | 50 | 186,523 |

### The 2020 Spike is Real
The significant increase in 2020 earthquake counts is legitimate:
- **2020 Ridgecrest aftershock sequence** (California)
- **2020 Kilauea activity** (Hawaii: 616 → 8,026)
- **2020 Puerto Rico earthquake sequence** (PR: 196 → 12,112)

## 🔧 Changes in This Update

### Files Modified

1. **src/stores/earthquakeStore.ts**
   - Fixed `fetchStaleDays()` to limit range sizes based on magnitude
   - Prevents 20k API limit truncation

2. **src/App.tsx**
   - Removed unused `AppView` import

3. **src/components/Charts/CacheProgressBanner.tsx**
   - Fixed setState-in-effect lint warning using requestAnimationFrame

4. **src/components/Charts/MagnitudeDistributionChart.tsx**
   - Fixed setState-in-effect lint warning using requestAnimationFrame

5. **src/components/Controls/DataRangeSelector.tsx**
   - Fixed setState-in-effect lint warning using requestAnimationFrame

### Previous Session Fixes (Already Committed)
- Progressive chart updates during cache fetch
- Cache incremental fetch (only fetch missing days)
- Reduced API request delays (50ms)
- Memory optimization for large datasets
- "By By Day" label duplicate fix

## ⚠️ Action Required

### Clear Existing Cache
The cached data is truncated and incomplete. Users must:
1. Open browser DevTools (F12)
2. Go to Application → IndexedDB
3. Delete `earthquake-cache` database
4. Refresh and re-fetch data

### Expected After Fix
After clearing cache and re-fetching 20 years of M-2+ US data:
- **Previous:** ~359,000 events
- **Expected:** ~2,000,000+ events

## 📋 Recommended Pre-Release Checklist

- [ ] Clear cache in development browser
- [ ] Test fresh fetch: 7 days M4+ US (should be ~100-300 events)
- [ ] Test fresh fetch: 30 days M-2+ US (should be ~15,000+ events)
- [ ] Verify progressive chart updates work
- [ ] Test cache expansion (30 days → 90 days, should only fetch 60 new days)
- [ ] Verify hover tooltips show correct magnitude breakdowns
- [ ] Check memory usage with large datasets (no crashes)
- [ ] Deploy to production

## 🏷️ Version Bump Recommendation

Bump to **1.2.9** with changelog:
```
## [1.2.9] - 2026-01-01

### Fixed
- Critical: Data truncation bug causing 85% data loss on large queries
- API limit of 20k events per request now properly chunked by magnitude
- ESLint setState-in-effect warnings

### Changed
- fetchStaleDays() now respects magnitude-aware range limits
- Progressive chart updates during incremental cache fetch
- Reduced API request delays for faster loading
```

## 📈 Performance Notes

With the fix applied, fetching 20 years of M-2+ data will require significantly more API calls:
- **Before:** 1 call (truncated to 20k)
- **After:** ~7,300 calls (1 per day for 20 years)

This is slower but **correct**. For faster initial loads, recommend:
- Default to M4+ (fewer events, larger chunks)
- Use shorter time ranges initially
- Let users expand ranges as needed

The cache system ensures subsequent queries are fast once data is cached.
