import { treaty } from "@elysiajs/eden";
import { createEdenTanStackQuery } from "eden-tanstack-react-query";
import { env } from "@/env";
import type { App } from "@/server";

// ---------------------------------------------------------------------------
// Base treaty client — type-safe, works everywhere.
//
// Usage:
//   Server components / non-React contexts → import { api } from "@/lib/eden"
//     const { data, error } = await api.api.todos.get();
// ---------------------------------------------------------------------------
export const api = treaty<App>(
  typeof window !== "undefined"
    ? window.location.origin
    : env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
);

// ---------------------------------------------------------------------------
// React Query integration — hooks + provider for client components only.
//
// Usage:
//   Client components → import { useEden, useEdenClient } from "@/lib/eden"
//     const eden = useEden();           // typed queryOptions / mutationOptions
//     const client = useEdenClient();   // treaty client for manual mutations
// ---------------------------------------------------------------------------
export const { EdenProvider, useEden, useEdenClient } =
  createEdenTanStackQuery<App>();
