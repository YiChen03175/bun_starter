import { treaty } from "@elysiajs/eden";
import type { App } from "@/server";

// Eden is used in client components only. The server-side fallback
// ("http://localhost:3000") is for SSR during development.
export const api = treaty<App>(
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
);
