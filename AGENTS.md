# AGENTS.md

## Context Budget Rules

* Do not scan the entire repository unless explicitly asked.
* Read only files required for the current task.
* Before exploring additional directories, explain why they are needed.
* Prefer targeted file reads over repository-wide searches.
* Avoid reading generated files, build outputs, dist folders, and node_modules.

## Repository Structure

apps/web      - React frontend
apps/server   - Express backend
packages/db   - Prisma schema and database client

## Coding Rules

* Use TypeScript only.
* Follow existing code patterns.
* Make the smallest possible change.
* Do not refactor unrelated code.
* Do not create files unless necessary.

## Database

* Prisma schema is in packages/db/prisma/schema.prisma.
* Use Prisma Client for database access.
* Do not modify migrations unless requested.

## Before Making Changes

1. Identify exact files that need modification.
2. Read only those files.
3. Propose a brief plan.
4. Implement the smallest working solution.

## Forbidden

* Repository-wide rewrites.
* Unrequested dependency changes.
* Reading node_modules.
* Reading build artifacts.
* Large-scale refactors without approval.
