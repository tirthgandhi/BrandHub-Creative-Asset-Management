# Vercel services deployment

Status: service names, public routing and no internal bindings confirmed by the user. Repository configuration is ready for Git-based deployment; a live Vercel deployment has not been run here.

## Proposed services

- `client`: root `client`, framework `vite`, builds to `dist`; serves the public SPA and static media.
- `server`: root `server`, framework `express`, entrypoint `index.js`; public only at `/api` and `/api/*`.
- Both use one project/domain. Browser API requests stay at `/api`; the original `/api` prefix reaches Express unchanged.
- There are no internal-only services and no service-to-service HTTP calls. Vite produces browser files, not a runtime server function. Browser requests to a public API do not use service bindings. MongoDB Atlas is an external database, not a declared Vercel service. No unused binding or build-time `VITE_SERVER_URL` has been added.

The root `vercel.json` is authoritative. The old root API function and nested client config were removed. The new Express entry exports an app without listening on a port, initializes MongoDB/session storage on the first runtime request, shares initialization between concurrent requests, and retries after a failed initialization. Local `npm run dev:server` continues to use `server/server.js`.

## Vercel settings

Import the existing repository as **one project**, with **repository root** as Root Directory. Use the current Services configuration/auto-detection; remove dashboard overrides from the old single-service setup (build command/output directory/root `client/`). Do not create two separate Vercel projects.

Add these in Project Settings -> Environment Variables for Production and any Preview deployments you want to use:

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Copy the working Atlas URI from local `server/.env`; retain `/brandhub_demo` to keep the demo data |
| `SESSION_SECRET` | Your private random secret of at least 32 characters; keep it consistent across the deployment |
| `CLIENT_URL` | Optional: your actual site origin. If omitted, the server uses the Vercel-provided `VERCEL_URL` automatically. |
| `ASSET_STORAGE` | `gridfs` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAME_SITE` | `lax` |
| `COOKIE_NAME` | `brandhub_session` (optional; also the default) |
| `VITE_API_URL` | `/api` (optional; also the client default) |
| `MEDIA_IMAGE_MAX_BYTES` | `4000000` |
| `MEDIA_VIDEO_MAX_BYTES` | `4000000` |
| `MEDIA_DOCUMENT_MAX_BYTES` | `4000000` |
| `GRIDFS_UPLOAD_BUDGET_BYTES` | `262144000` (optional; 250 MiB shared gallery budget) |

A copyable placeholder reference is in `.env.vercel.example`. Do not commit the actual Atlas URI or session secret. Database credentials must never have a `VITE_` prefix. Do not set `PORT`, `VITE_API_PROXY_TARGET`, `SERVER_URL`, or `BACKEND_URL` in Vercel for this topology. There are no generated binding variables to set manually.

Cloudinary variables are optional only if you need to serve old Cloudinary-backed design records. Current prototype uploads use GridFS. Seed credentials are not deployment requirements: the accounts already live in Atlas.

Allow Vercel's connection through Atlas Network Access. Redeploy after changing environment variables. To generate a new session secret locally: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Vercel function request payload limits mean new multipart uploads should stay below 4 MB here. Supplied static photos/videos are served directly by the client service and are not uploaded through the API. Large production uploads would need a different upload path, outside this prototype scope.

## Local and deployed verification

Run `vercel dev -L` from the repository root after installing the current Vercel CLI. For the actual deployment, verify:

1. `/api/health` returns JSON rather than SPA HTML.
2. `/login` and a direct `/app/projects` navigation load the client.
3. Sign-in sets the secure session cookie; reload retains the session.
4. A supplied `/demo-media/...` file loads as a static asset.
5. An allowed small file upload, authenticated download and report download work.
6. Client/designer requests to privileged endpoints still return forbidden responses.

Official references: https://vercel.com/docs/services, https://vercel.com/docs/services/routing, https://vercel.com/docs/services/bindings, https://vercel.com/docs/frameworks/backend/express.
