# Medexa — Final Database Schema (West Bengal Real-Data Edition)

Supersedes `MEDEXA_FINAL_DATABASE_SCHEMA.md` (the earlier version). This reflects the database after loading the **West Bengal Ultimate Data Package** — real coordinates, real facilities, real geography, and synthetic operational data linked to both.

**Note on your GitHub repo:** I tried pulling `https://github.com/deb1704-student/Medexa` three ways (git clone, and tarball download across `main`/`master`/`dev` branches via `codeload.github.com`) — every attempt returned 404. The repo currently has no pushed content, or it's private. So everything below is built fresh from your last-known backend structure plus this new dataset, packaged so you can push it directly.

---

## What changed since the last schema version

1. **`facilities` table extended**, not replaced — new `FacilityType` values (`chc`, `state_hospital`), new provenance/contact fields, and a new explicit `CoordinateStatus` enum.
2. **New `facility_services` table** — per-service, per-facility capacity tracking (e.g. "General OPD: available", "Emergency: full"), more granular than the three static availability enums on `Facility`.
3. **`facilities.py` router's pathway-ranking logic fixed** — it would have crashed or silently misbehaved on the 1,168 real facilities that have no coordinates. Now explicitly filters and returns a clear 422 when the origin facility itself lacks coordinates.
4. **Real geography tables** (`locations`, `districts`, `subdistricts`, `blocks`, `local_bodies`) — 41,416 real LGD-derived West Bengal locations, ready to load as-is.

---

## Data provenance (verified, not assumed)

| Source | Rows | Coordinates | Verified |
|---|---|---|---|
| All India Health Centres Directory | 11,698 | 11,695 present (118 swapped-lat/lon corrected, 1 corrected via Wikidata) | ✅ checked bounding box, checked coordinate_status distribution |
| National Hospital Directory | 1,165 | 0 present | ✅ confirmed column exists but is empty for every row |
| LGD West Bengal locations | 41,416 | N/A (villages, not facilities) | ✅ spot-checked against earlier village directory |
| Synthetic operational data | 50 patients/episodes/referrals/etc. | Linked to 10 **real** South 24 Parganas facilities with real coordinates | ✅ confirmed `from_facility_id`/`to_facility_id` in referrals resolve to real `MED-WB-FAC-` IDs |

**3 facilities remain genuinely unresolved** (Ajangachi SC, RHUTC 7 Nasibpur Sub Centre, Hatkhola SC) — each has a latitude but no longitude, and no web-verifiable correction was found. They're loaded with `coordinate_status = missing_or_invalid` and will correctly not appear in pathway-ranking results.

---

## Schema

### `facilities` (extended)
| Column | Type | Notes |
|---|---|---|
| id | string PK | `MED-WB-FAC-######` or `MED-WB-HOSP-######` — kept as source-provided IDs, not re-generated UUIDs, so provenance stays traceable |
| name | string | indexed |
| facility_type | enum, nullable | `sub_centre / phc / chc / rural_hospital / state_hospital / district_hospital` — **null for ~96% of hospital-directory rows**, genuinely unclassified in source |
| district | string, nullable | indexed |
| district_mapping_confident | bool | **False for 902 rows** — pre-2017 Bardhaman district split creates genuine ambiguity, not a bug |
| subdistrict | string, nullable | |
| pincode | string, nullable | |
| latitude / longitude | float, nullable | |
| coordinate_status | enum | `present / missing_or_invalid` — **pathway-ranking code must filter on this** |
| coordinate_source, coordinate_confidence | string, nullable | audit trail |
| source, source_record_id, verification_status | string, nullable | provenance — never silently deduplicate across sources |
| facility_category, facility_care_type, medicine_system | string, nullable | hospital-directory only, 96%+ sparse |
| telephone, mobile_number, emergency_number, website | string, nullable | 25–40% populated |
| specialties_raw | string, nullable | free text, <2% populated, not yet parsed into structured tags |
| service_availability, diagnostic_availability, medicine_availability | enum | static defaults — see `facility_services` for real per-service data |

### `facility_services` (NEW)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| facility_id | FK -> facilities | indexed |
| service_name | string | e.g. "General OPD", "Maternal Care", "Emergency" |
| available | bool | |
| capacity_status | enum(available/limited/full) | |
| last_updated | timestamp | |

### Geography dimensions (all real LGD data, load in this order)
- `districts` (23 rows) → `subdistricts` (349) → `blocks` (348) → `local_bodies` (3,358) → `locations` (41,416, the village-level table)

### Everything else
Unchanged from the previous schema doc — `patients`, `care_episodes`, `referrals` (15-state enum), `referral_state_transitions`, `referral_slas`, `referral_rescue_actions`, `back_referrals`, `follow_up_tasks`, `continuity_risk_scores`, `users`, `audit_logs`.

---

## Loading order (matches the package README exactly)

```
1. districts, subdistricts, blocks, local_bodies, locations   (geography)
2. facilities                                                  (12,863 rows)
3. facility_services                                            (from synthetic set for demo, or real data once you have it)
4. patients, care_episodes, triage_assessments                  (synthetic, linked to real villages)
5. referrals, referral_slas, referral_state_transitions          (synthetic, linked to real facilities)
6. follow_up_tasks
```

`scripts/seed_wb_data.py` runs this exact order.

---

## What's in this delivery

```
medexa_db_final/
├── medexa_locations.csv              41,416 real LGD villages
├── medexa_districts.csv              23 real districts
├── medexa_subdistricts.csv           349 real subdistricts
├── medexa_blocks.csv                 348 real blocks
├── medexa_local_bodies.csv           3,358 real local bodies
├── medexa_facilities.csv             12,863 unified real facilities (11,695 with coordinates)
├── medexa_synthetic_patients.csv     50 patients, linked to real villages
├── medexa_synthetic_care_episodes.csv
├── medexa_synthetic_triage.csv
├── medexa_synthetic_referrals.csv    linked to REAL facility IDs, states mapped to your actual 15-state machine
├── medexa_synthetic_referral_transitions.csv
├── medexa_synthetic_follow_up_tasks.csv
├── medexa_synthetic_facility_services.csv
└── backend_patches/
    ├── facility.py           extended Facility model — drop into app/models/
    ├── facility_service.py   new model — add to app/models/
    ├── facilities.py         fixed router — replace app/routers/facilities.py
    └── seed_wb_data.py       new seed script — add to scripts/
```

## Integration steps

1. Push your existing backend/frontend code to `github.com/deb1704-student/Medexa` first (it's currently empty/unreachable) — I can't merge into what isn't there.
2. Copy `backend_patches/facility.py` over `app/models/facility.py`.
3. Add `backend_patches/facility_service.py` to `app/models/`, and add `FacilityService, CapacityStatus` to `app/models/__init__.py`'s import list.
4. Replace `app/routers/facilities.py` with `backend_patches/facilities.py`.
5. Copy the CSVs into `backend/data/wb_final/` (create the folder).
6. Run `alembic revision --autogenerate -m "add facility_services, extend facility_type"` then `alembic upgrade head`.
7. Run `python -m scripts.seed_wb_data`.

## Remaining honest gaps

- **1,165 hospital-directory facilities still have zero coordinates** — this data package didn't manufacture them, and neither will I. If you want these on a map, that's a separate geocoding task (e.g. address + pincode → Nominatim), not something to fabricate.
- **Specialties/facilities_description are free text** — genuinely useful data, but not yet parsed into structured, queryable tags. Worth doing if you have time before judging.
- **Real facility_services data doesn't exist yet** — only the 10 synthetic-linked facilities have service-level records. The other 12,853 real facilities only have the static three-field defaults.
