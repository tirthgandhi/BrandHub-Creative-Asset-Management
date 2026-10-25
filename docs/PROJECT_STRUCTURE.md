# Project structure and development guide

BrandHub is a prototype with a React client, an Express API, and MongoDB. Keep features in their existing layer rather than adding another framework.

```text
api/
  index.mjs                    Vercel entry point; reuses the Express app
client/
  public/demo-media/           Supplied static photos, videos and posters
  src/
    components/
      auth/                    Shared login fields and atmosphere controls
      branding/                Decorative BrandHub watermark
      dashboard/               Data-driven pipeline, progress and workload charts
      layout/                  Navigation, header and workspace shell
      assets/                  Review, revision and comment panels
      ui/                      Buttons, alerts, empty states and dialogs
    config/access.ts           Four-role labels, demo accounts and redirect policy
    types/auth.ts              Canonical role type
    context/                   Session and theme state
    pages/
      auth/                    Login, client signup and account pages
      admin/                   User-management page (legacy folder name)
      app/                     Dashboard and profile
      projects/                Project list, details and admin forms
      requests/                Client briefs and admin approval
      assets/                  Designs, reviews and bookmarks
      media/                   Image/video gallery and uploads
    routes/                    Route definitions and authentication/role gates
    services/                  API calls, errors and media URL resolution
    styles/
      application.css          Workspace layout and base components
      atmosphere.css           Authentication atmosphere and form base
      workspace-polish.css     Glass surfaces, role selector and contrast
  tests/
    *.test.mjs                 Client regression tests
    browser/                   Browser route, theme and permission audits
server/
  src/
    config/                    Database, session and environment setup
    models/                    MongoDB record schemas
    routes/                    Endpoint handlers and role restrictions
    middleware/                Authentication, CSRF, validation and errors
    validation/                Request schemas
    services/                  Project access, file storage and transactions
    utils/                     State machine and shared utilities
  tests/                       API, upload, role and workflow integration tests
  scripts/                     Seeds, media preparation and demo workflow
  server.js                    Local server entry point
  .env                         Local secrets; ignored by Git
docs/
  testing/prototype/           Reports, screenshots and browser results
  PROJECT_STRUCTURE.md         This guide
vercel.json                    Combined frontend/API hosting configuration
```

## Where to change behavior

- Add a page: put it in the appropriate `pages/` feature, register it in `routes/AppRouter.tsx`, wrap privileged pages with `ProtectedRoute`, and update `config/access.ts` if its redirect policy changes.
- Add an API: put it in the matching server router; require authentication, role checks, project membership, CSRF for mutations, and input validation. The API reads the role from the saved user; the login selector never grants privileges.
- Change visual styling: use `workspace-polish.css` for the final visual layer. Decorative text is hidden from assistive technology and never accepts pointer events.
- Keep external API requests in `services/`. Review panels use `services/collaboration.ts`.
- Supplied files remain static local assets. New gallery and design-review files use Atlas GridFS. `cloudinaryStorage.js` is the legacy-named adapter that also supports existing Cloudinary records.

## Useful commands

- `npm run dev:server` and `npm run dev:client`: local app
- `npm run lint`: both codebases
- `npm run build`: client type check and bundled build
- `npm test`: client and API tests, using temporary test databases
- `node client/tests/browser/role-audit.mjs`: browser audit; set `BRANDHUB_TEST_URL` and `BRANDHUB_BROWSER` as needed

The browser audit expects the seeded prototype accounts and the approved example described in the verification report. It reads the demo data, signs in, and saves screenshots; it does not submit new projects or change account passwords.

## Management hierarchy and charts

`super_admin` is the sole privileged account; `project_manager` replaces the old stored `admin` role. `seedPrototypeRoles.js` performs the prototype migration. `/app/management/*` is the current management route family; `/app/admin/*` is a redirect alias. `/app/super-admin/users` has a Super Admin-only route gate.

Dashboard chart data is assembled in `server/src/routes/dashboardRoutes.js`, serialized in `client/src/services/dashboard.ts`, and presented by `client/src/components/dashboard/WorkspaceCharts.tsx`. Designer responses omit team workload.

For repeated browser audits, `server/scripts/browserPreview.js` starts a separate local API on port 5001 with test-specific request limits. Start a Vite instance with `VITE_API_PROXY_TARGET=http://127.0.0.1:5001`, then point `BRANDHUB_TEST_URL` at that frontend. Default app limits are unchanged. Backend database suites run serially to avoid overlapping temporary database startup on smaller machines.
