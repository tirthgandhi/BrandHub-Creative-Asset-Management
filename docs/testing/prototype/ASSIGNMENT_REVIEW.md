# BrandHub: submission review

**25 October 2026 · Prototype implementation**

## Delivered

- Former Admin is now a stored **Project Manager** role. Existing accounts were migrated in Atlas and old sessions invalidated.
- **One Super Admin** was created. A unique database index prevents a second; it cannot be demoted/deactivated through account controls. Only it can create/manage Project Managers.
- Project Manager, Designer and Super Admin dashboards now include design-stage bars, approval progress, project health and scoped workload/next actions. Values come from MongoDB; no chart data is fabricated.
- Client requests include contact name, email, phone, company and an INR project amount. Management sees the same saved details.
- Dummy checkout becomes available to the owning Client after approval. It supports simulated UPI/card/bank payment and declined-payment testing. A successful receipt survives reload and is visible to management. No real financial details or money are involved.

## Assignment compliance

**All 11 listed functional requirements are implemented.** [Read the feature-by-feature checklist and demonstration guide](../../ASSIGNMENT_COMPLIANCE.md).

| Requirement | Implementation |
| --- | --- |
| Home | Public landing and role dashboards |
| Listing/details | Projects and design lists with individual detail pages |
| Create/update | Briefs, manager project edits, designer draft edits and revisions |
| Delete own content | Designer's own draft/media deletion; own comment deletion |
| Interaction | Comments, bookmarks, approval and change requests |
| Search/filter | Projects, designs, team users and media |
| Profile | Name, email, readable role, avatar and recent activity |
| API | Express endpoints connected to the React client |
| Persistence | Atlas records, sessions, revisions and GridFS uploads |
| Validation/errors | Request schemas, form errors, loading/empty states and authorization |
| Responsive UI | Mobile navigation, forms, charts, contact cards and checkout |

## Verification results

| Check | Result |
| --- | --- |
| Full backend suite for role hierarchy and existing workflows | 62 passed |
| New payment tests | 2 passed |
| Existing project tests rerun after payment changes | 4 passed |
| Distinct backend tests covered | 64 |
| Client regression tests | 17 passed |
| Distinct automated tests covered | 81 |
| Production client build | Passed |
| Client and server lint | Passed |
| Chart UI checks | Project Manager, Designer and Super Admin passed |
| Existing interactive UI checks | 7 passed, including searches and client isolation |
| New contact/payment UI checks | 7 passed |

The chart audit compares visible stage counts against the live API, checks that project-health links apply the right filter, verifies that Designer responses contain no team workload, tests the Super Admin-only route, and checks mobile overflow.

The payment audit creates a fictional Atlas brief through the actual Client form, approves it through the Project Manager UI, assigns Nisha Verma, simulates a declined payment, completes demo checkout, reloads the receipt and checks manager/mobile presentation.

The backend tests cover request validation, exact conversion to paise, declined payments remaining unpaid, owner/role restrictions, approved-only checkout, rejection of amount tampering and idempotent receipts. The existing suite covers project scope, role escalation, CSRF, GridFS bytes/ranges, revisions, review transitions and database persistence.

A repeated broad browser-route matrix was interrupted by local request limits and machine resource pressure; that expanded run is not counted as completed. The focused current chart, interaction and payment checks above passed. An isolated local test API and serial database suites were added so repeated tests do not change the normal application's default limits or start many temporary databases together.

## Saved demo and access

Paid request: `6add960439eb7d48aee9a863`
Receipt: `DEMO-E18679D3`
Amount: **INR 12,500.50**

All four demo accounts use **Brand123**.

| Role | Email |
| --- | --- |
| Super Admin | superadmin@brandhub.example |
| Project Manager | admin@brandhub.example |
| Designer | nisha.verma@brandhub.example |
| Client | iris.vale@brandhub.example |

## Evidence

- [Project Manager charts](role-audit/project_manager-analytics.png)
- [Designer charts](role-audit/designer-analytics.png)
- [Super Admin charts](role-audit/super_admin-analytics.png)
- [Client payment receipt](role-audit/client-payment.png)
- [Manager contact and payment view](role-audit/manager-payment.png)
- [Mobile receipt](role-audit/payment-mobile.png)
- [Chart results](role-audit/analytics-results.json)
- [Payment results](role-audit/payment-results.json)
- [Interaction results](role-audit/interaction-results.json)

## Submission scope

This is a working local prototype. Email delivery remains unconfigured and no deployed Vercel URL was tested. GitHub push remains pending the earlier explicit destination/branch approval. The submission package excludes local secrets and installed dependencies; use the README to configure environment variables on another machine.

## Final upload, report and landing update

- Exactly two pending demo client requests were verified in Atlas. There were no older pending requests remaining to approve. Two pending demonstration briefs were created without altering approved work.
- Photo and video uploads remain supported. Project file uploads now also accept PDF, DOCX, XLSX, PPTX, TXT, CSV and ZIP, with validation, GridFS storage and authenticated document downloads. Unsupported executable formats are rejected.
- All-role account menus now provide profile, projects, settings, password change, role-specific actions and logout. Only management sees PDF reports.
- Reports support a year and optional month, use database records created in that period, and include the BrandHub logo, period heading and page numbers. October 2026 reports were generated and all five Project Manager pages plus the Super Admin opening page were visually inspected.
- The final media/report backend suite passed five tests, including image/video, document bytes, attachment delivery and report role checks. The production build passed.
- Landing hero and gallery now use twenty distinct local supplied-media visuals; provided videos open as playable films in the gallery. Repeated campaign artwork in supporting sections was replaced with typography.

## Landing-card correction

The decorative empty frames were replaced with three real supplied photographs, complete workflow cards and distinct editorial images. Hero, vision, showcase and editorial use 25 distinct source visuals. Build, lint and all 17 client tests passed.
