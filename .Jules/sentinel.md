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
