"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { api, EdenProvider } from "@/lib/eden";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((m) => ({
      default: m.ReactQueryDevtools,
    })),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000 },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <EdenProvider client={api} queryClient={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </EdenProvider>
    </QueryClientProvider>
  );
}
