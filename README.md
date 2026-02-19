# Bun Starter

Full-stack Next.js starter with Elysia API backend, type-safe end-to-end via Eden treaty.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Docker](https://www.docker.com/) (for local database)

## Setup

1. **Install dependencies**

```bash
bun install
```

2. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in your values. Required variables include `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. OAuth provider credentials (`GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, etc.) are optional. See the [Database](#database) section below for details.

3. **Start the development server**

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Next.js](https://nextjs.org/) (App Router + Turbopack)
- **API**: [Elysia](https://elysiajs.com/) (runs inside Next.js API routes)
- **API Client**: [Eden treaty](https://elysiajs.com/eden/overview) + [eden-tanstack-react-query](https://github.com/ap-1/eden-tanstack-react-query) (type-safe, auto-inferred from Elysia)
- **Data Fetching**: [TanStack React Query](https://tanstack.com/query) (caching, deduplication, background revalidation)
- **Database**: [Neon](https://neon.tech/) (serverless Postgres) via [Drizzle ORM](https://orm.drizzle.team/); local dev uses `postgres.js` direct TCP
- **Auth**: [Better Auth](https://www.better-auth.com/) (email/password + Google/GitHub OAuth)
- **Env Validation**: [@t3-oss/env-nextjs](https://env.t3.gg/) + Zod
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) ([Base UI](https://base-ui.com/) primitives)
- **Linting/Formatting**: [Biome](https://biomejs.dev/) (no ESLint/Prettier)
- **Testing**: `bun:test` + [Testing Library](https://testing-library.com/) + [happy-dom](https://github.com/nicedoc/happy-dom)
- **Git Hooks**: [Lefthook](https://github.com/evilmartians/lefthook) (pre-commit: lint + type-check, pre-push: validate + build)

## Project Structure

```
scripts/
└── seed.ts                       # Database seed script
specs/
└── <XX##-feature-name>/          # Feature specifications (e.g., KB01-kanban-board)
    └── spec.md                   # Acceptance scenarios, entities, decisions
src/
├── app/                        # Next.js App Router pages
│   ├── api/[[...slugs]]/       # Elysia catch-all API route
│   ├── (public)/               # Route group for unauthenticated pages (no sidebar)
│   │   ├── page.tsx            # Home page (server component)
│   │   ├── login/              # Login page + components
│   │   └── signup/             # Signup page + components
│   └── (authenticated)/        # Route group for authenticated pages (with sidebar)
│       ├── layout.tsx          # Sidebar + SidebarInset layout
│       ├── _components/        # Shared authenticated components (app-sidebar, nav-user)
│       └── <route>/
│           ├── page.tsx        # Route page (server component shell)
│           └── _components/    # Page-specific client components
├── components/ui/              # Shadcn UI components
├── env.ts                      # Validated env vars (@t3-oss/env-nextjs + Zod)
├── hooks/                      # Custom React hooks (e.g., use-mobile)
├── lib/
│   ├── auth-client.ts          # Better Auth React client (signIn, signUp, signOut, useSession)
│   ├── eden.ts                 # Eden treaty client + React Query hooks (see comments in file)
│   └── utils.ts                # Shadcn cn() helper
├── proxy.ts                    # Next.js middleware (auth redirects)
└── server/
    ├── auth.ts                  # Better Auth server instance
    ├── db/
    │   ├── index.ts            # Drizzle + Neon connection
    │   └── schema.ts           # Database schema (single source of truth)
    ├── errors/
    │   ├── http.ts             # Custom error classes (UnauthorizedError, ForbiddenError, ConflictError)
    │   └── index.ts            # Error handler Elysia plugin + re-exports
    ├── logger.ts                # Pino logger (via @bogeychan/elysia-logger)
    ├── plugins/
    │   └── auth.ts              # Elysia auth plugin (mount + auth macro)
    ├── modules/<feature>/
    │   ├── index.ts            # Controller (Elysia instance with routes)
    │   ├── service.ts          # Business logic
    │   └── model.ts            # Elysia.t validation schemas
    └── index.ts                # Root Elysia app (composes all modules)

test/
├── setup/                      # Preload scripts (happy-dom, jest-dom)
├── helpers/
│   ├── elysia.ts               # createTestClient() for controller tests
│   ├── eden-query.tsx          # Test EdenProvider + createQueryWrapper() for React Query
│   ├── mock-auth.ts            # Mocks auth for controller tests with auth
│   ├── mock-db.ts              # Drizzle mock via Proxy + setQueryResult()
│   └── mock-logger.ts          # Suppresses logger output in tests
├── fixtures/                   # Shared mock data
├── hooks/                      # Hook tests
├── server/
│   ├── errors/                 # Error handler + custom error tests
│   ├── modules/<feature>/      # Backend tests (controller + service)
│   └── plugins/                # Plugin tests (auth, proxy)
├── app/(public)/               # Public page tests
└── app/(authenticated)/        # Authenticated page + component tests
```

## Database

This project uses [Neon](https://neon.tech/) (serverless Postgres) with [Drizzle ORM](https://orm.drizzle.team/). It supports two modes — **local** and **cloud** — that you can switch between by toggling environment variables. No code changes needed.

### Local Development

Local development connects directly to Postgres via `postgres.js` (TCP) — no cloud account or internet required. A `compose.yaml` is included in the project root.

```bash
bun run db:up
```

Then configure your `.env` and push the schema:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/main
NEON_LOCAL=true
```

```bash
bun run db:push
```

### Cloud (Direct Connection)

To connect directly to your cloud Neon database, remove or comment out `NEON_LOCAL` and set `DATABASE_URL` to your cloud connection string:

```env
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
# NEON_LOCAL=true
```

### Branching (Cloud Only)

When using cloud Neon, you can use [database branching](https://neon.com/docs/introduction/branching) to safely develop schema changes without affecting your main database. Branches are copy-on-write — cheap to create and isolated from main.

Install the [Neon CLI](https://neon.com/docs/reference/neon-cli), then:

```bash
# Create a branch for your feature
neonctl branches create --name feature-x

# Set DATABASE_URL to the branch connection string and iterate
bun run db:push

# When schema is finalized, generate a migration file
bun run db:generate

# Switch DATABASE_URL back to main and apply
bun run db:migrate

# Clean up
neonctl branches delete feature-x
```

> **Note:** Branching is a Neon cloud feature. Local Postgres runs a single database with no branching support.

### Switching Between Local and Cloud

| Variable | Local | Cloud |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/main` | Neon cloud connection string |
| `NEON_LOCAL` | `true` | unset or removed |

Switch by updating these two variables in `.env` and restarting the dev server.

## Scripts

```bash
bun dev               # Start dev server (Turbopack)
bun run build         # Production build
bun run lint          # Check linting + formatting
bun run lint:fix      # Auto-fix lint + format issues
bun run format        # Format files with Biome
bun test              # Run all tests
bun test --watch      # Run tests in watch mode
bun run type-check    # TypeScript type checking
bun run validate      # Run lint + type-check + tests
bun run db:up         # Start local Postgres (Docker)
bun run db:down       # Stop local Postgres (Docker)
bun run db:push       # Push schema to database
bun run db:generate   # Generate migration files
bun run db:migrate    # Run pending migrations
bun run db:studio     # Open Drizzle Studio GUI
bun run db:seed       # Seed database with sample data
bun run test:coverage # Run tests with coverage report
```

## Testing

```bash
bun test              # Run all tests
bun test --watch      # Run tests in watch mode
```

Tests mirror the source structure under `test/`. Backend tests use `createTestClient()` from `test/helpers/elysia.ts` for controller tests and `setQueryResult()` from `test/helpers/mock-db.ts` for service tests. Frontend tests use React Testing Library. Shared mock data lives in `test/fixtures/`.

All tests follow **BDD style** (Given-When-Then) without Cucumber — use descriptive `// Given`, `// When`, `// Then` comments as behavior specs and `"should [outcome] when [condition]"` naming. Each test starts with an `// Acceptance: XX##-USx.x` comment (feature code prefix + bare spec ID) linking it back to the spec's acceptance scenario:

```typescript
it("should return the created column", async () => {
  // Acceptance: KB01-US1.3
  // Given valid column data
  setQueryResult([mockColumn]);

  // When the service creates a column with title "To Do"
  const col = await ColumnService.create("To Do", userId);

  // Then the column should be persisted and returned
  expect(col).toEqual(mockColumn);
});
```

A `.env.test` file sets `LOG_LEVEL=silent` to suppress log output during tests.

## Development Workflow

- Run `bun run validate` after every change — this runs lint + type-check + tests
- **Git hooks** (via [Lefthook](https://github.com/evilmartians/lefthook)):
  - **Pre-commit**: `biome check --write` on staged files + `tsc --noEmit` (in parallel)
  - **Pre-push**: `bun run validate` + `bun run build`
- [Biome](https://biomejs.dev/) handles both formatting and linting — no ESLint or Prettier needed

## Adding Features

### New API module

1. Create `src/server/modules/<name>/model.ts` — Elysia.t validation schemas
2. Create `src/server/modules/<name>/service.ts` — business logic
3. Create `src/server/modules/<name>/index.ts` — Elysia controller with routes
4. Register in `src/server/index.ts` via `.use()`
5. Add database table in `src/server/db/schema.ts` if needed, then `bun run db:push`

### New page

- **Public pages** (no auth): Create under `src/app/(public)/<route>/`
- **Authenticated pages** (with sidebar): Create under `src/app/(authenticated)/<route>/`
1. Create `page.tsx` — server component shell
2. Create `_components/` — colocated client components
3. Keep server/client boundary clear: page.tsx is server, interactive parts in `_components/`
4. Add tests mirroring the source structure under `test/app/`

## Advanced: Neon Local

If you need per-git-branch database branching tied to your cloud Neon project, you can use [Neon Local](https://neon.com/docs/local/neon-local) instead of the plain Postgres setup above. Neon Local runs a Docker container that proxies `localhost:5432` to your cloud Neon project and automatically creates/switches database branches based on your current git branch.

**Requirements**: A [Neon](https://neon.tech/) cloud account, `NEON_API_KEY`, and `NEON_PROJECT_ID`.

<details>
<summary>Neon Local compose.yaml</summary>

```yaml
services:
  db:
    image: neondatabase/neon_local:latest
    ports:
      - "5432:5432"
    environment:
      NEON_API_KEY: ${NEON_API_KEY}
      NEON_PROJECT_ID: ${NEON_PROJECT_ID}
      DELETE_BRANCH: true
    volumes:
      - ./.neon_local/:/tmp/.neon_local
      - ./.git/HEAD:/tmp/.git/HEAD:ro,consistent
```

</details>

See the [Neon Local docs](https://neon.com/docs/local/neon-local) and [Neon Local GitHub](https://github.com/neondatabase/neon_local) for more details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Elysia Documentation](https://elysiajs.com/)
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
