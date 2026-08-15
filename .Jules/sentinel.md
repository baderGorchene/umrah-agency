## 2025-08-15 - Insecure Default Role Fallback in Offline Authentication
**Vulnerability:** In `authService.ts`, offline/demo mode authentication defaulted unknown email addresses to the `admin` role, allowing privilege escalation.
**Learning:** Defaulting fallback roles to administrative privileges exposes the system when backend services are offline or misconfigured.
**Prevention:** Always default fallback roles to the lowest privilege level (`agent` or `pilgrim`) and require explicit admin matches before granting administrative access.
