import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createEdenTanStackQuery } from "eden-tanstack-react-query";
import type { ReactNode } from "react";

// Shared test instance — use these to mock @/lib/eden in test files:
//   mock.module("@/lib/eden", () => ({ api: {}, EdenProvider, useEden, useEdenClient }));
export const { EdenProvider, useEden, useEdenClient } =
  createEdenTanStackQuery();

/**
 * Creates a QueryClient + EdenProvider wrapper for rendering components
 * that use React Query hooks in tests.
 *
 * @param mockClient - A mock Eden treaty client matching the route shape
 */
export function createQueryWrapper(mockClient: unknown) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {/* biome-ignore lint/suspicious/noExplicitAny: mock client in tests */}
        <EdenProvider client={mockClient as any} queryClient={queryClient}>
          {children}
        </EdenProvider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}
