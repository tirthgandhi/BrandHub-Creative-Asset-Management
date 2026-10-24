# BRANDHUB landing page

The public landing experience lives in `client/src/App.tsx` and is preserved at `/`. Phase 1 added the routed application shell and Phase 2 added authentication, role-aware navigation, profiles, and Admin user management. Projects, assets, collaboration, and final dashboards remain assigned to later phases.

## Run

Requires Node.js 22.12+ (or a compatible newer release) and npm.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Production output is `client/dist/`, suitable for static hosting with an SPA rewrite. Set `VITE_API_URL` at build time for a deployed backend; local development uses Vite's `/api` proxy. Google Fonts is the only runtime external styling dependency; system font fallbacks remain available. Set the Open Graph image to an absolute public URL when deploying; no canonical domain has been invented.

## Structure

```text
client/
  public/
    images/gallery/       # Local WebP photos and smaller responsive variants
    images/themes/        # Four atmospheric posters
    videos/               # Four locally hosted, muted H.264 films
    media-manifest.json   # Source pages and license links
  src/
    components/           # Navigation, scene, sections, gallery, dialogs, films
    data/                 # Typed gallery content and atmosphere definitions
    hooks/                # Local-time themes and reduced-motion preferences
    styles/               # Semantic theme tokens and responsive styling
    App.tsx
    main.tsx
  tests/                  # Time-boundary and local-media checks
docs/                     # Implementation notes and honest QA record
scripts/                  # Media acquisition and optimization utilities
```

## Interactions

- Navigation and CTAs point to real sections of the same page.
- Automatic scenes follow browser-local time: 05:00 morning, 11:00 afternoon, 16:30 sunset, 19:30 night. A 15-second timer and visibility listener keep Auto current.
- Manual choices persist in localStorage. Blocked storage falls back to session-memory behavior. New poster imagery is decoded before crossfading scenes.
- Six gallery filters operate on 16 local images. Native modal dialogs trap focus, close with Escape, and restore the triggering control's focus.
- Films use native controls, local posters, no audio autoplay, and pause when out of view or the document is hidden. A poster/download fallback handles playback errors.
- Reduced motion disables decorative animation and smooth scrolling. ScrollTrigger animation instances are cleaned up on component unmount.
- Credits are available through the footer; the collection does not imply real customers or endorsements.

## Media maintenance

The source and license for each downloaded asset are recorded in `client/public/media-manifest.json`. Pexels images use the Pexels license; the selected Mixkit clips individually declare the Stock Video Free License in their provider metadata. Pexels video pages blocked automated retrieval, so licensed Mixkit footage is used instead. No Air media is included.

`scripts/download_media.py` requires Python with Pillow and network access. It downloads source clips; `scripts/optimize_media.py` converts them to compact 18-second-or-shorter 1280px H.264 files and creates the original social preview. The optimizer's FFmpeg executable path is local tooling configuration; adjust it for another machine. Media are already included, so these scripts are not required for installation or building.

The screen recording was supplied in the follow-up and reviewed. The latest campaign and 3D scene changes are documented in docs/campaign-refresh.md. The active gallery now shows 16 fictional client deliverables using original generated artwork and editable layouts.

