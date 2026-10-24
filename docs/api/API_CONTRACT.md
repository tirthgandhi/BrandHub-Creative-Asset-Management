# BrandHub API contract

**Version:** Phase 0 proposal, 2026-10-24

**Base path:** `/api`

**Status:** Proposed; implementation must wait for Dev B and Dev C approval

**Owners:** Dev A (contract), endpoint phase owners listed below

This contract is the integration boundary for the client and server. It documents planned behavior; none of these application endpoints currently exists. A change requires an ADR update, affected-owner review, consumer impact notes, and tests.

## 1. Transport and shared formats

Use JSON over HTTPS except multipart uploads. Send `Content-Type: application/json` for JSON writes, `multipart/form-data` for files, and `Accept: application/json`. Authentication uses a proposed Mongo-backed server session in an HttpOnly cookie. Browser clients send credentials; unsafe cookie-authenticated methods also send `X-CSRF-Token`. Never accept a browser-supplied user ID as authorization evidence.

Single success:

```json
{"data":{"id":"6650..."}}
```

List success:

```json
{"data":[],"pagination":{"page":1,"limit":12,"total":0}}
```

Error:

```json
{"success":false,"error":{"code":"VALIDATION_ERROR","message":"Invalid request data","details":[{"field":"title","message":"Title is required"}]}}
```

| HTTP | Code | Use |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed syntax or multipart request |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Authenticated but action is disallowed |
| 403 | `PASSWORD_CHANGE_REQUIRED` | Restricted session must change initial password |
| 404 | `NOT_FOUND` | Missing resource, including non-revealing denial for private resources |
| 409 | `CONFLICT` | Duplicate, invalid concurrent transition, or stale expected version |
| 413 | `PAYLOAD_TOO_LARGE` | Upload exceeds 5 MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | File bytes are not JPEG, PNG, or WebP |
| 422 | `VALIDATION_ERROR` | Well-formed input violates field/business validation |
| 429 | `RATE_LIMITED` | Request limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server failure; response contains no secrets |

Dates are ISO-8601 UTC strings. IDs are serialized strings. Unknown body fields are rejected except public registration's `role`, which is ignored and overwritten with `client` to make the escalation rule explicit. Trim strings before validation. Escape search input used in regular expressions.

### Shared enums

- Role: `admin | designer | client`
- Asset status: `draft | in_review | changes_requested | approved`
- Project status: `active | on_hold | completed | archived` (**Proposed**, ADR-012)
- Project visibility: `private | public`
- Request status: `pending | approved | rejected | cancelled`
- Review action: `submit | approve | request_changes | revision_uploaded`
- Category: `Logo | Social Media | Website Banner | Poster | Brand Identity | Marketing Creative` (**Proposed**, ADR-013)

### Query rules

`page` is an integer >= 1. `limit` defaults to 12 and is capped at 50. `sort` uses whitelisted names and a leading `-` for descending order. Apply the caller's resource scope before search/filter/sort. Lists may accept `search`, documented enum filters, and their listed ownership filters. Asset `status` accepts a comma-separated subset; `uploadedBy=me` resolves from the session. User lists accept `role` and `isActive`. Invalid filters return 422 rather than being silently ignored.

## 2. Resource shapes and access policy

Examples below may omit timestamps, but implementations return `createdAt` and `updatedAt` where the model has them.

```json
{
  "user": {"id":"u1","name":"Asha","email":"asha@example.com","role":"client","isActive":true,"mustChangePassword":false},
  "projectMember": {"id":"p1","title":"UrbanWear Branding","description":"...","category":"Brand Identity","status":"active","visibility":"private","clientId":"u1","designerIds":["u2"]},
  "projectPublic": {"id":"p1","title":"UrbanWear Branding","description":"...","category":"Brand Identity","visibility":"public","approvedAssetCount":3,"designers":[{"id":"u2","name":"Mira"}]},
  "asset": {"id":"a1","projectId":"p1","title":"Launch post","category":"Social Media","status":"draft","currentVersion":1,"uploadedBy":{"id":"u2","name":"Mira"}},
  "projectRequest": {"id":"r1","title":"Launch campaign","description":"...","category":"Social Media","desiredDeadline":null,"status":"pending","clientId":"u1"}
}
```

Admin scopes all projects/assets. Designers scope assigned projects. Clients scope assigned private projects plus logged-in public read-only views. A public non-member receives only `projectPublic` and approved asset previews: no client identity, email, drafts, comments, review history, or private metadata. Changing visibility to private revokes project and file access immediately.

Assigned clients see `in_review`, `changes_requested`, and `approved`; they do not see `draft` (**Proposed**, ADR-009). Password-change-required sessions may call only `/auth/me`, `/auth/change-password`, and `/auth/logout`. Every authenticated request revalidates that the user is active; deactivation invalidates continued use.

## 3. Endpoint specification method

Every endpoint row below supplies all required fields: **Route** gives method and URL; **Owner/access** gives phase, authentication, roles, and resource restrictions; **Input** gives headers, path/query parameters, body schema, required fields, and validation; **Success** gives status and response example; **Errors/rules/security** gives expected errors, business rules, and security constraints; **Model/consumer** gives the related MongoDB model and frontend consumer. `JSON+session+CSRF` means the shared headers above; GET requests do not require CSRF.

### Authentication — Dev A, Phase 2

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `GET /api/auth/csrf` | P2; public session bootstrap | session cookie; no path/query/body | `200 {"data":{"csrfToken":"..."}}` | Creates a random token tied to the server-side session; authenticated writes require it in `X-CSRF-Token`; contains no identity data | Session / API client bootstrap |
| `POST /api/auth/register` | P2; public; creates Client only | JSON; body `{name,email,password,role?}`; name/email/password required; normalized unique email; password policy; supplied role ignored | `201 {"data":{"user":{"id":"u1","role":"client"}}}` | 409 duplicate, 422 invalid, 429; rate-limit and force role server-side; do not echo password | User, Session / `/register` |
| `POST /api/auth/login` | P2; public | JSON; `{email,password}` required | `200 {"data":{"user":{"id":"u1","role":"client","mustChangePassword":false}}}` plus session cookie | 401 invalid/inactive, 429; generic credential error, rotate session ID, secure password comparison | User, Session / `/login` |
| `POST /api/auth/logout` | P2; authenticated all roles | session+CSRF; no path/query/body | `204` empty | 401; invalidate server session and clear cookie; idempotent clearing allowed | Session / app logout controls |
| `GET /api/auth/me` | P2; authenticated all roles including password-change-required | session; no input | `200 {"data":{"user":{"id":"u1","role":"designer","mustChangePassword":true}}}` | 401; recheck active user on server, return no password hash | User, Session / app bootstrap/profile |
| `PATCH /api/auth/change-password` | P2; authenticated all roles | JSON+session+CSRF; `{currentPassword,newPassword}` required; new password policy and must differ | `200 {"data":{"user":{"id":"u1","mustChangePassword":false}}}` | 401, 422, 429; revoke other sessions and rotate current session; never log passwords | User, Session / first-login and settings |

### Users — Dev A, Phase 2

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `GET /api/users` | P2; Admin only | session; query `page,limit,search,role,isActive,sort`; whitelist sort | `200 {"data":[{"id":"u2","role":"designer","isActive":true}],"pagination":{"page":1,"limit":12,"total":1}}` | 401/403/422; escape search; omit hashes/session data | User / Admin Users page and assignment pickers |
| `POST /api/users` | P2; Admin only | JSON+session+CSRF; `{name,email,role,initialPassword}`; all required; role `designer|admin`; unique email/password policy | `201 {"data":{"user":{"id":"u2","role":"designer","mustChangePassword":true}}}` | 409/422; only existing Admin creates; Designers must change initial password; protect credentials | User / Admin create-user dialog |
| `GET /api/users/:id` | P2; Admin, or self | session; path `id` valid ObjectId; no query/body | `200 {"data":{"user":{"id":"u2","name":"Mira","role":"designer"}}}` | 401/403/404; non-admin gets only own profile; omit sensitive fields | User / profile and Admin user detail |
| `PATCH /api/users/:id` | P2; Admin for role/active/name; self for allowed profile fields | JSON+session+CSRF; path `id`; `{name,isActive,role}` at least one; enum/boolean validation | `200 {"data":{"user":{"id":"u2","isActive":false}}}` | 401/403/404/409/422; last active Admin cannot be demoted/deactivated; perform conditional update; revoke sessions on deactivation | User, Session / profile and Admin Users page |

### Projects — Dev B, Phase 3

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `GET /api/projects` | P3; authenticated; Admin all, Designer assigned, Client assigned plus public | session; query `page,limit,search,category,status,visibility,sort`; scoped first | `200 {"data":[{"id":"p1","title":"UrbanWear Branding"}],"pagination":{"page":1,"limit":12,"total":1}}` | 401/422; public non-members receive redacted shape; prevent client/email leakage | Project / Projects and Explore lists |
| `POST /api/projects` | P3; Admin only | JSON+session+CSRF; `{title,description,category,status?,visibility?,clientId,designerIds,startDate?,dueDate?}`; title/description/category/client required; IDs/enum/date order validated | `201 {"data":{"project":{"id":"p1","visibility":"private","status":"active"}}}` | 401/403/404/422; defaults private/active; validate active Client and Designers | Project, User / Admin project form |
| `GET /api/projects/:id` | P3; authenticated; member/Admin or public-project viewer | session; path `id`; no body | `200 {"data":{"project":{"id":"p1","title":"UrbanWear Branding"}}}` | 401/404; private denial is non-revealing; public viewer gets redacted response | Project / Project detail and Explore detail |
| `PATCH /api/projects/:id` | P3; Admin only | JSON+session+CSRF; path `id`; partial create fields; at least one; enums/IDs/dates validated | `200 {"data":{"project":{"id":"p1","visibility":"private"}}}` | 401/403/404/409/422; visibility revocation is immediate; membership changes validated | Project / Admin project editor |
| `DELETE /api/projects/:id` | P3; Admin only | session+CSRF; path `id`; optional query `mode=archive|delete`, default archive | `200 {"data":{"project":{"id":"p1","status":"archived"}}}` or `204` for approved empty hard delete | 401/403/404/409; projects with assets/history archive; conditional safe cleanup; policy Proposed ADR-002/015 | Project and dependents / Admin project controls |

### Project requests — Dev B, Phase 3

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `POST /api/project-requests` | P3; Client only | JSON+session+CSRF; `{title,description,category,desiredDeadline?}`; first three required; category/date validation | `201 {"data":{"projectRequest":{"id":"r1","status":"pending"}}}` | 401/403/409/422; max five pending per Client enforced atomically | ProjectRequest / Client request form |
| `GET /api/project-requests` | P3; Admin all, Client own; Designer forbidden | session; query `page,limit,status,category,sort`; scoped first | `200 {"data":[{"id":"r1","status":"pending"}],"pagination":{"page":1,"limit":12,"total":1}}` | 401/403/422; Client cannot select another owner | ProjectRequest / Admin queue and Client requests |
| `GET /api/project-requests/:id` | P3; Admin or owning Client | session; path `id` | `200 {"data":{"projectRequest":{"id":"r1","status":"pending"}}}` | 401/404; non-owner uses non-revealing 404 | ProjectRequest / request detail |
| `PATCH /api/project-requests/:id` | P3; Admin only | JSON+session+CSRF; path `id`; `{decision,note?,designerIds?,startDate?,dueDate?}`; decision `approve|reject`; rejection note required; approval assignments/dates validated | `200 {"data":{"projectRequest":{"id":"r1","status":"approved","projectId":"p1"},"project":{"id":"p1"}}}` | 401/403/404/409/422; pending only; approval transaction/unique link prevents duplicate projects; default private | ProjectRequest, Project / Admin request review |
| `PATCH /api/project-requests/:id/cancel` | P3; owning Client only | JSON+session+CSRF; path `id`; no body | `200 {"data":{"projectRequest":{"id":"r1","status":"cancelled"}}}` | 401/404/409; pending only; atomic status predicate | ProjectRequest / Client requests |

Allowed request transitions: `pending -> approved` (Admin), `pending -> rejected` (Admin, note required), and `pending -> cancelled` (owning Client). Terminal states do not transition.

### Assets — Dev B, Phase 4

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `GET /api/assets` | P4; authenticated and project-scoped | session; query `page,limit,search,projectId,category,status,uploadedBy,sort`; status may be comma-separated | `200 {"data":[{"id":"a1","status":"in_review","currentVersion":1}],"pagination":{"page":1,"limit":12,"total":1}}` | 401/422; scope before filters; client/public status restrictions; no storage identifiers needed by UI | Asset, Project / gallery and review queue |
| `POST /api/assets` | P4; Admin or assigned Designer | multipart+session+CSRF; fields `projectId,title,description?,category`; `file` required; actual bytes JPEG/PNG/WebP <=5 MB | `201 {"data":{"asset":{"id":"a1","status":"draft","currentVersion":1}}}` | 401/403/404/413/415/422; stream limits, magic-byte decode, sanitized metadata; delete Cloudinary upload if DB write fails | Asset, AssetRevision, Project / upload page |
| `GET /api/assets/:id` | P4; Admin/assigned Designer/assigned Client; public member only if approved | session; path `id` | `200 {"data":{"asset":{"id":"a1","status":"approved","currentVersion":2}}}` | 401/404; non-revealing scope; redact private storage fields and forbidden collaboration data | Asset / asset detail |
| `PATCH /api/assets/:id` | P4; Admin or owning Designer while permitted | JSON+session+CSRF; path `id`; `{title,description,category,expectedVersion?}` at least one; validation/optimistic check | `200 {"data":{"asset":{"id":"a1","title":"Launch post"}}}` | 401/403/404/409/422; approved-file facts immutable; approved descriptive edits follow Proposed ADR-016 and audit requirement | Asset / asset metadata editor |
| `DELETE /api/assets/:id` | P4; Admin for non-approved; owning Designer for own draft | session+CSRF; path `id` | `204` empty | 401/403/404/409; approved never deleted; coordinated cleanup of Cloudinary object and comments/bookmarks/events; retry-safe compensation | Asset and collaboration dependents / asset controls |
| `GET /api/assets/:id/file` | P4; same current access as asset/version | session; path `id`; optional query `version` positive integer | `200 {"data":{"url":"https://signed.example/...","expiresAt":"2026-10-24T12:05:00Z"}}` | 401/404/422; re-evaluate project visibility/status each call; short-lived signed authenticated URL; no permanent public URL | AssetRevision, Project / preview/download |

### Review and revisions — Dev C, Phase 5

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `POST /api/assets/:id/submit` | P5; Admin or assigned/owning Designer | JSON+session+CSRF; path `id`; `{expectedVersion}` required positive integer | `200 {"data":{"asset":{"id":"a1","status":"in_review","currentVersion":1}}}` | 401/403/404/409/422; only draft; atomic `_id/status/currentVersion`; append submit event | Asset, ReviewEvent / asset detail |
| `POST /api/assets/:id/revisions` | P5; Admin or assigned/owning Designer | multipart+session+CSRF; path `id`; fields `expectedVersion,note?`, `file` required; expectedVersion integer; JPEG/PNG/WebP <=5 MB by bytes | `201 {"data":{"asset":{"id":"a1","status":"draft","currentVersion":2},"revision":{"version":2}}}` | 401/403/404/409/413/415/422; only changes_requested; preserve old revision; atomic version increment; compensate failed storage/DB; append event | Asset, AssetRevision, ReviewEvent / revision upload |
| `GET /api/assets/:id/revisions` | P5; Admin and project members with asset access; public non-member forbidden | session; path `id`; query `page,limit,sort` | `200 {"data":[{"version":2,"note":"Adjusted color"}],"pagination":{"page":1,"limit":12,"total":2}}` | 401/403/404/422; omit storage secrets; clients only for visible asset statuses | AssetRevision / RevisionList |
| `PATCH /api/assets/:id/review` | P5; Admin or assigned Client; Designer forbidden | JSON+session+CSRF; path `id`; `{decision,expectedVersion,note?}`; decision `approve|request_changes`; note required for changes; expectedVersion integer | `200 {"data":{"asset":{"id":"a1","status":"approved","currentVersion":2},"reviewEvent":{"action":"approve","version":2}}}` | 401/403/404/409/422; only in_review; stale/multiple action -> 409; atomic conditional update and append-only event | Asset, ReviewEvent / ReviewPanel and queue |
| `GET /api/assets/:id/history` | P5; Admin and project members with asset access; public non-member forbidden | session; path `id`; query `page,limit,sort` | `200 {"data":[{"action":"approve","version":2,"actor":{"id":"u1","name":"Asha"}}],"pagination":{"page":1,"limit":12,"total":1}}` | 401/403/404/422; append-only chronological audit; redact emails | ReviewEvent / review history timeline |

Legal asset transitions are `draft -> in_review` by submit; `in_review -> approved` by approve; `in_review -> changes_requested` by request changes; and `changes_requested -> draft` by revision upload. Every mutation supplies the version under review and uses one atomic status/version predicate. Stale state returns 409 and never shows success. Approved bytes are immutable.

### Comments — Dev C, Phase 5

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `GET /api/assets/:id/comments` | P5; Admin and project members; public non-member forbidden | session; path `id`; query `page,limit,version?,sort`; version positive integer | `200 {"data":[{"id":"c1","body":"Please adjust spacing","version":1}],"pagination":{"page":1,"limit":12,"total":1}}` | 401/403/404/422; verify asset scope; redact user email | Comment / CommentsPanel |
| `POST /api/assets/:id/comments` | P5; Admin and assigned project members; public non-member forbidden | JSON+session+CSRF; path `id`; `{body,version}` required; trimmed nonblank bounded body; existing version | `201 {"data":{"comment":{"id":"c1","body":"Please adjust spacing","version":1}}}` | 401/403/404/422/429; store actor from session; sanitize output | Comment, AssetRevision / CommentsPanel composer |
| `DELETE /api/comments/:id` | P5; author or Admin | session+CSRF; path `id` | `204` empty | 401/403/404; verify comment and asset scope before delete; audit requirements to be finalized | Comment / comment controls |

### Bookmarks — Dev C, Phase 5

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `GET /api/bookmarks` | P5; authenticated all roles | session; query `page,limit,sort`; current user implicit | `200 {"data":[{"id":"b1","asset":{"id":"a1","title":"Launch post"}}],"pagination":{"page":1,"limit":12,"total":1}}` | 401/422; omit bookmarks whose assets are no longer accessible; no cross-user query | Bookmark, Asset / bookmarks page |
| `POST /api/assets/:id/bookmark` | P5; authenticated user with asset access | JSON+session+CSRF; path `id`; no body | `201 {"data":{"bookmark":{"id":"b1","assetId":"a1"}}}` | 401/404/409; unique `(userId,assetId)`; actor from session | Bookmark / BookmarkButton |
| `DELETE /api/assets/:id/bookmark` | P5; authenticated owner with asset access or existing own bookmark | session+CSRF; path `id` | `204` empty | 401/404; idempotent removal may return 204; never affect another user | Bookmark / BookmarkButton |

### Dashboard — Dev C, Phase 6

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `GET /api/dashboard/stats` | P6; authenticated; response selected by session role | session; no body; optional bounded `activityLimit` <= 20 | `200 {"data":{"stats":{"assignedProjects":2,"assetsInReview":1},"recentActivity":[]}}` | 401/422; reuse project/asset scopes; calculate real values, never accept requested role or user ID | Project, Asset, User, ProjectRequest, ReviewEvent, Comment / role dashboard and profile activity |

Admin stats: projects, active users, assets by status, pending reviews, pending requests, clients without a project. Designer stats: assigned projects, draft/changes-requested work, in-review work. Client stats: awaiting-review assets, approved count, own requests by status, and public-project count. Activity returns only events visible to the caller.

### Health — Dev A, Phase 1

| Route | Owner/access | Input | Success | Errors/rules/security | Model/consumer |
|---|---|---|---|---|---|
| `GET /api/health` | P1; public; operational metadata only | `Accept: application/json`; no path/query/body | `200 {"data":{"status":"ok","database":"connected"}}` | 503 `SERVICE_UNAVAILABLE` while DB unavailable; never expose URI, credentials, stack, versions, or host details | Mongoose connection / deployment checks and local setup |

## 4. Model contract boundaries

- `User`: normalized unique email, password hash, role, active state, must-change-password state. Historical actors remain attributable after deactivation.
- `Session`: server-side session data with expiry and user reference. Do not store bearer credentials in browser storage.
- `Project`: status/visibility/category, one Client, assigned Designers, dates. Index fields used by scopes and lists.
- `ProjectRequest`: owning Client, request data, status, decision note/actor/time, and unique nullable created-project link. Approval is transactional or otherwise atomically idempotent.
- `Asset`: project, uploader, metadata, status, current version. `AssetRevision`: immutable version metadata and protected storage identifiers.
- `ReviewEvent`: immutable asset, version, action, actor, note, and timestamp. Never rewrite history.
- `Comment`: asset, version, author, bounded body. `Bookmark`: unique compound index on user and asset.

Schemas may add internal fields but cannot rename/remove contract fields or loosen access without contract approval.

## 5. Security and operational requirements

Use centralized async error handling, validation, and shared `buildProjectScope`/`buildAssetScope` helpers. Check object access before returning related resources. Treat unauthorized private IDs as 404 where existence itself is sensitive. Rate-limit login, registration, comments, and other abuse-prone writes. Hash passwords with an approved adaptive password hash. Protect cookie-authenticated writes against CSRF, configure exact credentialed CORS, rotate sessions after authentication changes, and set production Secure/SameSite cookie flags to match the selected domain layout.

Validate uploads while streaming with an early size cap, inspect decodable file content, generate server-owned storage identifiers, and remove orphaned storage objects when persistence fails. Logs must not contain cookies, passwords, reset material, database URIs, Cloudinary secrets, signed URLs, or confidential comment/file content.

## 6. Contract reviews

### Dev A technical consistency review — completed 2026-10-24

- All listed endpoints use the shared response/error structures and consistent enums.
- Permission checks derive identity from the session and use project/asset scopes.
- Project-request approval and review transitions specify atomic conflict behavior.
- File creation/revision/deletion specify storage compensation and protected delivery.
- Remaining technical blocker: the session-store package, CSRF mechanism, transaction capability, deployment topology, and exact field length limits must be selected during Phase 1/2 without changing these behaviors.

### Cross-phase compatibility review — prepared, approvals pending

- Phase 2 must expose active-user/session enforcement used by every later owner.
- Phase 3 owns shared project scope and redacted public/member project shapes.
- Phase 4 owns shared asset scope, versions, and protected file delivery consumed by Phase 5.
- Phase 5 must use Phase 4's atomic version and access helpers; Phase 6 must reuse Phase 3/4 scopes for counts.
- Dev B review is required for Projects, Project Requests, Assets, deletion, and public visibility.
- Dev C review is required for review events, revisions, comments, bookmarks, dashboard consumers, and approved metadata edits.

Unresolved items are tracked in `docs/decisions.md`. Until Dev B and Dev C record approval, this contract is **Proposed** and the Phase 0 gate remains **Waiting Review**.
