# Local setup

## Current Phase 0 state

The client landing page can be installed and checked. The `server/package.json` file is an uncommitted dependency scaffold only: it has no `server.js`, routes, models, middleware, tests, or database connection, so the backend cannot start yet. Phase 1 owns that implementation.

Prerequisites observed during the Phase 0 audit: Node.js `v26.3.1` and npm `11.5.2`. The package manifests do not currently pin an engine version; the team should approve an LTS version before freezing CI.

## Install

From the repository root:

```bash
npm install
```

Copy `.env.example` to `.env` and replace placeholders. Never commit `.env`. A local MongoDB service or an approved development Atlas database will be required once Phase 1 adds the server. Cloudinary credentials are not needed for the current static landing page.

## Client commands

```bash
npm run dev:client
npm run typecheck
npm run lint
npm test
npm run build
```

The development URL is `http://127.0.0.1:5173`.

## Server commands

These commands are reserved by the workspace manifest but are expected to fail until Phase 1 supplies the server entry point and tests:

```bash
npm run dev:server
npm run test:server
```

Phase 1 must add a health route, graceful database startup/failure handling, environment validation, and a test that starts the app without binding a production port.

## Environment boundaries

- Only `VITE_API_URL` belongs in browser code.
- MongoDB, session, and Cloudinary secrets remain on the server.
- `CLIENT_URL` must be an exact allowed origin; do not use wildcard credentialed CORS.
- Production must enable secure cookies and provide secrets through the hosting platform.
- Seed commands must refuse to run in production and require `ALLOW_SEED=true`.

## Dev B and Dev C handoff

1. Clone the repository and check out the approved `develop` branch.
2. Run `npm install` at the root.
3. Copy `.env.example` to `.env` without committing it.
4. Set a personal database name: Dev B may use `brandhub_devB`; Dev C may use `brandhub_devC`. Dev A uses `brandhub_devA`.
5. Add personal development-only MongoDB and Cloudinary credentials when the relevant implementation exists. Never share production credentials.
6. Run the supported client checks above. Treat server startup as blocked until Phase 1 merges.
7. Read the final phase plan, API contract, decision register, and contribution rules before beginning owned work.
8. Review the Phase 0 rows assigned to your phase and record approval or requested edits in the Phase 0 pull request.

## Setup verification by developer

| Developer | Recorded result |
|---|---|
| Dev A | Client install state present; typecheck, lint, 12 tests, and production build passed. Server startup failed because `server/server.js` is absent; server test command found zero tests. |
| Dev B | Not yet run; must record local database name and command results during Phase 0 review. |
| Dev C | Not yet run; must record local database name and command results during Phase 0 review. |
