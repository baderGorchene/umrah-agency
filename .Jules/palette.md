# Palette's Journal

Only add critical entries here when discovery happens.

## 2026-08-13 - [Custom Modal/Drawer Backdrop & Keyboard Escape Dismissal Pattern]
**Learning:** This application utilizes custom-designed Tailwind overlays for side drawers (e.g., `NotificationDrawer`) and floating modal boxes (e.g., `QRPassModal`, `SecurityModal`) rather than using semantic `<dialog>` elements or fully featured React modal frameworks. Because of this, standard keyboard and interaction expectations (specifically closing with the `Escape` key and dismissing via backdrop click) do not function out-of-the-box. Furthermore, icon-only dismiss buttons in bilingual environments need localized ARIA labels.
**Action:** When working on custom modal-like surfaces in this repository, always ensure to:
1. Bind a keydown listener for `Escape` within a `useEffect` that respects state changes and cleans up correctly.
2. Add a backdrop click-outside handler using standard target equality checking (`e.target === e.currentTarget`) to prevent child clicks from propagating and falsely dismissing the surface.
3. Supply explicit bilingual/localized screen reader labels (`aria-label`) on all close/dismiss buttons.
