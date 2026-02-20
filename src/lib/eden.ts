import { treaty } from "@elysiajs/eden";
import { env } from "@/env";
import type { App } from "@/server";

// ---------------------------------------------------------------------------
// Base treaty client — type-safe, works everywhere (server + client).
//
// Usage:
//   Server components / non-React contexts → import { api } from "@/lib/eden"
//     const { data, error } = await api.api.columns.get();
//
// For React Query hooks, import from "@/lib/eden-query" instead.
// ---------------------------------------------------------------------------
export const api = treaty<App>(
  typeof window !== "undefined"
    ? window.location.origin
    : env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
);
