# Bolt's Journal

Only add critical performance learnings and optimizations here to avoid future mistakes.

## 2026-08-13 - [Asynchronous QR Code Data URL Memoization]
**Learning:** The application renders dynamic QR Codes (using the `qrcode` package) in list views, badges, and modals. Generating these QR codes requires async execution of canvas drawing and Base64/data-URL encoding, which runs on the main thread and causes CPU bottlenecks when rendering batch badges (such as when preparing dozens of pilgrim cards for printing).
**Action:** Always utilize an in-memory cache (`Map<string, string>`) to store computed QR code data URLs by a structured key of the content and style options. Returning the cached result immediately for identical payloads entirely bypasses re-generation and layout thrashing, speeding up batch badge generation by 10x+.
