# BrandHub prototype: UI and test report

**Date:** 25 October 2026
**Result:** PASS for the checks listed below. No unresolved failures in this tested scope.
**Purpose:** A simple demonstrable prototype with strict role access.

## Delivered

- Separate Client, Designer, and Admin login choices with a visible selected state, role description, role-specific sign-in button, and demo autofill.
- Login role is checked against the saved database account before a session is established. Choosing Admin cannot promote an account.
- Diagonal BrandHub background on authentication and workspace pages. Decorative lettering does not intercept clicks and is hidden from screen readers.
- Refined glass cards, stronger text contrast, clearer fields, consistent spacing, readable empty states, and a shorter dashboard feed with Show more.
- Client creative uploads are blocked at both the route and API layers. Clients retain project requests, review, comments, and approval for their own work.
- Explicit dashboard index route, role-aware login redirects, an Explore redirect to allocated projects, and a proper unknown-page fallback.
- New `config/`, `types/`, and `components/branding/` responsibilities, a dedicated visual stylesheet, repeatable browser audits, and a project structure guide.

## Test results

| Check | Result |
| --- | --- |
| Backend tests | 58 passed, 0 failed |
| Client regression tests | 15 passed, 0 failed |
| Total automated unit/integration tests | 73 passed |
| Browser page-route checks | 52 passed |
| Browser blocked-access checks | 11 passed |
| Interactive frontend/API checks | 7 passed |
| Login theme checks | Morning, Afternoon, Sunset, Night |
| Workspace theme checks | All four themes for each of three roles |
| Desktop viewport | 1440 × 1000 |
| Mobile viewport | 390 × 844 |
| Page JavaScript errors | 0 |
| Browser API observations | 260 successful 200 responses; 6 expected pre-login 401 responses |
| Browser API server errors | 0 |
| Layout checks | No horizontal overflow in tested page/viewport combinations |
| Production bundle | Passed |
| Client and server lint | Passed |

### Route coverage

The browser audit loaded actual pages and checked loading completion, absence of visible error alerts, and horizontal layout. It also checked mobile navigation and saved desktop/mobile screenshots for each role.

| Session | Page checks |
| --- | --- |
| Guest | 5 |
| Admin | 18 |
| Client | 15 |
| Designer | 14 |

Coverage includes dashboard, project list/detail, design list/detail, media, reviews, bookmarks, profile, settings, password change, client request pages, admin user/request pages, admin project create/edit, and designer upload pages. Guest checks include signup, password recovery/reset notices, email verification notice, unknown route, and protected-route redirection.

Blocked browser routes include client access to user administration, request administration, project creation, and creative uploads; designer access to administration and client request creation; and admin access to client request creation.

### Interactive checks

- Empty login shows an actionable error.
- Wrong role login returns 403 and stays on login.
- Admin user search returns the matching client.
- Admin combined search and role filter handles empty results.
- Project search and clear filters update the list.
- Client media gallery hides the upload action.
- Client project API contains only the signed-in client allocation.

### Backend permission and workflow checks

- All six incorrect combinations of account role and selected login role return **403 ROLE_MISMATCH** and establish no session. An unknown role value returns **422**.
- Anonymous requests to each protected resource family return **401**.
- Admin-only user management, project changes, and storage usage are denied to other roles.
- Public signup cannot create an admin. Accounts cannot promote themselves. Deactivated accounts lose access. New designers must change their initial password.
- Clients see only their projects and submitted design work. Changing a different client's project to public does not grant access to that client.
- Client media upload, edit, and delete requests return **403**. Frontend upload controls are hidden for clients.
- Complete lifecycle passed: client brief; admin accepts and assigns designer; designer uploads and submits version 1; client requests changes; designer uploads version 2; client approves.
- The real GridFS regression checks downloaded file bytes against the uploaded bytes, preserves two revisions and five ordered review events, verifies admin visibility, and denies unrelated clients and anonymous downloads.
- Existing suites also cover CSRF, request validation, duplicate/conflicting transitions, file validation, video byte ranges, upload cleanup, and scoped dashboards.

Backend integration tests use temporary MongoDB instances. Browser checks use the existing Atlas demo and its saved approved workflow example. The previously verified Atlas example remains project `6add888278e3d9dfb61c8d40`, asset `6add888378e3d9dfb61c8d41`.

## UI review

The login and dashboard screenshots were visually inspected. Labels remain distinct from the background; selected roles are clear; content does not overlap the diagonal branding. The mobile login and role dashboards fit the tested viewport.

Measured login secondary-text contrast is approximately **6.72:1** for Morning and **8.62:1** for the three dark card themes, using a conservative white backing beneath the translucent card. This is a focused text check, not a complete accessibility certification.

- [Morning login](role-audit/login-morning.png)
- [Night login](role-audit/login-night.png)
- [Mobile login](role-audit/login-mobile.png)
- [Admin dashboard](role-audit/admin-dashboard.png)
- [Client dashboard](role-audit/client-dashboard.png)
- [Designer dashboard](role-audit/designer-dashboard.png)

## Issues found and corrected

| Finding | Resolution |
| --- | --- |
| Login roles were hidden inside a demo-account disclosure | Replaced with three persistent, labeled role choices |
| The selected login role was not verified by the API | Validated it against the stored role before session creation |
| Clients could reach media upload | Added frontend route and backend mutation role restrictions; hid upload controls |
| `/app` had no explicit default page | Added dashboard index redirect |
| Old Explore route conflicted with client isolation | Redirected it to allocated projects |
| Login could return a user to a route intended for another role | Added role-aware destination checks |
| Transparent surfaces and theme-specific heading colors could blend | Added readable card surfaces and corrected final theme overrides |
| Dashboard displayed an unnecessarily long media feed | Added six-item preview and Show more |
| A password-change regression appeared during implementation | Corrected it; password-change integration test passes |

A browser test initially expected the dashboard after every login. The app correctly restored the permitted Projects page, so the test expectation was corrected and rerun successfully.

## Role policy

| Action | Admin | Designer | Client |
| --- | --- | --- | --- |
| View projects | All | Assigned | Own only |
| Create, assign or edit a project | Yes | No | No |
| Send a project brief | No | No | Yes |
| Accept a brief | Yes | No | No |
| Upload creative files | Yes | Assigned projects | No |
| Approve or request changes | Yes | No | Own projects |
| Inspect review history | All | Assigned | Own submitted work |
| Manage users | Yes | No | No |

## Demo access

Password for all three: **Brand123**.

| Role | Email |
| --- | --- |
| Admin | admin@brandhub.example |
| Client | iris.vale@brandhub.example |
| Designer | nisha.verma@brandhub.example |

## Files and repeatable checks

- [Project structure guide](../../PROJECT_STRUCTURE.md)
- [Browser route results](role-audit/browser-results.json)
- [Interactive results](role-audit/interaction-results.json)
- Browser audits: `client/tests/browser/role-audit.mjs` and `interaction-audit.mjs`
- Role regressions: `server/tests/roleAccess.test.js` and `client/tests/access.test.mjs`

Run `npm run lint`, `npm run build`, and `npm test`. With the local API and frontend running, run the browser scripts from the repository root. They accept `BRANDHUB_TEST_URL` and `BRANDHUB_BROWSER` environment variables.

## Practical limits

Email delivery is not configured; recovery and verification pages clearly show that limitation. No deployed Vercel URL was tested. The checks cover the stated prototype workflows and routes, rather than every possible input, browser, or load condition. GitHub publishing remains pending the earlier destination/branch approval; no push or deployment was performed for this update.
