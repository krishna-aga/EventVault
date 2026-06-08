# PROJECT_ROADMAP.md

# EventVault Roadmap

## Project Goal

Build a centralized Event & Media Management Platform where clubs, photographers, organizers, and members can upload, organize, discover, and interact with event media.

---

## Phase 1 - Foundation

Status: In Progress

### Monorepo Setup

* [x] Turborepo
* [x] pnpm workspace
* [x] React frontend
* [x] Express backend
* [x] Prisma setup
* [x] Neon PostgreSQL setup
* [x] Shared Prisma client package

---

## Phase 2 - Authentication & Authorization

Status: Not Started

### Features

* [ ] User registration
* [ ] User login
* [ ] JWT authentication
* [ ] Protected routes

### Roles

* [ ] Admin
* [ ] Photographer
* [ ] Club Member
* [ ] Viewer

---

## Phase 3 - Event Management

Status: Not Started

### Features

* [ ] Create event
* [ ] Update event
* [ ] Delete event
* [ ] Event metadata
* [ ] Event categories
* [ ] Event descriptions

### Sorting

* [ ] By event name
* [ ] By date
* [ ] By category

---

## Phase 4 - Media Management

Status: Not Started

### Features

* [ ] Photo upload
* [ ] Video upload
* [ ] Bulk upload
* [ ] Drag and drop upload
* [ ] Media preview
* [ ] Media compression
* [ ] Event albums

---

## Phase 5 - Access Control

Status: Not Started

### Public Media

* [ ] Public visibility

### Private Media

* [ ] Member-only visibility

---

## Phase 6 - Social Features

Status: Not Started

### Features

* [ ] Likes
* [ ] Comments
* [ ] Shares
* [ ] Downloads
* [ ] Favourites
* [ ] User tagging

---

## Phase 7 - Notifications

Status: Not Started

### Features

* [ ] Like notifications
* [ ] Comment notifications
* [ ] Tag notifications

### Technology

* [ ] WebSockets

---

## Phase 8 - AI Features

Status: Not Started

### Smart Image Tagging

* [ ] Auto-generate tags
* [ ] Categorize images

### Advanced Search

* [ ] Search by event
* [ ] Search by tags
* [ ] Search by uploader
* [ ] Search by date

### Facial Recognition

* [ ] Upload reference selfie
* [ ] Face matching
* [ ] Personal gallery

---

## Phase 9 - Cloud Storage

Status: Not Started

### Storage

* [ ] AWS S3 integration

### Media Delivery

* [ ] CDN support

---

## Phase 10 - Watermarking

Status: Not Started

### Features

* [ ] Dynamic watermark
* [ ] Club watermark
* [ ] Event watermark
* [ ] Role-based watermark

---

## Phase 11 - Bonus Features

Status: Future

* [ ] Infinite scrolling
* [ ] QR album sharing
* [ ] Collaborative albums
* [ ] AI captions
* [ ] Analytics dashboard
* [ ] PWA
* [ ] Offline support
* [ ] Duplicate image detection

---

## Current Focus

1. Complete Prisma package.
2. Export shared Prisma client.
3. Connect backend with database.
4. Design database schema.
5. Build authentication system.

---

## Instructions For AI Agents

* Follow roadmap order.
* Prefer incremental implementation.
* Do not implement future phases unless requested.
* Focus only on current phase.
* Minimize repository scanning.
