import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js — cannot use @/env (t3-env requires Next.js runtime)
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
