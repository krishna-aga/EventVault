# DATABASE_SCHEMA.md

# EventVault Database Schema

## Overview

EventVault uses PostgreSQL with Prisma ORM.

The schema is designed to support:

* Authentication & Authorization
* Club Management
* Event Management
* Media Uploads
* Social Interactions
* Notifications
* AI Tagging & User Tagging

---

# Entity Relationship Overview

```text
User
 ├── ClubMember
 ├── Event (creator)
 ├── Media (uploader)
 ├── Comment
 ├── Like
 ├── Favourite
 ├── Notification
 ├── MediaTag
 └── UploadBatch

Club
 ├── ClubMember
 └── Event

Event
 ├── Media
 └── UploadBatch

UploadBatch
 └── Media

Media
 ├── Comment
 ├── Like
 ├── Favourite
 └── MediaTag
```

---

# Enums

## Role

Defines user permissions.

| Value        | Description            |
| ------------ | ---------------------- |
| ADMIN        | Platform administrator |
| PHOTOGRAPHER | Can upload media       |
| CLUB_MEMBER  | Member of club         |
| VIEWER       | Read-only user         |

---

## Visibility

Defines event access level.

| Value   | Description            |
| ------- | ---------------------- |
| PUBLIC  | Accessible by everyone |
| PRIVATE | Restricted access      |

---

# Models

## User

Represents a platform user.

### Fields

| Field        | Type            |
| ------------ | --------------- |
| id           | String          |
| name         | String          |
| email        | String (Unique) |
| passwordHash | String          |
| role         | Role            |
| profileImage | String?         |
| createdAt    | DateTime        |
| updatedAt    | DateTime        |

### Relationships

* Club memberships
* Created events
* Uploaded media
* Comments
* Likes
* Favourites
* Notifications
* Tagged media
* Upload batches

---

## Club

Represents a club or society.

### Fields

| Field       | Type     |
| ----------- | -------- |
| id          | String   |
| name        | String   |
| description | String?  |
| logoUrl     | String?  |
| createdAt   | DateTime |

### Relationships

* Members
* Events

---

## ClubMember

Many-to-many relationship between users and clubs.

### Fields

| Field    | Type     |
| -------- | -------- |
| id       | String   |
| userId   | String   |
| clubId   | String   |
| joinedAt | DateTime |

### Constraints

```text
UNIQUE(userId, clubId)
```

A user cannot join the same club twice.

---

## Event

Represents an event.

### Fields

| Field       | Type       |
| ----------- | ---------- |
| id          | String     |
| title       | String     |
| description | String?    |
| category    | String     |
| visibility  | Visibility |
| location    | String?    |
| eventDate   | DateTime   |
| coverImage  | String?    |
| createdAt   | DateTime   |
| createdById | String     |
| clubId      | String?    |

### Relationships

* Creator
* Club
* Media
* Upload batches

---

## UploadBatch

Represents a bulk upload session.

### Fields

| Field        | Type     |
| ------------ | -------- |
| id           | String   |
| uploadedById | String   |
| eventId      | String?  |
| createdAt    | DateTime |

### Relationships

* Uploader
* Event
* Media

---

## Media

Represents uploaded photos or videos.

### Fields

| Field        | Type     |
| ------------ | -------- |
| id           | String   |
| title        | String?  |
| fileUrl      | String   |
| thumbnailUrl | String?  |
| fileType     | String   |
| fileSize     | Int?     |
| uploadedAt   | DateTime |
| uploadedById | String   |
| eventId      | String   |
| batchId      | String?  |

### Relationships

* Uploader
* Event
* Upload batch
* Comments
* Likes
* Favourites
* Tags

---

## Comment

Represents comments on media.

### Fields

| Field     | Type     |
| --------- | -------- |
| id        | String   |
| content   | String   |
| createdAt | DateTime |
| userId    | String   |
| mediaId   | String   |

### Relationships

* User
* Media

---

## Like

Represents a like on media.

### Fields

| Field     | Type     |
| --------- | -------- |
| id        | String   |
| userId    | String   |
| mediaId   | String   |
| createdAt | DateTime |

### Constraints

```text
UNIQUE(userId, mediaId)
```

A user can like a media item only once.

---

## Favourite

Represents saved media.

### Fields

| Field     | Type     |
| --------- | -------- |
| id        | String   |
| userId    | String   |
| mediaId   | String   |
| createdAt | DateTime |

### Constraints

```text
UNIQUE(userId, mediaId)
```

A user can favourite a media item only once.

---

## MediaTag

Represents user tagging in media.

### Fields

| Field     | Type     |
| --------- | -------- |
| id        | String   |
| mediaId   | String   |
| userId    | String   |
| createdAt | DateTime |

### Constraints

```text
UNIQUE(mediaId, userId)
```

A user can only be tagged once in a media item.

---

## Notification

Represents user notifications.

### Fields

| Field     | Type     |
| --------- | -------- |
| id        | String   |
| userId    | String   |
| message   | String   |
| isRead    | Boolean  |
| createdAt | DateTime |

### Relationships

* User

---

# Current Database Statistics

## Total Models

```text
11 Models
```

1. User
2. Club
3. ClubMember
4. Event
5. UploadBatch
6. Media
7. Comment
8. Like
9. Favourite
10. MediaTag
11. Notification

---

# Future Schema Extensions

Planned future additions:

* FaceEmbedding
* AIImageTag
* Share
* DownloadHistory
* WatermarkConfig
* RefreshToken
* AuditLog
* ActivityFeed
* EventCategory
* ClubJoinRequest

These will be added in later roadmap phases as required.

---

# Last Updated

Phase 2 – Authentication & Authorization
