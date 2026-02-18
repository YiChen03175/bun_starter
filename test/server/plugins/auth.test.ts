import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { mockSession, mockUser } from "test/fixtures/auth";

const getSessionMock = mock((): Promise<unknown> => Promise.resolve(null));

mock.module("@/server/auth", () => ({
  auth: {
    handler: () => new Response(null, { status: 404 }),
    api: { getSession: getSessionMock },
  },
}));

const { betterAuthPlugin } = await import("@/server/plugins/auth");

// Test app: a minimal route using the auth macro
const app = new Elysia()
  .use(betterAuthPlugin)
  .get("/protected", ({ user }) => ({ id: user.id, name: user.name }), {
    auth: true,
  });

describe("betterAuthPlugin", () => {
  // The auth macro resolves user/session from request headers and rejects unauthenticated requests

  it("should return 401 when no session exists", async () => {
    // Acceptance: AU01-US4.1
    // Given no session cookie is present
    getSessionMock.mockImplementation(() => Promise.resolve(null));

    // When an unauthenticated request hits a protected route
    const res = await app.handle(new Request("http://localhost/protected"));

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });

  it("should resolve user and session when authenticated", async () => {
    // Acceptance: AU01-US4.5
    // Given a valid session exists
    getSessionMock.mockImplementation(() =>
      Promise.resolve({ user: mockUser, session: mockSession }),
    );

    // When an authenticated request hits a protected route
    const res = await app.handle(new Request("http://localhost/protected"));

    // Then it should return 200 with the user data from the resolved session
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ id: mockUser.id, name: mockUser.name });
  });
});
