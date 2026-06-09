# EventVault Handoff Brief


## 1. Project Overview

EventVault is a monorepo for an event and media management platform.

The product serves clubs, photographers, organizers, and members.

Core goals:

* manage clubs and memberships
* create and manage events
* upload and organize media
* discover event content
* support social interactions and notifications

## 2. Repository Layout

* `apps/web` - React frontend
* `apps/server` - Express backend
* `packages/db` - Prisma schema and database client
* `packages/contracts` - Shared TypeScript types and API contracts
* `docs` - Roadmap, status, schema, and project notes

## 3. Current State

Completed phases:

* Phase 1 - Foundation
* Phase 2 - Authentication and Authorization
* Phase 3 - Club Management
* Phase 4 - Event Management
* Phase 5 - Media Management
* Phase 6 - Access Control
* Phase 7 - Social Features
* Phase 8 - Notifications
* Phase 9 - Search & Discovery
* Phase 10 - AI/ML Features
* Phase 11 - Cloud Storage (AWS S3)
* Phase 12 - Watermarking (Implemented: uses Jimp to dynamically watermark downloads for `VIEWER` users. Clean files are kept; downloads endpoint is `/api/media/:mediaId/download`. Viewer role is served signed watermark URLs, restricted from creating events/clubs, and restricted from uploading media.)

Recent Hotfixes:
* Moved the Category select dropdown from the Media Upload preview card section to the Event Creation modal. Category draft default value is now "Concert".

Terminal Limitations:
* Workspace-wide check-types/builds might be slow or timeout in this terminal environment. Prefer checking changes package-specifically or utilizing incremental compilation where supported.

## 4. Architecture

Backend:

* Express
* TypeScript
* Prisma Client for database access (Neon PostgreSQL)

Frontend:

* React
* TypeScript
* Vite
* Custom EventVault glassmorphic dashboard (dark theme)

Shared code:

* `packages/db` for Prisma schema and DB client
* `packages/contracts` for shared request/response types

Environment:

* Root `.env` is used across the monorepo

## 5. Important Files

Backend:

* `apps/server/src/routes`
* `apps/server/src/modules/auth`
* `apps/server/src/modules/clubs`
* `apps/server/src/modules/events`
* `apps/server/src/modules/media` (Includes `media.service.ts`, `media.controller.ts`, and download endpoint)
* `apps/server/src/common/utils/watermark.util.ts` (Jimp watermark drawing logic)
* `apps/server/src/docs/API_DOC.md`

Frontend:

* `apps/web/src/App.tsx`
* `apps/web/src/App.css`
* `apps/web/src/index.css`
* `apps/web/src/lib/api.ts`

Database:

* `packages/db/prisma/schema.prisma`
* `packages/db/src/index.ts`

Shared contracts:

* `packages/contracts/src/index.ts`

Docs:

* `docs/PROJECT_ROADMAP.md`
* `docs/PROJECT_STATUS.md`
* `docs/DATABASE_SCHEMA.md`
* `docs/AGENTS.md`

## 6. Working Rules

* Read only the files needed for the task.
* Prefer targeted file reads over repository-wide scanning.
* Do not open `node_modules`, build outputs, or generated files unless strictly necessary.
* Follow existing code style and patterns.
* Use TypeScript.
* Avoid unrelated refactors.
* Avoid unrequested dependency changes.
* Do not modify migrations unless explicitly asked.

## 7. Database Rules

* Prisma schema lives in `packages/db/prisma/schema.prisma`.
* Use Prisma Client for database access.
* If a feature needs schema support, update the Prisma schema minimally.
* Do not assume the schema already supports a feature without checking.

## 8. Change Workflow

1. Identify the exact files that need to change.
2. Read only those files.
3. Make a brief plan if the task is non-trivial.
4. Update docs only if the feature or the user requested it.
5. Verify with the lightest useful check, such as typecheck or build for the affected package.

## 9. Documentation Rules

If project status changes, update the matching docs directly.

Relevant docs:

* `docs/PROJECT_ROADMAP.md`
* `docs/PROJECT_STATUS.md`
* `docs/DATABASE_SCHEMA.md`

## 10. Safety Boundaries

Do not:

* rewrite the repository broadly
* scan unrelated folders out of curiosity
* delete or reset user work
* make large-scale refactors without approval
* change dependencies unless the task requires it

## 11. What Good Looks Like

The best agent behavior for this repo is:

* precise
* minimal
* careful with context
* consistent with the current architecture
* clear about what changed and why
* respectful of existing work

## 12. Suggested Prompt To Continue Work

You are handed off a monorepo platform EventVault.
- Frontend React is under `apps/web`, backend Express is under `apps/server`.
- Prisma database uses Neon DB with schema in `packages/db/prisma/schema.prisma`.
- Phase 12 Watermarking is complete.
- The Category Dropdown menu hotfix has been completed: it is removed from the bulk upload page preview grid, and integrated as a `<select>` dropdown inside the Event Creation/Edit Modal mapping over `CATEGORIES` (excluding "all").
- The default category draft starts as `"Concert"`.

To continue:
1. Start the development server (`pnpm dev`) if the environment allows.
2. Validate UI event creation behavior and ensure the Category dropdown persists the selected category correctly.


