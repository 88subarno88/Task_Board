# 📋 Task Board — Project Management System

> A full-stack, Jira-inspired project management and issue-tracking application built entirely in strict TypeScript. Teams can plan, track, and manage work through customizable Kanban boards, hierarchical issues, role-based access control, audit trails, and rich collaboration features.

---

## Team Members

| Name         | Entry Number | GitHub                                         |
| ------------ | ------------ | ---------------------------------------------- |
| Subarno Saha | 2024CS50431  | [@88subarno88](https://github.com/88subarno88) |
| Rohit Meena  | 2024CS10030  | [@amigo-35](https://github.com/amigo-35)       |

> **GitHub Repository:** https://github.com/88subarno88/Task_Board

---

## Implemented Features

### Authentication, Authorization & User Management

- Email + password registration and login with `bcrypt` hashing
- JWT-based session management — access tokens in `HTTP-only` cookies, refresh token mechanism for session renewal, logout invalidates refresh token
- User profiles with name, email, and avatar
- **Role-Based Access Control (RBAC)**
  - _Global Admin_ — create projects, manage all users, assign project-level roles
  - _Project Admin_ — full project settings, manage members, edit workflows
  - _Project Member_ — create and edit tasks, participate in project
  - _Project Viewer_ — read-only access to project and tasks

### Projects

- Create, update, and archive projects
- Assign users to projects with project-level permissions
- Project metadata: name, description, created/modified timestamps

### Boards (Kanban)

- Each project has one or more boards with its own column configuration
- Default columns: `To Do`, `In Progress`, `Review`, `Done` (customizable per board)
- Native HTML5 Drag & Drop — no external DnD libraries (as required)
- WIP Limits — enforced at column level; invalid moves are blocked at the API, not just warned
- Project Admins can add, rename, reorder, and delete columns

### Issues / Tasks

- **Three hierarchical task types:**
  - _Story_ — parent item; status auto-derived from children's statuses
  - _Task_ — standard work item, linkable to a Story
  - _Bug_ — issue to fix, linkable to a Story
- Parent-child relationships enforced; Story status kept consistent with children
- **Task fields:** title, description, status, priority (Low/Medium/High/Critical), assignee, reporter, due date
- Create, edit, delete tasks; move between columns; change status/priority/assignee
- Task detail view with full information

### Issue Lifecycle & Workflow

- Configurable workflows per board
- **Valid status transitions enforced at the API level** (invalid transitions blocked, not just warned):
  ```
  To Do       →  In Progress
  In Progress →  Review | To Do
  Review      →  Done | In Progress
  Done        →  To Do
  ```
- **Mandatory Audit Trail** — the following events are logged for every task:
  - Status changes (old → new status, with timestamp)
  - Assignee changes (old → new assignee, with timestamp)
  - Comments added/deleted (with timestamp)
- Automatic timestamps: created, updated, resolved, closed

### Comments & Collaboration

- Comment threads on tasks
- Delete own comments
- `@email` mention system with clickable mention buttons as they are unique
- Activity Timeline per task — comments and audit events merged chronologically
- Rich text support in both issue descriptions and comments — custom-built editor using `contenteditable` + `execCommand` with no external WYSIWYG library (bold, italic, underline, font family, font size 12–72px, lists, blockquote, code block, links, alignment, strikethrough, indent/outdent, clear formatting)

### Notifications

- Triggered by: task assignment, status change, comment added, user mentioned
- Persistent in-app notification center — stored in the database
- Users can mark notifications as read
- Polling-based fetching

---

## 🛠️ Technology Stack

| Layer       | Technology                                                                              |
| ----------- | --------------------------------------------------------------------------------------- |
| Frontend    | React 18, Vite, TypeScript (`strict: true`), React Router DOM, Context API, CSS Modules |
| Backend     | Node.js, Express.js, TypeScript (`strict: true`)                                        |
| ORM         | Prisma                                                                                  |
| Database    | PostgreSQL                                                                              |
| Auth        | JWT (access + refresh tokens), bcrypt, HTTP-only cookies                                |
| Drag & Drop | Native HTML5 Drag and Drop API                                                          |
| Rich Text   | Custom `contenteditable` editor (no external WYSIWYG)                                   |
| Testing     | Jest (backend unit tests)                                                               |
| Style       | ESLint, Prettier, Google TypeScript Style Guide                                         |

---

## Project Structure

```
Task_Board/
├── backend/
│   ├── jest.config.js
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma          # User, Project, Board, Column, Issue, Comment, AuditLog, Notification
│   │   └── migrations/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   │   └── database.ts        # Prisma client singleton
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification + RBAC guards
│   │   │   └── errorHandler.ts    # Typed AppError class
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── issueservice.ts    # Business logic: create/update/move/delete, WIP + workflow validation
│   │   │   ├── notificationservice.ts
│   │   │   └── ...
│   │   ├── tests/                 # Jest unit tests
│   │   ├── types/
│   │   └── utils/
│   └── tsconfig.json
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── IssueForm.tsx        # Create issue modal
│   │   │   ├── IssueDetail.tsx      # Issue detail/edit modal + activity timeline
│   │   │   ├── RichTextEditor.tsx   # Custom rich text editor (no Quill)
│   │   │   └── cssmodules/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   ├── services/
│   │   │   ├── Issueservice.ts
│   │   │   ├── projectservices.ts
│   │   │   └── commentservice.ts
│   │   └── types/
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18.0 or higher
- PostgreSQL running locally or hosted

---

## Setup & Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/88subarno88/Task_Board.git
cd Task_Board
```

### 2. Install Dependencies

```bash
# Terminal 1 — Backend
cd backend
npm install

# Terminal 2 — Frontend
cd frontend
npm install
```

### 3. Configure Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://<YOUR_USERNAME>@localhost:5432/taskboard?schema=public"
DIRECT_URL="postgresql://<YOUR_USERNAME>@localhost:5432/taskboard?schema=public"
JWT_ACCESS_SECRET="taskboard-access-secret-2024"
JWT_REFRESH_SECRET="taskboard-refresh-secret-2024"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Database Setup (Prisma)

```bash
cd backend
npx prisma db push
# or: npx prisma migrate dev --name init
```

> **Note:** You may see a warning about `url` and `directUrl` in `schema.prisma` — ignore it, it does not affect functionality.

### 5. Start the Application

```bash
# Terminal 1 — Backend  →  http://localhost:3000
cd backend
npm run dev

# Terminal 2 — Frontend  →  http://localhost:5173
cd frontend
npm run dev
```

---

## API Reference

### Authentication

| Method | Endpoint             | Description                       |
| ------ | -------------------- | --------------------------------- |
| POST   | `/api/auth/register` | Register a new user               |
| POST   | `/api/auth/login`    | Login, sets HTTP-only cookie      |
| POST   | `/api/auth/refresh`  | Issue new access token            |
| POST   | `/api/auth/logout`   | Clear cookies, invalidate session |

### Projects & Boards

| Method | Endpoint                  | Description                                |
| ------ | ------------------------- | ------------------------------------------ |
| GET    | `/api/projects`           | Get all projects for current user          |
| POST   | `/api/projects`           | Create project (Global Admin only)         |
| GET    | `/api/projects/:id`       | Get project details and members            |
| GET    | `/api/boards/:id`         | Get board with columns                     |
| PUT    | `/api/boards/:id/columns` | Update Kanban columns (Project Admin only) |

### Issues

| Method | Endpoint                | Description                                     |
| ------ | ----------------------- | ----------------------------------------------- |
| POST   | `/api/issues`           | Create a new issue                              |
| GET    | `/api/issues/:id`       | Get issue with comments and audit log           |
| PUT    | `/api/issues/:id`       | Update issue metadata                           |
| PATCH  | `/api/issues/:id/move`  | Move issue — triggers workflow + WIP validation |
| DELETE | `/api/issues/:id`       | Delete an issue                                 |
| GET    | `/api/issues/:id/audit` | Get audit log for an issue                      |

### Comments & Notifications

| Method | Endpoint                        | Description                        |
| ------ | ------------------------------- | ---------------------------------- |
| POST   | `/api/issues/:issueId/comments` | Add a comment                      |
| DELETE | `/api/comments/:id`             | Delete own comment                 |
| GET    | `/api/notifications`            | Get notifications for current user |
| PATCH  | `/api/notifications/:id/read`   | Mark notification as read          |

---

## Testing

Backend unit tests cover core business logic, workflow validation, WIP enforcement, and RBAC constraints.

```bash
cd backend
npm run test
```

---

## Design Decisions

- **No external WYSIWYG library** — the assignment prohibits libraries not listed in the spec. The rich text editor is built from scratch using the browser's native `contenteditable` API and `document.execCommand`.
- **No external DnD library** — drag and drop is implemented using the native HTML5 Drag and Drop API as required.
- **Workflow transitions are server-enforced** — invalid moves are rejected at the API level with a `400` error, not just a frontend warning.
- **Story status is auto-derived** — when all children reach `Done`, the parent Story auto-transitions. If children are `In Progress` or `Review`, the Story moves to `In Progress`.
- **Audit log is append-only** — events are never edited or deleted, maintaining a reliable history.
- **Prisma + PostgreSQL** — chosen for type-safe queries and easy schema migrations.
