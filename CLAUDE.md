# Project Overview

Full-stack Next.js starter with Elysia API backend, type-safe end-to-end via Eden treaty.

## Stack

- **Runtime**: Bun
- **Framework**: Next.js (App Router, Turbopack)
- **API**: Elysia (runs inside Next.js API routes)
- **API Client**: Eden treaty (type-safe, auto-inferred from Elysia)
- **Database**: Neon (serverless Postgres) via Drizzle ORM; local dev uses `postgres.js` direct TCP connection
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Linting/Formatting**: Biome (no ESLint/Prettier)
- **Testing**: bun:test + Testing Library + happy-dom
- **Git Hooks**: Lefthook (pre-commit: lint + type-check, pre-push: validate + build)

## Commands

```bash
bun dev              # Start dev server (Turbopack)
bun run build        # Production build
bun run lint         # Check linting + formatting
bun run lint:fix     # Auto-fix lint + format issues
bun run format       # Format files with Biome
bun test             # Run all tests
bun test --watch     # Run tests in watch mode
bun run type-check   # TypeScript type checking (tsc --noEmit)
bun run validate     # Run lint + type-check + tests (run after every task)
bun run db:up        # Start local Postgres (Docker)
bun run db:down      # Stop local Postgres (Docker)
bun run db:push      # Push schema to database (no migration files)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run pending migrations
bun run db:studio    # Open Drizzle Studio GUI
```

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── api/[[...slugs]]/       # Elysia catch-all API route
│   ├── page.tsx                # Home page (server component)
│   └── <route>/
│       ├── page.tsx            # Route page (server component shell)
│       └── _components/        # Page-specific client components
├── components/ui/              # Shadcn UI components
├── lib/
│   ├── eden.ts                 # Eden treaty client (use this for API calls)
│   └── utils.ts                # Shadcn cn() helper
└── server/
    ├── db/
    │   ├── index.ts            # Drizzle + Neon connection
    │   └── schema.ts           # Database schema (single source of truth)
    ├── modules/<feature>/
    │   ├── index.ts            # Controller (Elysia instance with routes)
    │   ├── service.ts          # Business logic
    │   └── model.ts            # Elysia.t validation schemas
    └── index.ts                # Root Elysia app (composes all modules)

test/
├── setup/
│   ├── happy-dom.ts            # Preload: saves native Request, registers DOM globals
│   ├── testing-library.ts     # Preload: jest-dom matchers + cleanup
│   └── types.d.ts              # Bun matcher augmentation for jest-dom + __BunRequest global
├── helpers/
│   ├── elysia.ts               # createTestClient() — wraps Elysia .handle() with native Request
│   └── mock-db.ts              # Drizzle mock via Proxy + setQueryResult()
├── fixtures/                   # Shared mock data
├── server/modules/<feature>/   # Backend tests (controller + service)
└── app/<route>/_components/    # Frontend component tests
```

## Conventions

### Backend (Elysia DI Pattern)
- Each feature is a module in `src/server/modules/<name>/`
- **Model**: Define validation schemas with `Elysia.t`, register via `.model()` on a named Elysia plugin
- **Service**: Business logic — no HTTP context dependency
- **Controller**: Elysia instance as controller, inject models via `.use()`, compose into root app
- Use `Elysia.t` as single source of truth for types (not separate interfaces)
- Name plugins (`{ name: "Feature.Model" }`) to enable deduplication

### Database
- Schema defined in `src/server/db/schema.ts` using Drizzle `pgTable`
- Use `$inferInsert` / `$inferSelect` for TypeScript types

#### Local Database
- Set up Postgres locally via Docker: `docker compose up -d` (uses `compose.yaml` in project root)
- Set `NEON_LOCAL=true` in `.env` to use `postgres.js` (direct TCP) instead of Neon HTTP driver
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/main` (default local credentials)
- To switch to cloud Neon: unset `NEON_LOCAL` and set `DATABASE_URL` to your cloud connection string
- **No branching support** — local Postgres is a single database; branching is a Neon cloud-only feature

#### Schema Migration Workflow
- Check whether you're on **local Postgres** or **cloud Neon** — the workflow differs:

**Local Postgres** (no branching):
1. Iterate on schema with `bun run db:push` (fast, no migration files)
2. When the task is done and code is final, generate a migration: `bun run db:generate`
3. Review the generated SQL in `/drizzle`
4. Apply it: `bun run db:migrate`
5. Commit the migration file with the feature

**Cloud Neon** (with branching):
1. Create a branch: `neonctl branches create --name feature-x`
2. Set `DATABASE_URL` to the branch connection string
3. Iterate on schema with `bun run db:push` on the branch (safe — main is untouched)
4. When done, generate a migration: `bun run db:generate`
5. Switch `DATABASE_URL` back to main, apply: `bun run db:migrate`
6. Delete the branch: `neonctl branches delete feature-x`
7. Commit the migration file with the feature

- **Rule**: `db:push` is for prototyping only. Always produce a migration file (`db:generate`) before considering a schema change complete.
- Neon CLI reference: [neonctl docs](https://neon.com/docs/reference/neon-cli)

### Frontend
- Eden client at `src/lib/eden.ts` — all API calls are fully type-safe
- **Server components by default** — only add `"use client"` where interactivity is needed
- **`_components/` convention** — colocate page-specific components in a private folder next to the page
- Use `bunx --bun shadcn@latest add <component>` to add new Shadcn components
- Biome handles formatting and linting — run `bun run lint:fix` before committing

### Testing
- **Framework**: `bun:test` with happy-dom for DOM simulation
- **Backend tests**: Use `createTestClient()` from `test/helpers/elysia.ts` for controller tests; mock services via `bun:test` `mock.module()`; mock DB via `test/helpers/mock-db.ts` for service tests
- **Frontend tests**: React Testing Library for component tests
- **Test location**: Mirror source structure under `test/` (e.g., `test/server/modules/todo/`)
- **Preload scripts**: Configured in `bunfig.toml` — happy-dom globals (with native Request preservation), jest-dom matchers
- **Helpers** (`test/helpers/`): `elysia.ts` (test client for Elysia `.handle()`), `mock-db.ts` (Drizzle mock with `setQueryResult()`)
- **Fixtures** (`test/fixtures/`): Shared mock data — import in tests instead of defining inline

### Validation
- **`bun run validate`**: Run after every task — lint + type-check + tests
- **Pre-commit** (automatic): `biome check --write` on staged files + `tsc --noEmit` (in parallel)
- **Pre-push** (automatic): `bun run validate` + `bun run build` — full verification before pushing
- **Auto-fix**: Biome fixes are re-staged automatically (`stage_fixed: true`)
- **Bypass**: Use `--no-verify` to skip hooks when needed
- **Setup**: Lefthook hooks install automatically via `prepare` script on `bun install`

### Adding a New API Module
1. Create `src/server/modules/<name>/model.ts` — define Elysia.t schemas
2. Create `src/server/modules/<name>/service.ts` — implement business logic
3. Create `src/server/modules/<name>/index.ts` — wire routes as Elysia controller
4. Register in `src/server/index.ts` via `.use()`
5. Add database table in `src/server/db/schema.ts` if needed, then `bun run db:push`

### Adding a New Page
1. Create `src/app/<route>/page.tsx` — server component shell
2. Create `src/app/<route>/_components/` — colocated client components
3. Keep server/client boundary clear: page.tsx is server, interactive parts in `_components/`
4. Add tests in `test/app/<route>/_components/`

### Updating This File (CLAUDE.md)
- **When to update**: After any fundamental change — new folder structure, new infrastructure (e.g., test framework, CI), new conventions, new commands, or dependency changes that affect workflow
- **When NOT to update**: Bug fixes, feature implementation within existing patterns, or minor refactors that don't change conventions
- **Timing**: Always update CLAUDE.md as the **last step**, after all code changes pass `bun run validate`. Validation may fail and require code changes, so update docs only once the code is final.
