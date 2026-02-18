import { describe, expect, it, mock } from "bun:test";

const getSessionCookieMock = mock(
  (_req: unknown): string | undefined => undefined,
);

mock.module("better-auth/cookies", () => ({
  getSessionCookie: getSessionCookieMock,
}));

const { NextRequest } = await import("next/server");
const { proxy } = await import("@/proxy");

function createRequest(pathname: string) {
  return new NextRequest(new URL(pathname, "http://localhost:3000"));
}

describe("proxy", () => {
  // Next.js middleware that redirects based on auth state — protects pages and auth routes

  describe("unauthenticated users", () => {
    it("should redirect to /login when accessing a protected page", () => {
      // Acceptance: AU01-US4.2
      // Given the user has no session cookie
      getSessionCookieMock.mockReturnValue(undefined);

      // When they navigate to /board
      const response = proxy(createRequest("/board"));

      // Then they should be redirected to /login
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login",
      );
      expect(response.status).toBe(307);
    });

    it("should redirect to /login when accessing a protected sub-path", () => {
      // Acceptance: AU01-US4.2
      // Given the user has no session cookie
      getSessionCookieMock.mockReturnValue(undefined);

      // When they navigate to /board/some-sub-path
      const response = proxy(createRequest("/board/some-sub-path"));

      // Then they should be redirected to /login (startsWith matching)
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login",
      );
      expect(response.status).toBe(307);
    });

    it("should serve /login without redirect", () => {
      // Acceptance: AU01-US4.4
      // Given the user has no session cookie
      getSessionCookieMock.mockReturnValue(undefined);

      // When they navigate to /login
      const response = proxy(createRequest("/login"));

      // Then the page should be served without redirect
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("should serve /signup without redirect", () => {
      // Acceptance: AU01-US4.4
      // Given the user has no session cookie
      getSessionCookieMock.mockReturnValue(undefined);

      // When they navigate to /signup
      const response = proxy(createRequest("/signup"));

      // Then the page should be served without redirect
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });

  describe("authenticated users", () => {
    it("should redirect to / when accessing /login", () => {
      // Acceptance: AU01-US4.3
      // Given the user has a valid session cookie
      getSessionCookieMock.mockReturnValue("session-token");

      // When they navigate to /login
      const response = proxy(createRequest("/login"));

      // Then they should be redirected to the home page
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
      expect(response.status).toBe(307);
    });

    it("should redirect to / when accessing /signup", () => {
      // Acceptance: AU01-US4.3
      // Given the user has a valid session cookie
      getSessionCookieMock.mockReturnValue("session-token");

      // When they navigate to /signup
      const response = proxy(createRequest("/signup"));

      // Then they should be redirected to the home page
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
      expect(response.status).toBe(307);
    });

    it("should serve /board without redirect", () => {
      // Acceptance: AU01-US4.5
      // Given the user has a valid session cookie
      getSessionCookieMock.mockReturnValue("session-token");

      // When they navigate to /board
      const response = proxy(createRequest("/board"));

      // Then the page should be served without redirect
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });
});
