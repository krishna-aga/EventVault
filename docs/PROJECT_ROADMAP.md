# EventVault Roadmap

## Project Goal

Build a centralized Event and Media Management Platform where clubs, photographers, organizers, and members can upload, organize, discover, and interact with event media.

---

## Phase 1 - Foundation

Status: Completed

### Monorepo Setup

* [x] Turborepo
* [x] pnpm workspace
* [x] React frontend
* [x] Express backend
* [x] Prisma setup
* [x] Neon PostgreSQL setup
* [x] Shared Prisma client package
* [x] Shared database package export
* [x] Frontend development server verified
* [x] Backend development server verified

### Database

* [x] Database schema designed
* [x] Prisma models created
* [x] Prisma client generated
* [x] Database pushed to Neon
* [x] Database connectivity verified

---

## Phase 2 - Authentication & Authorization

Status: Completed

### Features

* [x] User registration
* [x] User login
* [x] Password hashing (bcrypt)
* [x] JWT authentication
* [x] Protected routes
* [x] Current user endpoint (/me)
* [x] Refresh token strategy

### Roles

* [x] Admin
* [x] Photographer
* [x] Club Member
* [x] Viewer

---

## Phase 3 - Club Management

Status: Completed

### Features

* [x] Create club
* [x] Update club
* [x] Delete club
* [x] Club membership management
* [x] Join requests
* [x] Member roles

---

## Phase 4 - Event Management

Status: Not Started

### Features

* [ ] Create event
* [ ] Update event
* [ ] Delete event
* [ ] Event metadata
* [ ] Event categories
* [ ] Event descriptions
* [ ] Event visibility

### Sorting

* [ ] By event name
* [ ] By date
* [ ] By category

---

## Phase 5 - Media Management

Status: Not Started

### Features

* [ ] Photo upload
* [ ] Video upload
* [ ] Bulk upload
* [ ] Drag and drop upload
* [ ] Upload batches
* [ ] Media preview
* [ ] Media compression
* [ ] Event albums

---

## Phase 6 - Access Control

Status: Not Started

### Features

* [ ] Public media access
* [ ] Private media access
* [ ] Event visibility enforcement
* [ ] Role-based permissions

---

## Phase 7 - Social Features

Status: Not Started

### Features

* [ ] Likes
* [ ] Comments
* [ ] Shares
* [ ] Downloads
* [ ] Favourites
* [ ] User tagging

---

## Phase 8 - Notifications

Status: Not Started

### Features

* [ ] Like notifications
* [ ] Comment notifications
* [ ] Tag notifications

### Technology

* [ ] WebSockets
* [ ] Real-time updates

---

## Phase 9 - Search & Discovery

Status: Not Started

### Features

* [ ] Search by event
* [ ] Search by tags
* [ ] Search by uploader
* [ ] Search by date
* [ ] Filter by club

---

## Phase 10 - AI Features

Status: Future

### Smart Image Tagging

* [ ] Auto-generate tags
* [ ] Categorize images

### Facial Recognition

* [ ] Upload reference selfie
* [ ] Face matching
* [ ] Personal gallery

---

## Phase 11 - Cloud Storage

Status: Future

### Storage

* [ ] AWS S3 integration

### Media Delivery

* [ ] CDN support

---

## Phase 12 - Watermarking

Status: Future

### Features

* [ ] Dynamic watermark
* [ ] Club watermark
* [ ] Event watermark
* [ ] Role-based watermark

---

## Phase 13 - Bonus Features

Status: Future

* [ ] Infinite scrolling
* [ ] QR album sharing
* [ ] Collaborative albums
* [ ] AI captions
* [ ] Analytics dashboard
* [ ] PWA support
* [ ] Offline support
* [ ] Duplicate image detection

---

## Current Focus

1. Event management.
2. Media management.
3. Access control.
4. Social features.
5. Notifications.

---

## Instructions For AI Agents

* Follow roadmap order.
* Prefer incremental implementation.
* Complete authentication before feature modules.
* Avoid implementing future phases unless requested.
* Minimize repository scanning.
