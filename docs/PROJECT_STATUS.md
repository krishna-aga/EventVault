## Project

EventVault

EventVault is a centralized Event and Media Management Platform developed using a Turborepo monorepo architecture.

The platform enables clubs, photographers, organizers, and members to upload, organize, search, share, and interact with event media.

---

## Current Development Stage

Phase 12 - Watermarked Downloads & UX Polish

Status: Completed

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
* [x] Custom EventVault dashboard implemented

### Backend

* [x] Express server initialized
* [x] TypeScript configured
* [x] Basic server setup completed
* [x] Development environment configured
* [x] Backend server verified
* [x] Authentication endpoints implemented
* [x] Authorization middleware implemented
* [x] Club management endpoints implemented
* [x] Event management endpoints implemented

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
* [x] Superadmin seed account deployed via server migration script

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
* [x] API_DOC.md
* [x] DATABASE_SCHEMA.md

### Media Management (Phase 5)

* [x] Upload single & multiple media files (multipart/form-data)
* [x] Media preview support (photo/video file source url resolution)
* [x] Bulk upload sessions / batches mapped in DB

### Access Control (Phase 6)

* [x] Private event authorization guard (only club members can view or upload)
* [x] Standalone event authorization checks (only creator can upload unless photographer/admin)
* [x] Uploader permission restrictions

### Social Features (Phase 7)

* [x] Like / unlike media toggles
* [x] List media likes count and users
* [x] Post comment under media item
* [x] List and delete comments
* [x] Save / unsave to favourites (bookmarks)
* [x] List personal favourite media items

### Notifications (Phase 8)

* [x] WebSocket integration with socket.io
* [x] Real-time activity alerts broadcast on like, comment, etc.
* [x] List all notifications
* [x] Mark individual or all notifications as read

### Search & Discovery (Phase 9)

* [x] Full-text database wildcard search on events
* [x] Filters by category, club, uploader, date range, tags

### AI/ML Integration (Phase 10)

* [x] Smart image tagging (AWS Rekognition labels converted to tags)
* [x] AI search by tags (matching auto-generated tags array)
* [x] Face prints calibration selfie widget (POST /auth/selfie)
* [x] Auto facial recognition and photographer auto-tagging
* [x] AI caption generation using Google Gemini (with AWS Rekognition fallback)
* [x] SHA-256 buffer hash exact duplicate blocking

### Cloud Features (Phase 11)

* [x] AWS S3 file upload integration with automatic static local folder fallback

### Watermarking & UX Enhancements (Phase 12)

* [x] Dynamic text watermark overlay using Jimp on media download
* [x] Drag-and-drop bulk file upload zone with live AI analysis previews
* [x] Dual-column Instagram-style media viewer popup (likes, bookmarks, comments, video, download)
* [x] Viewer role guards and view restrictions
* [x] Club Console member roles updating (Owners/Superadmin) and member removal (Admins/Superadmin)

---

## Current Database Models

* User
* Club
* ClubMember
* ClubJoinRequest
* RefreshToken
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

1. Implement dynamic and event-based watermarking.
2. Optimize media delivery via cloud CDN distributions.

### AI Features

* Smart image tagging (Completed)
* Facial recognition (Completed)
* Personalized gallery (Completed)
* Advanced search improvements (Completed)

### Cloud Features

* AWS S3 integration (Completed)
* Media delivery optimization & CDN support

---

## Important Decisions

* Turborepo for monorepo management.
* pnpm as package manager.
* React and TypeScript for frontend.
* Express and TypeScript for backend.
* PostgreSQL (Neon) as database.
* Prisma 7 as ORM.
* Shared database package inside packages/db.
* Centralized .env at repository root.
* Shared Prisma client exported through @repo/db.

---

## Last Updated

Phase 10 - AI/ML Integration completed.

Current task: Documentation update and future features planning.
