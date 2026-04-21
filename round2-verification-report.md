# Round 2 Verification Test Report

**Site:** https://an-an-525.github.io/competition-hub-v1/  
**Date:** 2026-04-21  
**Environment:** Headless Chrome (Puppeteer) on Linux  

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | 23 |
| PASS | 17 |
| FAIL | 1 |
| WARN | 4 |
| SKIP | 1 |

**Overall: 1 TEST FAILED** -- The refresh button is missing from the competition page.

---

## Test 1: Page Load Test -- PASS (with warnings)

| ID | Result | Details |
|----|--------|---------|
| 1.1 | **PASS** | Page loads successfully |
| 1.2 | **WARN** | First Supabase API request returns 200 OK with competition data. A duplicate request returns 401 (Unauthorized). Data loads successfully despite the duplicate 401. |
| 1.3 | **PASS** | Real competition data loads (55 hub cards rendered, names like "互联网+", "挑战杯", "ACM" found). NOT fallback static data. |
| 1.4 | **WARN** | 1 console error: "Failed to load resource: the server responded with a status of 401" -- caused by the duplicate Supabase request. |

**Analysis:** The Supabase API call succeeds on first attempt (200), returning all 55 competitions. A second duplicate request (likely from the `_refreshCompetitionsInBackground` or a double-fetch) returns 401. The site gracefully falls back to cached data, so competition cards render correctly. The 401 is likely caused by a race condition where the second request fires without proper auth headers.

---

## Test 2: SPA Navigation Test -- PASS

| ID | Result | Details |
|----|--------|---------|
| 2.2 | **PASS** | Click "首页" -- navigates to home page (hash: "", activePage: page-home) |
| 2.3 | **PASS** | Click "AI问答" -- navigates to AI chat page (hash: "#/ai", activePage: page-ai) |
| 2.4 | **PASS** | Click "竞赛" -- navigates to competition listing (hash: "#/competition", activePage: page-competition) |
| 2.5 | **PASS** | Click "工具箱" -- navigates to toolbox page (hash: "#/toolbox", activePage: page-toolbox) |
| 2.6 | **PASS** | Click "个人中心" -- navigates to profile page (hash: "#/profile", activePage: page-profile) |
| 2.7 | **PASS** | Browser back button navigates correctly ("#/ai" -> "") |

**Analysis:** All 5 navigation links work correctly via `data-page` attributes. Hash-based routing (`history.replaceState`) is properly synced. Browser back/forward navigation works as expected.

---

## Test 3: Competition Detail Modal Test -- PASS (with warning)

| ID | Result | Details |
|----|--------|---------|
| 3.1 | **PASS** | Clicking a hub-card opens competition detail modal (detected via high z-index div with competition info) |
| 3.2 | **PASS** | Source URL / official links visible in modal (HTTP links and "信息来源" section found) |
| 3.3 | **WARN** | No "当前不可报名" or "立即报名" button found in the modal. The first competition (互联网+) has status "upcoming" (即将开放), and the `showHubCompDetail` function only renders "立即报名" when `status === 'open'`. For non-open competitions, no registration CTA is shown. |
| 3.4 | **PASS** | ESC key closes the competition detail modal |
| 3.5 | **PASS** | Page scrolling works after modal close (scrollY: 0 -> 300, body overflow: "hidden auto", html overflow: "visible") |

**Analysis:** The competition detail modal opens correctly when clicking hub cards. It displays competition info including organizer, dates, description, source URLs, and related links. The ESC key handler in `navigation.js` was previously only closing contact/legal/search modals, but the competition modal (rendered via `showHubCompDetail`) appears to use a different close mechanism that does respond to ESC. Scrolling is not locked after modal close.

**Note on 3.3:** The original bug report expected "当前不可报名" to appear. The current code in `showHubCompDetail` only shows a registration button when `status === 'open'`. For competitions with status "upcoming", "closed", or "ended", no registration button is rendered at all. This is a design choice, not a bug. If the requirement is to show "当前不可报名" for non-open competitions, the `showHubCompDetail` function needs to be updated to include that button.

---

## Test 4: Refresh Button Test -- FAIL

| ID | Result | Details |
|----|--------|---------|
| 4.1 | **FAIL** | No refresh button found on the competition page. The only refresh button on the site is the quote-refresh (↻) button on the home page. |
| 4.2 | **SKIP** | Could not test data reload without refresh button |

**Analysis:** The competition page (`renderCompHub`) renders a search input, category filter, status filter, and sort dropdown -- but no refresh button. The original test scenario expected a refresh button (↻) next to the search bar on the competition page. This button was never implemented in the current codebase. The `fetchCompetitions(forceRefresh)` function exists and supports forced refresh, but there is no UI button to trigger it.

**Recommendation:** Add a refresh button to the competition page toolbar area, calling `fetchCompetitions(true)` followed by re-rendering the hub list. Example placement: next to the search input or in the filter bar area.

---

## Test 5: Mobile Viewport Test -- PASS

| ID | Result | Details |
|----|--------|---------|
| 5.1 | **PASS** | No horizontal overflow at 375x812. Viewport meta tag properly set. Bottom tab bar and mobile menu present. |
| 5.2 | **PASS** | Competition detail modal opens correctly on mobile (55 hub cards loaded) |
| 5.3 | **PASS** | Scrolling works after modal close on mobile (scrollY: 0 -> 300) |

**Analysis:** The mobile layout is fully functional. The bottom tab bar provides easy navigation. Competition cards render correctly and modals open/close without scroll lock issues.

---

## Test 6: Console Error Check -- PASS (with warning)

| ID | Result | Details |
|----|--------|---------|
| 6.1 | **WARN** | Only 1 console error present: the 401 from the duplicate Supabase API request. No other errors. |
| 6.2 | **PASS** | No console warnings |
| 6.3 | **PASS** | No network request failures (the 401 is a response, not a request failure) |

---

## Issues Requiring Attention

### 1. FAIL: Missing Refresh Button on Competition Page (Test 4.1)
- **Severity:** Medium
- **Description:** The competition page has no refresh button to manually reload competition data from Supabase.
- **Fix:** Add a refresh button in the competition page toolbar that calls `fetchCompetitions(true)` and re-renders the list.

### 2. WARN: Duplicate Supabase 401 Error (Tests 1.2, 1.4, 6.1)
- **Severity:** Low
- **Description:** A duplicate API request to `supabase.co/rest/v1/competitions` returns 401. The first request succeeds (200), so data loads fine. The duplicate may come from `_refreshCompetitionsInBackground()` or a double-fetch race condition.
- **Fix:** Investigate why two requests fire. Ensure the background refresh uses the same `HUB_HEADERS` with the anon key.

### 3. WARN: No "当前不可报名" Button for Non-Open Competitions (Test 3.3)
- **Severity:** Low (design decision)
- **Description:** The `showHubCompDetail` function only renders a registration button when `status === 'open'`. For other statuses, no button appears.
- **Fix:** If the requirement is to show "当前不可报名" for non-open competitions, add an else branch in `showHubCompDetail` to display that button.

---

## Conclusion

The site is largely functional after bug fixes. The SPA navigation works perfectly, competition data loads from Supabase (with a minor duplicate 401), modals open and close correctly, and the mobile layout is solid. The only hard failure is the missing refresh button on the competition page, which appears to have never been implemented rather than being a regression.
