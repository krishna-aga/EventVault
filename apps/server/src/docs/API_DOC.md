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

Header:

```http
Authorization: Bearer <accessToken>
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
