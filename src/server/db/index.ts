import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

let _db: Database | null = null;

function createDb(): Database {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  if (process.env.NEON_LOCAL === "true") {
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");
    return drizzle({ client: postgres(databaseUrl), schema });
  }

  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  return drizzle({ client: neon(databaseUrl), schema });
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
