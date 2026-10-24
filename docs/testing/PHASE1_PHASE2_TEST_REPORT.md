# Phase 1 and Phase 2 test report

**Date:** 2026-10-24 (Asia/Calcutta)  
**Owner:** Dev A  
**Scope:** Foundation; authentication, users, and roles

## Automated results

| Command | Expected | Actual | Result | Corrective action |
|---|---|---|---|---|
| `npm run lint --workspace server` | No ESLint errors | Passed | PASS | None |
| `npm run test --workspace server` | Foundation and authentication integration tests pass against an isolated database | 14/14 passed | PASS | Pinned the harness to MongoDB 7.0.14 after the newer binary download lost network access |
| `npm run lint --workspace client` | No ESLint errors or warnings | Passed | PASS | Marked mixed provider and hook modules for the Fast Refresh lint rule |
| `npm run typecheck --workspace client` | No TypeScript errors | Passed | PASS | Added Vite environment types during Phase 1 |
| `npm run test --workspace client` | Landing regression tests pass | 12/12 passed | PASS | None |
| `npm run build --workspace client` | Production bundle succeeds | 1,687 modules transformed | PASS | None |
| `node scripts/browser_qa.mjs` | No dashboard/user-page overflow or post-login console errors at required widths | 375, 768, 1024, 1440 all clean | PASS | Increased user-card stacking breakpoint and corrected compact heading letter spacing after the first pass found a 1024 px overflow and visual overlap |

The initial sandboxed Supertest run failed with loopback `EACCES`; the identical suite passed when allowed to open local test ports. The first MongoDB-memory run failed because `fastdl.mongodb.org` became unreachable during a 7.0.24 download. No product test failed: the suite was rerun with MongoDB 7.0.14 and passed.

## Backend coverage

Verified directly through Supertest and Mongoose:

- Safe health response, exact-origin credentialed CORS, environment validation, and standard 404 error shape.
- Client self-registration, server-forced Client role, injected Admin-role prevention, and password-hash exclusion.
- Duplicate email, malformed email, weak password, valid/invalid login, and inactive-account rejection.
- Mongo-backed session behavior, CSRF rejection, logout invalidation, and active-user revalidation.
- Anonymous and non-Admin denial for user APIs.
- Admin-created Designer, forced password-change gate, successful password change, and new-password login.
- Self-role escalation prevention, last-active-Admin protection, session invalidation after deactivation, and auth rate limiting.

## Browser integration scenarios

Executed against the real Vite client at `http://127.0.0.1:5173` and the Express preview API at `http://127.0.0.1:5000/api`, backed by a disposable MongoDB instance.

| Scenario | Evidence | Result |
|---|---|---|
| Visitor registers as Client and reaches Client dashboard | Submitted the mobile registration form and captured the resulting dashboard | PASS |
| Admin logs in and creates Designer | Created `designer@brandhub.demo`; user list showed Designer and password-change-required state | PASS |
| Designer is forced to password-change screen | Logged in with the generated initial password and reached only the required change screen | PASS |
| Password change completes | Supertest integration flow changed password and logged in with the replacement | PASS (API); browser submission not performed because browser automation policy requires user handoff for credential changes |
| Client attempts Admin page | API authorization test returns 403; client navigation excludes Admin Users | PASS |
| Light/Dark/System persistence | Explicit Dark selection survived reload; automated exact-width run covered Light and Dark; source listener covers System OS changes | PASS |
| Logout blocks protected access | Mobile drawer logout returned to login; API session then returned 401 | PASS |
| Deactivation blocks existing session | Direct integration test increments auth version and `/auth/me` returns 401 | PASS |
| Authenticated nested-route refresh | `/app/admin/users` reload retained the Admin session after local same-origin proxy fix | PASS |

## Responsive and accessibility QA

The automated browser runner used installed Microsoft Edge with real viewports and reduced motion:

| Width | Dashboard overflow | User page overflow | Post-login console errors |
|---:|---|---|---|
| 375 | No | No | None |
| 768 | No | No | None |
| 1024 | No | No | None |
| 1440 | No | No | None |

Manual browser checks confirmed labeled fields, visible keyboard focus, mobile drawer open/close and Escape behavior, touch-sized controls, responsive user cards, readable errors, and theme persistence. Dialog focus trapping and Escape handling are implemented in the shared confirmation modal. Reduced-motion CSS disables application animations.

Screenshots and machine-readable results are stored in `docs/screenshots/`. They are real local renders, not mockups.

## Deployment status

Local production-like integration passed. MongoDB Atlas and public hosting were **not tested** because credentials and hosting permissions were not supplied. `docs/deployment/PHASE2_DEPLOYMENT.md` records the exact remaining deployment checks.

Final preview health check returned `{"data":{"status":"ok","database":"connected"}}` and the client root returned HTTP 200 on 2026-10-24.
