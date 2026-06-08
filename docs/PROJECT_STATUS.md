# PROJECT_STATUS.md

## Project

EventVault

EventVault is a centralized Event & Media Management Platform being developed using a Turborepo monorepo architecture.

The platform enables clubs, photographers, organizers, and members to upload, organize, search, share, and interact with event media.

---

## Current Development Stage

Phase 2 - Authentication & Authorization

Status: Ready To Start

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite

Location:

apps/web

### Backend

* Node.js
* Express
* TypeScript

Location:

apps/server

### Database

* PostgreSQL (Neon)

### ORM

* Prisma 7

Location:

packages/db

### Monorepo

* Turborepo
* pnpm

---

## Repository Structure

```text
apps/
├── web
└── server

packages/
├── db
└── typescript-config
```

---

## Completed Work

### Monorepo

* [x] Turborepo initialized
* [x] pnpm workspace configured

### Frontend

* [x] React application created
* [x] TypeScript configured
* [x] Vite configured
* [x] Frontend development server verified

### Backend

* [x] Express server initialized
* [x] TypeScript configured
* [x] Basic server setup completed
* [x] Development environment configured
* [x] Backend server verified

### Database

* [x] Neon PostgreSQL database created
* [x] Connection string configured
* [x] Database connection verified

### Prisma

* [x] Prisma installed
* [x] Prisma initialized
* [x] Prisma 7 configured
* [x] prisma.config.ts configured
* [x] schema.prisma completed
* [x] Prisma client generated
* [x] Database schema pushed to Neon
* [x] Prisma Studio verified

### Shared Database Package

* [x] Shared Prisma client package created
* [x] @repo/db workspace package configured
* [x] Backend connected to Prisma client
* [x] Database queries verified

### Documentation

* [x] README.md
* [x] AGENTS.md
* [x] PROJECT_STATUS.md
* [x] PROJECT_ROADMAP.md

---

## Current Database Models

* User
* Club
* ClubMember
* Event
* UploadBatch
* Media
* Comment
* Like
* Favourite
* MediaTag
* Notification

---

## Current Focus

### Immediate Next Steps

1. Implement user registration.
2. Implement login.
3. Implement JWT authentication.
4. Implement protected routes.
5. Implement role-based authorization.

---

## Not Started Yet

### Authentication

* User registration
* Login
* JWT authentication
* Role-based authorization

### Event Management

* Event creation
* Event editing
* Event deletion
* Event metadata

### Media Management

* Media uploads
* Event albums
* Media previews
* Bulk uploads

### Social Features

* Likes
* Comments
* Shares
* Favourites
* User tagging

### Notifications

* Real-time notifications
* WebSocket integration

### AI Features

* Smart image tagging
* Facial recognition
* Personalized gallery
* Advanced search

### Cloud Features

* AWS S3 integration
* Media delivery optimization

---

## Important Decisions

* Turborepo for monorepo management.
* pnpm as package manager.
* React + TypeScript for frontend.
* Express + TypeScript for backend.
* PostgreSQL (Neon) as database.
* Prisma 7 as ORM.
* Shared database package inside packages/db.
* Centralized .env at repository root.
* Shared Prisma client exported through @repo/db.

---

## Last Updated

Foundation phase completed.

Current task: Authentication & Authorization.
