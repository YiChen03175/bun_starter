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

Edit `.env` and fill in your values. See the [Database](#database) section below for details.

3. **Start the development server**

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

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
```

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
