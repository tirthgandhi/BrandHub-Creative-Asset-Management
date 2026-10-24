# BrandHub Phase 3–4 implementation handoff

This document describes code present in the repository. It does **not** declare either phase gate complete: live Cloudinary upload/delivery, browser checks, persistence across a real backend restart, and cross-team contract approval remain unverified.

## Phase 3

- `Project` stores a single Client, assigned Designers, status, visibility, dates, author, and an optional unique source request. Indexed membership, visibility/status, category, and request source support scoped queries.
- `ProjectRequest` stores the Client brief, review decision, reviewer, and linked project. Five unique pending slots per Client enforce the pending limit under concurrent inserts. Approval uses a MongoDB transaction on supported deployments; standalone MongoDB claims the request atomically and relies on unique `Project.sourceRequestId` for idempotency and recovery.
- `buildProjectScope(user)`, `projectAccess(user, project)`, `findAccessibleProject(user, id)`, and `serializeProject(project, access, assetCount, approvedAssetCount)` are in `server/src/services/projectAccess.js`. Non-members receive only the redacted public shape; inaccessible private projects return 404.
- `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`, `POST/GET /api/project-requests`, `GET/PATCH /api/project-requests/:id`, and `PATCH /api/project-requests/:id/cancel` reuse the Phase 2 session, password-change gate, role checks, CSRF middleware, shared errors, and Zod validation.
- `/app/projects`, `/app/projects/new`, `/app/projects/:id`, `/app/projects/:id/edit`, `/app/explore`, `/app/requests`, `/app/requests/new`, and `/app/admin/requests` use real APIs. Filters, pagination, empty/error states, request decisions, and archive confirmation are present.
- Project deletion defaults to archive. `mode=delete` is intentionally unavailable while concurrent upload and collaboration cleanup semantics are unresolved.

## Phase 4

- `Asset` and immutable `AssetRevision` version 1 reference a valid project and uploader through the API. The unique `(assetId, version)` index protects revision identity. Asset query indexes cover project/status, title, tags, and an optional uploader/idempotency key.
- `buildAssetScope(user)` in `server/src/services/assetAccess.js` reuses current project membership/visibility. Admins and assigned Designers see all permitted assets; assigned Clients cannot see Draft; public non-members see Approved only.
- `POST /api/assets` accepts one JPEG, PNG, or WebP image up to 5 MB. Multer caps the upload, while signature, filename/MIME, dimensions, and Sharp decoding checks inspect the actual bytes. The server creates an authenticated Cloudinary object and then stores the Asset and version-1 Revision. Failed persistence triggers storage cleanup; cleanup failures are queued in `StorageCleanup` for a periodic retry worker.
- `GET/POST /api/assets`, `GET/PATCH/DELETE /api/assets/:id`, and `GET /api/assets/:id/file` enforce current asset scope. File and thumbnail delivery uses backend-generated Cloudinary access tokens expiring after five minutes. The API never sends storage IDs or credentials to the frontend. Existing issued links can remain usable until expiry after access is revoked.
- `server/src/services/cloudinaryStorage.js` exports `uploadFile`, `deleteFile`, `getSignedFileUrl`, `getSignedThumbnailUrl`, `queueStorageCleanup`, `releaseStorageCleanup`, `retryStorageCleanup`, and `startStorageCleanupWorker`.
- `/app/assets`, `/app/assets/upload`, and `/app/assets/:id` provide a scoped gallery, upload, secure image opening, metadata editing, and authorized deletion. `BookmarkButton`, `ReviewPanel`, `RevisionList`, and `CommentsPanel` are noninteractive Phase 5 mounting points. `bookmarkLookup.js` returns false; `collabCleanup.js` is a placeholder hook. They must be replaced when Phase 5 models and APIs exist.
- Project list/detail asset counts come from grouped database queries. Public viewers receive only Approved counts.
- Approved metadata editing is locked pending the audited correction decision in ADR-016. No Phase 5 status transitions are implemented.

## Configuration

Copy `server/.env.example` to `server/.env` and set a MongoDB URI, session secret, exact client URL, Cloudinary cloud name/API key/API secret, and `CLOUDINARY_AUTH_TOKEN_KEY` from the Cloudinary access-control configuration. Keep all credentials on the server. The storage service returns a service-unavailable error when protected delivery is not configured.

## Verification and open gates

The frontend production build, client type check, and repository lint passed during implementation. The isolated server suite passed after fixing the standalone-MongoDB approval fallback. Its asset API test uses a test-only Cloudinary adapter to verify persistence and authorization; it is not evidence of live Cloudinary delivery.

| Check | Expected | Actual | Result |
|---|---|---|---|
| Server suite | Existing auth and new Phase 3–4 checks pass | 22 tests passed, including concurrent request limit, approval, project privacy, asset scope, upload validation, idempotency, archive restriction, deletion, and Client → Admin → Designer integration | PASS |
| Frontend build and type check | Vite build and TypeScript compilation succeed | Build completed | PASS |
| Existing client tests | Landing media and atmosphere behavior stay intact | 12 tests passed | PASS |
| Repository lint | No lint errors | Client and server lint completed | PASS |
| Live Cloudinary upload and delivery | Authenticated object, five-minute token, safe cleanup | No account credentials in workspace; only local token generation and test adapter checked | NOT RUN |
| Backend app reload | Project and asset data persist when the Express app is recreated | Isolated MongoDB integration test re-created the app, logged in again, and read the same asset | PASS |
| Real deployed database/backend restart | Data persists through a process restart | No configured persistent MongoDB in this workspace | NOT RUN |
| Browser and responsive workflow | Role-by-role pages function at target sizes | Browser access to local preview was blocked; no screenshots captured | NOT RUN |

The Admin assignment and request-review selectors load active Designers in pages; Client selection uses server-side search. The upload/delete fallback on standalone MongoDB compensates ordinary failures, but production should use a replica set for fully transactional records. Cloudinary network upload, real signed delivery, backend restart persistence, browser/responsive behavior, and the full role-by-role workflow remain **not run** because this workspace has no `server/.env` or Cloudinary credentials. Do not create `v0.3.0` or `v0.4.0` until those checks and the required reviews pass.

The Phase 0 API contract and ADR register remain marked Proposed and awaiting Dev B/Dev C approval. Preserve that status until reviewers explicitly approve any policy decisions.
