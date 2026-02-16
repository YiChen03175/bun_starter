/**
 * Database seed script — creates test users (with loginable passwords) and bulk kanban data.
 *
 * Usage: bun run db:seed
 *
 * Test credentials:
 *   alice@test.com / password123
 *   bob@test.com   / password123
 *   carol@test.com / password123
 *
 * Idempotent: safe to run multiple times.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

// ── Env (runs outside Next.js — use process.env directly) ──────────────

const DATABASE_URL = process.env.DATABASE_URL;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
if (!BETTER_AUTH_SECRET) throw new Error("BETTER_AUTH_SECRET is not set");
if (!BETTER_AUTH_URL) throw new Error("BETTER_AUTH_URL is not set");

// ── DB + Auth instances (local to this script) ─────────────────────────

const client = postgres(DATABASE_URL);
const db = drizzle({ client, schema });

const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
});

// ── Seed data ──────────────────────────────────────────────────────────

const SEED_USERS = [
  { name: "Alice", email: "alice@test.com", password: "password123" },
  { name: "Bob", email: "bob@test.com", password: "password123" },
  { name: "Carol", email: "carol@test.com", password: "password123" },
];

const COLUMN_TITLES = ["Backlog", "To Do", "In Progress", "Review", "Done"];
const TASKS_PER_COLUMN = 50;

// ── Helpers ────────────────────────────────────────────────────────────

async function seedUser(user: (typeof SEED_USERS)[number]): Promise<string> {
  // Check if user already exists
  const existing = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, user.email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`  ✓ ${user.email} already exists (${existing[0].id})`);
    return existing[0].id;
  }

  // Create via Better Auth so password is properly hashed
  const result = await auth.api.signUpEmail({
    body: {
      name: user.name,
      email: user.email,
      password: user.password,
    },
  });

  console.log(`  + ${user.email} created (${result.user.id})`);
  return result.user.id;
}

async function seedColumnsAndTasks(userId: string, userName: string) {
  // Check if user already has columns (idempotent)
  const [existing] = await db
    .select({ n: count() })
    .from(schema.columns)
    .where(eq(schema.columns.userId, userId));

  if (existing.n > 0) {
    console.log(`  ✓ ${userName} already has ${existing.n} columns — skipping`);
    return;
  }

  // Insert columns
  const insertedColumns = await db
    .insert(schema.columns)
    .values(
      COLUMN_TITLES.map((title, i) => ({
        title,
        position: i,
        userId,
      })),
    )
    .returning({ id: schema.columns.id, title: schema.columns.title });

  console.log(`  + ${insertedColumns.length} columns created for ${userName}`);

  // Insert tasks (50 per column)
  const now = Date.now();
  const taskValues = insertedColumns.flatMap((col) =>
    Array.from({ length: TASKS_PER_COLUMN }, (_, i) => ({
      title: `Task ${col.title} #${i + 1}`,
      description:
        i % 3 === 0 ? `Description for task #${i + 1} in ${col.title}` : null,
      columnId: col.id,
      position: i,
      userId,
      createdAt: new Date(now - (TASKS_PER_COLUMN - i) * 3600_000),
      updatedAt: new Date(now - (TASKS_PER_COLUMN - i) * 3600_000),
    })),
  );

  await db.insert(schema.tasks).values(taskValues);
  console.log(`  + ${taskValues.length} tasks created for ${userName}`);
}

// ── Main ───────────────────────────────────────────────────────────────

console.log("\nSeeding database...\n");

console.log("Users:");
const userIds: { id: string; name: string }[] = [];
for (const user of SEED_USERS) {
  const id = await seedUser(user);
  userIds.push({ id, name: user.name });
}

console.log("\nColumns & Tasks:");
for (const { id, name } of userIds) {
  await seedColumnsAndTasks(id, name);
}

// Summary
const [userCount] = await db.select({ n: count() }).from(schema.user);
const [colCount] = await db.select({ n: count() }).from(schema.columns);
const [taskCount] = await db.select({ n: count() }).from(schema.tasks);

console.log("\n--- Summary ---");
console.log(`Users:   ${userCount.n}`);
console.log(`Columns: ${colCount.n}`);
console.log(`Tasks:   ${taskCount.n}`);
console.log("\nDone!\n");

await client.end();
