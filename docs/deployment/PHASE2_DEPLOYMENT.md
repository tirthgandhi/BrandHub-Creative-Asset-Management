# Phase 2 deployment skeleton

No hosting account or production credentials were available during implementation, so deployment is **not verified**. This skeleton documents the secure target without claiming a live release.

## Backend

`render.yaml` defines the Express service and health check. Configure `MONGODB_URI`, `CLIENT_URL`, and Cloudinary values in the host. `SESSION_SECRET` must be random and server-only. The backend trusts one proxy in production, uses credentialed CORS for the exact `CLIENT_URL`, and refuses to start if MongoDB or required environment validation fails.

If the frontend and backend are on different sites, use `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none`, serve both over HTTPS, and verify CSRF headers and cookies in a real browser. Do not use wildcard CORS.

Run `npm run seed:admin` once with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and the production MongoDB URI. The command refuses to modify an existing Admin account.

## Frontend

Build from the repository root with `npm run build`. Set `VITE_API_URL` at build time to the backend URL ending in `/api`. `client/vercel.json` provides the SPA fallback required for nested-route refreshes. Only `VITE_API_URL` may be exposed in the browser; secrets must not use the `VITE_` prefix.

## Local production-like preview

For development and browser QA only, run these in separate terminals:

```bash
npm run dev:preview-api
npm run dev:client
```

The preview API uses an isolated, disposable MongoDB instance and prints fictional development credentials. It never connects to a shared database. The normal `npm run start:server` command uses the configured real MongoDB database.

## Required live checks

Before calling deployment complete, verify on the actual URLs: health, registration, login, cookie persistence, forced password change, logout, exact-origin CORS, CSRF rejection, nested-route refresh, and absence of secrets in the client bundle.
