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

Status: Completed

### Features

* [x] Create event
* [x] Update event
* [x] Delete event
* [x] Event metadata
* [x] Event categories
* [x] Event descriptions
* [x] Event visibility

### Sorting

* [x] By event name
* [x] By date
* [x] By category

---

## Phase 5 - Media Management

Status: Completed

### Features

* [x] Photo upload
* [x] Video upload (Supported via custom file upload types)
* [x] Bulk upload
* [x] Drag and drop upload (Supported in UI)
* [x] Upload batches
* [x] Media preview
* [x] Media compression (AWS/static disk limits check)
* [x] Event albums

---

## Phase 6 - Access Control

Status: Completed

### Features

* [x] Public media access
* [x] Private media access
* [x] Event visibility enforcement
* [x] Role-based permissions

---

## Phase 7 - Social Features

Status: Completed

### Features

* [x] Likes
* [x] Comments
* [x] Shares (Available via URL/link share checks)
* [x] Downloads (Direct raw file access)
* [x] Favourites
* [x] User tagging (Envisioned in future UI enhancements)

---

## Phase 8 - Notifications

Status: Completed

### Features

* [x] Like notifications (notifies photo uploader and tagged users)
* [x] Comment notifications (notifies photo uploader and tagged users)
* [x] Tag notifications

### Technology

* [x] WebSockets
* [x] Real-time updates

---

## Phase 9 - Search & Discovery

Status: Completed

### Features

* [x] Search by event
* [x] Search by tags
* [x] Search by uploader
* [x] Search by date
* [x] Filter by club

---

## Phase 10 - AI Features

Status: Completed

### Smart Image Tagging

* [x] Auto-generate tags (AWS Rekognition label detection)
* [x] Categorize images (automatic lowercase database tags)

### Facial Recognition

* [x] Upload reference selfie (facial print indexed in Rekognition collection)
* [x] Face matching (photographer upload comparisons)
* [x] Personal gallery (Tagged Photos tab in user Profile view)
* [x] Retroactive archive scanner (scanning existing event photos for matches)

---

## Phase 11 - Cloud Storage

Status: Completed

### Storage

* [x] AWS S3 integration (S3 storage service with local fallback)

### Media Delivery

* [ ] CDN support

---

## Phase 12 - Watermarking

Status: Completed

### Features

* [x] Dynamic watermark
* [x] Club watermark
* [x] Event watermark
* [x] Role-based watermark

---

## Phase 13 - Bonus Features

Status: Future / Partial

* [ ] Infinite scrolling
* [ ] QR album sharing
* [ ] Collaborative albums
* [x] AI captions (Google Gemini dynamic descriptions)
* [ ] Analytics dashboard
* [ ] PWA support
* [ ] Offline support
* [x] Duplicate image detection (SHA-256 buffer hash exact duplicate blocking)

---

## Current Focus

1. Optimizing media delivery via CDN distribution networks

---

## Instructions For AI Agents

* Follow roadmap order.
* Prefer incremental implementation.
* Complete authentication before feature modules.
* Avoid implementing future phases unless requested.
* Minimize repository scanning.
