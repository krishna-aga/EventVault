# EventVault

EventVault is a modern, AI-powered Event & Media Management Platform built using a Turborepo monorepo architecture. The platform enables organizers, photographers, clubs, and viewers to manage, upload, search, and discover event media seamlessly.

## AI/ML Integrated Features

* **Smart Image Tagging**: Automatically detects category labels using AWS Rekognition upon photographer upload.
* **AI Search**: Search events and media files by exact or auto-generated AI labels.
* **Facial Recognition Auto-Tagging**: Users can calibrate their Face ID by uploading a reference selfie. Any photo matching their face print during upload triggers real-time WebSocket notifications and automatically links them.
* **AI Caption Generation**: Generates engaging, social-friendly image summaries and descriptions powered by Google Gemini (with AWS label fallback).
* **Exact Duplicate Upload Blocker**: Prevents redundant uploads by calculating a SHA-256 buffer hash of image files and matching them.

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
