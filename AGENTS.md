# EventVault Handoff Brief

Use this file as the primary context source when continuing work on EventVault.
Read this first, then only open the exact files needed for the current task.

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

Current focus:

* Phase 5 - Media Management

Upcoming areas:

* Access control
* Social features
* Notifications
* Search and discovery
* AI features
* Cloud storage
* Watermarking

## 4. Architecture

Backend:

* Express
* TypeScript
* Prisma Client for database access

Frontend:

* React
* TypeScript
* Vite
* Custom EventVault dashboard, not a starter template look

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

## 6. Working Rules

* Read only the files needed for the task.
* Prefer targeted file reads over repository-wide scanning.
* Do not open `node_modules`, build outputs, or generated files unless strictly necessary.
* Make the smallest change that fully solves the task.
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
4. Implement the smallest working solution.
5. Update docs only if the feature or the user requested it.
6. Verify with the lightest useful check, such as typecheck or build for the affected package.

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

You can treat this repo as:

* a monorepo with a React frontend, Express backend, Prisma database layer, and shared contracts package
* a project currently past auth, clubs, and events
* a codebase where the next major area is media management

When starting a new task, first identify the exact files needed, then make the smallest safe change.

