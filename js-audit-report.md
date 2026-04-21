# JavaScript Code Audit Report

**Date:** 2026-04-21  
**Scope:** 15 JavaScript files in `/workspace/js/`  
**Auditor:** Automated Static Analysis

---

## Severity Legend

- **CRITICAL** - Security vulnerability or data loss risk; must fix immediately
- **HIGH** - Bug that causes incorrect behavior or crashes; should fix soon
- **MEDIUM** - Code quality issue, potential race condition, or maintainability concern
- **LOW** - Minor issue, style problem, or defensive coding gap

---

## 1. CRITICAL: Hardcoded API Keys Exposed in Frontend Code

### 1.1 `/workspace/js/competition-hub.js` (Lines 2-4)
```js
var HUB_URL='https://fdbbcibmqaogsbasoqly.supabase.co';
var HUB_KEY='sb_publishable_Vc1DwX3BjKjbeRq-tdvQqQ_m8Cm-6mZ';
var HUB_HEADERS={'apikey':HUB_KEY,'Authorization':'Bearer '+HUB_KEY,...};
```
**Issue:** Supabase API key (`sb_publishable_...`) is hardcoded. While this is labeled "publishable," the `Authorization: Bearer` header grants the same permissions as the key. If Row Level Security (RLS) is misconfigured, this allows unrestricted database access.  
**Severity:** CRITICAL

### 1.2 `/workspace/js/registration.js` (Lines 3-4)
```js
var SUPABASE_URL='https://fdbbcibmqaogsbasoqly.supabase.co';
var SUPABASE_KEY='sb_publishable_Vc1DwX3BjKjbeRq-tdvQqQ_m8Cm-6mZ';
```
**Issue:** Duplicate Supabase credentials. Same key exposed again.  
**Severity:** CRITICAL

### 1.3 `/workspace/js/ai-chat.js` (Line 4)
```js
var MINIMAX_API_KEY = 'sk-cp-sHnWpvPMygZhEJloWKBPQ49qOLA8FiMJIjoyWDegRumFLl4RRJvqOqMirvnkuq_gk6LmyRZcwzrTORsajL7_VlAVEpMhkiqfQxKOTvgRce6_53sy2aNZeB0';
```
**Issue:** MiniMax API secret key is hardcoded in frontend JavaScript. This is a **secret key** (not a publishable key). Anyone viewing the page source can extract it and make API calls at the owner's expense. This key should ONLY be on a backend server.  
**Severity:** CRITICAL

### 1.4 `/workspace/js/ai-chat.js` (Lines 9-15)
```js
var HUB_URL = 'https://fdbbcibmqaogsbasoqly.supabase.co';
var HUB_HEADERS = {
  'apikey': 'sb_publishable_Vc1DwX3BjKjbeRq-tdvQqQ_m8Cm-6mZ',
  'Authorization': 'Bearer sb_publishable_Vc1DwX3BjKjbeRq-tdvQqQ_m8Cm-6mZ',
  ...
};
```
**Issue:** Third duplication of Supabase credentials. Also re-declares `HUB_URL` and `HUB_HEADERS` which are already declared in `competition-hub.js`.  
**Severity:** CRITICAL

---

## 2. CRITICAL: Plaintext Password Hashing on Client Side

### 2.1 `/workspace/js/auth.js` (Lines 17-29, 31)
```js
async function hashPassword(pwd){
  if(crypto.subtle){
    var hashBuffer=await crypto.subtle.digest('SHA-256',data);
    ...
  }
  return _sha256(pwd);
}
```
**Issue:** Passwords are hashed client-side using SHA-256 before being sent to the server. SHA-256 is not a password hashing algorithm -- it is designed for speed, making it trivially brute-forceable. There is no salt or pepper. The server stores the raw SHA-256 hash, so anyone with database access can reverse common passwords instantly using rainbow tables. Password hashing must happen server-side using bcrypt, scrypt, or Argon2.  
**Severity:** CRITICAL

### 2.2 `/workspace/js/auth.js` (Lines 52-58)
```js
var hash=await hashPassword(pwd);
var res=await fetch(HUB_URL+'/rest/v1/profiles?student_id=eq.'+encodeURIComponent(sid),{headers:HUB_HEADERS});
...
if(profile.password_hash!==hash){errEl.textContent='密码错误';...}
```
**Issue:** Password verification compares a client-computed hash against a stored hash. This means the actual password never leaves the client, but the hash IS the password equivalent. Intercepting the hash allows replay attacks.  
**Severity:** CRITICAL

### 2.3 `/workspace/js/auth.js` (Lines 63, 93)
```js
body:JSON.stringify({studentId:sid,password:pwd})
```
**Issue:** The raw plaintext password is sent to the backend API (`API_BASE+'/api/login'`) for JWT token retrieval, contradicting the client-side hashing approach. The password is sent in both hashed and plaintext forms.  
**Severity:** CRITICAL

---

## 3. HIGH: Duplicate Global Variable Declarations

### 3.1 `HUB_URL` and `HUB_HEADERS` redeclared in multiple files
- `/workspace/js/competition-hub.js` (Lines 2-4)
- `/workspace/js/ai-chat.js` (Lines 9-15)

**Issue:** `HUB_URL` and `HUB_HEADERS` are declared with `var` in both files. Since `var` is function-scoped and these are at the top level, the second declaration silently overwrites the first. If the values ever diverge (e.g., different environments), this causes unpredictable behavior.  
**Severity:** HIGH

### 3.2 `SUPABASE_URL` / `SUPABASE_KEY` vs `HUB_URL` / `HUB_KEY`
- `/workspace/js/competition.js` uses `SUPABASE_URL` / `SUPABASE_KEY`
- `/workspace/js/competition-hub.js` uses `HUB_URL` / `HUB_KEY`

**Issue:** Both point to the same Supabase instance but use different variable names. This is confusing and error-prone. If one is updated, the other may be missed.  
**Severity:** MEDIUM

---

## 4. HIGH: XSS Risk via innerHTML with Dynamic Data

### 4.1 `/workspace/js/competition-hub.js` (Lines 138, 225, 290)
```js
row.innerHTML=html;
container.innerHTML=html;
pagEl.innerHTML=renderHubPagination(visibleCount,visibleCount);
```
**Issue:** While most user-facing data is passed through `esc()`, the code builds HTML strings via concatenation and assigns them to `innerHTML`. If any data path bypasses `esc()`, it creates an XSS vulnerability. The `esc()` function itself is solid, but the pattern is fragile.  
**Severity:** MEDIUM (mitigated by consistent use of `esc()`)

### 4.2 `/workspace/js/ai-chat.js` (Line 94)
```js
var formatted=esc(content).replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')...
```
**Issue:** Content is escaped first, then markdown-like formatting is applied by inserting HTML tags. The `esc()` function escapes `<`, `>`, `&`, `"`, `'`. However, the regex replacements insert raw `<br/>`, `<strong>`, `<span>` tags. If `esc()` is bypassed or if the content contains crafted input that survives escaping, this could lead to XSS. The current implementation is safe because `esc()` runs first, but this is a fragile pattern.  
**Severity:** MEDIUM

### 4.3 `/workspace/js/admin-v2.js` (Lines 201-204, 258-274)
```js
el.innerHTML = '<div class="card" ...>' + esc(comp.name || '未知竞赛') + ...;
```
**Issue:** Admin panel renders user-submitted data (competition names, student names) via `innerHTML`. While `esc()` is used, the admin panel is a high-value target. Any missed `esc()` call is catastrophic.  
**Severity:** MEDIUM

---

## 5. HIGH: Race Conditions and Missing Error Handling

### 5.1 `/workspace/js/registration-v2.js` (Lines 285-291)
```js
var appRes = await fetch(HUB_URL + '/rest/v1/applications?id=eq.' + applicationId, ...);
var appData = (await appRes.json())[0];
var formRes = await fetch(HUB_URL + '/rest/v1/application_forms?competition_id=eq.' + compId, ...);
var formData = (await formRes.json())[0];
```
**Issue:** No error checking on `appRes.ok` or `formRes.ok`. If either request fails, `appData` or `formData` will be `undefined`, causing a crash on the next line when accessing properties.  
**Severity:** HIGH

### 5.2 `/workspace/js/registration-v2.js` (Lines 303-308)
```js
var reqRes = await fetch(HUB_URL + '/rest/v1/form_requirements?...');
var requirements = await reqRes.json();
var filesRes = await fetch(HUB_URL + '/rest/v1/application_files?...');
var files = await filesRes.json();
```
**Issue:** Same pattern -- no `res.ok` check before calling `.json()`.  
**Severity:** HIGH

### 5.3 `/workspace/js/admin-v2.js` (Lines 280-281)
```js
var res = await fetch(HUB_URL + '/rest/v1/applications?id=eq.' + applicationId + '...');
var apps = await res.json();
```
**Issue:** No error handling if `res.ok` is false.  
**Severity:** HIGH

### 5.4 `/workspace/js/competition-hub.js` (Lines 66-73)
```js
function _refreshCompetitionsInBackground(){
  _fetchCompetitionsFromServer().then(function(data){
    if(data && data.length > 0) {
      var hubList = document.getElementById('hubCompList');
      if(hubList) renderCompHub(document.getElementById('competitionContent'));
    }
  });
}
```
**Issue:** Background refresh has no `.catch()` handler. If the fetch fails, the promise rejection is silently swallowed.  
**Severity:** LOW

### 5.5 `/workspace/js/registration.js` (Line 63)
```js
setLS('auth_token', null)
```
**Issue:** In `doLogout()`, `setLS` is called with `null`. The `setLS` function calls `JSON.stringify(null)` which produces `"null"` (a string). On next login check, `getLS` will parse `"null"` as `null`, which is falsy, so this works by accident. However, `localStorage.removeItem` would be more correct.  
**Severity:** LOW

---

## 6. HIGH: Memory Leaks

### 6.1 `/workspace/js/navigation.js` (Lines 96-98)
```js
window.addEventListener('scroll',function(){
  if(!ticking){requestAnimationFrame(function(){...});ticking=true}
},{passive:true});
```
**Issue:** The scroll event listener is never removed. If `initBackToTop()` is called multiple times (e.g., during SPA navigation), multiple listeners accumulate.  
**Severity:** MEDIUM

### 6.2 `/workspace/js/navigation.js` (Line 61)
```js
document.addEventListener('click',function(e){if(!e.target.closest('.nav-group'))closeAllNavGroups()});
```
**Issue:** Global click listener is added at script load time and never removed. This is acceptable for a single-page app but could conflict with dynamically loaded content.  
**Severity:** LOW

### 6.3 `/workspace/js/auth.js` (Line 137)
```js
document.addEventListener('click',function(e){...});
```
**Issue:** Another global click listener for closing dropdowns, never removed.  
**Severity:** LOW

### 6.4 `/workspace/js/notifications.js` (Line 48)
```js
function startNotifPoll(){stopNotifPoll();if(!isLoggedIn())return;_notifPollTimer=setInterval(function(){loadNotifications()},30000)}
```
**Issue:** The polling interval is properly managed with `stopNotifPoll()` guard. However, if the user logs out and back in rapidly, there could be a brief window where two intervals exist. The `stopNotifPoll()` call mitigates this.  
**Severity:** LOW (properly guarded)

### 6.5 `/workspace/js/data.js` (Line 238)
```js
var app={currentPage:'home',pomodoroMode:'work',pomodoroTime:1500,pomodoroRunning:false,pomodoroTimer:null};
```
**Issue:** `pomodoroTimer` is declared but never cleared in the visible code. If a pomodoro timer is started and the user navigates away, the interval continues running.  
**Severity:** MEDIUM (timer leak)

---

## 7. HIGH: Broken References and Missing Functions

### 7.1 `/workspace/js/navigation.js` (Line 54)
```js
if(page==='learning'){if(typeof renderLearningResources==='function')renderLearningResources()}
```
**Issue:** `renderLearningResources` is defined in `learning-resources.js`, which is loaded AFTER `navigation.js` in the HTML (line 627 vs 609). However, this is inside `handlePageInit()` which is called at runtime, not at load time, so the function will be available. This is safe but fragile.  
**Severity:** LOW (safe due to runtime call)

### 7.2 `/workspace/js/pages-competition.js` (Line 217)
```js
if(typeof renderCompetitionResources==='function'){
  html+='<div style="margin-top:12px" id="compDetailResources"></div>';
}
```
**Issue:** `renderCompetitionResources` is defined in `learning-resources.js`. The `typeof` check makes this safe, but the container ID `compDetailResources` is used in `learning-resources.js` as `compResourcesList` (line 396). The IDs don't match.  
**Severity:** HIGH

### 7.3 `/workspace/js/learning-resources.js` (Line 396)
```js
var container = document.getElementById('compResourcesList');
```
**Issue:** The container ID is `compResourcesList`, but `pages-competition.js` (line 218) creates an element with ID `compDetailResources`. These don't match, so `renderCompetitionResources()` will never find its container and will silently fail.  
**Severity:** HIGH

### 7.4 `/workspace/js/navigation.js` (Line 55)
```js
if(page==='guide'){renderGuidePage()}
```
**Issue:** `renderGuidePage()` is defined in `navigation.js` itself (line 112), so this is fine. However, the guide page is created dynamically and appended to `main-content`, which means it exists outside the normal page routing system.  
**Severity:** LOW

### 7.5 `/workspace/js/learning-resources.js` (Line 432)
```js
html += '<button class="btn-secondary" ... onclick="navigate(\'learning-resources\')">查看更多学习资源</button>';
```
**Issue:** The page name is `learning-resources` but in `navigation.js` (line 69), `PAGE_TITLES` maps `learning` not `learning-resources`. The `navigate()` function looks for `page-learning-resources` which may not exist in the HTML.  
**Severity:** HIGH

### 7.6 `/workspace/js/utils.js` (Line 57) - `esc()` function
```js
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
```
**Issue:** The `esc()` function does not handle `null` or `undefined` when called without arguments (though the `if(!s)` guard handles falsy values). However, if `s` is `0` (a number), it returns `''` instead of `'0'`. This could cause issues if numeric IDs are passed through `esc()`.  
**Severity:** LOW

### 7.7 `/workspace/js/ai-chat.js` (Line 94) - `addChatMessage` uses `esc(content)` then applies regex
```js
var formatted=esc(content).replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')...
```
**Issue:** The `**bold**` regex operates on escaped text. If the user types `<b>test</b>`, `esc()` converts it to `&lt;b&gt;test&lt;/b&gt;`, and the bold regex won't match HTML tags. This is safe. However, the regex `replace(/^- (.+)$/gm,...)` for bullet points inserts HTML `<span>` tags into already-escaped content, which is correct since the content was pre-escaped.  
**Severity:** LOW (safe)

---

## 8. MEDIUM: Logic Errors

### 8.1 `/workspace/js/competition-hub.js` (Line 282)
```js
var pages=Math.ceil(visibleCount/_hubPageSize);
```
**Issue:** `visibleCount` is used instead of `visibleCards.length`. These should be the same value, but using `visibleCards.length` would be more explicit and correct.  
**Severity:** LOW

### 8.2 `/workspace/js/competition-hub.js` (Line 290)
```js
pagEl.innerHTML=renderHubPagination(visibleCount,visibleCount);
```
**Issue:** `renderHubPagination(total, visible)` is called with `visibleCount` for both parameters. The `total` and `visible` parameters are both used identically in the function (line 301: `var pages = Math.ceil(visible / _hubPageSize)`), so the `total` parameter is dead code.  
**Severity:** LOW

### 8.3 `/workspace/js/pages-competition.js` (Lines 131-157)
```js
(function(){
  var _origApplyCompFilters=applyCompFilters;
  applyCompFilters=function(){
    _origApplyCompFilters();
    ...
  };
})();
```
**Issue:** The IIFE overrides `applyCompFilters` after it's defined. This monkey-patching pattern works but is fragile and hard to debug. If another script also overrides `applyCompFilters`, one override will be lost.  
**Severity:** MEDIUM

### 8.4 `/workspace/js/competition-hub.js` (Line 184)
```js
html+='<button class="club-filter-btn'+(i===0?' active':'')+'" onclick="filterHubBy(\'cat\',\''+esc(c)+'\')">'+esc(c)+'</button>'
```
**Issue:** If a category name contains a single quote (e.g., `C'est`), `esc()` converts it to `&#39;`, but the `onclick` attribute uses `\'` as delimiter. The escaped `&#39;` inside a single-quoted string context could cause issues. The `esc()` function replaces `'` with `&#39;`, but the surrounding JavaScript string literal uses `\'` as delimiters. This could break the onclick handler.  
**Severity:** MEDIUM

### 8.5 `/workspace/js/registration-v2.js` (Lines 436-471)
```js
showConfirm('确认提交报名？提交后将无法修改。', async function() {
  var res = await fetch(...);
  ...
});
```
**Issue:** The `showConfirm` callback is `async`, but `showConfirm` (in `utils.js`) does not await the callback. If the callback throws, the error is unhandled. Also, `_submitLock` is released in the `finally` block of `submitApplication`, but the `showConfirm` callback runs after `submitApplication` returns (since `showConfirm` doesn't return a promise). This means `_submitLock` is released before the actual submission happens.  
**Severity:** HIGH

### 8.6 `/workspace/js/registration-v2.js` (Lines 421-474)
```js
async function submitApplication(applicationId, compId) {
  if (_submitLock) { ... return; }
  _submitLock = true;
  try {
    ...
    showConfirm('确认提交报名？...', async function() {
      var res = await fetch(...);
      ...
    });
  } finally {
    _submitLock = false;  // Released immediately, before confirm callback runs
  }
}
```
**Issue:** The `_submitLock` is released in the `finally` block, which runs synchronously after `showConfirm()` returns. The actual API call happens inside the `showConfirm` callback, which runs later when the user clicks "OK". This means the lock is ineffective -- the user could trigger another submission before the confirm callback executes.  
**Severity:** HIGH

---

## 9. MEDIUM: Security Concerns

### 9.1 `/workspace/js/competition-hub.js` (Lines 2-4) - No RLS verification
**Issue:** The Supabase API key is used with `Authorization: Bearer` header. All CRUD operations (SELECT, INSERT, UPDATE, DELETE) on `competitions`, `applications`, `registrations`, `notifications`, etc. are performed with the same anon key. The security entirely depends on Supabase Row Level Security (RLS) policies. If any table lacks proper RLS, data is fully exposed.  
**Severity:** CRITICAL (depends on RLS configuration)

### 9.2 `/workspace/js/admin-v2.js` (Lines 24-27)
```js
if (!res.ok) {
  adminScope.role = 'super_admin'; // 查询失败时降级为超级管理员
  return;
}
```
**Issue:** When the role query fails (network error, server error), the code defaults to `super_admin`. This is a security anti-pattern -- fail-open. If an attacker can cause the role query to fail, they gain super admin access.  
**Severity:** CRITICAL

### 9.3 `/workspace/js/admin-v2.js` (Lines 62-64)
```js
} catch (e) {
  console.error('fetchAdminScope error:', e);
  adminScope.role = 'super_admin';
}
```
**Issue:** Same fail-open pattern in the catch block.  
**Severity:** CRITICAL

### 9.4 `/workspace/js/registration.js` (Line 9)
```js
async function deleteRegistration(id){try{var res=await fetch(SUPABASE_REST+'?id=eq.'+id,...)
```
**Issue:** Registration deletion uses the anon key. Any user could potentially delete any registration if RLS is not properly configured. There is no server-side check that the requesting user owns the registration.  
**Severity:** HIGH

### 9.5 `/workspace/js/auth.js` (Lines 38-41)
```js
function demoLogin(){
  document.getElementById('authLoginStudentId').value='admin';
  document.getElementById('authLoginPassword').value='admin123';
  doLogin();
}
```
**Issue:** A demo login function with hardcoded credentials is present in production code. If this function is accessible (it likely is since it's a global function), anyone can log in as admin.  
**Severity:** CRITICAL

---

## 10. MEDIUM: Code Quality Issues

### 10.1 `/workspace/js/utils.js` (Line 56)
```js
function setLS(k,v){try{localStorage.setItem('app_'+k,JSON.stringify(v))}catch(e){showCopyToast('存储空间不足','error')}}
```
**Issue:** `JSON.stringify(undefined)` returns `undefined` (not a string), which `localStorage.setItem` converts to the string `"undefined"`. Then `getLS` would parse `"undefined"` as the actual value `undefined`. This is inconsistent.  
**Severity:** LOW

### 10.2 `/workspace/js/competition-hub.js` (Line 205)
```js
html+='<div class="comp-hub-card hub-card... data-name="'+esc((c.name||'').toLowerCase())+'" ...'
```
**Issue:** Very long HTML string concatenation lines. This makes the code hard to read and maintain. Template literals would be cleaner.  
**Severity:** LOW (style)

### 10.3 `/workspace/js/ai-chat.js` (Line 94)
**Issue:** The `addChatMessage` function is a single 500+ character line. Extremely difficult to read and debug.  
**Severity:** MEDIUM (maintainability)

### 10.4 `/workspace/js/data.js` (Line 2)
**Issue:** The entire `CSUST_DATA` object is on a single line (~220 lines compressed). This is a massive data file that is unreadable.  
**Severity:** LOW (data file, acceptable)

### 10.5 Multiple files - Inconsistent error handling patterns
**Issue:** Some functions use try/catch with user-facing error messages, others silently swallow errors with `console.warn`, and others have no error handling at all. There is no consistent error handling strategy.  
**Severity:** MEDIUM

### 10.6 `/workspace/js/registration-v2.js` (Line 91)
```js
var info = typeof comp.school_level_info === 'string' ? JSON.parse(comp.school_level_info) : comp.school_level_info;
```
**Issue:** `JSON.parse` is called without try/catch. If `school_level_info` is a malformed JSON string, this will throw and crash the function.  
**Severity:** HIGH

### 10.7 `/workspace/js/registration-v2.js` (Line 119)
```js
var links = typeof comp.related_links === 'string' ? JSON.parse(comp.related_links) : comp.related_links;
```
**Issue:** Same `JSON.parse` without try/catch.  
**Severity:** HIGH

### 10.8 `/workspace/js/admin-v2.js` (Lines 442-443)
```js
if (typeof coopTypes === 'string') {
  try { coopTypes = JSON.parse(coopTypes); } catch (e) { coopTypes = []; }
}
```
**Issue:** This file DOES properly wrap `JSON.parse` in try/catch. This inconsistency with `registration-v2.js` highlights the lack of coding standards.  
**Severity:** LOW (inconsistency note)

---

## 11. Script Loading Order Analysis (`/workspace/index.html`)

```
Line 603: data.js          -- CSUST_DATA, QUOTES, app object
Line 604: utils.js         -- esc(), getLS(), setLS(), showCopyToast(), etc.
Line 605: animations.js    -- (not analyzed)
Line 606: modals.js        -- showContactModal(), hideContactModal(), etc.
Line 607: auth.js          -- login/register, uses HUB_URL, HUB_HEADERS, esc(), getLS()
Line 608: notifications.js -- uses HUB_URL, HUB_HEADERS, getCurrentUser(), esc()
Line 609: navigation.js    -- navigate(), uses esc(), getLS(), many page init functions
Line 610: ai-chat.js       -- RE-DECLARES HUB_URL, HUB_HEADERS; uses CSUST_DATA, esc()
Line 611: search.js        -- (not analyzed)
Line 612: pages-academic.js
Line 613: pages-campus.js
Line 614: pages-admission.js
Line 615: pages-news.js
Line 616: pages-competition.js -- uses CSUST_DATA, esc(), getCurrentUser()
Line 617: competition-hub.js   -- DECLARES HUB_URL, HUB_KEY, HUB_HEADERS
Line 618: registration.js      -- uses HUB_URL, HUB_HEADERS, SUPABASE_URL, SUPABASE_KEY
Line 619: registration-v2.js   -- uses HUB_URL, HUB_HEADERS
Line 620: admin.js             -- uses HUB_URL, HUB_HEADERS
Line 621: admin-v2.js          -- uses HUB_URL, HUB_HEADERS
Line 622: toolbox.js
Line 623: calendar.js
Line 624: effects.js
Line 625: app.js
Line 626: onboarding.js        -- IIFE, exports to window
Line 627: learning-resources.js
```

### Loading Order Issues:

**11.1** `ai-chat.js` (line 610) re-declares `HUB_URL` and `HUB_HEADERS` BEFORE `competition-hub.js` (line 617) declares them. Since both use `var`, the later declaration in `competition-hub.js` overwrites `ai-chat.js`'s values. If they ever differ, this causes bugs.  
**Severity:** MEDIUM

**11.2** `data.js` loads first (line 603), which is correct since `CSUST_DATA` is used everywhere.  
**Severity:** OK

**11.3** `utils.js` loads second (line 604), which is correct since `esc()`, `getLS()`, `setLS()` are used everywhere.  
**Severity:** OK

**11.4** `learning-resources.js` loads last (line 627). Functions like `renderLearningResources` and `renderCompetitionResources` are referenced in earlier files via `typeof` checks, which is safe.  
**Severity:** OK

---

## 12. Additional Findings

### 12.1 `/workspace/js/admin-v2.js` (Line 623)
```js
if (!confirm('确定要删除该企业吗？此操作不可撤销。')) return;
```
**Issue:** Uses native `confirm()` instead of the app's custom `showConfirm()`. This is inconsistent with the rest of the UI and may be blocked by popup blockers.  
**Severity:** LOW

### 12.2 `/workspace/js/ai-chat.js` (Line 115)
```js
function loadChatHistory(){...aiLoadHistoryFromDB().then(function(dbMessages){if(dbMessages&&dbMessages.length>0){setLS('ai_messages_'+_uid,dbMessages);loadChatHistory();}}).catch(function(){});...}
```
**Issue:** `loadChatHistory()` calls itself recursively inside the `.then()` callback. This could cause an infinite loop if the database always returns messages. The intent is to re-render with DB data, but the recursion is dangerous.  
**Severity:** HIGH

### 12.3 `/workspace/js/notifications.js` (Lines 18, 38, 46)
```js
}catch(e){}
```
**Issue:** Empty catch blocks silently swallow errors. At minimum, `console.warn` should be used for debugging.  
**Severity:** LOW

### 12.4 `/workspace/js/registration.js` (Line 12)
```js
async function showRegForm(compName){navigate('profile');setTimeout(function(){...container.innerHTML='...'},100)}
```
**Issue:** Uses `setTimeout` with 100ms delay to wait for navigation to complete. This is a race condition -- if the navigation takes longer than 100ms, the DOM element won't exist yet.  
**Severity:** MEDIUM

### 12.5 `/workspace/js/competition-hub.js` (Line 398-399)
```js
html+='<button class="btn-primary" onclick="document.body.style.overflow=\'\';this.closest(\'div[style]\').parentElement.remove();navigate(\'auth\')">登录后报名</button>'
```
**Issue:** Complex DOM manipulation inside an `onclick` string attribute. The selector `this.closest('div[style]').parentElement` is fragile and depends on the exact DOM structure.  
**Severity:** MEDIUM

---

## Summary by Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 8 | Hardcoded API keys (4), client-side password hashing (3), fail-open admin auth (1), demo login credentials (1) |
| HIGH | 8 | Missing error handling on fetch (3), JSON.parse without try/catch (2), submitLock race condition (1), recursive loadChatHistory (1), container ID mismatch (1) |
| MEDIUM | 8 | XSS patterns (3), race conditions (2), variable redeclaration (1), inconsistent error handling (1), loading order (1) |
| LOW | 12 | Memory leaks (3), dead code (2), empty catch blocks (1), style issues (2), minor logic issues (2), inconsistent confirm (1), fragile DOM selectors (1) |

## Top Priority Fixes

1. **Move MiniMax API key to backend** -- This is a secret key being exposed to every visitor
2. **Remove `demoLogin()` function** or gate it behind a development flag
3. **Fix fail-open admin auth** in `admin-v2.js` -- default to no access on error, not super_admin
4. **Move password hashing to server-side** using bcrypt/scrypt/Argon2
5. **Fix container ID mismatch** between `pages-competition.js` (`compDetailResources`) and `learning-resources.js` (`compResourcesList`)
6. **Fix `loadChatHistory()` infinite recursion** risk
7. **Fix `_submitLock` race condition** in `submitApplication()`
8. **Add try/catch around `JSON.parse()`** calls in `registration-v2.js`
9. **Consolidate duplicate `HUB_URL`/`HUB_HEADERS` declarations** into a single shared config
10. **Verify Supabase RLS policies** are properly configured for all tables
