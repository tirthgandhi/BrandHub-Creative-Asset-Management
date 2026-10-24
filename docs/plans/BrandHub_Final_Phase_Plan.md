# BrandHub: Final Phase Plan (One Owner Per Phase)

> Based on: BrandHub PRD v1.0 plus your changes: client self sign-up, Admin-created Designers, client project requests, public projects.
> Stack: React + Vite · Node/Express · MongoDB (Mongoose) · Cloudinary
> This file **replaces** `BrandHub_Phase_Plan.md` and `BrandHub_Final_Team_Plan.md`.
> PRD submission target: **25 Oct 2026, 12:00 PM IST** (verify with the original email).
> This is a **plan**. Nothing is built or tested until the team runs it. Tick a box only after you have actually run the check.

---

## 1. Ownership Model

### 1.1 Who owns which phase

Each phase has **one owner**. The owner builds the whole phase (backend, frontend, unit/API tests) in their own branches. The other two developers **review**, they do not write code in that phase.

| Phase | Name | Owner | Tag at gate |
|---|---|---|---|
| 0 | Audit, Decisions, Contract | **Dev A** | none |
| 1 | Foundation | **Dev A** | `v0.1.0` |
| 2 | Identity (auth, users, roles) | **Dev A** | `v0.2.0` |
| 3 | Projects, Requests, Public Projects | **Dev B** | `v0.3.0` |
| 4 | Assets (upload, gallery, files) | **Dev B** | `v0.4.0` |
| 5 | Collaboration and Review | **Dev C** | `v0.5.0` |
| 6 | Dashboards, Seed Data, Polish | **Dev C** | `v0.6.0` |
| 7 | Release | **Dev C** | `v1.0.0` |

Replace "Dev A/B/C" with real names. If you have only 2 developers, split Dev C's phases (5 to 7) between them and keep the rule that one person owns each phase. Tell me the real team size and I will adjust the table.

### 1.2 Rules

1. **Review circle:** A's PRs are reviewed by **B**, B's by **C**, C's by **A**. Exceptions: contract/decision PRs (Phase 0 and any later contract change) need approval from **all three**. The final release PR needs **two approvals**.
2. **Bug rule:** a bug goes to the **owner of the phase where the bug lives**, on a `fix/pX-...` branch. Example: an upload bug found in Phase 6 goes to Dev B (Phase 4).
3. **Cross-phase touch rule:** do not edit another owner's code. If you need a change in it, open an issue with the exact change. Allowed exception: a **tiny** change (a few lines, e.g. adding a nav item) in a PR that the file's owner approves.
4. **Stub hand-off rule:** where a later phase fills in something an earlier phase needs, the earlier owner creates the **placeholder**, the later owner **implements it without editing the earlier owner's files** (see 1.4).
5. **Each owner writes unit and API tests for their own phase** and runs that phase's gate checks. Phase 7 (Dev C) adds browser end-to-end tests for everything.
6. **No PR merges into `develop` before its dependencies are merged** (see "PRs may merge when" in each phase). Dependent work can be built and tested locally earlier.

### 1.3 Critical path and waiting

```
Phase 0,1,2 (A)  ──▶  Phase 3,4 (B)  ──▶  Phase 5,6,7 (C)
```

| Stage | Dev A | Dev B | Dev C |
|---|---|---|---|
| Phase 0 | Builds | Reviews contract | Reviews contract |
| Phases 1–2 | Builds | After `p1-server-core` merges: starts Phase 3 locally; **PRs wait for `p2-auth-api`** | Prepares Phase 5: state machine + unit tests (`p5-state-machine`), review/comment UI against mock data |
| Phases 3–4 | Reviews B's PRs; fixes Phase 1–2 bugs | Builds | Keeps preparing Phase 5 (mock-based) |
| Phases 5–7 | Reviews C's PRs; fixes Phase 1–2 bugs | Fixes Phase 3–4 bugs (no regular reviews, since B reviews only A's PRs) | Builds |

Waiting developers do not write code in someone else's phase. They review PRs quickly (within a few hours), keep their own prerequisite work ready, and fix bugs in their own phases.

### 1.4 Placeholders created early, implemented later

| Placeholder (created by) | Implemented in | By |
|---|---|---|
| `components/reviews/{ReviewPanel,RevisionList,CommentsPanel}` render nothing, mounted in asset detail page (Phase 4, B) | Phase 5 | C |
| `components/assets/BookmarkButton` renders nothing, mounted on gallery card and detail (Phase 4, B) | Phase 5 | C |
| `services/bookmarkLookup.js` returns an empty set; asset serializer sets `isBookmarked` from it (Phase 4, B) | Phase 5 | C |
| `services/collabCleanup.js`: no-op `deleteCommentsFor`, `deleteBookmarksFor`, `deleteReviewEventsFor`; asset delete calls them (Phase 4, B) | Phase 5 | C |
| Project `assetCount` returns `0` (Phase 3, B) | Phase 4 | B |
| `/app/dashboard`, `/app/profile` activity: minimal page (Phase 2, A) | Phase 6 | C |
| Route placeholders for every page (Phase 1, A) | Each page's phase | its owner |
| Nav config with all items for all roles (Phase 1, A) | Pending-requests badge hook (Phase 3, tiny approved edit by B) | B |

### 1.5 Exports every later phase must reuse (never re-implement)

| Helper | Built in | Used by |
|---|---|---|
| `requireAuth`, `requireRole(...)`, password-change gate | Phase 2 (A) | everyone |
| Project access helper (admin / designer / client / public / none→404) and `buildProjectScope(user)` | Phase 3 (B) | Phases 4, 5, 6 |
| Asset access helper and `buildAssetScope(user)` (includes draft hiding for Clients and approved-only for public) | Phase 4 (B) | Phases 5, 6 |
| Storage service (upload, delete, signed URL) and upload middleware | Phase 4 (B) | Phase 5 (revisions) |
| State machine `nextStatus(...)` | Phase 5 (C) | review endpoints |

Dashboard counts and recent activity (Phase 6) **must use the same scope builders**, so numbers match the list pages.

---

## 2. Deadline Reality and Cut Line

The PRD estimates **50–90 focused hours**, and this plan runs in sequence (A → B → C), so total time follows the chain. If the real deadline is **25 Oct 2026, 12:00 PM IST** and today is 24 Oct, the full scope will not fit. Decide the cut line now.

| Tier | Contents | If time runs out |
|---|---|---|
| **Tier 1: Must** | Phases 0–5: auth (client sign-up, Admin-created Designers), projects CRUD, assets, comments, bookmarks, revisions, review flow, persistence | Never cut |
| **Tier 2: Your added features** | Project requests and Explore/public projects (Phase 3) | Cut after Tier 3 |
| **Tier 3: Polish** | Landing animation, parallax, extra motion, richer dashboards, P1 backlog | Cut first |

Minimum valid submission = Tier 1 + simple dashboards + themes + responsive layout + README + deployment. That still covers all **11 internship requirements**.

---

## 3. Locked Product Rules

### 3.1 Accounts
| Role | How created | Notes |
|---|---|---|
| **Client** | **Self sign-up** at `/register`, no Admin approval | Server forces `role = "client"`; any `role` in the request body is ignored |
| **Designer** | **Admin only** (`/app/admin/users`) | Admin sets initial password; `mustChangePassword = true`; forced change on first login |
| **Admin** | Seeded first Admin; further Admins only by an existing Admin | Never via public sign-up |

Inactive accounts cannot log in or call APIs. History stays attributed to them. The system refuses to deactivate or demote the **last active Admin**.

### 3.2 Project access
| Who | Sees |
|---|---|
| Admin | All projects and assets |
| Designer | Projects where they are in `designerIds` |
| Client | The project(s) where they are `clientId` (full client view) **plus public projects (read-only)** |
| Anyone else | `404` for private projects (never `403`, which would reveal existence) |

**Public project:** Admin sets `visibility = "public"`. Visible to **logged-in users only** (not anonymous). Non-members see **Approved assets only** and a **public view** of the project (title, description, category, approved-asset count, designer display names; **no emails, no client identity, no comments, no review history**). Non-members cannot comment, review, upload, revise, or delete. Switching to private removes access immediately, including file delivery. Default is **private**.

### 3.3 Project requests
Client sends: title, description, category, optional desired deadline. Admin **approves** (project created, that client assigned, designers/dates chosen, visibility default private) or **rejects (note required)**. Client can cancel while `pending`. Max **5 pending** requests per client.

### 3.4 Review state machine
```
Draft ──submit──▶ In Review ──approve─────────────▶ Approved (final)
                      │
                      └─request changes (note)────▶ Changes Requested
                                                        │
                                       upload revision (version N+1)
                                                        ▼
                                                      Draft
```
- **Submit:** assigned Designer / uploader or Admin; needs a valid current file and metadata.
- **Approve / request changes:** **Admin or the project's assigned Client only; never a Designer;** only from `in_review`; request changes needs a non-empty note.
- **Revision upload:** assigned Designer / uploader or Admin; **only from `changes_requested`**; creates version N+1, keeps all previous versions, sets status to `draft`.
- **Approved** assets can never be overwritten.
- Review actions send the version the reviewer saw; a stale version returns **409**.
- Every transition is **one atomic conditional update** (query matches `_id` + expected `status` + expected `currentVersion`), so two simultaneous actions cannot both succeed.
- Every transition appends a `ReviewEvent` (never edited or deleted).

### 3.5 Files
JPEG / PNG / WebP, **≤ 5 MB**, validated by the **actual file bytes**, not just the extension or header. Files are **private** (authenticated delivery); the backend checks access and then returns a short-lived signed URL.

---

## 4. Git Workflow

```
main        ← always deployable; protected; only receives the release PR from develop
 └─ develop ← integration; protected; receives feature PRs
      ├─ feature/pX-...   new work
      ├─ fix/pX-...       bug fixes
      └─ chore/pX-...     docs, config, tooling
```

- Create `develop` from `main` in Phase 0. Branch **from `develop`**, PR **into `develop`**. Never push directly to `main` or `develop`.
- Branch names: `feature/p<phase>-<area>-<name>`. Commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- **Squash and merge.** Delete the branch after merge. Small PRs (well under ~400 changed lines when possible).
- **Daily:** `git checkout develop && git pull`, then rebase your branch on `develop` at least **twice a day**. Force-push only your own feature branch after a rebase; never `develop` or `main`.
- **Phase gate:** after all of a phase's PRs merge, the owner runs the phase tests on a clean `develop` checkout, fixes blockers via `fix/pX-...`, a reviewer confirms, then tag `v0.<phase>.0`.
- **Release:** PR `develop → main`, two approvals, tag `v1.0.0`.

**Conflict hotspots**
| File | Rule |
|---|---|
| `server/src/routes/index.js` | One line per feature router; rebase before PR |
| `client/src/routes/index.jsx` | Each feature exports its own route array; the index only imports them |
| Nav config | One config per role; add lines only |
| `package.json` / lockfile | Announce in team chat before adding a dependency; on conflict take `develop`'s lockfile and re-run install |
| `.env.example` | Append only; update in the same PR that adds the variable |
| `docs/api/API_CONTRACT.md` | Change only via a dedicated PR approved by all three |
| Seed scripts | Admin seed (Phase 2, A); demo seed (Phase 6, C) |

---

## 5. Shared Contracts (frozen in Phase 0)

### 5.1 Enums
| Name | Values |
|---|---|
| `role` | `admin`, `designer`, `client` |
| `asset.status` | `draft`, `in_review`, `changes_requested`, `approved` |
| `project.status` | `active`, `on_hold`, `completed`, `archived` *(proposal; confirm in Phase 0)* |
| `project.visibility` | `private` (default), `public` |
| `projectRequest.status` | `pending`, `approved`, `rejected`, `cancelled` |
| `category` (project and asset) | Logo, Social Media, Website Banner, Poster, Brand Identity, Marketing Creative *(confirm one shared list)* |
| `reviewEvent.action` | `submit`, `approve`, `request_changes`, `revision_uploaded` |

### 5.2 Responses, errors, queries
- Single: `{ "data": {...} }`. List: `{ "data": [...], "pagination": { "page", "limit", "total" } }` (default `limit=12`, **max 50**).
- Error: `{ "success": false, "error": { "code", "message", "details": [] } }`

| HTTP | `error.code` |
|---|---|
| 401 | `UNAUTHENTICATED` |
| 403 | `FORBIDDEN`, or `PASSWORD_CHANGE_REQUIRED` while `mustChangePassword` is true |
| 404 | `NOT_FOUND` (also used instead of 403 when existence must not leak) |
| 409 | `CONFLICT` (stale version, duplicate email, duplicate bookmark, wrong state) |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `VALIDATION_ERROR` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

**Query rules.** Sorting uses a whitelist per resource (`createdAt`, `title`/name, `deadline` for projects; `-` prefix for descending). `page ≥ 1`; `limit` 1–50. `status` on assets accepts a comma-separated list (e.g. `in_review,changes_requested`). `GET /api/assets` also accepts `uploadedBy=me`. `GET /api/users` accepts `search`, `role`, `isActive`. Search text is regex-escaped. All filters apply **after** the access scope. Never trust a client-sent `userId`.

**Asset object** always includes `isBookmarked` (Phase 4 returns `false` via the placeholder; Phase 5 makes it real) and a short-lived signed `thumbnailUrl`.

### 5.3 Endpoints (✚ = added beyond the PRD list because the requirements need it)

| Group | Method + path | Access | Built in |
|---|---|---|---|
| Auth | `POST /api/auth/register` ✚ | Public, creates client only | P2 (A) |
| | `POST /api/auth/login` | Public | P2 (A) |
| | `POST /api/auth/logout` | Authenticated | P2 (A) |
| | `GET /api/auth/me` | Authenticated | P2 (A) |
| | `PATCH /api/auth/change-password` ✚ | Authenticated | P2 (A) |
| Users | `GET /api/users` | Admin | P2 (A) |
| | `POST /api/users` | Admin | P2 (A) |
| | `GET /api/users/:id` | Admin or self | P2 (A) |
| | `PATCH /api/users/:id` | Admin (any); self (name/avatar only); no self role change | P2 (A) |
| Projects | `GET /api/projects` (add `visibility=public` for the public list) | Scoped | P3 (B) |
| | `POST /api/projects` | Admin | P3 (B) |
| | `GET /api/projects/:id` | Member/Admin; non-member only if public (public view) | P3 (B) |
| | `PATCH /api/projects/:id` (includes `visibility`) | Admin | P3 (B) |
| | `DELETE /api/projects/:id` (archive; hard delete only if no assets) | Admin | P3 (B) |
| Requests ✚ | `POST /api/project-requests` | Client | P3 (B) |
| | `GET /api/project-requests` | Client (own), Admin (all) | P3 (B) |
| | `GET /api/project-requests/:id` | Owner client / Admin | P3 (B) |
| | `PATCH /api/project-requests/:id` (approve / reject + note) | Admin | P3 (B) |
| | `PATCH /api/project-requests/:id/cancel` | Owner client, only `pending` | P3 (B) |
| Assets | `GET /api/assets` | Scoped | P4 (B) |
| | `POST /api/assets` (multipart) | Admin; assigned Designer | P4 (B) |
| | `GET /api/assets/:id` | Authorized | P4 (B) |
| | `PATCH /api/assets/:id` | Admin; own uploader | P4 (B) |
| | `DELETE /api/assets/:id` | Admin (not Approved); Designer own Draft | P4 (B) |
| | `GET /api/assets/:id/file` ✚ | Authorized | P4 (B) |
| Review | `POST /api/assets/:id/submit` | Assigned Designer/uploader, Admin | P5 (C) |
| | `POST /api/assets/:id/revisions` | Same; only from `changes_requested` | P5 (C) |
| | `GET /api/assets/:id/revisions` ✚ | Authorized members/Admin | P5 (C) |
| | `PATCH /api/assets/:id/review` (body: `decision`, `version`, `note`) | Admin; assigned Client | P5 (C) |
| | `GET /api/assets/:id/history` ✚ | Members/Admin | P5 (C) |
| Comments | `GET /api/assets/:id/comments` | Members/Admin | P5 (C) |
| | `POST /api/assets/:id/comments` | Members/Admin | P5 (C) |
| | `DELETE /api/comments/:id` | Own; Admin moderation | P5 (C) |
| Bookmarks | `GET /api/bookmarks` | Own | P5 (C) |
| | `POST /api/assets/:id/bookmark` | Authenticated with access | P5 (C) |
| | `DELETE /api/assets/:id/bookmark` | Own | P5 (C) |
| Dashboard | `GET /api/dashboard/stats` (counts + `recentActivity`) | Role-aware | P6 (C) |
| Health | `GET /api/health` | Public | P1 (A) |

### 5.4 Frontend routes

| Route | Access | Placeholder (P1, A) | Real page built in |
|---|---|---|---|
| `/` | Public | Yes | P6 (C) landing |
| `/login`, `/register` ✚ | Public | Yes | P2 (A) |
| `/app/dashboard` | Authenticated | Yes | P2 minimal (A); P6 final (C) |
| `/app/profile` | Authenticated | Yes | P2 (A); activity P6 (C) |
| `/app/settings` | Authenticated | Yes | P6 (C) |
| `/app/admin/users` | Admin | Yes | P2 (A) |
| `/app/projects`, `/app/projects/:id` | Authenticated, scoped | Yes | P3 (B) |
| `/app/projects/new`, `/app/projects/:id/edit` | Admin | Yes | P3 (B) |
| `/app/explore` ✚ | Client | Yes | P3 (B) |
| `/app/requests`, `/app/requests/new` ✚ | Client | Yes | P3 (B) |
| `/app/admin/requests` ✚ | Admin | Yes | P3 (B) |
| `/app/assets`, `/app/assets/:id` | Authenticated, scoped | Yes | P4 (B) |
| `/app/assets/upload` | Admin, assigned Designer | Yes | P4 (B) |
| `/app/reviews` | Client, Admin; Designer (own pending view) | Yes | P5 (C) |
| `/app/bookmarks` | Authenticated | Yes | P5 (C) |
| `*` | Any | 404 page | P1 (A) |

### 5.5 Permission matrix (enforced by the backend)

| Capability | Admin | Designer | Client |
|---|---|---|---|
| Register themselves | n/a | **No** | **Yes** |
| Create users | Yes | No | No |
| Create / edit / archive project | Yes | No | No |
| Set project public/private; assign members | Yes | No | No |
| Send project request | No | No | Yes |
| Approve / reject request | Yes | No | No |
| View private project and assets | All | Assigned | Assigned |
| View public project (read-only, approved assets) | Yes | Yes | Yes |
| Upload asset / revision | Yes | Assigned | No |
| Edit asset metadata | Yes | Own | No |
| Delete asset | Yes (not Approved) | Own Draft only | No |
| Submit for review | Yes | Assigned/own | No |
| Approve / request changes | Yes | **Never** | Assigned project's client |
| Comment | Members/Admin | Members | Members |
| Delete comment | Moderation | Own | Own |
| Bookmark an accessible asset | Yes | Yes | Yes |

### 5.6 Model ownership
`User` (A, P2) · `Project`, `ProjectRequest` (B, P3) · `Asset`, `Revision` (B, P4) · `ReviewEvent`, `Comment`, `Bookmark` (C, P5).

---

## 6. Phases

### Phase 0: Audit, Decisions, Contract

**Owner:** Dev A · **Reviewers:** B and C (both must approve) · **Branch:** `chore/p0-audit-baseline`

**Purpose.** Protect existing work and make everyone agree on the same rules before any new code.

**Steps (Dev A)**
1. Commit or stash everything; tag the current state `baseline-before-brandhub`.
2. Inventory the existing repository: per PRD feature, record route/endpoint, status (**Working / Partial / Missing / Broken**), notes.
3. Reuse rule: keep working code; refactor only when a test or requirement forces it; changing any existing schema or API needs a short impact note ("what else uses this?").
4. Create `develop` from `main`; protect `main` and `develop` (PR required, ≥1 approval, no force-push, no direct commits).
5. Write `docs/api/API_CONTRACT.md` from section 5: per endpoint, method and path, access, request body and validation, success example, every error case with HTTP status and `error.code` (including `PASSWORD_CHANGE_REQUIRED`).
6. Write `docs/decisions.md` (question, options, chosen, reason, date, who decided) and lock the decisions below **with B and C**.
7. Add `.env.example`, `CONTRIBUTING.md` (section 4) and the PR template (section 9).
8. Help B and C run the project locally. Each developer uses their **own database name** (e.g. `brandhub_devA`) so nobody wipes another's data.

**Environment variables:** `PORT`, `NODE_ENV`, `MONGODB_URI`, `SESSION_SECRET` (or `JWT_SECRET` if tokens are chosen), `CLIENT_URL`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `VITE_API_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (first-Admin seed only), `ALLOW_SEED` (demo seed guard).

**Decisions to lock (recommended defaults; confirm each)**
| # | Decision | Recommended default |
|---|---|---|
| 1 | Client accounts | **Self sign-up (decided)** |
| 2 | Project delete | Archive by default |
| 3 | File access | Cloudinary private/authenticated delivery; backend checks access, returns short-lived signed URL |
| 4 | Review history | `ReviewEvent` collection (append-only) |
| 5 | Hosting | Choose now: frontend host, backend host, MongoDB Atlas free tier |
| 6 | Revision comparison | P1, not required |
| 7 | Can Clients see **Draft** assets? | **No.** Clients see `in_review`, `changes_requested`, `approved` only (PRD is silent; confirm) |
| 8 | Public project assets | **Approved only** |
| 9 | Session approach | Server-side sessions in MongoDB (real logout and deactivation) in an HTTP-only cookie, with CSRF protection (token or required custom header) and strict CORS. Alternative: signed token cookie + `tokenVersion`. If frontend and backend are on different domains: `Secure` + `SameSite=None`, CORS with credentials, and test on real URLs early |
| 10 | Project statuses and categories | Use section 5.1 |
| 11 | Asset deletion | Designer: own Draft only. Admin: any non-Approved asset; delete removes revisions, comments, bookmarks, review events and Cloudinary files. **Approved assets cannot be deleted**; archive the project instead |
| 12 | Hard delete of a project | Only if the project has **no assets**; otherwise archive |
| 13 | Metadata edit on Approved asset | Designer blocked; Admin allowed (the file never changes) |

**Common mistakes.** Starting features before the contract merges; different response shapes in different heads; committing a real `.env`; running seed or reset scripts on a shared database.

**While A works:** B and C read and review the contract, set up their local environments.

**Gate.** Contract and decisions merged; branches protected; all three can run client and server locally. *(No tag.)*

---

### Phase 1: Foundation

**Owner:** Dev A · **Reviewer:** B · **Branches, merge in this order:** `feature/p1-server-core` → `feature/p1-ui-system` → `feature/p1-client-foundation`

**Purpose.** The skeleton every other phase plugs into: working server, design system with themes, client app with routing and an API layer.

**1. `p1-server-core`**
- Middleware order: security headers → CORS (exact `CLIENT_URL`, `credentials: true`) → JSON parser with size limit → cookie parser → rate limiter → routes → not-found handler → central error handler.
- `AppError(status, code, message, details)` class and an async-handler wrapper; the central handler converts validation, Mongoose, Multer and unknown errors into the section 5.2 format (no stack traces to the client).
- Choose **one validation library** for the whole team and wrap it in one helper.
- MongoDB connection (exit with a clear message on failure); Cloudinary config; logging of method, path, status, request id (never passwords, tokens, secrets).
- `GET /api/health` (app status + DB state); `routes/index.js` registry (one line per router).

**2. `p1-ui-system`**
- **Semantic tokens**, never raw colors: background, surface, text, muted text, border, primary, danger, success, warning, focus ring, and one color per asset status.
- **Theme:** `data-theme="light|dark"` on `<html>`; a tiny inline script in `index.html` reads the saved choice (`light`/`dark`/`system`) and applies it **before first paint**; in System mode listen to the OS `prefers-color-scheme` and update live.
- **Base components** with all states (default, hover, focus, disabled, error, loading): button, input/form field, status chip (text + icon, not color alone), empty state, skeleton, toast/alert, confirmation modal (focus trapped, Esc closes), permission-denied view, theme selector.
- **Layout shell:** header, desktop sidebar, mobile drawer, nav driven by a config file per role containing **all** nav items from section 5.4.

**3. `p1-client-foundation`**
- Vite + React; `VITE_API_URL`.
- Router with **every route in section 5.4** as a lazy-loaded placeholder with a skeleton fallback; helpful 404 page.
- API client wrapper: sends cookies, parses JSON, normalizes every error to `{ code, message, details }`, and on `401` redirects to `/login`.
- `ProtectedRoute` skeleton.

**Tests:** health endpoint responds; error handler returns the standard shape for a thrown validation error; theme persists after refresh; System mode follows OS.

**Common mistakes.** Hard-coded colors; CORS without `credentials`; no SPA fallback so refresh shows 404 in production; different error formats.

**Handoff.** Merge `p1-server-core` first so B can start Phase 3 locally.

**Gate.** `/api/health` works; both themes persist; every route opens on direct URL and refresh; shell is usable at 375/768/1024/1440 px. Tag `v0.1.0`.
**FR coverage:** FR-006 (base), FR-027, FR-029 (base).

---

### Phase 2: Identity (Auth, Users, Roles)

**Owner:** Dev A · **Reviewer:** B · **Branches:** `feature/p2-auth-api` → `feature/p2-auth-ui` → `chore/p2-deploy-skeleton`

**Purpose.** Decide who can enter and what they may do. Every later phase depends on this.

**1. `p2-auth-api`**
- **User model:** name, email (trimmed, lower-cased, unique), `passwordHash`, `role`, `avatarUrl`, `isActive`, `mustChangePassword`, timestamps. The hash is never returned.
- **Password rule:** min 8 characters, at least one letter and one number (put it in the contract so UI and server match); bcrypt cost 10–12.
- **Sessions** per decision 9. The auth middleware loads the user from the database **on every request**, so deactivation and role changes apply immediately. Inactive users get no session.
- **Endpoints:** register (role **forced to `client`** by the server; body `role` ignored; rate limited; duplicate email → 409), login (rate limited), logout, me, change-password.
- **`mustChangePassword` gate:** while true, every endpoint except `me`, `logout`, `change-password` returns `403 PASSWORD_CHANGE_REQUIRED`.
- **Users API (Admin):** list with `search`, `role`, `isActive` and pagination (Phase 3 pickers need these), create (Admin chooses role, sets initial password, `mustChangePassword = true`), get, patch. Self may edit only name/avatar; nobody changes their own role; email and role changes are Admin-only. Deactivate instead of delete. Refuse deactivating or demoting the **last active Admin**.
- **Middleware:** `requireAuth`, `requireRole(...)`.
- **First Admin seed:** `npm run seed:admin` creates one Admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and refuses if an Admin already exists.

**2. `p2-auth-ui`**
- **Login:** validation, loading state, server errors shown, "New client? Create account" link, redirect to `/app/dashboard` after login.
- **Register:** name, email, password, confirm; says clearly it creates a **Client** account; success → dashboard.
- **Forced change-password screen** when the server says `PASSWORD_CHANGE_REQUIRED`.
- **Auth context** loads `/api/auth/me` on startup; `ProtectedRoute` shows a skeleton and **never** restricted content while identity is unknown.
- **Minimal dashboard** (replaced in Phase 6): welcome, role, and for a new Client "No projects assigned yet" with **Request a project** (`/app/requests/new`) and **Browse public projects** (`/app/explore`) buttons. The routes already exist as placeholders, so the buttons work without later edits.
- **Profile:** name, email, role; edit allowed fields.
- **Admin users page:** search, create (role dropdown; initial password shown **once**), edit, deactivate; duplicate email and invalid role show inline errors. Mobile: stacked cards.

**3. `chore/p2-deploy-skeleton`** (early deployment check)
- Deploy frontend, backend and Atlas; verify login cookie, CORS and the SPA rewrite on the real URLs. Document the host settings. (Cross-domain cookie problems usually appear only here.)

**Tests (A writes and runs)**
- [ ] Register with `role: "admin"` or `"designer"` in the body still creates a `client`
- [ ] Duplicate email, weak password, invalid role → clear 409/422
- [ ] Inactive user cannot log in; existing session stops working
- [ ] Admin creates Designer → Designer logs in → forced password change → can use the app
- [ ] Designer or Client calling `/api/users` → 403
- [ ] Logout ends the session; protected routes redirect; no restricted content flash
- [ ] Register and login rate limits → 429
- [ ] Cannot deactivate or demote the last active Admin
- [ ] Self cannot change own role

**Common mistakes.** Trusting a role from the browser; checking roles only in the UI; returning the hash; letting inactive users keep working sessions; skipping the last-Admin rule.

**Handoff.** Merge `p2-auth-api` as soon as it works because B's Phase 3 PRs wait for it.

**Gate.** Wrong roles blocked in UI **and** direct API calls; Admin-created Designer can log in and change password; deployed skeleton login works. Tag `v0.2.0`.
**FR coverage:** FR-001–005, FR-033, FR-034.

---

### Phase 3: Projects, Requests, Public Projects

**Owner:** Dev B · **Reviewer:** C · **Branches, in this order:** `feature/p3-projects-api` → `feature/p3-requests-api` → `feature/p3-projects-ui` → `feature/p3-requests-ui`
**Start:** after `p1-server-core` is merged (build locally against the contract).
**PRs may merge when:** `p2-auth-api` is on `develop` (rebase onto it first). **Never merge a temporary auth stub.**

**Purpose.** Create the containers for work and the single project-access rule that protects everything later.

**1. `p3-projects-api`**
- **Access helper (build once, export, reuse everywhere):** Admin → full; Designer in `designerIds` → full; Client equal to `clientId` → full client view; otherwise if `visibility === "public"` → **public (read-only) view**; otherwise **404**. Also export `buildProjectScope(user)`.
- **Model:** title, description, category, `status`, `visibility` (default `private`), `clientId`, `designerIds`, `createdBy`, `startDate`, `deadline`, timestamps. Validation: `deadline ≥ startDate`; `clientId` must be an **active Client**; each designer an **active Designer**.
- **List:** base scope by role; `visibility=public` returns public projects; case-insensitive partial title search with **escaped regex**; status/category filters; sort whitelist; `page ≥ 1`, `limit` 1–50; archived hidden by default.
- **Two response shapes:** *member view* (members, dates, visibility, `assetCount`) and *public view* (title, description, category, approved-asset count, designer display names; **no emails, no client identity**).
- `assetCount` returns `0` until Phase 4 implements it.
- **Update:** Admin only; `visibility` Admin-only. **Archive** (default delete): `status = archived`, assets kept, no new uploads. **Hard delete** only when the project has no assets.
- **Reassignment:** removed designers or a changed client lose access on the next request; past authorship stays.

**2. `p3-requests-api`**
- **Model:** `clientId`, title, description, category, `desiredDeadline` (optional), `status`, `adminNote`, `reviewedBy`, `reviewedAt`, `projectId`, timestamps.
- **Create:** Client only; validated; reject if the client already has **5 pending**; rate limited.
- **Approve (Admin):** body has designers, dates, visibility (default private). Do a conditional update `pending → approved` first (two Admins cannot both approve), then create the project with that client assigned and store `projectId`; if project creation fails, set the request back to `pending`.
- **Reject:** only from `pending`; **note required**. **Cancel:** owner client, only while `pending`.
- Client sees only their own requests; Admin sees all (filter by status).

**3. `p3-projects-ui`**
- **List:** search, status/category filters, sort, "Clear filters", skeletons, empty state for "no projects" and a different one for "no matches".
- **Create/edit form (Admin):** client picker (searchable active clients, so new sign-ups are easy to find), designer multi-picker (active designers), dates, category, **visibility toggle with a confirmation** that explains who will see it.
- **Detail:** members, dates, asset count; **"Public · View only"** badge for public projects; comment/upload/review controls are **not rendered** for read-only viewers.
- **Explore page (Client):** cards for public projects with search and category filter.
- Confirmation modal for archive/delete.

**4. `p3-requests-ui`**
- **Client:** request form (inline validation, success state) and "My requests" list with status chips, Admin note, link to the created project, cancel button for pending.
- **Admin inbox:** filter by status, detail panel, Approve (choose designers, dates, visibility) and Reject (note required).
- **Pending-count badge** in the Admin nav (tiny approved edit to the nav config). Inbox becomes stacked cards on mobile.

**Tests (B writes and runs)**
- [ ] Created and edited projects persist after refresh and server restart
- [ ] **E2E-02:** Client B cannot open Client A's private project by URL or API → 404
- [ ] Public project: Client B sees the public view only; no emails; comment/approve/upload via direct API → 403
- [ ] Switch to private → Client B loses access at once
- [ ] Request → Admin approves → project exists, client assigned, request links to it
- [ ] Reject without note blocked; with note, Client sees it
- [ ] Sixth pending request rejected; non-owner cannot view/cancel another client's request
- [ ] Inactive or wrong-role ids rejected in assignment
- [ ] Invalid sort field or `limit=1000` rejected or capped

**Common mistakes.** `403` instead of `404` for private projects; leaking emails in the public view; writing access checks separately in each endpoint; allowing inactive or wrong-role assignees; forgetting archived filtering; merging before auth.

**Gate.** Persistent project creation; E2E-02 passes; private/public switch is immediate. Tag `v0.3.0`.
**FR coverage:** FR-007–011, FR-035, FR-036, FR-037.

---

### Phase 4: Assets

**Owner:** Dev B · **Reviewer:** C · **Branches, in this order:** `feature/p4-assets-storage` → `feature/p4-assets-api` → `feature/p4-assets-ui-upload-detail` → `feature/p4-gallery-ui`
**Start:** after `p3-projects-api` is merged.

**Purpose.** Safe image upload, private storage, and correct visibility for every role.

**1. `p4-assets-storage`**
- **Cloudinary service:** upload from a buffer into `brandhub/<projectId>/<assetId>` with **authenticated (private)** delivery; return `publicId`, version, bytes, format, width, height; delete by `publicId`; create short-lived signed URLs (including a small thumbnail transformation). Secrets stay on the server.
- **Upload middleware:** Multer memory storage, 5 MB limit; accept JPEG/PNG/WebP only; **check the real file bytes** (magic numbers) so a renamed `.exe` is rejected; sanitize filenames; errors: too large → 413, wrong type → 415.
- **Models:** `Asset` (projectId, uploadedBy, title, description, category, tags, `currentVersion`, `status`, `currentFile`, `reviewedBy`, `reviewedAt`, `reviewNote`, timestamps), `Revision` (assetId, version, file, uploadedBy, note, createdAt; unique `(assetId, version)`; never updated).

**2. `p4-assets-api`**
- **Upload order:** (1) session; (2) actor is Admin or assigned Designer and project not archived; (3) Multer size limit; (4) real-bytes check; (5) create the asset `_id` first; (6) upload to Cloudinary; (7) save `Asset` (`draft`, version 1, `currentFile`) **and** version-1 `Revision`; (8) **if step 7 fails, delete the Cloudinary file** (log the `publicId` if cleanup also fails); (9) respond with the saved record.
- **Visibility:** Admin all; Designer assigned projects; Client their projects but **only `in_review`, `changes_requested`, `approved`**; non-member on a public project **approved only**. Export `buildAssetScope(user)` and the asset access helper.
- **List:** search title/tags; filters project, category, status (comma list), `uploadedBy=me`; sort date/name whitelist; pagination; every filter applied **after** scope.
- **Detail, metadata edit** (title required, description, category, tags: limit count, trim, lower-case, dedupe; Designer own only; Approved blocked for Designer, allowed for Admin), **delete** per decision 11 via `cascadeDeleteAssetData` which deletes revisions and calls the placeholder cleanup functions (no-ops until Phase 5), and Cloudinary files.
- **`GET /api/assets/:id/file`:** same access check, then a short-lived signed URL. No permanent public URL, no guessable path.
- Project `assetCount` implemented (public view counts Approved only).
- **Placeholders created here:** `BookmarkButton`, `ReviewPanel`, `RevisionList`, `CommentsPanel` components (render nothing), `services/bookmarkLookup.js`, `services/collabCleanup.js` (section 1.4); responses include `isBookmarked: false`.

**3. `p4-assets-ui-upload-detail`**
- **Upload page:** drop zone (drag-and-drop and keyboard-accessible "Choose file"), image preview, metadata form, project picker limited to the Designer's assigned projects. On failure the entered metadata stays and a **Retry** button appears; success is shown **only** after the server responds.
- **Asset detail:** large preview (lightbox), metadata panel, current version, download, edit metadata when allowed; mount the placeholder panels.

**4. `p4-gallery-ui`**
- Responsive grid: 1 column ≤480 px, 2 ≤768 px, 3 ≤1024 px, 4+ above; lazy-loaded images with fixed aspect ratio.
- Card: thumbnail, title, project, category, uploader, status chip, version, date, bookmark placeholder.
- Filter bar (search, project, category, status, sort), "Clear", skeletons, "nothing yet" vs "no results" empty states, lightbox (Esc closes, focus trapped).

**Tests (B writes and runs)**
- [ ] **E2E-04:** wrong type, renamed `.exe`→`.png`, over 5 MB: rejected with a clear message, no asset record, no orphan Cloudinary file (also with a forced DB failure)
- [ ] **E2E-05:** multi-filter search + clear returns the full list; empty state shown
- [ ] Designer cannot upload to an unassigned or archived project; Client cannot upload
- [ ] Client cannot see Draft assets; Client B cannot reach Client A's asset by ID or file link
- [ ] Public viewer gets approved assets only
- [ ] Files are not publicly enumerable; signed URLs expire
- [ ] Designer deletes own Draft only; Approved cannot be deleted

**Common mistakes.** Trusting the file extension; saving the record before the upload succeeds, or not cleaning up on failure; public Cloudinary URLs; searching before applying the access scope; editing C's files instead of leaving placeholders.

**Gate.** Valid uploads display and persist; bad files rejected cleanly; no cross-client access. Tag `v0.4.0`.
**FR coverage:** FR-012–018 (FR-016's full cascade completes in Phase 5).

---

### Phase 5: Collaboration and Review

**Owner:** Dev C · **Reviewer:** A · **Branches:** `feature/p5-state-machine` (early) → `feature/p5-review-revisions-api` → `feature/p5-comments-bookmarks-api` → `feature/p5-review-ui` → `feature/p5-comments-bookmarks-ui`
**Start early (no dependency):** `p5-state-machine` after Phase 1; review/comment UI against mock data.
**PRs may merge when:** `p4-assets-api` is on `develop` (state-machine PR may merge earlier).

**Purpose.** The business loop: submit, review, request changes, revise, approve, with comments, bookmarks and a trustworthy history.

**0. `p5-state-machine`.** Pure function `nextStatus(current, action, actorRole)` with unit tests for every valid and invalid transition (including Designer approving, Client submitting, revision from `approved`/`draft`/`in_review`).

**1. `p5-review-revisions-api`**
- `ReviewEvent` model (append-only): assetId, version, actorId, action, fromStatus, toStatus, note, createdAt.
- **Submit** (Draft → In Review): one conditional update matching `_id`, `status: draft`, expected `currentVersion`; requires valid current file and metadata. If nothing matches, return `404` (not found or not allowed) or `409` (wrong state), never silent success.
- **Review:** body `decision` (`approve` | `request_changes`), `version`, `note`. Only **Admin or the project's assigned Client**; Designers always `403`. Conditional update matching `_id`, `status: in_review`, `currentVersion === version`; no match → **409** "changed since you opened it". Approve stores `reviewedBy`/`reviewedAt`; request changes requires a non-empty note.
- **Revisions:** only from `changes_requested`. Upload the new file first (path includes the version), then conditional update matching `status: changes_requested` and `currentVersion: n` → `currentVersion: n+1`, new `currentFile`, `status: draft`, clear current review fields; create the new `Revision` (unique index blocks duplicates). If the DB step fails, delete the new Cloudinary file. Old revisions are never modified. Approved assets never receive revisions.
- Every transition appends a `ReviewEvent` (use a transaction if the Atlas cluster supports it; otherwise write immediately after and log failures).
- `GET /revisions` and `GET /history`.

**2. `p5-comments-bookmarks-api`**
- **Comments:** stored with the version they refer to; trimmed, non-empty, max length (e.g. 1000); readable/writable by project members and Admin only (public viewers cannot); delete own, or Admin moderation. Support a version filter.
- **Bookmarks:** unique `(userId, assetId)`; access-checked; duplicate → `409` (UI treats as already saved); list excludes assets the user can no longer access.
- Implement the placeholders: `bookmarkLookup` (makes `isBookmarked` real) and `collabCleanup` (asset deletion now removes comments, bookmarks, review events) with tests.

**3. `p5-review-ui`**
- Implement `ReviewPanel` and `RevisionList`: Submit button (permitted roles only); Approve (confirmation: "This marks version N as final") and Request changes (required note, inline error); revision list with date, uploader, note; upload-revision flow; **review history timeline** (who, when, decision, note, version).
- `/app/reviews` queue: Client = `in_review` in their projects; Admin = all `in_review`; Designer = own assets in `in_review` and `changes_requested` (`uploadedBy=me`), view only.
- On **409** show "This asset changed since you opened it" with a Refresh button; never show success. After each action update from the server response so gallery, detail, queue and project agree (FR-025).

**4. `p5-comments-bookmarks-ui`**
- Implement `CommentsPanel` (list, composer, version filter, delete own) and `BookmarkButton` (instant toggle, roll back with a message on failure), synced across gallery, detail and `/app/bookmarks`.

**Tests (C writes and runs)**
- [ ] **E2E-01:** Admin project → Designer uploads → submits → Client requests changes → revision (v2, v1 kept) → resubmit → Client approves; history complete
- [ ] **E2E-03:** Designer cannot approve through the UI or a direct API call
- [ ] **E2E-06:** bookmark add/remove persists after refresh, per user
- [ ] **E2E-10:** stale version review → 409, no overwrite
- [ ] Double click or two tabs on submit/approve: only one transition applies
- [ ] Request changes without a note → 422; blank or oversized comment → 422
- [ ] Revision on `approved`, `draft` or `in_review` asset rejected
- [ ] Public viewer cannot read comments or history
- [ ] Deleting an asset removes its comments, bookmarks, review events
- [ ] Status identical in gallery, detail, queue and project view

**Common mistakes.** Checking status in code and then updating in a second step; Designer approving through the API; rewriting history; revisions on the wrong status; showing comments to public viewers; editing B's page files instead of filling the placeholders.

**Gate.** E2E-01 passes; Designer cannot approve; stale review rejected; history lists every step. Tag `v0.5.0`.
**FR coverage:** FR-019–025.

---

### Phase 6: Dashboards, Seed Data, Polish

**Owner:** Dev C · **Reviewer:** A · **Branches, in this order:** `feature/p6-dashboard-api` → `feature/p6-dashboards-ui` → `feature/p6-seed-fixtures` → `feature/p6-settings-responsive-a11y` → `feature/p6-landing-motion`
**Start:** after Phase 5 gate. Do the landing page **last**.

**1. `p6-dashboard-api`.** `GET /api/dashboard/stats` for the current role only, using **the same `buildProjectScope` and `buildAssetScope` helpers** as the list pages.
- **Admin:** projects, active users, assets by status, pending reviews, **pending project requests**, **clients without a project**.
- **Designer:** assigned projects, assets needing action (`draft`, `changes_requested`), assets in review.
- **Client:** assets awaiting my review, approved count, **my requests by status**, count of public projects.
- `recentActivity`: latest ~10 real events (review events, new assets, comments, requests), newest first, limited to what that user may see.

**2. `p6-dashboards-ui`.** Replace the minimal dashboard with three role layouts: stat cards linking to the filtered list they count, a "needs your attention" list, quick actions (Admin: Review requests; Designer: Upload asset; Client: Request a project), skeletons and empty states. **Profile** gets an "associated activity" section from `recentActivity`. No invented numbers.

**3. `p6-seed-fixtures`.** `npm run seed:demo` (dev/demo only). Guards: refuses when `NODE_ENV=production` or when `ALLOW_SEED` is not `true`; a separate reset command asks for confirmation and affects only the configured dev database.
- Deterministic (fixed fictional emails such as `admin@brandhub.demo`, fixed dates and order).
- 1 Admin, 2 Designers, 2 Clients; 5 projects: UrbanWear Branding, NovaTech Campaign, BloomSkin Identity, FreshBite Marketing, PixelWave Creatives; **at least one public**.
- 20+ assets covering all six categories and all four statuses; several comments; bookmarks; 2+ revision chains; at least one pending and one rejected project request.
- Images are original (script-generated shapes/gradients) or properly licensed. Credentials are fictional and marked development-only in the README.
- Verify every reference resolves and dashboard counts equal stored scoped records.

**4. `p6-settings-responsive-a11y`.** Settings page (theme selector, reduced-motion option, logout). Then the **responsive and accessibility pass** over every page (standards in section 6A) at 375/768/1024/1440 px in both themes: keyboard-only use, visible focus, dialog focus trapping, error announcements, contrast, status shown by text or icon.

**5. `p6-landing-motion`.** Sections: animated nav (Features, How It Works, Product Preview, Login); hero (promise, **Sign up as Client** primary, **Log in** secondary, product preview); problem/value; interactive feature previews (Asset Library, Projects, Comments, Reviews); sample gallery of fictional brands; workflow narrative Admin → Designer → Client → revision/approval; final CTA and footer. A short line says Designer accounts are created by the agency Admin. **No** fake customer logos, testimonials, or statistics; no promise of features that do not exist.
- **Motion:** prefer CSS transitions and `IntersectionObserver`; use GSAP/ScrollTrigger only if a scroll timeline truly needs it; never let two libraries animate the same property. Everything switches off or simplifies under `prefers-reduced-motion` (check in CSS **and** JavaScript). Nothing depends on hover; CTAs are never blocked; clean up animations on route change; no large background video.

**Tests (C writes and runs)**
- [ ] Dashboard counts equal stored scoped records for each role
- [ ] **E2E-07:** invalid fields and failed API show real errors, never false success
- [ ] **E2E-08:** Light/Dark/System persist after refresh; System follows OS change
- [ ] **E2E-09:** reload on a nested route (e.g. `/app/assets/:id`) and mobile navigation work
- [ ] Demo seed re-runs cleanly on a dev database and refuses in production mode

**Common mistakes.** Animation before the pipeline works; dashboard counts that differ from the lists; seeding a shared or production database; copying imagery from reference products; animations that ignore reduced motion.

**Gate.** Responsive and reduced-motion checks pass; counts match the seed. Tag `v0.6.0`.
**FR coverage:** FR-026, FR-028 (UI states verified across the app), FR-029, FR-030, FR-031, FR-032.

---

### Phase 7: Release

**Owner:** Dev C · **Reviewer:** A (release PR needs **two approvals**: A and B) · **Branches:** `feature/p7-e2e-tests`, `chore/p7-docs-readme`, `chore/p7-deploy`, `chore/p7-screenshots`

**Purpose.** Prove it works, document it honestly, deploy it. **No new features**, only `fix/p7-...` for bugs (routed to the phase owner per rule 1.2).

**1. `p7-e2e-tests`.** Supertest API suites (CRUD, denied access per role, search/filter, upload rejection, review transitions, stale conflict) against a seeded test database; Playwright tests for **E2E-01 to E2E-10**, using separate browser contexts for Admin, Designer, Client A and Client B in the same test. Optional CI: lint, production build, server start, tests.

**2. `p7-deploy`** (builds on A's Phase 2 skeleton).
- **Atlas:** database user; network access for the backend host (free hosts often need "allow from anywhere" plus a strong password).
- **Backend host:** all variables from `.env.example`; `NODE_ENV=production`; `trust proxy` if behind a proxy; cookie flags matching the domain setup; CORS origin **exactly** equal to the frontend URL with no trailing slash.
- **Frontend host:** `VITE_API_URL` set at **build time**; SPA rewrite (all paths → `index.html`) so deep links work on refresh.
- **Cloudinary:** production credentials only in host settings.
- **Demo database:** a separate database for the public demo; seed it once, on purpose, with approval. Never re-seed a database holding real data.
- **Smoke test on real URLs:** register a client, log in as each role, upload, submit, review, approve, refresh, open a deep link.

**3. `p7-docs-readme`.** What the product is; features by role; stack; prerequisites; install and run steps (client and server); environment variable table; seed commands and fictional demo credentials; API route list; folder structure; test commands; deployment notes; **known limitations and unfinished items, stated honestly**.

**4. `p7-screenshots`.** Real browser screenshots (desktop and mobile) of: landing, login, register, three dashboards, gallery, asset detail, upload, project detail, requests, explore, reviews, and both themes. **Never** AI mockups. Measure Lighthouse and Core Web Vitals and report only the real numbers.

**Release steps**
1. Freeze features; run the full verification matrix (section 7) on `develop`.
2. Fix blockers via `fix/p7-...` branches owned by the phase owner.
3. Open PR `develop → main`; two approvals (A and B); merge; tag `v1.0.0`.
4. Confirm no secrets in the client bundle or Git history.
5. Submit the repository link, README, deployed URLs and demo credentials.

**Common mistakes.** Late first deployment; missing SPA rewrite; claiming 11/11 without running the matrix; committing `.env`; re-seeding a database with real data.

**Gate.** Every item in section 10 is checked on the deployed app. Tag `v1.0.0`.

---

## 6A. Responsive and Accessibility Standards (apply in every phase)

Test at **375, 768, 1024, 1440 px** in Light and Dark.

| Rule | Requirement |
|---|---|
| Approach | Mobile-first; fluid grids; no fixed-width containers |
| Navigation | Desktop sidebar; mobile drawer or bottom nav; closes on route change and Esc |
| Gallery | 1 column ≤480 px, 2 ≤768 px, 3 ≤1024 px, 4+ above; lazy-loaded images with fixed aspect ratio |
| Tables and lists | Become stacked cards on mobile, or scroll inside their own container (never the page body) |
| Forms | Single column on mobile; inputs ≥ 44 px high; correct `type` and `autocomplete` |
| Touch | Targets ≥ 44×44 px; no hover-only actions |
| Asset detail | Mobile: preview, then metadata, comments, versions stacked or tabbed. Desktop: preview left, panel right |
| Modals and lightbox | Full-screen on mobile; focus trapped; Esc closes |
| Status | Always text or icon plus color, never color alone |
| Keyboard and forms | Visible focus; dialogs and menus keyboard-operable; labels on every field; errors announced (`aria-live` / `role="alert"`) |
| Motion | Respect `prefers-reduced-motion`; no scroll-jacking |

**Accept:** no horizontal page scroll, no clipped or overlapping elements, and upload, submit, approve, request changes and comment all usable at 375 px.

---

## 7. Full Verification Matrix (run before release)

Test at **375, 768, 1024, 1440 px** in Light and Dark. "Bugs go to" is the phase owner who fixes it.

| # | Role | Action | Expected | Bugs go to |
|---|---|---|---|---|
| 1 | Visitor | Click every landing nav link and CTA | All work, no dead buttons | C (P6) |
| 2 | Visitor | Register as Client (valid) | Account created; dashboard with request + explore actions | A (P2) |
| 3 | Visitor | Register with duplicate email, weak password, injected `role` | Errors shown; injected role ignored | A (P2) |
| 4 | Admin | Create a Designer | Appears in Users list | A (P2) |
| 5 | Designer | Log in with Admin-given password; change it | Reaches Designer dashboard | A (P2) |
| 6 | Client | Send project request (valid and invalid) | Pending / validation errors | B (P3) |
| 7 | Admin | Approve request and pick designers | Project created, client assigned, request shows Approved | B (P3) |
| 8 | Admin | Reject another request with note | Client sees Rejected + note | B (P3) |
| 9 | Admin | Create/edit project, assign people, toggle Public | Persists after refresh | B (P3) |
| 10 | Designer | Upload valid image with metadata | Asset in gallery, status Draft | B (P4) |
| 11 | Designer | Upload invalid type / over 5 MB | Rejected; nothing orphaned | B (P4) |
| 12 | Designer | Edit metadata; submit | Status In Review | C (P5) |
| 13 | Client | Open asset; comment | Persists | C (P5) |
| 14 | Client | Request changes without / with note | Blocked / Changes Requested | C (P5) |
| 15 | Designer | Upload revision | v2 created, v1 kept, status Draft | C (P5) |
| 16 | Designer → Client | Resubmit; Client approves | Approved; reviewer and time recorded | C (P5) |
| 17 | Designer | Try to approve (UI and API) | Blocked | C (P5) |
| 18 | Client B | Open Client A's private project/asset URL and file link | 404 / denied | B (P3/P4) |
| 19 | Client B | View a public project | Read-only, approved assets only, no action controls | B (P3/P4) |
| 20 | Client B | Comment/approve via API on public project | 403 | C (P5) |
| 21 | Admin | Set project back to Private | Client B loses access at once | B (P3) |
| 22 | Any | Search, filter, sort, clear (projects and assets) | Correct; reset works; empty state shown | B (P3/P4) |
| 23 | Any | Bookmark / unbookmark; refresh | Persists per user | C (P5) |
| 24 | Any | Light / Dark / System; refresh | Persists; System follows OS | A (P1) |
| 25 | Any | Reload deep URLs | Correct page | A (P1) |
| 26 | Any | Permitted delete with confirmation; unauthorized delete | Works / blocked; Approved asset cannot be deleted | B (P3/P4) |
| 27 | Admin | Deactivate a user; try last Admin | User cannot log in, history preserved; last Admin refused | A (P2) |
| 28 | Any | Dashboard counts vs real records | Match | C (P6) |
| 29 | Any | Key flows at 375 / 768 / 1024 / 1440 px | No overflow; actions usable | C (P6) |
| 30 | Any | Keyboard-only and reduced-motion pass | Focus visible; motion reduced | C (P6) |
| 31 | Any | Restart backend; refresh frontend | Data still present | A (P1/P2) |

---

## 8. Traceability

### 8.1 Internship requirements
| # | Requirement | Phase(s) | Evidence |
|---|---|---|---|
| 1 | Home page | 1, 6 | Landing + dashboards, working CTAs |
| 2 | Listing and details | 3, 4 | Open items from lists |
| 3 | Create and update | 3, 4 | Edits persist after refresh |
| 4 | Delete | 3, 4 | Confirmation + permission checks |
| 5 | Interaction | 5 | Persisted comments and bookmarks |
| 6 | Search and filtering | 3, 4 | Combined query, clear, empty state |
| 7 | User profile | 2, 6 | Role-aware profile with real activity |
| 8 | Backend API | 2–5 | Tested requests and error responses |
| 9 | Database | 2–5 | Persistence after reload and restart |
| 10 | Validation and error handling | All | Positive and negative tests |
| 11 | Responsive UI | 1, 6 | Breakpoint QA; Light/Dark/System |

### 8.2 Functional requirements by phase
| Phase | FR IDs |
|---|---|
| 1 | FR-006 (base), FR-027, FR-029 (base) |
| 2 | FR-001, 002, 003, 004, 005, 033, 034 |
| 3 | FR-007, 008, 009, 010, 011, 035, 036, 037 |
| 4 | FR-012, 013, 014, 015, 016, 017, 018 |
| 5 | FR-019, 020, 021, 022, 023, 024, 025 |
| 6 | FR-026, 028, 029, 030, 031, 032 |

New IDs from your changes:
- **FR-033** Client self-registration (role forced to client, rate limited)
- **FR-034** Admin-created Designers with forced first-login password change
- **FR-035** Client project request (validation, 5-pending cap, cancel)
- **FR-036** Admin approves or rejects requests (approval creates and assigns the project; rejection needs a note)
- **FR-037** Public project visibility (logged-in read-only, approved assets only, instant revoke)

### 8.3 E2E scenarios by phase
| Scenario | Run at |
|---|---|
| E2E-02 | Phase 3 (re-run in 4 and 5) |
| E2E-04, E2E-05 | Phase 4 |
| E2E-01, 03, 06, 10 | Phase 5 |
| E2E-07, 08, 09 | Phase 6 |
| All ten, automated | Phase 7 |

---

## 9. Templates

### 9.1 Pull request template (`.github/pull_request_template.md`)
```markdown
## What and why
<!-- one or two sentences -->

## Phase / FR IDs
<!-- e.g. Phase 4, FR-012, FR-017 -->

## Changes
-

## How I tested
- [ ] Ran locally (backend + frontend)
- [ ] Positive case
- [ ] Negative case (validation / permission denied)
- [ ] Checked at 375 px and desktop (UI changes)
- [ ] Light and Dark (UI changes)

## Checklist
- [ ] Follows docs/api/API_CONTRACT.md (or contract PR linked)
- [ ] Backend enforces permissions (not just the UI)
- [ ] Reuses the shared access helpers (no copied access logic)
- [ ] No secrets; .env.example updated if needed
- [ ] Dependencies merged on develop; rebased on latest develop
- [ ] No edits to another phase owner's files (or approved tiny edit noted)
- [ ] Screenshots attached (UI changes)
```

### 9.2 Definition of Done (per task)
Code merged into `develop`; permission and validation cases pass; loading, empty, error and success states handled; data persists where applicable; responsive and keyboard checked; limitations documented; **nothing is claimed complete without running it**.

### 9.3 Phase gate routine
1. All of the phase's PRs are merged and everyone has pulled `develop`.
2. The owner runs the phase tests on a clean `develop` checkout.
3. Blockers are fixed through `fix/pX-...` branches.
4. The reviewer confirms; the owner tags `v0.<phase>.0` and posts a short status in team chat.
5. The next phase's owner starts merging only after the gate passes.

---

## 10. Final Handoff Checklist

- [ ] Existing repository audited; baseline tag exists
- [ ] Decisions recorded in `docs/decisions.md`
- [ ] All three roles work; client sign-up and Admin-created Designers verified
- [ ] Project requests and public projects verified, including instant revoke
- [ ] Express API and MongoDB persistence verified after a restart
- [ ] Cloudinary uploads and access control verified; no public file enumeration
- [ ] Project and asset CRUD tested
- [ ] Search/filter, comments, bookmarks, revisions, review flow verified
- [ ] Light/Dark/System and reduced motion verified
- [ ] Responsive pass at 375/768/1024/1440 px
- [ ] Real screenshots captured (no mockups)
- [ ] README complete: install, env table, routes, fictional demo credentials, limitations
- [ ] Deployed and smoke-tested on real URLs
- [ ] All 11 internship requirements demonstrated
- [ ] Known limitations documented honestly
- [ ] `main` tagged `v1.0.0`; repository ready to submit

---

## 11. Main Risks

| Risk | Severity | Prevention |
|---|---|---|
| Cross-client data leakage | Critical | Single project/asset access helpers; membership check in every query and file delivery; E2E-02 re-run each phase |
| Role escalation through sign-up | Critical | Server hard-codes `client`; test an injected role |
| Public project leaks drafts, comments, emails | High | Separate public response shape; test with Client B |
| Cloudinary upload succeeds but DB write fails | High | Compensating delete; E2E-04 |
| Approved asset overwritten or double transition | High | Atomic conditional update; 409 on stale version |
| Sequential ownership delays later phases | High | Merge small and early; owners prepare dependent work locally; review within hours; use the cut line (section 2) |
| Phase 3 merged before auth | High | PRs wait for `p2-auth-api`; never merge an auth stub |
| Late deployment problems (cookies, CORS, SPA rewrite) | High | Deploy skeleton in Phase 2 |
| Time spent on animation before the core works | High | Landing page last; Tier 3 is cut first |
| Merge conflicts at hotspots | Medium | Section 4 rules; rebase twice daily; small PRs |
| AI coding agent breaks working code | High | Feature branches, small patches, run tests before each PR |
