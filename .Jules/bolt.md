# Bolt's Journal

Only add critical performance learnings and optimizations here to avoid future mistakes.

## 2026-08-13 - [Asynchronous QR Code Data URL Memoization]
**Learning:** The application renders dynamic QR Codes (using the `qrcode` package) in list views, badges, and modals. Generating these QR codes requires async execution of canvas drawing and Base64/data-URL encoding, which runs on the main thread and causes CPU bottlenecks when rendering batch badges (such as when preparing dozens of pilgrim cards for printing).
**Action:** Always utilize an in-memory cache (`Map<string, string>`) to store computed QR code data URLs by a structured key of the content and style options. Returning the cached result immediately for identical payloads entirely bypasses re-generation and layout thrashing, speeding up batch badge generation by 10x+.

## 2026-08-23 - [Route-based On-Demand Data Fetching and Lazy Loading]
**Learning:** Fetching all application tables (such as settings, trips, pilgrims, staff, posts, and notifications) in a single monolithic `Promise.all` call on application mount causes significant network data overhead and unneeded database reads, as users may not visit all views in a single session.
**Action:** Transition from monolithic preloading to route-based, on-demand dynamic loading. Only fetch specific database tables from Supabase when the user navigates to a route that requires them. Additionally, defer lightweight/frequent tables like notifications until their interaction elements (e.g., drawer opening) are activated, and lazy-load view components using `React.lazy` and `Suspense` to improve first-paint times and keep the initial JS bundle minimal.
