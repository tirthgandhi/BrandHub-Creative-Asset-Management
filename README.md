# BrandHub

BrandHub is a creative project and media workspace for agency administrators, designers, and clients. Teams can organize projects, manage design reviews, discuss revisions, and keep campaign images and videos together.

The application uses React, TypeScript, Vite, and React Router in the client; Node.js, Express, and JavaScript in the server; and MongoDB with Mongoose for records and sessions. Design-review images use the existing authenticated Cloudinary delivery flow. The separate project-media gallery stores new website uploads in MongoDB GridFS. The supplied demo catalog uses optimized local static files, with metadata in MongoDB.

## What works

- Client registration, login/logout, Mongo-backed sessions, role protection, administrator user management, and forced password changes for new designers.
- Project and project-request workflows with scoped access, assignment, public discovery, and approval.
- Design assets with image upload, metadata, private delivery, draft submission, client/admin review, change requests, version history, comments, and bookmarks.
- Project media gallery with posts, stories, reels, image/video upload, GridFS streaming, byte-range video playback, metadata editing, and authorized deletion.
- Role-based dashboards backed by database counts, recent review activity, profile editing, theme selection, and reduced-motion preference.
- Responsive landing, authentication, and workspace pages.

The demo seed in `brandhub_demo` contains 15 fictional clients, 8 fictional designers, 1 admin, 15 brands, 30 projects, 30 campaigns, and 26 categorized media records. The files comprise 14 optimized images and 12 videos. The seed is repeatable and does not delete existing records. Usage rights for the supplied files have **not** been verified.

## Roles

| Role | Main actions |
| --- | --- |
| Admin | Manage users and projects, review requests and assets, access scoped reports |
| Designer | Work on assigned projects, upload design assets, submit and revise them |
| Client | Request projects, review assigned work, comment, bookmark, and browse project media |

The server enforces project membership and role rules on every protected API route. A private resource outside a user's scope returns 404.

## Project layout

| Path | Purpose |
| --- | --- |
| `client/src/` | React pages, components, themes, and API services |
| `client/public/demo-media/` | Optimized demo images, videos, and posters |
| `server/src/` | Express routes, models, middleware, and storage services |
| `server/scripts/` | Demo preparation, seeding, and media utilities |
| `server/tests/` | API and storage integration tests |
| `docs/` | Architecture notes, setup, handoffs, media guide, and test evidence |

## Local setup

Install Node.js and a MongoDB instance or Atlas database. From the repository root:

```sh
npm ci
```

Create `server/.env` from `server/.env.example`. Set `MONGODB_URI`, `SESSION_SECRET`, `CLIENT_URL`, and the Cloudinary values needed by the existing design-asset flow. The Atlas demo URI must target `/brandhub_demo` when running the demo seed. Keep this file untracked. Do not put secrets in a `VITE_` variable. For the client, use `VITE_API_URL` when the API is hosted at a different origin; the local Vite proxy defaults to port 5000 and may be overridden with `VITE_API_PROXY_TARGET`.

```sh
npm run dev:server
npm run dev:client
```

Open `http://localhost:5173`. See [local setup](docs/setup/LOCAL_SETUP.md) for additional environment details.

## Demo data and credentials

The demo files are already in `client/public/demo-media/`. To regenerate them from the supplied archive, extract the source ZIP to `.tmp/brandhub-feed/` or set `BRANDHUB_MEDIA_DIR` to another extracted folder, then run:

```sh
npm run media:prepare-local --workspace @brandhub/server
npm run seed:brandhub:dry-run --workspace @brandhub/server
npm run seed:brandhub --workspace @brandhub/server
npm run verify:brandhub-seed --workspace @brandhub/server
```

Set `DEMO_USER_PASSWORD` and `ADMIN_PASSWORD` in the ignored `server/.env` before seeding. The demo admin email is `admin@brandhub.example`; fictional client and designer emails end in `@brandhub.example`. The generated local passwords are stored only in `server/.env`, never in Git. These are development accounts and should not be used as production credentials. See the [hybrid media guide](docs/HYBRID_MEDIA.md) for the storage design and verified seed counts.

## Main routes and API

| Browser route | Purpose | API |
| --- | --- | --- |
| `/` | Landing page | Public |
| `/login`, `/signup` | Authentication | `/api/auth/*` |
| `/app/dashboard` | Role-based overview | `/api/dashboard/stats` |
| `/app/projects` | Projects and discovery | `/api/projects`, `/api/project-requests` |
| `/app/assets` | Design-review image library | `/api/assets` |
| `/app/assets/:id` | Review, revisions, comments | `/api/assets/:id/*`, `/api/comments` |
| `/app/reviews` | Review queue | `/api/assets` |
| `/app/bookmarks` | Saved assets | `/api/bookmarks` |
| `/app/media` | Project images, posts, and reels | `/api/media` |
| `/app/media/upload` | GridFS project upload | `/api/media/upload` |
| `/app/profile`, `/app/settings` | Account and preferences | `/api/users`, `/api/dashboard/stats` |

## Verification

```sh
npm run lint --workspace @brandhub/server
npm run test --workspace @brandhub/server
npm run build --workspace @brandhub/client
```

The most recent full server suite passed 54 tests, including an authenticated design-review lifecycle, concurrent-review protection, and GridFS image/video uploads. The production client build passed. Browser checks in Edge at desktop and mobile sizes covered dashboard, media gallery, video loading, reviews, bookmarks, and settings. Results and screenshots are in [the Phase 5–7 verification report](docs/testing/PHASE5_PHASE6_PHASE7_REPORT.md).

## Deployment status

`render.yaml` contains the API service skeleton and `client/vercel.json` supplies the SPA rewrite. A production deployment and deployed-URL smoke test have **not** been completed in this workspace. Before release, set production environment values on the selected hosts, point the client at the API, rotate credentials that were shared in chat, verify media usage rights, and test sign-in and private delivery at the live URLs. The local Atlas database `brandhub_demo` is a development demo, not a production database.

Email recovery screens are present, but outbound email delivery still needs service configuration. The review-asset image flow and GridFS project-media flow remain separate. Real-time collaboration, bulk uploads, and production performance measurements are not implemented.
