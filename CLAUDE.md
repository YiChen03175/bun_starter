# Project Overview

Full-stack Next.js starter with Elysia API backend, type-safe end-to-end via Eden treaty.

## Stack

- **Runtime**: Bun
- **Framework**: Next.js (App Router, Turbopack)
- **API**: Elysia (runs inside Next.js API routes)
- **API Client**: Eden treaty (type-safe, auto-inferred from Elysia)
- **Database**: Neon (serverless Postgres) via Drizzle ORM; local dev uses `postgres.js` direct TCP connection
- **Auth**: Better Auth (email/password + Google/GitHub OAuth) with Elysia integration
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Linting/Formatting**: Biome (no ESLint/Prettier)
- **Env Validation**: @t3-oss/env-nextjs + Zod
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
bun run test:coverage # Run tests with coverage report
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
├── env.ts                      # Validated env vars (import from @/env)
├── lib/
│   ├── auth-client.ts          # Better Auth client (signIn, signUp, signOut, useSession)
│   ├── eden.ts                 # Eden treaty client (use this for API calls)
│   └── utils.ts                # Shadcn cn() helper
├── proxy.ts                    # Next.js proxy (auth redirects, uses getSessionCookie)
└── server/
    ├── auth.ts                  # Better Auth server instance (infrastructure, not a module)
    ├── db/
    │   ├── index.ts            # Drizzle + Neon connection
    │   └── schema.ts           # Database schema (single source of truth)
    ├── errors/
    │   ├── http.ts             # Custom error classes (UnauthorizedError, ForbiddenError, ConflictError)
    │   └── index.ts            # Error handler Elysia plugin + re-exports
    ├── plugins/
    │   └── auth.ts              # Elysia Better Auth plugin (mount + `auth` macro)
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
│   ├── mock-auth.ts            # Mocks @/server/auth for controller tests with auth
│   └── mock-db.ts              # Drizzle mock via Proxy + setQueryResult()
├── fixtures/                   # Shared mock data (todo.ts, auth.ts)
├── server/modules/<feature>/   # Backend tests (controller + service)
└── app/<route>/_components/    # Frontend component tests
```

## Conventions

### Imports
- **Always use path aliases** (`@/*` for `src/*`, `test/*` for `test/*`) — never use relative imports (`../`) across directory boundaries
- Same-directory imports (`./model`, `./service`) are fine as-is

### Backend (Elysia DI Pattern)
- Each feature is a module in `src/server/modules/<name>/`
- **Model**: Define validation schemas with `Elysia.t`, register via `.model()` on a named Elysia plugin
- **Service**: Business logic — no HTTP context dependency
- **Controller**: Elysia instance as controller, inject models via `.use()`, compose into root app
- **HTTP status codes**: Use proper code (e.g. `201` for resource creation, `404` for not found) — don't default everything to 200
- Use `Elysia.t` as single source of truth for types (not separate interfaces)
- Name plugins (`{ name: "Feature.Model" }`) to enable deduplication

### Authentication (Better Auth)
- **Server instance**: `src/server/auth.ts` — configures Better Auth with Drizzle adapter, email/password, and Google/GitHub OAuth
- **Elysia plugin**: `src/server/plugins/auth.ts` — `.mount(auth.handler)` exposes all `/api/auth/*` routes, and defines an `auth` macro for route protection
- **Protecting routes**: Add `{ auth: true }` to any Elysia route options — the macro resolves `user` and `session` from the request headers (returns 401 if unauthenticated)
- **Client**: `src/lib/auth-client.ts` exports `signIn`, `signUp`, `signOut`, `useSession` from Better Auth's React client
- **Proxy**: `src/proxy.ts` — handles auth redirects (uses `getSessionCookie` from `better-auth/cookies`): redirects authenticated users away from `/login`/`/signup`, and unauthenticated users away from protected pages (e.g., `/todos`)
- **Protecting a new feature end-to-end**:
  1. **API**: Add `{ auth: true }` to route options, destructure `user` in handlers, pass `user.id` to service methods
  2. **Service**: Add `userId` parameter to methods, scope queries with `eq(table.userId, userId)` (use `and()` for compound where on update/delete)
  3. **Page**: Add the route prefix to `protectedPages` array in `src/proxy.ts` (uses `startsWith` matching — sub-paths are automatically protected) and to `config.matcher`
  4. **Schema**: Add `userId` column with `.references(() => user.id, { onDelete: "cascade" })` and an index

### Environment Variables
- **Centralized validation**: All env vars are defined in `src/env.ts` using `@t3-oss/env-nextjs` + Zod
- **Import from `@/env`** — never use `process.env` directly in application code (exception: `drizzle.config.ts` runs outside Next.js)
- **Adding a new env var**: add schema in `src/env.ts`, add to `runtimeEnv`, update `.env.example` and `.env.test`
- **Server/client boundary**: server vars are only accessible in server code; client vars must be prefixed with `NEXT_PUBLIC_`
- **Build-time validation**: `next.config.ts` imports `src/env.ts` so missing vars fail the build early
- **Tests**: `SKIP_ENV_VALIDATION=1` in `.env.test` bypasses validation during test runs
- **Zod scope**: Zod is used **only** for env validation in `src/env.ts` — use `Elysia.t` (TypeBox) for all API/request/response validation

### Error Handling

#### Backend
- Error handler plugin at `src/server/errors/` — registered via `.use(errorHandler)` in root app
- Custom error classes in `src/server/errors/http.ts` — extend `Error` with a `status` property
- Register custom errors via `.error()` for type narrowing in `.onError()`
- Services throw `NotFoundError` (from Elysia) or custom errors from `src/server/errors/http.ts`
- Adding a new error: define class in `http.ts`, register in `errors/index.ts`, handle in the `switch`

#### Frontend
- `src/app/error.tsx` — root error boundary for uncaught rendering errors
- `src/app/not-found.tsx` — root 404 page for unmatched routes
- Client components: check Eden `{ data, error }` responses, show error state in UI

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
- **Error handling**: Always check Eden `{ data, error }` responses; show error state in UI
- **Async operations**: `"use client"` components should handle loading/disabled states (e.g., `submitting` state in forms)
- Use `cn()` from `@/lib/utils` for conditional classNames (not template literal concatenation)
- **`_components/` convention** — colocate page-specific components in a private folder next to the page
- Use `bunx --bun shadcn@latest add <component>` to add new Shadcn components
- `src/components/ui/` is generated code — Biome (linting, formatting, import sorting) and test coverage are all disabled for this folder
- Biome handles formatting and linting — run `bun run lint:fix` before committing

#### React 19 Type Guidelines
- **Event types**: Use specific event types — `FormEvent` is deprecated. Use `SubmitEvent` (form submit), `ChangeEvent` (input change), `InputEvent` (input event), or `SyntheticEvent` (generic)
- **Refs**: Use `Ref<T>` (not `LegacyRef`), `ComponentRef<C>` (not `ElementRef`), `RefObject<T>` (not `MutableRefObject`)
- **Keyboard events**: Use `onKeyDown`/`onKeyUp` — `onKeyPress` is deprecated. Use `e.key` instead of `e.keyCode`/`e.charCode`
- **No `propTypes`**: Rely on TypeScript for type checking — `propTypes` property is deprecated

### Testing
- **Framework**: `bun:test` with happy-dom for DOM simulation
- **Backend tests**: Use `createTestClient()` from `test/helpers/elysia.ts` for controller tests; mock services via `bun:test` `mock.module()`; mock DB via `test/helpers/mock-db.ts` for service tests; import `test/helpers/mock-auth.ts` before importing the app when testing auth-protected routes
- **Frontend tests**: React Testing Library + `userEvent` for component tests
- **Coverage**: Write tests for both happy path and error cases (e.g., not-found returning 404); mock services conditionally (e.g., throw `NotFoundError` for specific IDs) to test error paths through controllers
- **Test location**: Mirror source structure under `test/` (e.g., `test/server/modules/todo/`)
- **Preload scripts**: Configured in `bunfig.toml` — happy-dom globals (with native Request preservation), jest-dom matchers
- **Helpers** (`test/helpers/`): `elysia.ts` (test client for Elysia `.handle()`), `mock-db.ts` (Drizzle mock with `setQueryResult()`)
- **Fixtures** (`test/fixtures/`): Shared mock data — import in tests instead of defining inline
- **Coverage**: `bun run test:coverage` — prints per-file function and line coverage to the terminal; Shadcn UI components (`src/components/ui/`), env validation (`src/env.ts`), DB schema (`src/server/db/schema.ts`), and test infrastructure (`test/setup/`, `test/helpers/`, `test/fixtures/`) are excluded via `coveragePathIgnorePatterns` in `bunfig.toml`

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

### Common Pitfalls
- **Prefer official CLIs and generators over manual implementation.** When a library provides a CLI to generate config, schema, boilerplate, or migrations, always use it instead of writing by hand. Manual implementations drift silently when the library updates. Examples: `@better-auth/cli generate` for auth schema, `bunx --bun shadcn@latest add` for UI components, `drizzle-kit generate` for migrations.
- **Check docs for the recommended setup path before implementing.** Libraries often have a specific "getting started" flow (CLI commands, generators, adapters). Follow that flow rather than reverse-engineering the expected output. If the docs say "run this command", run it — don't replicate what the command would produce.
- **Elysia plugin lifecycle hooks are encapsulated by default.** `onError`, `onBeforeHandle`, etc. defined inside a plugin only affect routes within that plugin instance. They do NOT automatically apply to routes defined on the parent or sibling plugins. To propagate hooks outward, use `{ as: "scoped" }` (one level up) or `{ as: "global" }` (all levels). When writing tests for a plugin's `onError`, define test routes directly on the same Elysia chain after `.use(plugin)` — do NOT put them in a separate `new Elysia()` passed via `.use()`.
- **Elysia's `t` (TypeBox) is not a static property on the class.** Use `import { t } from "elysia"` as a named export, not `Elysia.t`. The latter is only available on an Elysia instance (e.g., inside `.post()` body schemas), not from the class itself.

### Updating This File (CLAUDE.md)
- **When to update**: After any fundamental change — new folder structure, new infrastructure (e.g., test framework, CI), new conventions, new commands, or dependency changes that affect workflow
- **When NOT to update**: Bug fixes, feature implementation within existing patterns, or minor refactors that don't change conventions
- **Timing**: Always update CLAUDE.md as the **last step**, after all code changes pass `bun run validate`. Validation may fail and require code changes, so update docs only once the code is final.
