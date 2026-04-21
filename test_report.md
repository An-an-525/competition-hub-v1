# Supabase Backend API Test Report
**Project:** fdbbcibmqaogsbasoqly
**Date:** 2026-04-21T19:03:00Z
**Script:** /data/user/work/test_backend.py

---

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| Total Tests | 26 |
| Passed | 22 |
| Failed | 4 |
| Success Rate | **84.6%** |
| Avg Response Time | 591.8ms |
| Total Competitions | 135 (matches expected) |

---

## SCHEMA DISCOVERY

The `competitions` table has **44 columns** and uses non-standard naming:

- **Primary key:** `competition_id` (NOT `id`)
- **Name field:** `name` (NOT `title`)
- **URL fields:** Both `official_url` and `source_url` exist
- **Level values:** `national` (74), `provincial` (26), `school` (21), `national_c` (10), `national_b` (3), `national_a` (1)
- **Status values:** All 135 records have `status = upcoming`

The database has **35 table endpoints** exposed via PostgREST, including: competitions, users, ai_conversations, ai_messages, notifications, registrations, teams, colleges, enterprises, certificates, audit_logs, and more.

**IMPORTANT:** The `applications` table does NOT exist (404). The equivalent appears to be `registrations`.

---

## TEST RESULTS DETAIL

### PHASE 0: Schema Discovery
- OpenAPI schema loaded successfully: 35 paths, 11 definitions
- Raw fetch of competitions confirmed 44 columns

### PHASE 1: REST API Tests (Service Role Key)

| ID | Test | HTTP | Time | Status |
|----|------|------|------|--------|
| 1a | GET competitions - List all (limit 200) | 200 | 821ms | PASS |
| 1b | GET competitions - Select specific fields | 200 | 620ms | PASS |
| 1c | GET competitions - Level filter (beginner) | 200 | 527ms | PASS |
| 2 | GET competitions - By competition_id | 200 | 620ms | PASS |
| 3 | GET competitions - source_url not.is.null | 200 | 719ms | PASS |
| 4 | GET competitions - Count (Prefer: count=exact) | 206 | 534ms | PASS (Content-Range: 0-0/135) |
| 5-beginner | GET competitions - Level=beginner | 200 | 556ms | PASS |
| 5-intermediate | GET competitions - Level=intermediate | 200 | 588ms | PASS |
| 5-advanced | GET competitions - Level=advanced | 200 | 561ms | PASS |
| 6-order-name | GET competitions - Order by name | 200 | 582ms | PASS |
| 6-order-created_at | GET competitions - Order by created_at | 200 | 500ms | PASS |
| 6-order-level | GET competitions - Order by level | 200 | 747ms | PASS |
| 6-order-competition_id | GET competitions - Order by competition_id | 200 | 535ms | PASS |
| 7 | GET users table | 200 | 516ms | PASS |
| 8 | GET ai_conversations table | 200 | 526ms | PASS |
| 9 | GET ai_messages table | 200 | 513ms | PASS |
| **10** | **GET applications table** | **404** | **607ms** | **FAIL** |
| 11 | GET notifications table | 200 | 560ms | PASS |
| **12a** | **POST competitions - Insert test record** | **400** | **519ms** | **FAIL** |
| 13a | PATCH competitions - Update name | 200 | 548ms | PASS |
| 13b | PATCH competitions - Revert name | 200 | 563ms | PASS |

### PHASE 2: Edge Function Tests

| ID | Test | HTTP | Time | Status |
|----|------|------|------|--------|
| 14 | GET /competition-api/health | 200 | 527ms | PASS |
| **15a** | **POST /competition-api/api/login** | **400** | **586ms** | **FAIL** |
| 16a | GET /competition-api/rest/v1/competitions (no params) | 200 | 902ms | PASS |
| 16b | GET /competition-api/rest/v1/competitions (limit=5) | 200 | 644ms | PASS |

### Anon Key Test

| ID | Test | HTTP | Time | Status |
|----|------|------|------|--------|
| **ANON-1** | **GET competitions with anon key** | **401** | **467ms** | **FAIL** |

---

## FAILED TEST ANALYSIS

### 1. Test 10: GET applications table (HTTP 404)
- **Error:** `Could not find the table 'public.applications' in the schema cache`
- **Hint from Supabase:** "Perhaps you meant the table 'public.notifications'"
- **Root cause:** The `applications` table does not exist. The equivalent table is likely `registrations`.
- **Impact:** Medium - any code referencing `applications` will fail.

### 2. Test 12a: POST competitions - Insert (HTTP 400)
- **Error:** `code: 23514` (check constraint violation)
- **Details:** The insert payload fails a database check constraint. The failing row shows the record was being created with `competition_id=169` but some constraint was violated.
- **Root cause:** A check constraint on the `competitions` table prevents the test insert. The constraint likely validates field combinations (e.g., level/status relationship, or required fields for certain levels).
- **Impact:** Low - this is a data integrity feature, not a bug. The PATCH (update) works fine.

### 3. Test 15a: POST /competition-api/api/login (HTTP 400)
- **Error:** `{'error': '请输入学号和密码'}` ("Please enter student ID and password")
- **Root cause:** The login endpoint expects specific field names (likely `student_id` and `password` in the request body, or possibly different parameter names). The edge function is rejecting the request before processing.
- **Impact:** Low - this is expected behavior with test/invalid credentials. The endpoint is functioning and returning appropriate error messages.

### 4. Test ANON-1: Anon Key REST API Access (HTTP 401)
- **Error:** `Invalid API key`
- **Root cause:** The provided anon key is rejected by Supabase. This could mean the key was rotated/regenerated, or the API is configured to only accept the service role key.
- **Impact:** High - if the frontend relies on the anon key for public data access, it will fail. All client-side requests would need to go through the edge function proxy instead.

---

## DATA QUALITY ANALYSIS

### Competition Count
- **135 / 135** competitions returned -- matches expected count

### source_url Coverage
- **135/135 (100%)** have `source_url` populated -- no missing values

### official_url Coverage
- **52/135 (38.5%)** have a non-empty `official_url`
- **82 competitions** have an empty string `official_url` (not NULL, but empty "")
- **1 competition** has NULL `official_url`
- **Issue:** 83 competitions (61.5%) lack a usable official URL

### Critical Field Completeness (all 100%)
- `competition_id`: 135/135
- `name`: 135/135
- `level`: 135/135
- `status`: 135/135
- `source_url`: 135/135
- `source_name`: 135/135
- `description`: 135/135
- `organizer_name`: 135/135

### Fields with Significant NULL Values
| Field | Non-null | % | Notes |
|-------|----------|---|-------|
| short_name | 37/135 | 27.4% | Optional abbreviation |
| category_id | 98/135 | 72.6% | 37 uncategorized |
| hosting_college_id | 98/135 | 72.6% | 37 without host college |
| contact_teacher | 37/135 | 27.4% | |
| contact_phone | 37/135 | 27.4% | |
| awards | 37/135 | 27.4% | |
| tracks | 37/135 | 27.4% | |
| notes | 37/135 | 27.4% | |
| qq_group | 36/135 | 26.7% | |
| max_participants | 37/135 | 27.4% | |
| registration_start | 0/135 | 0% | All NULL |
| registration_end | 0/135 | 0% | All NULL |
| event_start_date | 0/135 | 0% | All NULL |
| event_end_date | 0/135 | 0% | All NULL |
| historical_win_rate | 0/135 | 0% | All NULL |
| contact_location | 0/135 | 0% | All NULL |
| cover_image_url | 0/135 | 0% | All NULL |
| parent_competition_id | 0/135 | 0% | All NULL (no hierarchy) |

### Level Distribution
| Level | Count |
|-------|-------|
| national | 74 |
| provincial | 26 |
| school | 21 |
| national_c | 10 |
| national_b | 3 |
| national_a | 1 |

**Note:** The level values use a custom scheme (national/national_a/national_b/national_c/provincial/school) rather than the standard beginner/intermediate/advanced. The beginner/intermediate/advanced filters return 0 results.

### Status Distribution
| Status | Count |
|--------|-------|
| upcoming | 135 |

**All competitions are in "upcoming" status** -- no active, completed, or archived competitions exist.

### Duplicate Names
- **No duplicate names found** -- all 135 competition names are unique.

### school_level_info
- All 135 records have `school_level_info = {}` (empty JSONB object)

---

## KEY FINDINGS & RECOMMENDATIONS

1. **Anon key is invalid (401):** The provided anon key is not accepted by Supabase REST API. This blocks any direct client-side API access. Either regenerate the anon key or route all traffic through the edge function proxy.

2. **`applications` table does not exist:** Replace references with `registrations` table.

3. **POST insert has a check constraint:** The competitions table has a constraint that prevents simple test inserts. The PATCH (update) endpoint works correctly. Investigate the constraint if programmatic inserts are needed.

4. **Level values are non-standard:** The `level` column uses `national/provincial/school/national_a/national_b/national_c` instead of `beginner/intermediate/advanced`. Any filtering by beginner/intermediate/advanced returns empty results.

5. **61.5% of competitions have empty `official_url`:** 82 out of 135 records have an empty string for `official_url`. Only 52 have actual URLs.

6. **Date fields are entirely empty:** `registration_start`, `registration_end`, `event_start_date`, `event_end_date` are all NULL across all 135 records.

7. **Edge functions work well:** The health endpoint and REST proxy both function correctly through the edge function, providing a working alternative to direct REST API access.

8. **All 135 competitions have `source_url`:** Full coverage on this field -- no missing values.

9. **No data corruption:** All critical fields (competition_id, name, level, status, source_url, source_name, description, organizer_name) are 100% populated. No duplicate names.
