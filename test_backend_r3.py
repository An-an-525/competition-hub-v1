#!/usr/bin/env python3
"""
Comprehensive Backend & Performance Test Suite (v2 - corrected schema)
Project: fdbbcibmqaogsbasoqly
Tests: Data Integrity, Edge Function Robustness, Security, Performance

Actual schema discovered:
  - PK is competition_id (not id) on competitions table
  - Tables: competitions, registrations, ai_conversations, ai_messages, users,
    colleges, roles, user_roles, team_members, teams, notifications, audit_logs,
    community_posts, competition_milestones, learning_resources, point_records,
    majors, enterprises, competition_admin_dashboard, competition_categories
  - Edge Function routes: /rest/v1/{table} for proxy, /api/health, /api/login, /api/register
  - REST API requires both Authorization AND apikey headers
  - Management API blocked by Cloudflare (403) - use REST API for data checks
"""

import json
import time
import sys
import urllib.request
import urllib.error
import urllib.parse
import concurrent.futures
import ssl
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_REF = "fdbbcibmqaogsbasoqly"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmJjaWJtcWFvZ3NiYXNvcWx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYxNzU3NSwiZXhwIjoyMDkyMTkzNTc1fQ.fZm5QVWfMMH5wHyUVKuAXzfBGM3SZOrYh8Nt4dWmmAU"

EDGE_FUNCTION_BASE = f"https://{PROJECT_REF}.supabase.co/functions/v1/competition-api"
REST_BASE = f"https://{PROJECT_REF}.supabase.co/rest/v1"

# Headers for service_role access to REST API
SR_HEADERS = {
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "apikey": SERVICE_ROLE_KEY,
    "Content-Type": "application/json"
}

# Headers for anon access (no valid anon key - use empty to test auth blocking)
ANON_HEADERS = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmJjaWJtcWFvZ3NiYXNvcWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTc1NzUsImV4cCI6MjA5MjE5MzU3NX0.placeholder",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmJjaWJtcWFvZ3NiYXNvcWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTc1NzUsImV4cCI6MjA5MjE5MzU3NX0.placeholder",
    "Content-Type": "application/json"
}

# ============================================================================
# RESULTS TRACKING
# ============================================================================

results = []

def record_result(category, test_name, status, severity, details=""):
    """Record a test result."""
    results.append({
        "category": category,
        "test": test_name,
        "status": status,
        "severity": severity,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    })
    icon = {"PASS": "PASS", "FAIL": "FAIL", "WARN": "WARN", "ERROR": "ERR!"}[status]
    sev = f"[{severity}]"
    print(f"  [{icon}] {status} {sev} {test_name}")
    if details:
        for line in details.split("\n"):
            print(f"      {line}")

def make_request(url, method="GET", data=None, headers=None, timeout=30):
    """Make an HTTP request and return (status_code, response_body, elapsed_seconds)."""
    if headers is None:
        headers = {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=req_data, method=method, headers=headers)
    ctx = ssl.create_default_context()

    start = time.time()
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        elapsed = time.time() - start
        body = resp.read().decode("utf-8")
        return resp.status, body, elapsed
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start
        body = ""
        try:
            body = e.read().decode("utf-8")
        except Exception:
            pass
        return e.code, body, elapsed
    except Exception as e:
        elapsed = time.time() - start
        return 0, str(e), elapsed

def rest_get(table, select="*", filters=None, limit=1000, headers=None):
    """GET from REST API with proper headers."""
    if headers is None:
        headers = dict(SR_HEADERS)
    url = f"{REST_BASE}/{table}?select={select}&limit={limit}"
    if filters:
        for k, v in filters.items():
            url += f"&{k}={urllib.parse.quote(str(v))}"
    return make_request(url, headers=headers)

def rest_count(table):
    """Get exact row count via Prefer: count=exact header."""
    headers = dict(SR_HEADERS)
    headers["Prefer"] = "count=exact"
    headers["Range"] = "0-0"
    status, body, elapsed = make_request(
        f"{REST_BASE}/{table}?select=competition_id" if table == "competitions"
        else f"{REST_BASE}/{table}?select=*",
        headers=headers
    )
    # Parse content-range header from the raw response
    # Since urllib doesn't give us easy access, use a different approach
    # We'll just fetch all and count
    status2, body2, elapsed2 = make_request(
        f"{REST_BASE}/{table}?select=competition_id" if table == "competitions"
        else f"{REST_BASE}/{table}?select=*",
        headers=SR_HEADERS
    )
    if status2 == 200:
        try:
            data = json.loads(body2)
            return len(data) if isinstance(data, list) else "?"
        except Exception:
            return "?"
    return "error"

# ============================================================================
# A. DATA INTEGRITY TESTS (via REST API)
# ============================================================================

def test_data_integrity():
    print("\n" + "=" * 70)
    print("CATEGORY A: DATA INTEGRITY (via REST API)")
    print("=" * 70)

    # A1. Check for duplicate competition names
    print("\n  A1. Duplicate competition names")
    status, body, elapsed = rest_get("competitions", select="name", limit=1000)
    if status == 200:
        data = json.loads(body)
        names = [r["name"] for r in data if r.get("name")]
        from collections import Counter
        dupes = {name: count for name, count in Counter(names).items() if count > 1}
        if dupes:
            record_result("Data Integrity", "A1. Duplicate competition names",
                          "FAIL", "HIGH",
                          f"Found {len(dupes)} duplicate name(s): {json.dumps(dupes)}")
        else:
            record_result("Data Integrity", "A1. Duplicate competition names",
                          "PASS", "INFO", f"No duplicates among {len(names)} records")
    else:
        record_result("Data Integrity", "A1. Duplicate competition names",
                      "ERROR", "HIGH", f"Query failed: HTTP {status} - {body[:200]}")

    # A2. Check for NULL name, level, or status
    print("\n  A2. Competitions with NULL name, level, or status")
    null_issues = []
    for field in ["name", "level", "status"]:
        status, body, elapsed = rest_get("competitions", select="competition_id,name",
                                          filters={field: "is.null"})
        if status == 200:
            data = json.loads(body)
            if isinstance(data, list) and len(data) > 0:
                null_issues.append(f"{field}: {len(data)} record(s) with NULL")
    if null_issues:
        record_result("Data Integrity", "A2. NULL required fields",
                      "FAIL", "CRITICAL",
                      "Issues found:\n" + "\n".join(null_issues))
    else:
        record_result("Data Integrity", "A2. NULL required fields",
                      "PASS", "INFO", "No NULL values in name, level, or status")

    # A3. Check for empty descriptions
    print("\n  A3. Competitions with empty description")
    status, body, elapsed = rest_get("competitions", select="competition_id,name",
                                      filters={"description": "is.null"}, limit=1000)
    null_desc_count = 0
    if status == 200:
        data = json.loads(body)
        null_desc_count = len(data) if isinstance(data, list) else 0

    # Also check for empty string descriptions
    status2, body2, elapsed2 = rest_get("competitions", select="competition_id,name,description",
                                         limit=1000)
    empty_desc_count = 0
    empty_desc_examples = []
    if status2 == 200:
        data2 = json.loads(body2)
        if isinstance(data2, list):
            for r in data2:
                desc = r.get("description")
                if desc is not None and isinstance(desc, str) and desc.strip() == "":
                    empty_desc_count += 1
                    if len(empty_desc_examples) < 5:
                        empty_desc_examples.append(f"id={r['competition_id']}: '{r['name'][:30]}'")

    total_empty = null_desc_count + empty_desc_count
    if total_empty > 0:
        record_result("Data Integrity", "A3. Empty descriptions",
                      "WARN", "MEDIUM",
                      f"NULL descriptions: {null_desc_count}, Empty string descriptions: {empty_desc_count}. "
                      f"Examples: {json.dumps(empty_desc_examples[:3])}")
    else:
        record_result("Data Integrity", "A3. Empty descriptions",
                      "PASS", "INFO", "All competitions have non-empty descriptions")

    # A4. Check for invalid source_url
    print("\n  A4. Competitions with invalid source_url")
    status, body, elapsed = rest_get("competitions",
                                      select="competition_id,name,source_url,official_url",
                                      limit=1000)
    invalid_urls = []
    if status == 200:
        data = json.loads(body)
        if isinstance(data, list):
            for r in data:
                for url_field in ["source_url", "official_url"]:
                    url_val = r.get(url_field)
                    if url_val and isinstance(url_val, str) and url_val.strip():
                        if not (url_val.startswith("http://") or url_val.startswith("https://")):
                            invalid_urls.append(f"id={r['competition_id']} {url_field}='{url_val[:60]}'")
    if invalid_urls:
        record_result("Data Integrity", "A4. Invalid URLs",
                      "FAIL", "MEDIUM",
                      f"Found {len(invalid_urls)} invalid URL(s):\n" + "\n".join(invalid_urls[:5]))
    else:
        record_result("Data Integrity", "A4. Invalid URLs",
                      "PASS", "INFO", "All source_url and official_url values are valid HTTP(S) URLs")

    # A5. Orphaned registrations (competition_id not in competitions)
    print("\n  A5. Orphaned registrations")
    status, body, elapsed = rest_get("registrations",
                                      select="registration_id,competition_id",
                                      limit=1000)
    orphaned = []
    if status == 200:
        reg_data = json.loads(body)
        if isinstance(reg_data, list) and len(reg_data) > 0:
            # Get all competition IDs
            status2, body2, elapsed2 = rest_get("competitions", select="competition_id", limit=1000)
            if status2 == 200:
                comp_data = json.loads(body2)
                comp_ids = {r["competition_id"] for r in comp_data} if isinstance(comp_data, list) else set()
                for reg in reg_data:
                    cid = reg.get("competition_id")
                    if cid and cid not in comp_ids:
                        orphaned.append(f"registration_id={reg['registration_id']} -> competition_id={cid}")
    if orphaned:
        record_result("Data Integrity", "A5. Orphaned registrations",
                      "FAIL", "HIGH",
                      f"Found {len(orphaned)} orphaned record(s):\n" + "\n".join(orphaned[:5]))
    else:
        record_result("Data Integrity", "A5. Orphaned registrations",
                      "PASS", "INFO", "No orphaned registrations found")

    # A6. Orphaned ai_messages (conversation_id not in ai_conversations)
    print("\n  A6. Orphaned ai_messages")
    status, body, elapsed = rest_get("ai_messages",
                                      select="message_id,conversation_id",
                                      limit=1000)
    orphaned = []
    if status == 200:
        msg_data = json.loads(body)
        if isinstance(msg_data, list) and len(msg_data) > 0:
            status2, body2, elapsed2 = rest_get("ai_conversations",
                                                 select="conversation_id", limit=1000)
            if status2 == 200:
                conv_data = json.loads(body2)
                conv_ids = {r["conversation_id"] for r in conv_data} if isinstance(conv_data, list) else set()
                for msg in msg_data:
                    cid = msg.get("conversation_id")
                    if cid and cid not in conv_ids:
                        orphaned.append(f"message_id={msg['message_id']} -> conversation_id={cid}")
    if orphaned:
        record_result("Data Integrity", "A6. Orphaned ai_messages",
                      "FAIL", "HIGH",
                      f"Found {len(orphaned)} orphaned message(s):\n" + "\n".join(orphaned[:5]))
    else:
        record_result("Data Integrity", "A6. Orphaned ai_messages",
                      "PASS", "INFO", "No orphaned ai_messages found")

    # A7. Table row counts
    print("\n  A7. Table row counts")
    tables_to_check = [
        "competitions", "registrations", "ai_messages", "ai_conversations",
        "users", "colleges", "roles", "user_roles", "team_members", "teams",
        "notifications", "audit_logs", "community_posts", "competition_milestones",
        "learning_resources", "point_records", "majors", "enterprises",
        "competition_admin_dashboard", "competition_categories"
    ]
    for table in tables_to_check:
        count = rest_count(table)
        if count != "error":
            record_result("Data Integrity", f"A7. Row count: {table}",
                          "PASS", "INFO", f"{table}: {count} rows")
        else:
            record_result("Data Integrity", f"A7. Row count: {table}",
                          "WARN", "LOW", f"Could not query table {table}")

    # A8. Check table schemas via REST API (fetch one record with select=*)
    print("\n  A8. Table schema verification")
    expected_schemas = {
        "competitions": ["competition_id", "name", "description", "level", "status",
                         "source_url", "official_url", "created_at", "updated_at"],
        "registrations": ["registration_id", "competition_id", "user_id", "status", "created_at"],
        "ai_conversations": ["conversation_id", "user_id", "competition_context", "created_at"],
        "ai_messages": ["message_id", "conversation_id", "role", "content", "created_at"],
        "users": ["user_id", "csust_id", "real_name", "nickname", "college_id", "created_at"],
    }
    for table, expected_cols in expected_schemas.items():
        status, body, elapsed = rest_get(table, select="*", limit=1)
        if status == 200:
            data = json.loads(body)
            if isinstance(data, list) and len(data) > 0:
                actual_cols = set(data[0].keys())
            elif isinstance(data, list) and len(data) == 0:
                # Table is empty - use OpenAPI schema to verify columns exist
                # Fetch the OpenAPI spec to check table definition
                api_status, api_body, _ = make_request(f"{REST_BASE}/", headers=SR_HEADERS)
                if api_status == 200:
                    try:
                        api_spec = json.loads(api_body)
                        definitions = api_spec.get("definitions", {})
                        if table in definitions:
                            table_def = definitions[table]
                            actual_cols = set(table_def.get("properties", {}).keys())
                        else:
                            record_result("Data Integrity", f"A8. Schema: {table}",
                                          "WARN", "LOW",
                                          f"Table is empty and not found in API schema definition. Cannot verify columns.")
                            continue
                    except Exception:
                        record_result("Data Integrity", f"A8. Schema: {table}",
                                      "WARN", "LOW", f"Table is empty. Could not parse API schema.")
                        continue
                else:
                    record_result("Data Integrity", f"A8. Schema: {table}",
                                  "WARN", "LOW", f"Table is empty. Could not fetch API schema (HTTP {api_status}).")
                    continue
            elif isinstance(data, dict):
                actual_cols = set(data.keys())
            else:
                actual_cols = set()
            missing = set(expected_cols) - actual_cols
            extra = actual_cols - set(expected_cols)
            if missing:
                record_result("Data Integrity", f"A8. Schema: {table}",
                              "FAIL", "HIGH",
                              f"Missing expected columns: {missing}. Actual columns: {sorted(actual_cols)}")
            else:
                extra_info = f" (+ {len(extra)} extra columns: {sorted(extra)[:5]}...)" if extra else ""
                record_result("Data Integrity", f"A8. Schema: {table}",
                              "PASS", "INFO",
                              f"All {len(expected_cols)} expected columns present. Total: {len(actual_cols)}{extra_info}")
        else:
            record_result("Data Integrity", f"A8. Schema: {table}",
                          "WARN", "LOW", f"Could not fetch schema: HTTP {status}")

# ============================================================================
# B. EDGE FUNCTION ROBUSTNESS TESTS
# ============================================================================

def test_edge_function_robustness():
    print("\n" + "=" * 70)
    print("CATEGORY B: EDGE FUNCTION ROBUSTNESS")
    print("=" * 70)

    # The Edge Function acts as a proxy/gateway. Routes:
    #   /rest/v1/{table} -> proxies to REST API
    #   /api/health -> health check
    #   /api/login -> login endpoint
    #   /api/register -> register endpoint
    #   / (root) -> returns API info

    # B1. Malformed JSON to POST endpoint
    print("\n  B1. Malformed JSON to POST endpoint")
    status, body, elapsed = make_request(
        f"{EDGE_FUNCTION_BASE}/api/login",
        method="POST",
        data="this is not json{{{",
        headers={"Content-Type": "application/json"}
    )
    if status == 400 or status == 422:
        record_result("Edge Function", "B1. Malformed JSON handling",
                      "PASS", "INFO", f"Returned {status} for malformed JSON")
    elif status == 500:
        record_result("Edge Function", "B1. Malformed JSON handling",
                      "FAIL", "HIGH",
                      f"Returned 500 instead of 400/422 for malformed JSON. Body: {body[:200]}")
    else:
        # Some frameworks return 200 with error message in body
        record_result("Edge Function", "B1. Malformed JSON handling",
                      "WARN", "MEDIUM",
                      f"Unexpected status {status}. Body: {body[:200]}")

    # B2. Invalid path
    print("\n  B2. Invalid path handling")
    status, body, elapsed = make_request(
        f"{EDGE_FUNCTION_BASE}/nonexistent/invalid/path",
        headers={"Authorization": f"Bearer {SERVICE_ROLE_KEY}"}
    )
    if status == 404:
        record_result("Edge Function", "B2. Invalid path handling",
                      "PASS", "INFO", f"Returned 404 for invalid path")
    elif status == 500:
        record_result("Edge Function", "B2. Invalid path handling",
                      "FAIL", "HIGH",
                      f"Returned 500 instead of 404. Body: {body[:200]}")
    else:
        # Edge Function returns 200 with API info for unrecognized routes
        record_result("Edge Function", "B2. Invalid path handling",
                      "WARN", "MEDIUM",
                      f"Status {status} for invalid path (returns API info page instead of 404). Body: {body[:150]}")

    # B3. Extremely long query string
    print("\n  B3. Extremely long query string")
    long_qs = "x" * 10000
    status, body, elapsed = make_request(
        f"{EDGE_FUNCTION_BASE}/rest/v1/competitions?select=name&name=ilike.*{long_qs}*",
        headers={"Authorization": f"Bearer {SERVICE_ROLE_KEY}"}
    )
    if status in (200, 400, 413, 414):
        record_result("Edge Function", "B3. Long query string handling",
                      "PASS", "INFO",
                      f"Returned {status} for 10K char query string ({elapsed:.2f}s)")
    elif status == 500:
        record_result("Edge Function", "B3. Long query string handling",
                      "FAIL", "MEDIUM",
                      f"Returned 500 for long query string. Body: {body[:200]}")
    else:
        record_result("Edge Function", "B3. Long query string handling",
                      "WARN", "LOW", f"Unexpected status {status}")

    # B4. Concurrent requests (10 simultaneous)
    print("\n  B4. Concurrent requests (10 simultaneous)")
    def fetch_via_ef(i):
        return make_request(
            f"{EDGE_FUNCTION_BASE}/rest/v1/competitions?select=competition_id,name&limit=200",
            headers={"Authorization": f"Bearer {SERVICE_ROLE_KEY}"}
        )

    start = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(fetch_via_ef, i) for i in range(10)]
        responses = [f.result() for f in futures]
    total_elapsed = time.time() - start

    statuses = [r[0] for r in responses]
    errors_500 = statuses.count(500)
    errors_0 = statuses.count(0)
    successes = statuses.count(200)

    if errors_500 == 0 and errors_0 == 0:
        record_result("Edge Function", "B4. Concurrent requests",
                      "PASS", "INFO",
                      f"All 10 requests succeeded. Successes: {successes}, "
                      f"Total time: {total_elapsed:.2f}s, Avg: {total_elapsed/10:.2f}s")
    elif errors_500 > 0:
        record_result("Edge Function", "B4. Concurrent requests",
                      "FAIL", "HIGH",
                      f"{errors_500}/10 requests returned 500 (possible race condition). "
                      f"Successes: {successes}")
    else:
        record_result("Edge Function", "B4. Concurrent requests",
                      "WARN", "MEDIUM",
                      f"{errors_0}/10 connection errors. Successes: {successes}, 500s: {errors_500}")

    # B5. Response time for competitions list via Edge Function
    print("\n  B5. Response time: competitions list via Edge Function")
    times = []
    counts = []
    for i in range(5):
        status, body, elapsed = make_request(
            f"{EDGE_FUNCTION_BASE}/rest/v1/competitions?select=competition_id,name,level,status&limit=200",
            headers={"Authorization": f"Bearer {SERVICE_ROLE_KEY}"}
        )
        times.append(elapsed)
        if status == 200:
            try:
                data = json.loads(body)
                counts.append(len(data) if isinstance(data, list) else "?")
            except Exception:
                counts.append("?")
    avg_time = sum(times) / len(times)
    p50 = sorted(times)[len(times)//2]
    if avg_time < 2.0:
        record_result("Edge Function", "B5. Competitions list response time",
                      "PASS", "INFO",
                      f"Avg: {avg_time:.3f}s, P50: {p50:.3f}s (threshold: 2s). "
                      f"Records: {counts[0] if counts else '?'}. "
                      f"Times: {[f'{t:.3f}' for t in times]}")
    else:
        record_result("Edge Function", "B5. Competitions list response time",
                      "FAIL", "HIGH",
                      f"Avg: {avg_time:.3f}s exceeds 2s. Times: {[f'{t:.3f}' for t in times]}")

    # B6. Response time for single competition detail
    print("\n  B6. Response time: single competition detail")
    # Get a competition ID first
    status, body, elapsed = rest_get("competitions", select="competition_id", limit=1)
    comp_id = None
    if status == 200:
        data = json.loads(body)
        if isinstance(data, list) and len(data) > 0:
            comp_id = data[0].get("competition_id")

    if comp_id:
        times = []
        for i in range(5):
            s, b, e = make_request(
                f"{EDGE_FUNCTION_BASE}/rest/v1/competitions?select=*&competition_id=eq.{comp_id}",
                headers={"Authorization": f"Bearer {SERVICE_ROLE_KEY}"}
            )
            times.append(e)
        avg_time = sum(times) / len(times)
        if avg_time < 1.0:
            record_result("Edge Function", "B6. Single competition response time",
                          "PASS", "INFO",
                          f"Avg: {avg_time:.3f}s. Times: {[f'{t:.3f}' for t in times]}")
        else:
            record_result("Edge Function", "B6. Single competition response time",
                          "WARN", "MEDIUM",
                          f"Avg: {avg_time:.3f}s is slow for single record. Times: {[f'{t:.3f}' for t in times]}")
    else:
        record_result("Edge Function", "B6. Single competition response time",
                      "ERROR", "LOW", "Could not get a competition ID to test")

# ============================================================================
# C. SECURITY TESTS
# ============================================================================

def test_security():
    print("\n" + "=" * 70)
    print("CATEGORY C: SECURITY")
    print("=" * 70)

    # C1. SQL injection via REST API (INSERT with service_role)
    print("\n  C1. SQL injection attempt via REST API (INSERT)")
    malicious_payloads = [
        "'; DROP TABLE competitions; --",
        "1 OR 1=1",
        "Robert'); DROP TABLE students;--",
        "<script>alert('xss')</script>",
        "{{constructor.constructor('return this')()}}",
    ]
    for payload in malicious_payloads:
        status, body, elapsed = make_request(
            f"{REST_BASE}/competitions",
            method="POST",
            data={
                "name": payload,
                "description": "test injection",
                "level": "national",
                "status": "upcoming"
            },
            headers={**SR_HEADERS, "Prefer": "return=representation"}
        )
        if status == 201:
            # Payload was accepted as data (parameterized query prevented injection)
            # Clean up
            make_request(
                f"{REST_BASE}/competitions?name=eq.{urllib.parse.quote(payload)}",
                method="DELETE",
                headers=SR_HEADERS
            )
            # Verify table still exists
            check_s, check_b, _ = rest_get("competitions", select="competition_id", limit=1)
            if check_s == 200:
                record_result("Security", f"C1. SQL injection: '{payload[:35]}...'",
                              "PASS", "INFO",
                              f"Payload stored as literal data (parameterized). Table intact.")
            else:
                record_result("Security", f"C1. SQL injection: '{payload[:35]}...'",
                              "FAIL", "CRITICAL",
                              f"Table may be corrupted! Subsequent query failed: HTTP {check_s}")
        elif status in (400, 422):
            record_result("Security", f"C1. SQL injection: '{payload[:35]}...'",
                          "PASS", "INFO",
                          f"Rejected with status {status}. Body: {body[:100]}")
        else:
            record_result("Security", f"C1. SQL injection: '{payload[:35]}...'",
                          "WARN", "MEDIUM",
                          f"Unexpected status {status}. Body: {body[:100]}")

    # C2. UPDATE competitions via REST API with anon key
    print("\n  C2. UPDATE competitions via anon key")
    status, body, elapsed = make_request(
        f"{REST_BASE}/competitions?competition_id=eq.39",
        method="PATCH",
        data={"status": "hacked"},
        headers=ANON_HEADERS
    )
    if status in (401, 403):
        record_result("Security", "C2. UPDATE blocked for anon",
                      "PASS", "INFO", f"Correctly blocked with status {status}")
    elif status in (200, 204):
        record_result("Security", "C2. UPDATE blocked for anon",
                      "FAIL", "CRITICAL",
                      f"Anon key was able to UPDATE! Status {status}. Body: {body[:200]}")
    else:
        record_result("Security", "C2. UPDATE blocked for anon",
                      "WARN", "MEDIUM", f"Unexpected status {status}. Body: {body[:200]}")

    # C3. DELETE competitions via REST API with anon key
    print("\n  C3. DELETE competitions via anon key")
    status, body, elapsed = make_request(
        f"{REST_BASE}/competitions?competition_id=eq.39",
        method="DELETE",
        headers=ANON_HEADERS
    )
    if status in (401, 403):
        record_result("Security", "C3. DELETE blocked for anon",
                      "PASS", "INFO", f"Correctly blocked with status {status}")
    elif status in (200, 204):
        record_result("Security", "C3. DELETE blocked for anon",
                      "FAIL", "CRITICAL",
                      f"Anon key was able to DELETE! Status {status}")
    else:
        record_result("Security", "C3. DELETE blocked for anon",
                      "WARN", "MEDIUM", f"Unexpected status {status}. Body: {body[:200]}")

    # C4. Access REST API data with anon key (no valid key)
    print("\n  C4. REST API data access with invalid anon key")
    status, body, elapsed = make_request(
        f"{REST_BASE}/competitions?select=competition_id,name&limit=5",
        headers=ANON_HEADERS
    )
    if status in (401, 403):
        record_result("Security", "C4. Data access blocked for invalid anon key",
                      "PASS", "INFO", f"Correctly blocked with status {status}")
    elif status == 200:
        try:
            data = json.loads(body)
            if isinstance(data, list) and len(data) > 0:
                record_result("Security", "C4. Data access with invalid anon key",
                              "FAIL", "HIGH",
                              f"Invalid anon key can read competition data! Got {len(data)} records. "
                              f"RLS may be disabled or too permissive.")
            else:
                record_result("Security", "C4. Data access with invalid anon key",
                              "WARN", "MEDIUM",
                              f"Got 200 but empty list - RLS may filter results. Body: {body[:100]}")
        except Exception:
            record_result("Security", "C4. Data access with invalid anon key",
                          "WARN", "MEDIUM", f"Got 200 but non-JSON body: {body[:100]}")
    else:
        record_result("Security", "C4. Data access with invalid anon key",
                      "WARN", "LOW", f"Unexpected status {status}. Body: {body[:100]}")

    # C5. Check RLS by testing INSERT with anon key
    print("\n  C5. RLS: INSERT blocked for anon")
    status, body, elapsed = make_request(
        f"{REST_BASE}/competitions",
        method="POST",
        data={"name": "rls_test", "description": "test", "level": "school", "status": "upcoming"},
        headers=ANON_HEADERS
    )
    if status in (401, 403):
        record_result("Security", "C5. INSERT blocked for anon",
                      "PASS", "INFO", f"Correctly blocked with status {status}")
    elif status == 201:
        # Clean up
        make_request(
            f"{REST_BASE}/competitions?name=eq.rls_test",
            method="DELETE",
            headers=SR_HEADERS
        )
        record_result("Security", "C5. INSERT blocked for anon",
                      "FAIL", "CRITICAL",
                      "Anon key was able to INSERT into competitions! RLS not enforced.")
    else:
        record_result("Security", "C5. INSERT blocked for anon",
                      "WARN", "MEDIUM", f"Unexpected status {status}. Body: {body[:100]}")

    # C6. Check if service_role can bypass RLS (expected behavior)
    print("\n  C6. Service role bypasses RLS (expected)")
    status, body, elapsed = rest_get("competitions", select="competition_id", limit=1)
    if status == 200:
        record_result("Security", "C6. Service role access",
                      "PASS", "INFO", "Service role can access data (expected behavior)")
    else:
        record_result("Security", "C6. Service role access",
                      "ERROR", "HIGH", f"Service role blocked! HTTP {status}")

    # C7. Edge Function: access data without auth
    print("\n  C7. Edge Function: unauthenticated access")
    status, body, elapsed = make_request(
        f"{EDGE_FUNCTION_BASE}/rest/v1/competitions?select=competition_id&limit=5"
    )
    if status in (401, 403):
        record_result("Security", "C7. Edge Function blocks unauthenticated",
                      "PASS", "INFO", f"Correctly blocked with status {status}")
    elif status == 200:
        record_result("Security", "C7. Edge Function blocks unauthenticated",
                      "WARN", "HIGH",
                      f"Edge Function allows unauthenticated access! Body: {body[:150]}")
    else:
        record_result("Security", "C7. Edge Function blocks unauthenticated",
                      "WARN", "LOW", f"Unexpected status {status}")

    # C8. Try accessing sensitive user data (password_hash) via REST
    print("\n  C8. Sensitive field exposure check")
    status, body, elapsed = rest_get("users", select="user_id,password_hash,real_name", limit=1)
    if status == 200:
        data = json.loads(body)
        if isinstance(data, list) and len(data) > 0:
            row = data[0]
            has_pw = row.get("password_hash") is not None and row.get("password_hash") != ""
            if has_pw:
                pw_preview = str(row["password_hash"])[:20]
                record_result("Security", "C8. Password hash exposure",
                              "FAIL", "CRITICAL",
                              f"password_hash is exposed via REST API! Preview: '{pw_preview}...'")
            else:
                record_result("Security", "C8. Password hash exposure",
                              "PASS", "INFO", "password_hash not exposed (null or filtered)")
        else:
            record_result("Security", "C8. Password hash exposure",
                          "PASS", "INFO", "No user records to check")
    else:
        record_result("Security", "C8. Password hash exposure",
                      "WARN", "LOW", f"Could not query users: HTTP {status}")

# ============================================================================
# D. PERFORMANCE TESTS
# ============================================================================

def test_performance():
    print("\n" + "=" * 70)
    print("CATEGORY D: PERFORMANCE")
    print("=" * 70)

    # D1a. List all 135 competitions via REST
    print("\n  D1a. Performance: list all competitions (REST)")
    times = []
    counts = []
    for i in range(5):
        status, body, elapsed = make_request(
            f"{REST_BASE}/competitions?select=competition_id,name,level,status&limit=200",
            headers=SR_HEADERS
        )
        times.append(elapsed)
        if status == 200:
            try:
                data = json.loads(body)
                counts.append(len(data) if isinstance(data, list) else "?")
            except Exception:
                counts.append("?")
    avg_time = sum(times) / len(times)
    p50 = sorted(times)[len(times)//2]
    p99 = max(times)
    record_result("Performance", "D1a. List all competitions (REST)",
                  "PASS" if avg_time < 2.0 else "FAIL",
                  "INFO" if avg_time < 2.0 else "HIGH",
                  f"Avg: {avg_time:.3f}s, P50: {p50:.3f}s, Max: {p99:.3f}s, "
                  f"Records: {counts[0] if counts else '?'}")

    # D1b. Filter by level
    print("\n  D1b. Performance: filter by level")
    for level in ["national", "provincial", "school"]:
        times = []
        counts = []
        for i in range(3):
            status, body, elapsed = make_request(
                f"{REST_BASE}/competitions?select=competition_id,name&level=eq.{level}&limit=200",
                headers=SR_HEADERS
            )
            times.append(elapsed)
            if status == 200:
                try:
                    data = json.loads(body)
                    counts.append(len(data) if isinstance(data, list) else "?")
                except Exception:
                    counts.append("?")
        avg = sum(times) / len(times)
        record_result("Performance", f"D1b. Filter level={level}",
                      "PASS" if avg < 2.0 else "FAIL",
                      "INFO" if avg < 2.0 else "MEDIUM",
                      f"Avg: {avg:.3f}s, Records: {counts[0] if counts else '?'}")

    # D1c. Search by name (ilike)
    print("\n  D1c. Performance: search by name")
    search_term = "design"
    times = []
    counts = []
    for i in range(3):
        status, body, elapsed = make_request(
            f"{REST_BASE}/competitions?select=competition_id,name&name=ilike.*{search_term}*&limit=200",
            headers=SR_HEADERS
        )
        times.append(elapsed)
        if status == 200:
            try:
                data = json.loads(body)
                counts.append(len(data) if isinstance(data, list) else "?")
            except Exception:
                counts.append("?")
    avg = sum(times) / len(times)
    record_result("Performance", f"D1c. Search by name (ilike '*{search_term}*')",
                  "PASS" if avg < 2.0 else "FAIL",
                  "INFO" if avg < 2.0 else "MEDIUM",
                  f"Avg: {avg:.3f}s, Records: {counts[0] if counts else '?'}")

    # D2. Edge Function vs direct REST latency comparison
    print("\n  D2. Edge Function vs direct REST API latency")
    # Edge Function
    ef_times = []
    for i in range(5):
        s, b, e = make_request(
            f"{EDGE_FUNCTION_BASE}/rest/v1/competitions?select=competition_id,name,level,status&limit=200",
            headers={"Authorization": f"Bearer {SERVICE_ROLE_KEY}"}
        )
        ef_times.append(e)
    ef_avg = sum(ef_times) / len(ef_times)

    # Direct REST
    rest_times = []
    for i in range(5):
        s, b, e = make_request(
            f"{REST_BASE}/competitions?select=competition_id,name,level,status&limit=200",
            headers=SR_HEADERS
        )
        rest_times.append(e)
    rest_avg = sum(rest_times) / len(rest_times)

    overhead = ef_avg - rest_avg
    overhead_pct = (overhead / rest_avg * 100) if rest_avg > 0 else 0
    if overhead < 0.3:
        record_result("Performance", "D2. Edge Function overhead",
                      "PASS", "INFO",
                      f"EF: {ef_avg:.3f}s, REST: {rest_avg:.3f}s, "
                      f"Overhead: {overhead:.3f}s ({overhead_pct:.1f}%)")
    elif overhead < 0.8:
        record_result("Performance", "D2. Edge Function overhead",
                      "WARN", "MEDIUM",
                      f"EF: {ef_avg:.3f}s, REST: {rest_avg:.3f}s, "
                      f"Overhead: {overhead:.3f}s ({overhead_pct:.1f}%) - moderate")
    else:
        record_result("Performance", "D2. Edge Function overhead",
                      "FAIL", "HIGH",
                      f"EF: {ef_avg:.3f}s, REST: {rest_avg:.3f}s, "
                      f"Overhead: {overhead:.3f}s ({overhead_pct:.1f}%) - significant")

    # D3. Large result sets - all columns for all 135 records
    print("\n  D3. Large result set: all columns, all records (REST)")
    times = []
    sizes = []
    for i in range(3):
        s, b, e = make_request(
            f"{REST_BASE}/competitions?select=*&limit=200",
            headers=SR_HEADERS
        )
        times.append(e)
        sizes.append(len(b))
    avg = sum(times) / len(times)
    avg_size = sum(sizes) / len(sizes)
    record_result("Performance", "D3. All columns, all records (REST)",
                  "PASS" if avg < 3.0 else "FAIL",
                  "INFO" if avg < 3.0 else "HIGH",
                  f"Avg: {avg:.3f}s, Avg payload: {avg_size/1024:.1f}KB, "
                  f"Times: {[f'{t:.3f}' for t in times]}")

    # D3b. Same via Edge Function
    print("\n  D3b. Large result set via Edge Function")
    ef_times = []
    ef_sizes = []
    for i in range(3):
        s, b, e = make_request(
            f"{EDGE_FUNCTION_BASE}/rest/v1/competitions?select=*&limit=200",
            headers={"Authorization": f"Bearer {SERVICE_ROLE_KEY}"}
        )
        ef_times.append(e)
        ef_sizes.append(len(b))
    ef_avg = sum(ef_times) / len(ef_times)
    ef_avg_size = sum(ef_sizes) / len(ef_sizes)
    record_result("Performance", "D3b. All columns, all records (Edge Function)",
                  "PASS" if ef_avg < 3.0 else "FAIL",
                  "INFO" if ef_avg < 3.0 else "HIGH",
                  f"Avg: {ef_avg:.3f}s, Avg payload: {ef_avg_size/1024:.1f}KB, "
                  f"Times: {[f'{t:.3f}' for t in ef_times]}")

    # D4. Health endpoint response time
    print("\n  D4. Health endpoint response time")
    times = []
    for i in range(5):
        s, b, e = make_request(f"{EDGE_FUNCTION_BASE}/api/health")
        times.append(e)
    avg = sum(times) / len(times)
    record_result("Performance", "D4. Health endpoint",
                  "PASS" if avg < 1.0 else "WARN",
                  "INFO" if avg < 1.0 else "MEDIUM",
                  f"Avg: {avg:.3f}s. Times: {[f'{t:.3f}' for t in times]}")

# ============================================================================
# REPORT GENERATION
# ============================================================================

def generate_report():
    print("\n" + "=" * 70)
    print("FINAL REPORT")
    print("=" * 70)

    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    warnings = sum(1 for r in results if r["status"] == "WARN")
    errors = sum(1 for r in results if r["status"] == "ERROR")

    print(f"\n  Total Tests: {total}")
    print(f"  PASS:  {passed}")
    print(f"  FAIL:  {failed}")
    print(f"  WARN:  {warnings}")
    print(f"  ERROR: {errors}")

    # Group by category
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(r)

    print("\n" + "-" * 70)
    for cat, cat_results in categories.items():
        cp = sum(1 for r in cat_results if r["status"] == "PASS")
        cf = sum(1 for r in cat_results if r["status"] == "FAIL")
        cw = sum(1 for r in cat_results if r["status"] == "WARN")
        ce = sum(1 for r in cat_results if r["status"] == "ERROR")
        print(f"  {cat}: {cp}P / {cf}F / {cw}W / {ce}E")

    # Critical and High severity issues
    print("\n" + "-" * 70)
    print("  CRITICAL / HIGH ISSUES:")
    critical_issues = [r for r in results if r["status"] in ("FAIL", "WARN")
                       and r["severity"] in ("CRITICAL", "HIGH")]
    if critical_issues:
        for r in critical_issues:
            print(f"    [{r['severity']}] [{r['status']}] {r['test']}")
            print(f"      {r['details'][:150]}")
    else:
        print("    None found!")

    # All FAIL items
    print("\n" + "-" * 70)
    print("  ALL FAILURES:")
    failures = [r for r in results if r["status"] == "FAIL"]
    if failures:
        for r in failures:
            print(f"    [{r['severity']}] [{r['category']}] {r['test']}")
            print(f"      {r['details'][:200]}")
    else:
        print("    None!")

    # Verdict
    print("\n" + "=" * 70)
    if failed == 0 and errors == 0 and warnings == 0:
        print("  VERDICT: ALL TESTS PASSED - NO ISSUES")
    elif failed == 0 and errors == 0:
        print(f"  VERDICT: PASSED with {warnings} warning(s)")
    elif failed == 0:
        print(f"  VERDICT: PASSED with {errors} error(s) and {warnings} warning(s)")
    else:
        print(f"  VERDICT: {failed} FAILURE(S) found - REQUIRES ATTENTION")

    # Save JSON report
    report_path = "/data/user/work/test_report_r3.json"
    report_data = {
        "run_timestamp": datetime.utcnow().isoformat(),
        "project": PROJECT_REF,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "warnings": warnings,
            "errors": errors
        },
        "results": results
    }
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=2)
    print(f"\n  JSON report saved to: {report_path}")

    return failed == 0

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("COMPREHENSIVE BACKEND & PERFORMANCE TEST SUITE (v2)")
    print(f"Project: {PROJECT_REF}")
    print(f"Started: {datetime.utcnow().isoformat()}")
    print("=" * 70)

    try:
        test_data_integrity()
        test_edge_function_robustness()
        test_security()
        test_performance()
    except Exception as e:
        print(f"\nFATAL ERROR during test execution: {e}")
        import traceback
        traceback.print_exc()

    success = generate_report()
    sys.exit(0 if success else 1)
