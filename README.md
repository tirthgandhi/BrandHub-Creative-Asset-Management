<div align="center">

# 🎨 BrandHub

### Digital Asset Management & Creative Collaboration Platform

**One creative workspace. From first draft to final approval.**

![Status](https://img.shields.io/badge/Status-In%20Development-675CF5?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-MERN-0D9488?style=for-the-badge)
![React](https://img.shields.io/badge/React-Vite-149ECA?style=for-the-badge&logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-111827?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)


**[Overview](#-overview) · [Workflow](#-how-brandhub-works) · [Roles](#-user-roles--permissions) · [Features](#-core-features) · [Architecture](#-system-architecture) · [Data Models](#-database-design) · [API](#-api-reference-planned) · [Setup](#-getting-started) · [Assignment](#-internship-assignment-compliance)**

> **Project context:** Proposed full-stack technical assignment project inspired by the workflows of a digital creative agency. This is an independent portfolio project and is **not** an official Rewamp Digital application.

</div>

---

## 🔄 How BrandHub Works

BrandHub connects **agency administrators**, **designers**, and **clients** in one review-and-approval workflow.

```text
ADMIN creates a branding project
             |
             v
ADMIN assigns the designer and client
             |
             v
DESIGNER uploads a creative asset
             |
             v
DESIGNER submits the asset for review
             |
             v
CLIENT previews the asset and comments
             |
             v
       CLIENT DECISION
          /      \
         /        \
 REQUEST CHANGES   APPROVE
       |              |
       v              v
 Designer reads    Asset marked
 feedback          APPROVED
       |              |
       v              v
 Upload revision   Authorized users
       |           access final asset
       +----> Resubmit for review
```

**Example:** For a fictional *UrbanWear* branding project, an admin creates the project and assigns a designer and client. The designer uploads a logo; the client requests a color change; the designer uploads a new revision; and the client approves the finished logo. Comments, versions, and approval status remain associated with the project.

### Asset status lifecycle

`Draft` → `In Review` → **Approved**

`In Review` → `Changes Requested` → `In Review` → **Approved**

Only authorized reviewers may approve or request changes. Approved files cannot be silently overwritten; revisions create new versions.

---

## 📌 Overview

**BrandHub** is a planned full-stack web platform for organizing design deliverables, managing creative projects, discussing individual assets, and streamlining client approvals. It is designed around the practical needs of branding, marketing, and web-development teams.

### The problem

Creative projects often distribute files and feedback across email, chat, and local folders. This makes it hard to identify the latest version, keep feedback together, maintain client access boundaries, and confirm final approval.

### The solution

- **Centralized projects** with assigned clients and designers.
- **Searchable asset library** for logos, banners, and social graphics.
- **Image upload and preview** with cloud-based file storage.
- **Threaded-by-asset feedback** through comments.
- **Review and approval** using explicitly defined statuses.
- **Version tracking** so revisions do not erase previously submitted work.
- **Role-based dashboards** and secure, project-scoped access.

> **Implementation status:** This README is a **development specification and project plan**. Described features, routes, and folder paths are targets; they should be marked complete only after implementation and testing. Replace this note and the status badge with verified implementation details when ready to submit.

---

## 👥 User Roles & Permissions

### 🛡️ Admin / Project Manager

Responsible for organizing work and managing access.

- Manage designers and client accounts.
- Create, update, archive, and view projects.
- Assign designers and a client to each project.
- View project assets, comments, and review activity.
- Review delivery progress and project status.

### 🎨 Designer / Creative Team Member

Responsible for producing and revising design work.

- View projects assigned to their account.
- Upload assets with title, description, tags, and category.
- Edit permitted draft assets and submit assets for review.
- Read client feedback and upload revised versions.
- Delete their own permitted drafts.
- View status of submitted and approved assets.

### 🤝 Client

Responsible for reviewing work delivered for their project.

- View **only** projects and assets explicitly assigned to their account.
- Preview images and read asset information.
- Comment on submitted designs and bookmark assets.
- Approve an asset or request changes with feedback.
- View approved design versions and profile activity.

### Permission matrix

| Capability | Admin | Designer | Client |
|---|:---:|:---:|:---:|
| Manage users | ✅ | ❌ | ❌ |
| Create and assign projects | ✅ | ❌ | ❌ |
| View assigned projects | ✅ | ✅ | ✅ |
| Upload asset | ✅ | ✅ Assigned only | ❌ |
| Edit asset metadata | ✅ | ✅ Own permitted assets | ❌ |
| Delete asset | ✅ | ✅ Own drafts only | ❌ |
| Comment on accessible asset | ✅ | ✅ | ✅ |
| Bookmark accessible asset | ✅ | ✅ | ✅ |
| Submit asset for review | ✅ | ✅ Assigned only | ❌ |
| Approve/request changes | ✅ | ❌ | ✅ Assigned only |
| View project dashboard | ✅ | ✅ Scoped | ✅ Scoped |

**Security rule:** The backend enforces all permissions; hiding a UI button does not secure an API.

---

## ✨ Core Features

| Module | Planned functionality |
|---|---|
| Authentication | Login, logout, secure password hashes, protected routes, role-based authorization |
| Project management | Create, list, view, edit, archive projects; client/designer assignment |
| Asset management | Upload, preview, update metadata, delete permitted assets |
| Asset organization | Category, tags, project grouping, pagination, search and filters |
| Collaboration | Per-asset comments; personalized bookmarks |
| Client review | Submit for review, request changes with feedback, approve design |
| Version history | Store each revised file and associate it with an asset |
| User profile | Profile information, associated assets, comments, and saved designs |
| Dashboards | Role-specific counters and recent activity |
| Quality & UX | Responsive interface, validation, loading indicators, error and empty states |

### Out of scope for the first release

AI-generated tags, real-time WebSockets, payments, complex analytics, bulk upload, and support for all source-design formats. These may be considered after the core assignment is complete.

---

## 🧭 Main Pages & Navigation

| Route | Page | Access |
|---|---|---|
| `/` | Landing / product overview | Public |
| `/login` | Login | Public |
| `/dashboard` | Role-specific dashboard | Authenticated |
| `/projects` | Accessible project listing | Authenticated |
| `/projects/new` | Create project | Admin |
| `/projects/:id` | Project details and associated assets | Project members / admin |
| `/assets` | Searchable asset gallery | Authenticated / scoped |
| `/assets/upload` | Upload asset | Admin / assigned designer |
| `/assets/:id` | Asset preview, feedback, versions, review actions | Authorized project members |
| `/bookmarks` | Saved designs | Authenticated |
| `/users` | User management | Admin |
| `/profile` | My profile and activity | Authenticated |

### UI direction

Professional creative SaaS styling: **dark navy sidebar**, **violet actions**, **light neutral canvas**, clean typography, image-forward gallery cards, responsive navigation, and accessible feedback states.

| Token | Hex | Usage |
|---|---|---|
| Navy | `#111827` | Sidebar and strong text |
| Violet | `#675CF5` | Primary actions |
| Cloud | `#F6F7FB` | Page background |
| Teal | `#14B8A6` | Approved/success indicators |
| Amber | `#F59E0B` | Review and warning states |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | **React.js, Vite, JavaScript** | Interactive SPA |
| Styling | **Tailwind CSS** | Responsive design system |
| Components | **shadcn/ui**, Lucide React | UI primitives and icons |
| Navigation | **React Router** | Client-side routing |
| Network & caching | **Axios**, TanStack Query | Server communication and query state |
| Forms | **React Hook Form**, Zod | Client-side forms and validation |
| Backend | **Node.js**, Express.js | REST APIs and business logic |
| Persistence | **MongoDB Atlas**, Mongoose | Data models and database queries |
| Authentication | **JWT**, bcrypt | Sessions, hashing, and role checks |
| Media storage | **Cloudinary** | Image storage and delivery |
| Uploads | **Multer** | Multipart upload handling |
| Testing | **Vitest**, Supertest, Postman | Component/unit and API testing |
| Deployment | **Vercel**, Render | Frontend and API hosting candidates |
| Version control | **Git, GitHub** | Source management |

> Exact dependency versions should be pinned when implementation starts. The hosting services above are recommended deployment options rather than confirmed deployment destinations.

---

## 🏗️ System Architecture

```text
Admin / Designer / Client
             |
             v
     React + Vite UI
             |
      REST API (HTTPS)
             |
             v
    Node.js + Express
      /           \
     v             v
Authentication   API Controllers
& Authorization    /       \
                  v         v
             MongoDB     Cloudinary
             (records)   (media files)
```

**Principles**

1. React never connects directly to MongoDB.
2. Server verifies identity, project membership, and role for every protected resource.
3. Asset metadata lives in MongoDB; image bytes live in Cloudinary.
4. Uploads have size and content-type limits; untrusted filenames are never used directly as filesystem paths.
5. Sensitive/private client assets require access-controlled delivery, not merely a hidden frontend route.
6. Errors use consistent HTTP status codes and safe client-facing messages.

---

## 🗂️ Proposed Repository Structure

```text
BrandHub-Creative-Asset-Management/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Frontend static assets
│   │   ├── components/
│   │   │   ├── common/              # Button wrappers, loaders, empty states
│   │   │   ├── layout/              # Navbar, sidebar, shell
│   │   │   ├── projects/            # Project forms and cards
│   │   │   └── library/             # Asset cards, filters, preview
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── assets/
│   │   │   ├── bookmarks/
│   │   │   ├── users/
│   │   │   └── profile/
│   │   ├── context/                 # Authentication state
│   │   ├── hooks/
│   │   ├── services/                # Typed/validated API access helpers
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/                  # MongoDB, Cloudinary and app config
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   ├── Asset.js
│   │   │   ├── Comment.js
│   │   │   ├── Revision.js
│   │   │   └── Bookmark.js
│   │   ├── routes/                  # HTTP endpoint declarations
│   │   ├── controllers/             # Request handlers
│   │   ├── services/                # Business logic and file storage
│   │   ├── middleware/              # Auth, RBAC, upload, error handling
│   │   ├── validators/              # Request validation schemas
│   │   ├── utils/
│   │   └── app.js
│   ├── tests/                      # Unit/integration tests
│   ├── server.js
│   └── package.json
│
├── docs/
│   ├── api.md                       # Endpoints and examples
│   ├── architecture.md              # Design decisions
│   └── testing.md                   # Test scenarios and results
├── .env.example
├── .gitignore
└── README.md
```

> The tree is the **target structure**. Update it to match actual committed files before final submission.

---

## 🗄️ Database Design

### Relationships

```text
USERS (admin / designer / client)
  | creates projects
  | assigned to projects as client or designer
  | uploads assets and writes comments
  v
PROJECTS  (one project has many assets)
  |
  v
ASSETS
  |----> REVISIONS (one asset, many versions)
  |----> COMMENTS  (one asset, many comments)
  `----> BOOKMARKS (user + asset, unique pair)

Foreign-key-like references are MongoDB ObjectIds.
```

### Collections and important fields

**`users`** (`User.js`)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | User identifier |
| `name` | String | Display name |
| `email` | String, unique | Normalized email address |
| `passwordHash` | String | Hashed password, never returned by API |
| `role` | Enum | `admin`, `designer`, `client` |
| `avatarUrl` | String? | Profile image |
| `isActive` | Boolean | Account state |
| `createdAt`, `updatedAt` | Date | Timestamps |

**`projects`** (`Project.js`)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Project identifier |
| `title` | String | Project title |
| `description` | String | Project brief |
| `clientId` | ObjectId → User | Assigned client |
| `designerIds` | ObjectId[] → User | Assigned designers |
| `createdBy` | ObjectId → User | Admin who created it |
| `category` | String | Branding, marketing, etc. |
| `status` | Enum | `active`, `completed`, `archived` |
| `deadline` | Date? | Target delivery date |
| `createdAt`, `updatedAt` | Date | Timestamps |

**`assets`** (`Asset.js`)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Asset identifier |
| `projectId` | ObjectId → Project | Parent project |
| `uploadedBy` | ObjectId → User | Designer/admin |
| `title` | String | Asset name |
| `description` | String | Description |
| `category` | Enum/String | Logo, banner, social-media graphic |
| `tags` | String[] | Search and organization |
| `fileUrl` | String | Media delivery reference/URL |
| `cloudinaryPublicId` | String | Cloudinary storage identifier |
| `status` | Enum | `draft`, `in_review`, `changes_requested`, `approved` |
| `currentVersion` | Number | Latest version |
| `reviewedBy`, `reviewedAt` | ObjectId?, Date? | Latest reviewer and date |
| `reviewNote` | String? | Latest review note |
| `createdAt`, `updatedAt` | Date | Timestamps |

**`comments`** (`Comment.js`): `_id`, `assetId`, `userId`, `message`, `createdAt`, `updatedAt`.

**`revisions`** (`Revision.js`): `_id`, `assetId`, `version`, `fileUrl`, `cloudinaryPublicId`, `uploadedBy`, `note`, `createdAt`.

**`bookmarks`** (`Bookmark.js`): `_id`, `userId`, `assetId`, `createdAt`. Enforce a compound unique index on `(userId, assetId)`.

### Recommended schema rules

- Require and trim titles, names, and comments; limit their length.
- Validate ObjectId references and verify referenced users have the required roles.
- Scope every project/asset query to the signed-in user's authorized projects.
- Preserve revision history when a submitted asset is updated.
- Use indexed email, projectId, status, and commonly filtered fields as needed.
- Use transactions or compensating operations for changes spanning multiple records or external media storage.

---

## 🔌 API Reference (Planned)

All routes are prefixed with `/api`. Protected endpoints require authentication and appropriate project/role permissions.

| Method | Endpoint | Purpose | Typical access |
|---|---|---|---|
| `POST` | `/auth/login` | Sign in | Public |
| `POST` | `/auth/logout` | Sign out | Logged-in user |
| `GET` | `/auth/me` | Current session/user | Logged-in user |
| `GET` | `/users` | List user accounts | Admin |
| `POST` | `/users` | Create designer/client account | Admin |
| `PATCH` | `/users/:id` | Update permitted user properties | Owner/Admin |
| `GET` | `/users/me/activity` | Personal activity | Logged-in user |
| `GET` | `/projects` | List accessible projects | Logged-in user |
| `POST` | `/projects` | Create project | Admin |
| `GET` | `/projects/:id` | View project details | Authorized member |
| `PATCH` | `/projects/:id` | Update project | Admin |
| `DELETE` | `/projects/:id` | Archive/delete according to policy | Admin |
| `GET` | `/assets` | List, filter, paginate assets | Authorized member |
| `POST` | `/assets` | Upload asset and create record | Admin/assigned designer |
| `GET` | `/assets/:id` | View asset details | Authorized member |
| `PATCH` | `/assets/:id` | Edit asset metadata | Admin/owner as permitted |
| `DELETE` | `/assets/:id` | Delete permitted asset | Admin/owner draft |
| `POST` | `/assets/:id/submit` | Submit for review | Admin/assigned designer |
| `POST` | `/assets/:id/revisions` | Upload revised file | Admin/assigned designer |
| `PATCH` | `/assets/:id/review` | Approve/request changes | Authorized reviewer |
| `GET` | `/assets/:id/comments` | List comments | Authorized member |
| `POST` | `/assets/:id/comments` | Add comment | Authorized member |
| `DELETE` | `/comments/:id` | Delete own permitted comment | Author/Admin |
| `GET` | `/bookmarks` | List saved assets | Logged-in user |
| `POST` | `/assets/:id/bookmark` | Bookmark asset | Authorized member |
| `DELETE` | `/assets/:id/bookmark` | Remove bookmark | Bookmark owner |
| `GET` | `/dashboard/stats` | Scoped dashboard statistics | Logged-in user |

### Example asset search

```http
GET /api/assets?search=logo&category=Logo&status=approved&page=1&limit=12
```

### Example review request

```http
PATCH /api/assets/:id/review
Content-Type: application/json

{
  "decision": "changes_requested",
  "note": "Please try a higher-contrast version of the logo."
}
```

### Example success/error response contracts

```json
{
  "success": true,
  "data": { "id": "asset-id", "status": "changes_requested" }
}
```

```json
{
  "success": false,
  "message": "You do not have permission to review this asset."
}
```

Use `400` for invalid input, `401` for missing/invalid authentication, `403` for authorization failures, `404` for unavailable resources, and `500` for unexpected server errors. Client messages should never expose credentials or internal stack traces.

---

## 📤 Image Upload & Storage Workflow

```text
Designer -> React: Select image + enter metadata
React -> Express: Send multipart/form-data upload
Express: Authenticate, authorize and validate file
Express -> Cloudinary: Upload validated image
Cloudinary -> Express: Return secure URL + public ID
Express -> MongoDB: Save asset metadata
MongoDB -> Express: Confirm saved record
Express -> React: Return asset details
React -> Designer: Refresh asset gallery
```

**First-release support:** JPEG, PNG, WebP; configurable limit (e.g., 5 MB). Backend validates actual file content, not extension alone. Store secrets only on the server. Use restricted asset delivery where necessary for confidential client designs.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (currently supported LTS release) and npm
- Git
- MongoDB Atlas database
- Cloudinary account
- VS Code (optional)

### Clone

```bash
git clone https://github.com/YOUR_USERNAME/BrandHub-Creative-Asset-Management.git
cd BrandHub-Creative-Asset-Management
```

> Replace `YOUR_USERNAME` with the actual GitHub username. This clone URL is a placeholder, not a verified published repository.

### Install dependencies

Once the planned `client/` and `server/` directories have been implemented:

```bash
cd server
npm install
cd ../client
npm install
```

### Environment variables

Create `server/.env` from your environment template and supply valid values:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

If browser authentication uses HttpOnly cookies, configure appropriate `Secure`, `SameSite`, CORS, and CSRF protections. Never commit `.env` or API keys. Do not store sensitive login tokens in localStorage if using secure cookie-based sessions.

### Start application

In two terminal windows, once package scripts are defined:

```bash
# Terminal 1
cd server
npm run dev
```

```bash
# Terminal 2
cd client
npm run dev
```

**Expected local URLs (when configured):**

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

> Ensure `dev` scripts exist in the respective `package.json` files. The commands are a target setup procedure, not a claim that a live repo already runs.

---

## ✅ Internship Assignment Compliance

The Rewamp Digital technical assignment specifies **11 mandatory elements**. BrandHub is designed to cover every item below.

| # | Requirement | BrandHub implementation | Status |
|---:|---|---|---|
| 1 | Home page | Landing page / role-based dashboard | ⬜ To verify |
| 2 | Listing & details | Asset gallery and asset detail pages | ⬜ To verify |
| 3 | Create & update | Projects and assets CRUD | ⬜ To verify |
| 4 | Delete | Authorized deletion of own permitted records | ⬜ To verify |
| 5 | Interaction | Comments and bookmarks | ⬜ To verify |
| 6 | Search & filtering | Title search, category, status, project filters | ⬜ To verify |
| 7 | User profile | Personal details and associated activity | ⬜ To verify |
| 8 | Backend API | Express REST endpoints | ⬜ To verify |
| 9 | Database | MongoDB persistent data | ⬜ To verify |
| 10 | Validation & errors | Input checks, upload checks, loading/error/empty states | ⬜ To verify |
| 11 | Responsive UI | Desktop, tablet and mobile layouts | ⬜ To verify |

**Submission rule:** Only change an item to ✅ **Implemented & tested** after confirming it works end-to-end.

---

## 🧪 Testing Strategy

### Essential scenarios

1. Valid login succeeds; wrong password is rejected.
2. Designer cannot access a project assigned to someone else.
3. Admin creates and assigns a project successfully.
4. Designer uploads an allowed image; unsupported/oversized files fail safely.
5. Asset listing and details display persisted MongoDB data after refresh.
6. Designer edits their own permitted draft; another user's protected record is denied.
7. Delete is limited to allowed assets and preserves storage/data consistency.
8. Search and filtering produce relevant results; no matches show an empty state.
9. Comment and bookmark actions persist and respect project access.
10. Client requests changes; designer uploads new revision; client approves it.
11. Client cannot approve someone else's project or act as a designer.
12. Profile activity shows the correct signed-in user's data.
13. Backend/network failures show a recoverable error UI.
14. Responsive pages remain usable on mobile and desktop.

### Suggested commands (after test scripts are implemented)

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd ../client
npm test
```

Record actual test results and screenshots in `docs/testing.md` before submitting.

---

## 🗓️ Suggested Development Milestones

- [ ] **Phase 1 — Foundation:** Repo, frontend, backend, MongoDB, styles.
- [ ] **Phase 2 — Security:** Login, sessions, user model, roles, authorization.
- [ ] **Phase 3 — Projects:** Project schemas, assignment, project CRUD.
- [ ] **Phase 4 — Assets:** Cloudinary upload, asset CRUD, gallery, details.
- [ ] **Phase 5 — Discovery:** Search, filters, pagination.
- [ ] **Phase 6 — Collaboration:** Comments, bookmarks, review decisions.
- [ ] **Phase 7 — Experience:** Profiles, dashboards, responsiveness, error states.
- [ ] **Phase 8 — Delivery:** Integration tests, README verification, deployment.

**MVP first:** Finish the 11 assignment requirements before adding analytics, notifications, AI tagging, or other extras.

---

## 🔐 Security & Data Protection

- Hash passwords with bcrypt; never store plaintext passwords.
- Prefer secure HttpOnly cookie sessions and defend against CSRF if using cookies.
- Validate all input server-side, even if React already validates it.
- Authorize access at the **record/project level** for all endpoints.
- Validate real image contents and enforce size limits.
- Do not expose Cloudinary secrets or private MongoDB connection strings.
- Avoid publishing confidential client images through unrestricted public URLs.
- Add rate limits for login and other abuse-sensitive endpoints.
- Ensure an approved revision remains traceable and is not silently replaced.
- Return minimal safe error messages; log diagnostic details only on the server.

---

## 📷 Screenshots & Demo

> Add **real screenshots** after development. Do not treat mockups as screenshots from the completed application.

| Screen | Screenshot |
|---|---|
| Login | *To be added* |
| Role-based dashboard | *To be added* |
| Project list and details | *To be added* |
| Asset gallery | *To be added* |
| Asset preview and comments | *To be added* |
| Client approval | *To be added* |

**Live demo:** To be added after deployment.  
**Walkthrough video:** Optional; to be added if recorded.

---

## 🤝 Contributions & Development Process

Development workflow: create a small feature branch, implement one module, run focused tests, review changes, open a pull request, and merge only after verification. Avoid committing `.env`, service credentials, generated output, or `node_modules`.

Example branches:

```text
main
feature/authentication
feature/project-management
feature/asset-library
feature/client-review
fix/upload-validation
```

---

## 🎓 Project Context

**Use case:** Full Stack Developer Internship technical assignment.  
**Project inspiration:** Real digital-agency design collaboration workflows.  
**Reference company:** [Rewamp Digital](https://rewampdigital.com/) — mentioned for assignment context only; **no affiliation or endorsement is implied**.

---

<div align="center">

### Built around creative work, structured feedback, and confident delivery.

**BrandHub — Create. Collaborate. Review. Approve.**

*Documentation reflects planned scope until feature tests and deployment are completed.*

</div>
