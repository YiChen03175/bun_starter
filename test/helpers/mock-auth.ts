import { mock } from "bun:test";
import { mockSession, mockUser } from "test/fixtures/auth";

mock.module("@/server/auth", () => ({
  auth: {
    handler: () => new Response(null, { status: 404 }),
    api: {
      getSession: mock(() =>
        Promise.resolve({ user: mockUser, session: mockSession }),
      ),
    },
  },
}));
