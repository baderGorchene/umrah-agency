## 2025-08-15 - Insecure Default Role Fallback in Offline Authentication
**Vulnerability:** In `authService.ts`, offline/demo mode authentication defaulted unknown email addresses to the `admin` role, allowing privilege escalation.
**Learning:** Defaulting fallback roles to administrative privileges exposes the system when backend services are offline or misconfigured.
**Prevention:** Always default fallback roles to the lowest privilege level (`agent` or `pilgrim`) and require explicit admin matches before granting administrative access.

## 2025-10-27 - Security Fix: QR Code Injection & Auth Escalation
**Vulnerability:** Weak substring matching in role inference (`.includes('admin')`) allowed unauthorized users to escalate privileges. Also, QR payload schemes were not validated properly, allowing XSS through dangerous schemes (e.g., `javascript:`), and URL parameters lacked sanitization.
**Learning:** Defaulting fallback roles and substring checks are extremely unsafe for privilege determination. All external input feeding into URL schemes or DOM attributes must be explicitly verified against an allowlist and sanitized.
**Prevention:**
1. Require exact specific emails (e.g., `admin@demo.com`) instead of relying on `.includes()` for admin role escalation.
2. Restrict URL payload generation strictly to safe schemes (`http`, `https`, `mailto`, `tel`).
3. Clean dynamically read URL parameters/hash fragments with strict whitelisting (`[^a-zA-Z0-9_-]`).

## 2026-03-30 - URL Scheme Injection & XSS in Agency Settings
**Vulnerability:** `sanitizeUrl` in `agencyService.ts` and `SettingsView.tsx` only checked for string type and domain exclusion (`unsplash.com`), allowing dangerous URL schemes such as `javascript:` or `data:text/html` to pass unsanitized into asset attributes (`<img src="...">`).
**Learning:** Checking for string types or specific blocked domains is insufficient for sanitizing user-provided image/asset URLs. Unchecked scheme execution can lead to XSS or protocol injection when URLs are rendered in DOM attributes.
**Prevention:** Always restrict URL sanitizers to an explicit allowlist of safe schemes (`http:`, `https:`, `blob:`, `data:image/`) and safe relative paths (`/`, `./`).
