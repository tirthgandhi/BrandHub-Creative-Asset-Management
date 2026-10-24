# BrandHub architecture decision register

**Date opened:** 2026-10-24

**Owner:** Dev A

**Approval gate:** Dev A sign-off plus Dev B and Dev C approval

This register separates recommendations from approved choices. The final phase plan locks several product requirements, but the Phase 0 team approval required by the execution prompt is still outstanding. Consequently every implementation-affecting record remains **Proposed** or **Deferred**; no row should be read as team approval until both reviewer columns name an approver and date.

| ID | Question | Options considered | Recommended choice | Final choice | Reason | Date | Owner | Dev B approval | Dev C approval | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| ADR-001 | Can clients self-register? | Admin-only creation; open role selection; client-only registration | Permit self-registration and force `client` server-side; rate-limit registration | Pending review | Matches the locked product rule and prevents role injection | 2026-10-24 | Dev A | Pending | Pending | Proposed |
| ADR-002 | What does project deletion do? | Hard delete; archive; conditional hard delete | Archive projects that have assets; allow hard delete only for an empty project if the owner phase proves cleanup | Pending review | Preserves history and avoids orphaned collaboration records | 2026-10-24 | Dev A | Pending | Pending | Proposed |
| ADR-003 | How are uploaded files protected? | Public URLs; authenticated Cloudinary assets; proxy all bytes through API | Private/authenticated Cloudinary delivery; issue short-lived signed URLs only after API access checks | Pending review | Confidential assets must not have durable public URLs | 2026-10-24 | Dev A | Pending | Pending | Proposed |
| ADR-004 | How is review history stored? | Mutate asset only; embedded mutable array; append-only events | Append-only `ReviewEvent` records plus current state on `Asset` | Pending review | Supports auditability, version history, and concurrency diagnosis | 2026-10-24 | Dev A | Pending | Pending | Proposed |
| ADR-005 | Where is the frontend hosted? | Vercel; Netlify; Render/static host; other | Choose during release planning after cookie/domain and SPA-rewrite proof | Not selected | Hosting requirements and accounts are not yet available | 2026-10-24 | Dev C | Pending | Pending | Deferred |
| ADR-006 | Where is the backend hosted? | Render; Railway; Fly.io; other | Choose during Phase 2 deployment skeleton work based on persistent sessions, proxy, region, and sleep behavior | Not selected | A provider choice without deployment constraints would be invented | 2026-10-24 | Dev A | Pending | Pending | Deferred |
| ADR-007 | Where is MongoDB hosted? | Local only; MongoDB Atlas; provider database | Atlas for shared/non-local environments; local MongoDB allowed for development | Pending review | Atlas matches the plan and supports managed persistence; access controls still need configuration | 2026-10-24 | Dev A | Pending | Pending | Proposed |
| ADR-008 | What is the priority for revision comparison? | Side-by-side visual diff; version list/open; automated pixel diff | Ship reliable revision list and single-version viewing first; side-by-side comparison after the core review flow | Pending review | Keeps Phase 5 focused on correct state/history; rich comparison is optional polish | 2026-10-24 | Dev C | Pending | Pending | Proposed |
| ADR-009 | Can an assigned client see Draft assets? | Yes; opt-in; no | No. Assigned clients see `in_review`, `changes_requested`, and `approved` only | Pending review | Prevents accidental exposure of unfinished work and matches the plan recommendation | 2026-10-24 | Dev A | Pending | Pending | Proposed |
| ADR-010 | What does public project visibility mean? | Anonymous; authenticated read-only; full collaboration | Logged-in read-only discovery with a redacted project shape and approved assets only | Pending review | Enables exploration without leaking client, draft, comment, or review data | 2026-10-24 | Dev B | Pending | Pending | Proposed |
| ADR-011 | How are sessions authenticated? | Bearer JWT; browser JWT storage; Mongo-backed server sessions | Mongo-backed server sessions in HttpOnly cookies with CSRF protection, strict credentialed CORS, and server-side active-user checks | Pending review | Supports immediate deactivation and avoids exposing tokens to browser JavaScript | 2026-10-24 | Dev A | Pending | Pending | Proposed |
| ADR-012 | Which project statuses are shared? | Free text; reduced set; `active/on_hold/completed/archived` | Use `active`, `on_hold`, `completed`, `archived` | Pending review | A small enum supports consistent filters and keeps deletion separate from lifecycle | 2026-10-24 | Dev B | Pending | Pending | Proposed |
| ADR-013 | Which asset/project categories are shared? | Per-module labels; admin-defined taxonomy; fixed initial enum | Start with Logo, Social Media, Website Banner, Poster, Brand Identity, Marketing Creative | Pending review | Matches the phase plan and prevents incompatible labels across APIs | 2026-10-24 | Dev B | Pending | Pending | Proposed |
| ADR-014 | When may an asset be deleted? | Always; soft delete; role/status rules | Designer may delete own Draft; Admin may delete non-Approved; Approved cannot be deleted; clean related records and Cloudinary file safely | Pending review | Protects final work and states ownership explicitly | 2026-10-24 | Dev B | Pending | Pending | Proposed |
| ADR-015 | Are projects ever hard-deleted? | Always; never; only when empty | Default to archive; permit hard delete only when no assets/collaboration records exist and cleanup is transactionally safe | Pending review | Preserves references and audit history | 2026-10-24 | Dev B | Pending | Pending | Proposed |
| ADR-016 | Can Approved asset metadata be edited? | Fully editable; immutable; limited audited edits | File, version, project, and approval facts are immutable; Admin may correct descriptive title/category only through an audited operation | Pending review | Preserves approval meaning while allowing harmless catalog corrections | 2026-10-24 | Dev B/Dev C | Pending | Pending | Proposed |

## Required review notes

Dev B should validate project/request/asset ownership, category and lifecycle choices, deletion cleanup, and the member/public response boundary. Dev C should validate ReviewEvent fields, review transitions, approved-metadata audit behavior, comments/bookmarks visibility, and dashboard consumers. Both reviewers should confirm that the chosen session and file-delivery strategies support their phases before any implementation merges.

Any changed decision must update `docs/api/API_CONTRACT.md` in the same pull request and list affected models, endpoints, frontend consumers, tests, and phase owners.

## Interim Phase 1–2 main milestone

The execution request proposes merging the completed Phase 1–2 foundation from `develop` to `main` before Phase 7. This remains **Proposed** on 2026-10-24. Dev A is the owner; Dev B and Dev C approvals are required. The merge must occur through a reviewed pull request after both phase gates pass and must not be performed by direct push.
