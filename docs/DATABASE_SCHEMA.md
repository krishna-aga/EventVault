# EventVault Database Schema

## Overview

EventVault uses PostgreSQL with Prisma ORM.

The schema supports:

* Authentication and authorization
* Club management
* Event management
* Media uploads
* Social interactions
* Notifications
* AI tagging and user tagging

---

## Entity Relationship Overview

```text
User
 ├── ClubMember
 ├── ClubJoinRequest (requester)
 ├── ClubJoinRequest (reviewedBy)
 ├── RefreshToken
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
 ├── ClubJoinRequest
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

## Enums

### Role

| Value | Description |
| --- | --- |
| ADMIN | Platform administrator |
| PHOTOGRAPHER | Can upload media |
| CLUB_MEMBER | Member of club |
| VIEWER | Read-only user |

### Visibility

| Value | Description |
| --- | --- |
| PUBLIC | Accessible by everyone |
| PRIVATE | Restricted access |

### ClubMemberRole

| Value | Description |
| --- | --- |
| OWNER | Club owner |
| ADMIN | Club manager |
| MEMBER | Standard club member |

### ClubJoinRequestStatus

| Value | Description |
| --- | --- |
| PENDING | Awaiting review |
| APPROVED | Approved by club admin |
| REJECTED | Rejected by club admin |
| CANCELLED | Cancelled by requester |

---

## Models

### User

Represents a platform user.

| Field | Type |
| --- | --- |
| id | String |
| name | String |
| email | String (Unique) |
| passwordHash | String |
| role | Role |
| profileImage | String? |
| referenceSelfie | String? |
| createdAt | DateTime |
| updatedAt | DateTime |

Relationships:

* Club memberships
* Club join requests
* Refresh tokens
* Created clubs
* Created events
* Uploaded media
* Comments
* Likes
* Favourites
* Notifications
* Tagged media
* Upload batches

### Club

Represents a club or society.

| Field | Type |
| --- | --- |
| id | String |
| name | String |
| description | String? |
| logoUrl | String? |
| createdById | String |
| createdAt | DateTime |

Relationships:

* Creator
* Members
* Join requests
* Events

### ClubMember

Many-to-many relationship between users and clubs.

| Field | Type |
| --- | --- |
| id | String |
| userId | String |
| clubId | String |
| role | ClubMemberRole |
| joinedAt | DateTime |

Constraints:

```text
UNIQUE(userId, clubId)
```

A user cannot join the same club twice.

### ClubJoinRequest

Represents a user's request to join a club.

| Field | Type |
| --- | --- |
| id | String |
| userId | String |
| clubId | String |
| status | ClubJoinRequestStatus |
| createdAt | DateTime |
| updatedAt | DateTime |
| reviewedAt | DateTime? |
| reviewedById | String? |

Constraints:

```text
UNIQUE(userId, clubId)
```

One join request per user per club.

### RefreshToken

Represents a stored refresh token for session rotation.

| Field | Type |
| --- | --- |
| id | String |
| userId | String |
| tokenHash | String |
| expiresAt | DateTime |
| revokedAt | DateTime? |
| createdAt | DateTime |

Relationships:

* User

### Event

Represents an event.

| Field | Type |
| --- | --- |
| id | String |
| title | String |
| description | String? |
| category | String |
| visibility | Visibility |
| location | String? |
| eventDate | DateTime |
| coverImage | String? |
| createdAt | DateTime |
| createdById | String |
| clubId | String? |

### UploadBatch

Represents a bulk upload session.

| Field | Type |
| --- | --- |
| id | String |
| uploadedById | String |
| eventId | String? |
| createdAt | DateTime |

### Media

Represents uploaded photos or videos.

| Field | Type |
| --- | --- |
| id | String |
| title | String? |
| fileUrl | String |
| thumbnailUrl | String? |
| fileType | String |
| fileSize | Int? |
| uploadedAt | DateTime |
| uploadedById | String |
| eventId | String |
| batchId | String? |
| aiTags | String[] |
| aiCaption | String? |
| pHash | String? |

### Comment

Represents comments on media.

| Field | Type |
| --- | --- |
| id | String |
| content | String |
| createdAt | DateTime |
| userId | String |
| mediaId | String |

### Like

Represents a like on media.

| Field | Type |
| --- | --- |
| id | String |
| userId | String |
| mediaId | String |
| createdAt | DateTime |

Constraints:

```text
UNIQUE(userId, mediaId)
```

A user can like a media item only once.

### Favourite

Represents saved media.

| Field | Type |
| --- | --- |
| id | String |
| userId | String |
| mediaId | String |
| createdAt | DateTime |

Constraints:

```text
UNIQUE(userId, mediaId)
```

A user can favourite a media item only once.

### MediaTag

Represents user tagging in media.

| Field | Type |
| --- | --- |
| id | String |
| mediaId | String |
| userId | String |
| createdAt | DateTime |

Constraints:

```text
UNIQUE(mediaId, userId)
```

A user can only be tagged once in a media item.

### Notification

Represents user notifications.

| Field | Type |
| --- | --- |
| id | String |
| userId | String |
| message | String |
| isRead | Boolean |
| createdAt | DateTime |

---

## Current Database Statistics

### Total Models

```text
13 Models
```

1. User
2. Club
3. ClubMember
4. ClubJoinRequest
5. RefreshToken
6. Event
7. UploadBatch
8. Media
9. Comment
10. Like
11. Favourite
12. MediaTag
13. Notification

---

## Future Schema Extensions

Planned future additions:

* FaceEmbedding
* AIImageTag
* Share
* DownloadHistory
* WatermarkConfig
* AuditLog
* ActivityFeed
* EventCategory

These will be added in later roadmap phases as required.

---

## Last Updated

Phase 10 - AI/ML Integration (Phases 5-10 implemented)
