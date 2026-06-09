# EventVault API Doc

Base path: `/api`

All successful responses use this shape:

```json
{
  "success": true,
  "message": "text",
  "data": {}
}
```

Errors return:

```json
{
  "success": false,
  "message": "text"
}
```

---

## Auth

### `POST /auth/register`
Create a new user.

Request body:

```json
{
  "name": "Aarav",
  "email": "aarav@example.com",
  "password": "secretpass123",
  "role": "VIEWER"
}
```

Allowed self-service roles: `VIEWER`, `PHOTOGRAPHER`, `CLUB_MEMBER`.

Response data:

```json
{
  "user": {},
  "tokens": {
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

### `POST /auth/login`
Login with email and password.

Request body:

```json
{
  "email": "aarav@example.com",
  "password": "secretpass123"
}
```

### `POST /auth/refresh`
Rotate a refresh token and return a new token pair.

Request body:

```json
{
  "refreshToken": "jwt"
}
```

### `POST /auth/logout`
Revoke a refresh token.

Request body:

```json
{
  "refreshToken": "jwt"
}
```

### `GET /auth/me`
Return the current authenticated user.

### `POST /auth/selfie`
Upload and index a calibration selfie to set up facial recognition for auto-tagging.

Multipart/form-data field:
* `file` (single image file)

Header:
```http
Authorization: Bearer <accessToken>
```

Response data:
```json
{
  "fileUrl": "https://eventvault-s3-bucket.s3.amazonaws.com/selfies/user-123.jpg"
}
```

---

## Clubs

### `GET /clubs`
List all clubs.

### `GET /clubs/me`
List clubs joined by the current user.

Header:

```http
Authorization: Bearer <accessToken>
```

### `POST /clubs`
Create a club.

Header:

```http
Authorization: Bearer <accessToken>
```

Request body:

```json
{
  "name": "Photography Club",
  "description": "Campus media club",
  "logoUrl": "https://example.com/logo.png"
}
```

### `GET /clubs/:clubId`
Fetch a single club.

### `PATCH /clubs/:clubId`
Update a club.

Header:

```http
Authorization: Bearer <accessToken>
```

### `DELETE /clubs/:clubId`
Delete a club.

Header:

```http
Authorization: Bearer <accessToken>
```

### `POST /clubs/:clubId/join`
Create a join request for the current user.

Header:

```http
Authorization: Bearer <accessToken>
```

### `POST /clubs/:clubId/join-requests`
Alias of `POST /clubs/:clubId/join`.

Header:

```http
Authorization: Bearer <accessToken>
```

### `GET /clubs/:clubId/join-requests`
List join requests for a club.

Header:

```http
Authorization: Bearer <accessToken>
```

### `PATCH /clubs/:clubId/join-requests/:requestId`
Approve or reject a join request.

Request body:

```json
{
  "status": "APPROVED"
}
```

### `GET /clubs/:clubId/members`
List club members.

### `PATCH /clubs/:clubId/members/:memberId/role`
Update a club member role.

Request body:

```json
{
  "role": "ADMIN"
}
```

### `DELETE /clubs/:clubId/members/:memberId`
Remove a club member.

### `POST /clubs/:clubId/leave`
Leave a club.

Header:

```http
Authorization: Bearer <accessToken>
```

---

## Permissions

- `POST /auth/register` and `POST /auth/login` are public.
- `POST /auth/refresh` and `POST /auth/logout` require a refresh token in the body.
- `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout`, and all club management routes require authentication.
- `POST /clubs`, `PATCH /clubs/:clubId`, `DELETE /clubs/:clubId`, join request review, member role updates, and member removal are manager actions.
- `GET /clubs` and `GET /clubs/:clubId` are public.

---

## Events

### `GET /events`
List events with optional query filters.

Query params:

- `sortBy` = `title`, `eventDate`, or `category`
- `sortOrder` = `asc` or `desc`
- `category`
- `clubId`
- `visibility` = `PUBLIC` or `PRIVATE`

### `GET /events/:eventId`
Fetch a single event by id.

### `POST /events`
Create an event.

Header:

```http
Authorization: Bearer <accessToken>
```

Request body:

```json
{
  "title": "Moonlight Concert",
  "description": "An outdoor performance under the lights.",
  "category": "Concert",
  "visibility": "PUBLIC",
  "location": "Central courtyard",
  "eventDate": "2026-06-08T18:30:00.000Z",
  "coverImage": "https://images.example.com/concert.jpg",
  "clubId": "club_123"
}
```

### `PATCH /events/:eventId`
Update an event.

Header:

```http
Authorization: Bearer <accessToken>
```

### `DELETE /events/:eventId`
Delete an event.

Header:

```http
Authorization: Bearer <accessToken>
```

---

## Media (Phases 5-6)

### `POST /media/events/:eventId/media`
Upload media files under an event album. Supported fields in multipart/form-data:
* `files` (array of file objects, up to 15 files)
* `title` (optional string title)

Header:
```http
Authorization: Bearer <accessToken>
```

### `GET /media/events/:eventId/media`
List all media files uploaded under a specific event album.

Header:
```http
Authorization: Bearer <accessToken>
```

### `DELETE /media/:mediaId`
Delete a specific media item.

### `GET /media/tagged`
Retrieve all media items where the logged-in user has been tagged via facial recognition matching.

Header:
```http
Authorization: Bearer <accessToken>
```

Response data:
```json
{
  "media": [
    {
      "id": "media-123",
      "title": "Opening Stage",
      "fileUrl": "/uploads/media-123.jpg",
      "aiTags": ["stage", "concert", "singer"],
      "aiCaption": "A fantastic opening stage featuring live singing.",
      "eventId": "event-123"
    }
  ]
}
```

---

## Social (Phase 7)

### `POST /media/:mediaId/like`
Toggle like status on a media item.

Header:
```http
Authorization: Bearer <accessToken>
```

### `GET /media/:mediaId/likes`
List likes and their total count on a media item.

### `POST /media/:mediaId/comments`
Post a comment on a media item.

Request body:
```json
{
  "content": "Lovely photo!"
}
```

Header:
```http
Authorization: Bearer <accessToken>
```

### `GET /media/:mediaId/comments`
List all comments on a media item.

### `DELETE /media/comments/:commentId`
Delete a specific comment.

Header:
```http
Authorization: Bearer <accessToken>
```

### `POST /media/:mediaId/favourite`
Toggle saving a media item to favourites.

Header:
```http
Authorization: Bearer <accessToken>
```

### `GET /media/me`
List all saved (favourited) media items for the current user.

Header:
```http
Authorization: Bearer <accessToken>
```

---

## Notifications (Phase 8)

### `GET /notifications`
Retrieve all notifications for the logged-in user. Supports WebSocket notifications broadcast.

Header:
```http
Authorization: Bearer <accessToken>
```

### `PATCH /notifications/:notificationId/read`
Mark a single notification as read.

Header:
```http
Authorization: Bearer <accessToken>
```

### `POST /notifications/read-all`
Mark all notifications of the current user as read.

Header:
```http
Authorization: Bearer <accessToken>
```

---

## Search & Discovery (Phase 9)

### `GET /search`
Perform full text search on events matching terms, with filters.

Query params:
* `q` = text query matching title/description
* `category` = match category
* `clubId` = match linked club ID
* `startDate` = filter events after date
* `endDate` = filter events before date
* `uploaderId` = filter by uploader ID
* `tag` = search by tag name

