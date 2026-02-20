import { createEdenTanStackQuery } from "eden-tanstack-react-query";
import type { App } from "@/server";

// ---------------------------------------------------------------------------
// React Query integration — hooks + provider for client components ONLY.
//
// This module calls createContext at module scope, so it MUST NOT be imported
// in server components. Import { api } from "@/lib/eden" for server usage.
//
// Usage:
//   Client components → import { useEden, useEdenClient } from "@/lib/eden-query"
//     const eden = useEden();           // typed queryOptions / mutationOptions
//     const client = useEdenClient();   // treaty client for manual mutations
// ---------------------------------------------------------------------------
export const { EdenProvider, useEden, useEdenClient } =
  createEdenTanStackQuery<App>();
