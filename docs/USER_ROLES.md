# EventVault User Roles & Permissions

EventVault implements a hybrid, granular access control system split into **Platform Roles** (global scope) and **Club Membership Roles** (club-specific scope).

---

## 1. Platform Roles (`Role` Enum)

Platform roles define global capabilities across the EventVault platform. They are assigned upon registration and determine a user's baseline permissions.

| Role | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **`ADMIN`** (Super Admin) | Global | • Complete system administration override.<br>• Implicit membership in all clubs (bypasses private checks).<br>• View, approve, or reject club join requests for any club.<br>• Promote/demote club members and remove them.<br>• Delete any media item or comment.<br>• *"Join Club"* options are hidden (as they are global managers). |
| **`PHOTOGRAPHER`** | Global | • Standard uploading permissions.<br>• Access to drag-and-drop event album upload zones.<br>• Automated image analysis suggestions (captions and labels recommendation). |
| **`CLUB_MEMBER`** | Global | • Can request to join clubs.<br>• Can upload media to events of clubs they belong to. |
| **`VIEWER`** | Global (Read-only) | • Baseline self-service role.<br>• View public events, streams, and media.<br>• Like, comment, and bookmark (favourite) media files.<br>• Restricted from event creation, media uploads, and club management. |

---

## 2. Club Membership Roles (`ClubMemberRole` Enum)

Club membership roles are scoped strictly within a specific club. A user can have different membership roles in different clubs.

| Role | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **`OWNER`** | Local (Club) | • Created the club.<br>• Full administrative ownership.<br>• Review (approve/reject) club join requests.<br>• Update club details.<br>• Promote members to `ADMIN` or demote them to `MEMBER`.<br>• Remove any member from the club. |
| **`ADMIN`** | Local (Club) | • Club administrative assistant.<br>• Review (approve/reject) club join requests.<br>• Remove normal `MEMBER` tier users from the club. |
| **`MEMBER`** | Local (Club) | • Standard club participant.<br>• Upload media items to events linked to this club.<br>• Access private events scheduled by the club. |

---

## 3. Fine-Grained Access Controls

### A. Private Event Visibility & Uploads
* A private event's albums and media can **only** be accessed, viewed, or uploaded to by:
  1. The platform **`ADMIN`** (Super Admin).
  2. Any club member belonging to the hosting club (possessing `MEMBER`, `ADMIN`, or `OWNER` club role).
* Standard platform users who are not club members will see access restricted.

### B. Media Deletion Rules
A media item can only be deleted from storage and database by:
1. The user who uploaded the media item (`uploadedById`).
2. The user who created the event album.
3. A Club Manager of the hosting club (`OWNER` or `ADMIN`).
4. The platform **`ADMIN`** (Super Admin).

### C. Comment Deletion Rules
A comment can only be deleted by:
1. The creator of the comment (`userId`).
2. The uploader of the parent media file.
3. The platform **`ADMIN`** (Super Admin).

### D. Download Watermarking
* When a user downloads a photo, a custom text watermark is dynamically overlaid.
* The watermark string contains the user's platform role formatted in Title Case:
  * `Role: Admin`
  * `Role: Photographer`
  * `Role: Club Member`
  * `Role: Viewer`
