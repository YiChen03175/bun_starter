import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { env } from "@/env";
import * as schema from "./schema";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

let _db: Database | null = null;

// Uses require() intentionally — the sync Proxy pattern depends on synchronous
// module loading. Bun supports require() natively, and switching to async import()
// would break Drizzle's chainable query builder API (e.g. db.select().from().where()).
function createDb(): Database {
  if (env.NEON_LOCAL) {
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");
    return drizzle({ client: postgres(env.DATABASE_URL), schema });
  }

  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  return drizzle({ client: neon(env.DATABASE_URL), schema });
}

export function getDb(): Database {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export const db = new Proxy({} as Database, {
  get(_, prop) {
    return Reflect.get(getDb(), prop);
  },
});
