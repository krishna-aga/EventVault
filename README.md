# EventVault

EventVault is a modern, AI-powered Event & Media Management Platform built using a Turborepo monorepo architecture. The platform enables organizers, photographers, clubs, and viewers to manage, upload, search, and discover event media seamlessly.

## AI/ML Integrated Features

* **Smart Image Tagging**: Automatically detects category labels using AWS Rekognition upon photographer upload.
* **AI Search**: Search events and media files by exact or auto-generated AI labels.
* **Facial Recognition Auto-Tagging**: Users can calibrate their Face ID by uploading a reference selfie. Any photo matching their face print during upload triggers real-time WebSocket notifications and automatically links them.
* **AI Caption Generation**: Generates engaging, social-friendly image summaries and descriptions powered by Google Gemini (with AWS label fallback).
* **Exact Duplicate Upload Blocker**: Prevents redundant uploads by calculating a SHA-256 buffer hash of image files and matching them.
* **Dynamic Watermarked Downloads (Phase 12)**: Original clean images and videos are kept securely in storage. When users click download, the server dynamically overlays a custom text watermark with the club name, event name, and user role before sending the file.
* **Bulk Drag & Drop Uploads**: Fully interactive local upload zone supporting multiple files, live progress tracking, and editable AI-suggested captions and tags.
* **Instagram-Style Feed & Interactive Popup**: Feed items are presented as clean Event summary cards. Clicking an card transitions to a detailed Instagram-style batch feed. Media is also viewable in a premium dual-column details popup supporting comments, likes, bookmarks, video streaming, and watermarked downloads.
* **Viewer Role Restrictions**: Strict access controls hide event creation, club join requests, and media uploads from VIEWER users in both UI layouts and API endpoints.

## Tech Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* PostgreSQL (Neon)

### ORM

* Prisma

### Monorepo

* Turborepo
* pnpm

---

## Repository Structure

```text
EventVault/
├── apps/
│   ├── web/
│   │   └── React frontend
│   └── server/
│       └── Express backend
│
├── packages/
│   ├── db/
│   │   └── Prisma schema and database client
│   └── typescript-config/
│       └── Shared TypeScript configurations
│
├── turbo.json
├── pnpm-workspace.yaml
├── AGENTS.md
└── README.md
```

---

## Getting Started

### Prerequisites

* Node.js 20+
* pnpm
* PostgreSQL (Neon)

### Install Dependencies

```bash
pnpm install
```

---

## Environment Variables

Create the required `.env` files.

### Database

```env
DATABASE_URL=your_neon_connection_string
```

---

## Database Setup

Generate Prisma Client:

```bash
cd packages/db
npx prisma generate
```

Push schema to database:

```bash
npx prisma db push
```

Open Prisma Studio:

```bash
npx prisma studio
```

Deploy Superadmin Account:

```bash
pnpm --filter server db:seed:superadmin
```

---

## Development

Run all applications:

```bash
pnpm dev
```

Run frontend only:

```bash
pnpm --filter web dev
```

Run backend only:

```bash
pnpm --filter server dev
```

---

## Build

Build all packages:

```bash
pnpm build
```

---

## Project Goals

* Event creation and management
* User registration and authentication
* Ticket booking system
* Event discovery
* Payment integration
* Dashboard for organizers
* Scalable monorepo architecture

---

## Development Guidelines

* Use TypeScript throughout the project.
* Keep components reusable.
* Use Prisma for all database operations.
* Follow the existing folder structure.
* Avoid committing secrets or `.env` files.
* Create focused pull requests.

---

## License

This project is developed for educational and learning purposes.
