# Security Assessment Report
## Competition Hub v1 - https://an-an-525.github.io/competition-hub-v1/

**Assessment Date:** 2026-04-22  
**Scope:** Client-side code at `/workspace/js/` and live website

---

## Executive Summary

This security assessment identified **2 Critical**, **4 High**, **4 Medium**, and **3 Low** severity vulnerabilities. The most severe issues involve exposed API credentials and weak password hashing. Immediate remediation is recommended for Critical and High severity findings.

---

## A. Client-Side Security

### 1. XSS Vulnerabilities

**Severity: MEDIUM**

#### Finding: Extensive use of `innerHTML`
The codebase uses `innerHTML` in 95+ locations across multiple files. While user input is generally escaped using the `esc()` function, this pattern is inherently risky.

**Affected Files:**
- `/workspace/js/ai-chat.js` (lines 86, 92, 94, 99, 101, 114)
- `/workspace/js/learning-resources.js` (lines 27, 45, 82, 125, 134, etc.)
- `/workspace/js/competition-hub.js` (lines 138, 176, 225, etc.)
- `/workspace/js/auth.js` (lines 113, 121)
- `/workspace/js/pages-competition.js` (multiple lines)
- `/workspace/js/admin.js` and `/workspace/js/admin-v2.js` (multiple lines)

**Positive Finding:** The `esc()` function in `/workspace/js/utils.js` (line 57) properly escapes HTML entities:
```javascript
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
```

**Remediation:**
- Replace `innerHTML` with `textContent` or `createElement()` where possible
- Implement Content Security Policy (CSP) headers
- Consider using a sanitization library like DOMPurify for complex HTML

---

### 2. API Keys Exposed in Frontend Code

**Severity: CRITICAL**

#### Finding: Supabase Anon Key Hardcoded
Multiple files contain hardcoded Supabase API keys that are exposed to all users:

**File: `/workspace/js/ai-chat.js` (lines 8-12)**
```javascript
if(typeof HUB_HEADERS === 'undefined') var HUB_HEADERS = {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmJjaWJtcWFvZ3NiYXNvcWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTc1NzUsImV4cCI6MjA5MjE5MzU3NX0.6vudhdijK3Dcy7aoM1qvGWbIJzE8aUVfTK7CdyrO3SM',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

**File: `/workspace/js/competition-hub.js` (lines 2-4)**
```javascript
var HUB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
var HUB_HEADERS={'apikey':HUB_KEY,'Authorization':'Bearer '+HUB_KEY...};
```

**File: `/workspace/js/registration.js` (lines 3-4)**
```javascript
var SUPABASE_KEY='sb_publishable_Vc1DwX3BjKjbeRq-tdvQqQ_m8Cm-6mZ';
```

**Impact:**
- Anyone can use these credentials to access the Supabase database
- Potential for data exfiltration, modification, or deletion
- Rate limiting abuse affecting service availability

**Remediation:**
- Move all API calls to a backend proxy server
- Never expose database credentials in frontend code
- Use Row Level Security (RLS) policies on all database tables
- Implement proper authentication with short-lived tokens

---

### 3. Cookie Security

**Severity: N/A (Not Using Cookies)**

#### Finding: No Cookies Used
The application uses `localStorage` instead of cookies for session management.

**Impact:** While cookies with `HttpOnly`, `Secure`, and `SameSite` flags would be more secure, the current approach using localStorage is acceptable for this application type, though it has its own vulnerabilities (see Section B).

---

### 4. Sensitive Data in localStorage

**Severity: HIGH**

#### Finding: User Data Stored in localStorage
User information including role is stored in localStorage:

**File: `/workspace/js/auth.js` (lines 33-35)**
```javascript
function getCurrentUser(){
  try{var u=localStorage.getItem('app_user');return u?JSON.parse(u):null}catch(e){return null}
}
function setCurrentUser(u){if(u){localStorage.setItem('app_user',JSON.stringify(u))}...}
```

**Data stored includes:**
- User ID, name, student ID, college
- User role (admin/student) - **Critical for authorization**
- Auth tokens (`auth_token`)
- AI chat history (`ai_messages_`)

**Impact:**
- Any XSS vulnerability can steal all user data
- Users can modify their role in localStorage to gain admin access
- Data persists after logout if not properly cleared

**Remediation:**
- Use HttpOnly cookies for session tokens
- Validate user role on the server side for every request
- Implement server-side session management

---

### 5. Additional Exposed Secrets

**Severity: CRITICAL**

#### Finding: API Keys and Sensitive URLs Exposed
The codebase contains multiple exposed credentials and sensitive endpoints:

**File: `/workspace/js/competition-hub.js` (line 2)**
```javascript
var HUB_URL='https://fdbbcibmqaogsbasoqly.supabase.co';
```

**File: `/workspace/js/registration.js` (line 3)**
```javascript
var SUPABASE_URL='https://fdbbcibmqaogsbasoqly.supabase.co';
```

**Remediation:** Same as Section A.2 - use backend proxy

---

## B. Authentication Security

### 1. Password Hashing

**Severity: CRITICAL**

#### Finding: Weak Password Hashing (Unsalted SHA-256)
Passwords are hashed using plain SHA-256 without salt:

**File: `/workspace/js/auth.js` (lines 17-29)**
```javascript
async function hashPassword(pwd){
  if(crypto.subtle){
    try{
      var encoder=new TextEncoder();var data=encoder.encode(pwd);
      var hashBuffer=await crypto.subtle.digest('SHA-256',data);
      var hashArray=Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(function(b){return b.toString(16).padStart(2,'0')}).join('');
    }catch(e){}
  }
  return _sha256(pwd); // Fallback
}
```

**Impact:**
- Vulnerable to rainbow table attacks
- Same password produces same hash (no salt)
- SHA-256 is fast, making brute-force attacks efficient
- Hashes stored in database can be cracked

**Remediation:**
- Use bcrypt, scrypt, or Argon2 on the server side
- Never hash passwords client-side - send over TLS and hash server-side
- Add per-user salt to each password hash

---

### 2. Password Transmission

**Severity: HIGH**

#### Finding: Password Sent in Plain Text to Backend
The password is sent to the backend API in plain text:

**File: `/workspace/js/auth.js` (line 62)**
```javascript
body:JSON.stringify({studentId:sid,password:pwd})
```

**Impact:**
- If TLS is compromised, passwords are exposed
- Backend receives plain text passwords
- Server logs may capture passwords

**Remediation:**
- Use SRP (Secure Remote Password) protocol
- Or ensure TLS is properly configured and use certificate pinning
- Never log password fields

---

### 3. Session Token Management

**Severity: MEDIUM**

#### Finding: JWT Token Stored in localStorage
Auth tokens are stored in localStorage:

**File: `/workspace/js/auth.js` (line 62)**
```javascript
if(loginData.token){setLS('auth_token',loginData.token)}
```

**Remediation:**
- Store tokens in HttpOnly cookies
- Implement token refresh mechanism
- Set appropriate token expiration

---

### 4. Logout Implementation

**Severity: LOW**

#### Finding: Logout Clears localStorage But Not Server Session
**File: `/workspace/js/auth.js` (lines 96-100)**
```javascript
function doLogout(){
  showConfirm('确定要退出登录吗？',function(){
    setLS('auth_token', null);setCurrentUser(null);updateNavAuth();stopNotifPoll();
    showCopyToast('已退出登录','success');navigate('home');
  });
}
```

**Impact:** Server-side session may remain active

**Remediation:** Implement server-side session invalidation

---

### 5. Rate Limiting

**Severity: MEDIUM**

#### Finding: No Client-Side Rate Limiting
No rate limiting is implemented on login attempts. Backend rate limiting is unknown.

**Remediation:**
- Implement server-side rate limiting on authentication endpoints
- Add CAPTCHA after failed attempts
- Implement account lockout after multiple failures

---

## C. Authorization Security

### 1. Client-Side Admin Check

**Severity: HIGH**

#### Finding: Admin Role Checked Client-Side Only
Admin access is determined solely by the `role` property in localStorage:

**File: `/workspace/js/auth.js` (line 37)**
```javascript
function isAdmin(){var u=getCurrentUser();return u&&u.role==='admin'}
```

**File: `/workspace/js/admin.js` (line 4)**
```javascript
if(!isAdmin()){container.innerHTML='<div class="login-required"><h3>无权限</h3>...';return}
```

**Impact:**
- Users can modify localStorage to set `role: 'admin'`
- Full admin panel access without server validation
- Can view all registrations, approve/reject applications

**Proof of Concept:**
```javascript
// In browser console:
var user = JSON.parse(localStorage.getItem('app_user'));
user.role = 'admin';
localStorage.setItem('app_user', JSON.stringify(user));
location.reload();
// Admin panel now accessible
```

**Remediation:**
- Implement server-side authorization for every admin action
- Validate user role against database on each request
- Use role-based access control (RBAC) on the backend

---

### 2. API Authorization Headers

**Severity: HIGH**

#### Finding: Same API Key Used for All Users
All API requests use the same hardcoded API key:

**File: `/workspace/js/admin-v2.js` (line 22)**
```javascript
var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/user_roles?user_id=eq.' + user.id + '&is_active=eq.true...', { headers: HUB_HEADERS });
```

**Impact:**
- No per-user authentication on API calls
- Anyone with the API key can access all data
- No audit trail of who made changes

**Remediation:**
- Use per-user JWT tokens
- Validate user permissions on every API request
- Implement proper authentication middleware

---

### 3. IDOR (Insecure Direct Object Reference)

**Severity: MEDIUM**

#### Finding: User IDs Used Directly in API Calls
User and application IDs are used directly without ownership verification:

**File: `/workspace/js/registration-v2.js` (line 35)**
```javascript
var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?competition_id=eq.' + compId + '&applicant_user_id=eq.' + user.id...
```

**Impact:**
- While the code uses the current user's ID, the API doesn't validate ownership
- Potential for unauthorized access if IDs are guessed

**Remediation:**
- Implement server-side ownership validation
- Use indirect references (e.g., UUIDs) instead of sequential IDs

---

### 4. Privilege Escalation

**Severity: HIGH**

#### Finding: Multiple Paths to Privilege Escalation
1. Modify localStorage `role` to 'admin'
2. Use exposed API key to directly modify database
3. No server-side validation of permissions

**Remediation:** Implement comprehensive server-side authorization

---

## D. Data Security

### 1. PII Handling

**Severity: MEDIUM**

#### Finding: PII Stored and Transmitted
Personal information is collected and stored:
- Student ID, name, college
- Phone number, email
- Competition registration data

**Positive Finding:** Data is transmitted over HTTPS

**Remediation:**
- Implement data minimization
- Add privacy policy
- Implement data retention policies
- Consider encryption at rest for sensitive fields

---

### 2. Data Encryption in Transit

**Severity: LOW**

#### Finding: HTTPS Used
All API calls use HTTPS (Supabase endpoints). This is a positive finding.

---

### 3. Data Encryption at Rest

**Severity: MEDIUM**

#### Finding: Unknown Encryption Status
Database encryption at rest depends on Supabase configuration (unknown).

**Remediation:** Verify Supabase encryption settings

---

### 4. Error Message Data Leakage

**Severity: LOW**

#### Finding: Some Error Messages Reveal Information
**File: `/workspace/js/auth.js` (line 55)**
```javascript
if(data.length===0){errEl.textContent='该学号未注册';...}
```

This reveals whether a student ID is registered.

**Remediation:** Use generic error messages like "Invalid credentials"

---

## E. CSRF and Clickjacking

### 1. CSRF Protection

**Severity: HIGH**

#### Finding: No CSRF Tokens
No CSRF tokens are implemented in any forms. All POST/PATCH requests lack CSRF protection.

**Affected Operations:**
- User registration
- Competition registration
- Admin actions (approve/reject)
- Team creation

**Remediation:**
- Implement CSRF tokens for all state-changing operations
- Use SameSite cookie attribute
- Validate Origin/Referer headers

---

### 2. Clickjacking Protection

**Severity: MEDIUM**

#### Finding: No Frame Protection
No `X-Frame-Options` or `Content-Security-Policy: frame-ancestors` headers are visible in the HTML.

**Remediation:**
- Add `X-Frame-Options: DENY` header
- Or add `Content-Security-Policy: frame-ancestors 'none'`

---

## F. Third-Party Dependencies

### 1. External Library Loading

**Severity: MEDIUM**

#### Finding: Three.js Loaded from CDN Without SRI
**File: `/workspace/index.html` (lines 590-598)**
```javascript
var s = document.createElement('script');
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
s.async = true;
// No integrity attribute
```

**Impact:** If CDN is compromised, malicious code can be injected

**Remediation:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        integrity="sha512-..."
        crossorigin="anonymous"></script>
```

---

### 2. Known Vulnerabilities

**Severity: LOW**

#### Finding: All Scripts are Local
All JavaScript files are served locally (not from CDNs), which is good for security. Only Three.js is loaded externally.

---

### 3. SRI (Subresource Integrity)

**Severity: MEDIUM**

#### Finding: No SRI on External Script
Three.js is loaded without Subresource Integrity hash.

**Remediation:** Add SRI attribute to external script

---

## Summary Table

| ID | Vulnerability | Severity | Status |
|----|---------------|----------|--------|
| A.2 | Exposed API Keys in Frontend | CRITICAL | Open |
| B.1 | Weak Password Hashing (Unsalted SHA-256) | CRITICAL | Open |
| C.1 | Client-Side Admin Authorization | HIGH | Open |
| C.2 | No Per-User API Authentication | HIGH | Open |
| C.4 | Privilege Escalation Possible | HIGH | Open |
| E.1 | No CSRF Protection | HIGH | Open |
| A.4 | Sensitive Data in localStorage | HIGH | Open |
| A.1 | Extensive innerHTML Usage | MEDIUM | Partially Mitigated |
| B.2 | Password in Plain Text to Backend | MEDIUM | Open |
| B.5 | No Rate Limiting | MEDIUM | Open |
| D.1 | PII Handling | MEDIUM | Open |
| E.2 | No Clickjacking Protection | MEDIUM | Open |
| F.1 | External Script Without SRI | MEDIUM | Open |
| B.3 | Token in localStorage | MEDIUM | Open |
| C.3 | Potential IDOR | MEDIUM | Open |
| B.4 | Incomplete Logout | LOW | Open |
| D.4 | Error Message Information Leakage | LOW | Open |
| F.3 | No SRI on External Scripts | MEDIUM | Open |

---

## Priority Remediation Order

### Immediate (Critical - Fix Within 24 Hours)
1. **Remove exposed API keys from frontend code** - Move all database operations to a backend proxy
2. **Fix password hashing** - Implement server-side bcrypt/Argon2 hashing

### Short-Term (High - Fix Within 1 Week)
3. **Implement server-side authorization** - Validate all admin actions on the server
4. **Add CSRF protection** - Implement tokens for all state-changing operations
5. **Move session tokens to HttpOnly cookies**

### Medium-Term (Medium - Fix Within 1 Month)
6. **Replace innerHTML with safer alternatives**
7. **Add rate limiting on authentication endpoints**
8. **Implement Content Security Policy**
9. **Add SRI to external scripts**
10. **Add X-Frame-Options header**

---

## Conclusion

The application has significant security vulnerabilities that require immediate attention. The most critical issues are:

1. **Exposed database credentials** that allow anyone to access the database
2. **Weak password hashing** that makes passwords vulnerable to cracking
3. **Client-side authorization** that can be easily bypassed

These issues should be addressed before the application handles any sensitive user data or goes into production use.

---

*Report generated by security assessment on 2026-04-22*
