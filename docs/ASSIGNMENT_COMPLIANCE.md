# Internship assignment: feature compliance

**BrandHub meets all 11 listed functional requirements as a prototype.** The assignment asks for these behaviors across the application; every role does not need the same permissions. Project Managers handle allocation, Designers create work, and Clients review their own work. A single Super Admin manages privileged accounts.

| # | Requirement | How BrandHub meets it | Where to demonstrate |
| --- | --- | --- | --- |
| 1 | Home page | Public landing page introduces the application; authenticated dashboards show projects, media and role-specific tasks. | `/` and `/app/dashboard` |
| 2 | Listing and details | Project and design lists open individual records. Media lists show photos/videos. | `/app/projects` then select a project; `/app/assets` then select a design |
| 3 | Create and update | Client submits a brief; Project Manager accepts and assigns; Designer creates a design, edits its metadata and uploads revisions. | `/app/requests/new`, project edit and design detail pages |
| 4 | Delete own content | Designer can delete their own draft design or unapproved uploaded media. Users can delete their own comments. Approved records are deliberately protected. | Upload a draft as Designer, open its detail page, then Delete; or delete your own comment |
| 5 | Interaction | Users comment on versions and bookmark designs. Clients approve or request changes on submitted work. | Design detail page and `/app/bookmarks` |
| 6 | Search/filtering | Projects and designs support search, category/status filters and sorting; management can search team accounts; media supports project/category/content filters. | `/app/projects`, `/app/assets`, `/app/media`, `/app/management/users` |
| 7 | User profile | Profile displays name, email, readable role, avatar and recent review activity; users edit name/avatar. | `/app/profile` |
| 8 | Backend API | React calls Express routes for sessions, accounts, projects, briefs, designs, revisions, comments, bookmarks, media and dashboard statistics. | `/api/auth/*`, `/api/projects`, `/api/assets`, `/api/media`, `/api/dashboard/stats` |
| 9 | Database persistence | MongoDB Atlas stores accounts, project records, requests, versions, comments, bookmarks and review events. New uploaded file bytes are stored in GridFS; supplied demo media remains in Git as local static files. | Reload a project or design; sign out and back in; inspect the saved approved workflow |
| 10 | Validation/errors | Server schemas validate requests; forms show useful errors; role and membership checks reject unauthorized requests; loading, empty and failed-request states are present. | Wrong role login, empty login, no-match search, unauthorized page or invalid upload |
| 11 | Responsive UI | Login, navigation, cards, charts, forms and galleries adapt to desktop/mobile; mobile navigation has a menu and closes after navigation. | Desktop and 390px mobile browser checks and screenshots |

## Role hierarchy

| Role | Responsibility | Restrictions |
| --- | --- | --- |
| Super Admin | Workspace overview, all projects and reviews, all users, creation of Project Managers | Exactly one is enforced by a unique partial database index; it cannot be demoted/deactivated or granted from the UI |
| Project Manager | Accept briefs, create/edit projects, assign Designers, review work, manage basic Client/Designer accounts | Cannot create/promote Project Managers or inspect/change Super Admin and other privileged accounts |
| Designer | Assigned projects, uploads, draft editing/deletion, revisions, comments and bookmarks | Cannot administer accounts, accept client briefs or approve their own designs |
| Client | Submit briefs, view own projects, comment, bookmark, request changes and approve | Cannot browse another client's projects, upload creative deliverables or allocate work |

The former `admin` database role has been migrated to `project_manager`; it is not just a display-label change. Existing `/app/admin/*` URLs redirect to `/app/management/*`. Privileged user administration has a dedicated `/app/super-admin/users` route.

## New visualizations

Project Manager, Designer and Super Admin dashboards show:

- **Design pipeline:** counts and clickable bars for Draft, In review, Needs revision and Approved.
- **Approval progress:** a ring chart and exact approved/total counts.
- **Project health:** Active, On hold, Completed and Archived counts, linked to project filters.
- **Designer workload** for management: active project assignment counts by Designer.
- **Your next steps** for Designers: revision and draft counts with direct actions.

Charts use the dashboard API's scoped database data. Designers receive no team-wide workload data. Zero records show honest zero/empty states; there are no fabricated chart values. Counts and labels accompany color so the charts remain understandable without relying on color alone.

## Suggested demonstration

1. Open Home, then log in as Client and show only that client's projects.
2. Submit a project brief with a description.
3. Log in as Project Manager, accept the brief and assign a Designer.
4. Log in as Designer, show the charts, upload a draft, edit it and submit for review.
5. Log in as Client, comment, bookmark and request changes.
6. Upload version 2 as Designer, resubmit and approve as Client.
7. Show both versions and the review history as Project Manager.
8. Create a separate draft and delete it to demonstrate the own-content delete requirement.
9. Show search/filters, profile and mobile layout.
10. Log in as Super Admin and show privileged user management; attempt that route as Project Manager to demonstrate denial.

## Demo accounts

All demo accounts use **Brand123**.

| Role | Email |
| --- | --- |
| Super Admin | superadmin@brandhub.example |
| Project Manager | admin@brandhub.example |
| Designer | nisha.verma@brandhub.example |
| Client | iris.vale@brandhub.example |

The Project Manager retains the existing email so previous demo credentials continue to work. The login selector and profile show the new role name.

## Prototype limits

Email recovery/verification delivery is not configured and its screens say so. No deployed Vercel URL has been tested. These do not prevent the 11 listed core behaviors from being demonstrated locally. This compliance assessment is based on the supplied guidelines and verified implementation; final evaluation remains with the assignment reviewer.

## Contact details, proposed amount and dummy checkout

Client briefs now include contact name, email, phone, company, and an INR project amount. Project Manager and Super Admin see these on request cards. Manager approval makes demo checkout available to the owning Client. The Client selects a simulated UPI, card, or bank method; a declined simulation leaves the request unpaid; success stores a DEMO receipt and exact amount in MongoDB. Managers can inspect the paid status and receipt after reload. No real financial details are collected and no payment provider is called.

Payment is approved-request-only and owner-only. The server determines the amount from the saved request, rejects amount tampering, and returns the same receipt on retry. Legacy requests without a budget remain readable and cannot be paid until an amount exists.
