# Frontend Bug Report: competition-hub-v1
**Website:** https://an-an-525.github.io/competition-hub-v1/  
**Test Date:** 2026-04-21  
**Tester:** Automated (Puppeteer headless browser) + Visual AI analysis  
**Viewport Tested:** Desktop (1280x900), Mobile (375x812)

---

## Executive Summary

The website is a Chinese academic competition platform ("竞赛助手") built as a Single Page Application (SPA). Testing revealed **3 Critical**, **4 High**, **6 Medium**, and **5 Low** severity issues. The most severe problems are: (1) Supabase API returning 400/404 errors on every page load, (2) SPA client-side routing completely broken for hash-based navigation (all pages show identical competition listing content), and (3) page scroll lock persisting after modal close.

---

## CRITICAL Severity Issues

### BUG-01: Supabase API Returns 400 Bad Request on Every Page Load
- **Category:** Backend/API
- **Reproducibility:** 100% (occurs on every page load)
- **Affected Endpoint:** `https://fdbbcibmqaogsbasoqly.supabase.co/rest/v1/competitions?select=*&order=sort_order.desc,created_at.desc`
- **HTTP Status:** 400 Bad Request
- **Details:** The Supabase REST API call to fetch competitions returns HTTP 400 on every page load and on every SPA navigation event. This means the live database query is failing. The competition data visible on the page appears to come from a hardcoded/static fallback dataset, not from the database.
- **Evidence:** Console error: `Failed to load resource: the server responded with a status of 400 ()` -- observed 3 times across the test session.
- **Impact:** Users are not seeing live/real-time competition data. Any dynamic features (real-time registration counts, status updates, new competitions) will not work.
- **Likely Cause:** Missing or invalid API key (apikey header), Row Level Security (RLS) policy misconfiguration, or the Supabase project/table being deleted/restricted.

### BUG-02: Supabase Applications API Returns 404 Not Found
- **Category:** Backend/API
- **Reproducibility:** 100% (occurs when navigating to competition page)
- **Affected Endpoint:** `https://fdbbcibmqaogsbasoqly.supabase.co/rest/v1/applications?select=competition_id,status&status=neq.draft`
- **HTTP Status:** 404 Not Found
- **Details:** The `applications` table does not exist or is not accessible. This endpoint is called when navigating to the competition page.
- **Evidence:** Console error: `Failed to load resource: the server responded with a status of 404 ()` -- observed 2 times.
- **Impact:** Application/registration tracking is completely non-functional. Users cannot see their application statuses.
- **Likely Cause:** The `applications` table has not been created in Supabase, or the API URL is incorrect.

### BUG-03: SPA Client-Side Routing Completely Broken
- **Category:** Navigation/Routing
- **Reproducibility:** 100%
- **Details:** When navigating between pages via hash-based routing (`#/`, `#/ai`, `#/competition`, `#/tools`, `#/profile`), the URL hash changes but the page content does NOT update. All routes display the exact same competition listing page content. The breadcrumb always shows "首页 / 学科竞赛", the page title always shows "学科竞赛 - 竞赛助手", and the filter/sort UI for competitions is always visible regardless of which route is active.
- **Evidence:** Page content captured for all 5 routes is identical:
  - `#/` -> Shows competition listing (should show homepage/hero)
  - `#/ai` -> Shows competition listing (should show AI chat interface)
  - `#/competition` -> Shows competition listing (correct)
  - `#/tools` -> Shows competition listing (should show toolbox)
  - `#/profile` -> Shows competition listing (should show user profile)
- **Impact:** Users cannot access the Home page, AI Q&A, Toolbox, or Profile pages at all. The entire multi-page navigation is non-functional. Only the competition listing page works.
- **Note:** Clicking the nav buttons in the header (e.g., "竞赛") does correctly navigate to the competition view, but subsequent hash-based navigation fails. This suggests the SPA router is either not listening for `hashchange` events after initial load, or the router state is corrupted.

---

## HIGH Severity Issues

### BUG-04: Page Scroll Lock Persists After Modal Close
- **Category:** UI/UX
- **Reproducibility:** 100%
- **Details:** After opening a competition detail modal and closing it (via the X button), the page scroll remains locked. `window.scrollY` stays at 0 even after calling `window.scrollTo(0, 500)`. The body overflow style shows `hidden auto` which prevents scrolling.
- **Evidence:** Scroll test result: `scrollY: 0 -> 0, body overflow: hidden auto`
- **Impact:** Users cannot scroll the competition list after viewing a competition detail. They must refresh the page to restore scrolling.
- **Likely Cause:** The modal close handler does not properly restore `document.body.style.overflow` to its original value.

### BUG-05: No source_url / External Links in Competition Detail Modal
- **Category:** Data/Content
- **Reproducibility:** 100%
- **Details:** The competition detail modal shows competition information (title, description, organizers, registration status) but contains zero external links. There is no "official website" link, no "source_url" field, and no way for users to navigate to the official competition page.
- **Evidence:** Modal link scan found 0 external links. The only links on the entire page are the logo link (empty href), and hidden "用户协议" and "隐私政策" links.
- **Impact:** Users cannot access official competition websites or registration portals from within the platform. This is a core feature gap.

### BUG-06: All Competitions Show "0人已报名" (Zero Registrations)
- **Category:** Data Integrity
- **Reproducibility:** 100%
- **Details:** Every single competition card displays "0人已报名" (0 people registered). For national-level competitions like the Internet+ Innovation Competition and Challenge Cup, this is highly suspicious and likely indicates a data loading failure rather than genuine zero registrations.
- **Impact:** Users cannot gauge competition popularity or registration status. The platform appears unused/dead.

### BUG-07: Homepage Competition Cards Missing Visual Headers/Images
- **Category:** UI/Visual
- **Reproducibility:** 100%
- **Details:** On the homepage, the three "热门竞赛" (Popular Competitions) cards have blank/white header areas where images, banners, or colored backgrounds should be. The cards only show organizer text and a "查看详情" link, with no visual differentiation or competition name/title in the card header.
- **Impact:** Poor visual presentation. Users cannot quickly identify competitions from the homepage cards without reading dense organizer text.

---

## MEDIUM Severity Issues

### BUG-08: Only 3 Anchor Links on Entire Site; Navigation Uses Buttons Without href
- **Category:** Accessibility/SEO
- **Reproducibility:** 100%
- **Details:** The entire site has only 3 `<a>` tags: the logo (empty href), and two hidden links ("用户协议", "隐私政策"). All navigation is done via `<button>` elements with class `nav-link`. This means:
  - Browser back/forward navigation may not work properly
  - Users cannot right-click -> open in new tab
  - Search engine crawlers cannot follow navigation links
  - Screen readers may not announce navigation properly
- **Impact:** SEO is severely impacted. Accessibility is degraded. No deep linking support.

### BUG-09: Empty Button Found (Accessibility Violation)
- **Category:** Accessibility
- **Reproducibility:** 100%
- **Details:** One `<button>` element exists with no text content and no `aria-label` attribute. This is an accessibility violation (WCAG 4.1.2 Name, Role, Value).
- **Impact:** Screen reader users will encounter an unnamed button with no context.

### BUG-10: Mobile Viewport Shows Desktop-Only Keyboard Shortcut Hint
- **Category:** Mobile UX
- **Reproducibility:** 100%
- **Details:** On the mobile viewport (375x812), the search hint text still displays "按 Ctrl+K 全局搜索" (Press Ctrl+K for global search). Mobile devices do not have a Ctrl key.
- **Impact:** Confusing instruction for mobile users. Indicates poor mobile adaptation.

### BUG-11: Modal Close Button Uses Wrong CSS Class
- **Category:** Code Quality
- **Reproducibility:** 100%
- **Details:** The modal close button (X) has class `mobile-menu-close`, suggesting it is repurposing the mobile menu close button for the modal. This could cause styling conflicts and is a code smell.
- **Evidence:** Close result: `{"method":"close-button","text":"×","class":"mobile-menu-close"}`

### BUG-12: Long Organizer Lists Cause Text Overflow on Mobile
- **Category:** Mobile Layout
- **Reproducibility:** 100%
- **Details:** Competition cards on mobile display extremely long organizer lists (e.g., 11+ government ministry names) as comma-separated text without proper truncation or collapsible formatting. This creates dense, hard-to-read text blocks that dominate the card layout.
- **Impact:** Poor readability on mobile. Cards become excessively tall.

### BUG-13: Inconsistent Competition Card Heights on Homepage
- **Category:** Visual/Layout
- **Reproducibility:** 100%
- **Details:** The three competition cards in the homepage "热门竞赛" section have uneven heights due to varying organizer list lengths (11 vs 5 vs 5 entries), creating visual misalignment in the horizontal card layout.

---

## LOW Severity Issues

### BUG-14: Page Title Does Not Update Per Route
- **Category:** SEO/UX
- **Reproducibility:** 100%
- **Details:** The page title remains "学科竞赛 - 竞赛助手" regardless of which route is active. It should change to reflect the current page (e.g., "AI问答 - 竞赛助手", "工具箱 - 竞赛助手").

### BUG-15: Secondary Search/Input Bar Has No Placeholder or Label
- **Category:** UX
- **Reproducibility:** 100%
- **Details:** Below the statistics cards on the homepage, there is a secondary input field with no placeholder text, no label, and no clear purpose. It shows an active cursor but provides no guidance to the user.

### BUG-16: Footer Shows Future Date Range
- **Category:** Content
- **Reproducibility:** 100%
- **Details:** Footer displays "© 2025-2026 学科竞赛智能助手". The 2026 date may be intentional but could also indicate placeholder content.

### BUG-17: No Images on Entire Site
- **Category:** Visual/Performance
- **Reproducibility:** 100%
- **Details:** The entire site contains zero `<img>` elements. All visual elements are CSS-generated or use icon fonts. While this is not necessarily a bug, competition cards would benefit from images/logos.

### BUG-18: Excessive DOM Elements (2293 Total)
- **Category:** Performance
- **Reproducibility:** 100%
- **Details:** The page contains 2293 DOM elements and 256 buttons for a single view. This is unusually high and could impact rendering performance on lower-end devices, especially mobile.

---

## Network Error Summary

| # | URL | Method | Status | Occurrences |
|---|-----|--------|--------|-------------|
| 1 | `supabase.co/rest/v1/competitions?select=*&order=...` | GET | 400 | 3 |
| 2 | `supabase.co/rest/v1/applications?select=...` | GET | 404 | 2 |

**Total failed network requests: 5** (across a single test session with ~6 page transitions)

---

## Console Error Summary

| # | Error Message | URL | Occurrences |
|---|---------------|-----|-------------|
| 1 | `Failed to load resource: the server responded with a status of 400 ()` | Homepage | 3 |
| 2 | `Failed to load resource: the server responded with a status of 404 ()` | Homepage | 2 |

**Total console errors: 5**  
**Total console warnings: 0**

---

## Page Load Performance

| Metric | Value | Assessment |
|--------|-------|------------|
| DOM Interactive | 1,642 ms | Acceptable |
| DOM Content Loaded | 1,651 ms | Acceptable |
| Full Page Load | 2,620 ms | Acceptable |

---

## Test Environment Details

- **Browser:** Chromium (Puppeteer headless)
- **Viewport Desktop:** 1280 x 900
- **Viewport Mobile:** 375 x 812 (iPhone X/11/12/13)
- **Page Framework:** Custom vanilla JS SPA (no React/Vue/Angular/jQuery/Svelte detected)
- **Total Scripts:** 28
- **Total Stylesheets:** 1
- **Service Worker:** Registered
- **Language:** zh-CN
- **Charset:** UTF-8

---

## Screenshots Captured

| # | File | Description |
|---|------|-------------|
| 1 | A1_homepage.png | Desktop homepage with hero section and competition cards |
| 2 | A2_competition_page.png | Desktop competition listing page with filters and 55 competitions |
| 3 | A3_modal.png | Competition detail modal (Internet+ competition) |
| 4 | A4_after_modal_close.png | Page state after modal close (modal still visible in screenshot) |
| 5 | B_home.png | Attempted home page navigation (shows competition page instead) |
| 6 | B_ai.png | Attempted AI page navigation (shows competition page instead) |
| 7 | B_tools.png | Attempted tools page navigation (shows competition page instead) |
| 8 | B_profile.png | Attempted profile page navigation (shows competition page instead) |
| 9 | C1_mobile_home.png | Mobile viewport homepage |
| 10 | C2_mobile_competition.png | Mobile viewport competition listing |
| 11 | C3_mobile_ai.png | Mobile viewport attempted AI page |

---

## Recommendations (Priority Order)

1. **[CRITICAL]** Fix Supabase API authentication -- verify the `apikey` header, RLS policies, and table existence for both `competitions` and `applications` tables.
2. **[CRITICAL]** Fix SPA router -- ensure `hashchange` event listener properly updates the view for all routes (`/`, `/ai`, `/tools`, `/profile`).
3. **[HIGH]** Fix modal scroll lock -- restore `body.style.overflow` on modal close.
4. **[HIGH]** Add `source_url` / official website links to competition detail modal.
5. **[MEDIUM]** Replace `<button>` navigation with `<a href>` links for SEO and accessibility.
6. **[MEDIUM]** Add mobile-specific UX adaptations (remove Ctrl+K hint, truncate organizer lists).
7. **[LOW]** Update page title dynamically per route.
8. **[LOW]** Add placeholder text to the secondary search input on homepage.
