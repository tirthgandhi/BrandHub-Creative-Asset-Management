# Landing-page verification

Phase 1–2 application and authentication verification is recorded separately in [`docs/testing/PHASE1_PHASE2_TEST_REPORT.md`](testing/PHASE1_PHASE2_TEST_REPORT.md). The report below preserves the earlier landing-page evidence.

Date: 24 October 2026 (Asia/Calcutta).

## Latest campaign refresh

The in-app browser became available during the follow-up. Inspected the updated desktop hero and client-work panels at 1440px and mobile hero at 390px. Measured no document-level horizontal overflow at 320, 375, 390, 768, 1024, 1440, and 1920px. Verified the Reel Covers filter returns three items, the detail dialog opens and closes with Escape, mobile navigation opens and closes, all four scene choices apply without broken loaded images, and Afternoon survives a reload. Captured browser warnings/errors were empty. Reduced-motion and video playback still require dedicated interactive testing; the code paths remain implemented.

The new campaign integrity test verifies all 16 entries, all five deliverable categories, and the four generated local PNG signatures. Original build results below describe the initial pass, including the then-unavailable browser.

## Pass 1 — implementation and media review

- Read the original README, the 17-page PRD, and the supplied landing-page brief before implementation.
- Inspected a contact sheet of all downloaded gallery photos and four scene posters. Replaced an unrelated animal photo with architecture and corrected image descriptions to match their content.
- Confirmed all 11 requested page sections are present in source, with a single React entry point and no additional application routes.
- Confirmed source includes navigation anchors, five atmosphere preferences, six gallery filters, native dialogs, film controls/fallbacks, a mobile menu, and reduced-motion styles.
- Confirmed development server responds with HTTP 200 at `http://127.0.0.1:5174/`.
- **Browser limitation:** the provided in-app browser timed out attaching its webview on two attempts. Desktop/mobile visual rendering, focus behavior, actual video playback, theme persistence through browser refresh, runtime console/network errors, and interactive controls are therefore **not browser-verified**. Source review is not a substitute for those checks.

## Pass 2 — automated checks

- `npm install`: passed; dependency audit reported zero vulnerabilities at installation.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 11 tests passed. Ten cover browser-local time boundaries, including 16:30 and 19:30. One verifies the 16 local photographs, responsive variants, four videos/posters, and source/license records.
- `npm run build`: passed (TypeScript and Vite production build).
- `git diff --check`: passed.
- FFmpeg decoded all four optimized MP4 files without errors. Pillow opened and verified the 16 gallery thumbnails and four scene posters. This checks file integrity, not browser playback.

## Manual browser acceptance checklist

These remain to be run once a browser viewer is available:

1. Review 320, 375, 390, 768, 1024, 1440, and 1920px viewports for overflow and overlapping content.
2. Select each theme; check text contrast and scene transitions throughout the page. Refresh a manual choice, then return to Auto.
3. Open/close the mobile menu, navigate every anchor, and use the back-to-top link.
4. Filter each gallery category, open a photo, tab through the dialog, close with Escape, and confirm focus returns to the trigger.
5. Play/pause all four theme films, scroll a playing video out of view, switch browser tabs, and verify poster fallback behavior.
6. Enable reduced motion; confirm scrolling, clouds, marquee, and reveals stop animating.
7. Inspect browser console and network requests, including fonts and lazy-loaded media.

The full-stack PRD acceptance matrix remains unimplemented; these checks cover only the requested landing page.

Final refresh verification: TypeScript/Vite production build, ESLint, and all 12 automated tests passed. Browser checks listed above passed. Production files are in client/dist/.

