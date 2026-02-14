import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockCredentials } from "test/fixtures/auth";

// Mock next/navigation
const pushMock = mock(() => {});
const refreshMock = mock(() => {});
mock.module("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

// Mock auth client
const signInEmail = mock(
  (): Promise<unknown> => Promise.resolve({ data: {}, error: null }),
);
const signInSocial = mock(() => {});
mock.module("@/lib/auth-client", () => ({
  signIn: { email: signInEmail, social: signInSocial },
  signUp: { email: mock(() => Promise.resolve({ data: {}, error: null })) },
  signOut: mock(() => Promise.resolve()),
  useSession: mock(() => ({ data: null, isPending: false })),
}));

const { LoginForm } = await import("@/app/login/_components/login-form");

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    signInEmail.mockClear();
    signInSocial.mockClear();
    signInEmail.mockImplementation(() =>
      Promise.resolve({ data: {}, error: null }),
    );
  });

  describe("rendering", () => {
    it("renders email and password fields", () => {
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders login button", () => {
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);
      expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    });

    it("renders social login buttons", () => {
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);
      expect(
        screen.getByRole("button", { name: /google/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /github/i }),
      ).toBeInTheDocument();
    });

    it("renders sign up link with correct href", () => {
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);
      const link = screen.getByRole("link", { name: /sign up/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/signup");
    });
  });

  describe("form submission", () => {
    it("calls signIn.email with credentials and navigates on success", async () => {
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      await userEvent.type(
        screen.getByLabelText(/email/i),
        mockCredentials.email,
      );
      await userEvent.type(
        screen.getByLabelText(/password/i),
        mockCredentials.password,
      );
      await userEvent.click(screen.getByRole("button", { name: "Login" }));

      await waitFor(() => {
        expect(signInEmail).toHaveBeenCalledWith({
          email: mockCredentials.email,
          password: mockCredentials.password,
        });
      });

      expect(pushMock).toHaveBeenCalledWith("/");
      expect(refreshMock).toHaveBeenCalled();
    });

    it("shows loading state while submitting", async () => {
      signInEmail.mockImplementation(() => new Promise(() => {}));
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      await userEvent.type(
        screen.getByLabelText(/email/i),
        mockCredentials.email,
      );
      await userEvent.type(
        screen.getByLabelText(/password/i),
        mockCredentials.password,
      );
      await userEvent.click(screen.getByRole("button", { name: "Login" }));

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /signing in/i });
        expect(button).toBeDisabled();
      });
    });
  });

  describe("social login", () => {
    it("calls signIn.social with google provider", async () => {
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);
      await userEvent.click(screen.getByRole("button", { name: /google/i }));
      expect(signInSocial).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/",
      });
    });

    it("calls signIn.social with github provider", async () => {
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);
      await userEvent.click(screen.getByRole("button", { name: /github/i }));
      expect(signInSocial).toHaveBeenCalledWith({
        provider: "github",
        callbackURL: "/",
      });
    });
  });

  describe("error handling", () => {
    it("shows API error message", async () => {
      signInEmail.mockImplementation(() =>
        Promise.resolve({
          data: null,
          error: { message: "Invalid credentials" },
        }),
      );
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      await userEvent.type(screen.getByLabelText(/email/i), "bad@example.com");
      await userEvent.type(screen.getByLabelText(/password/i), "wrong");
      await userEvent.click(screen.getByRole("button", { name: "Login" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Invalid credentials",
        );
      });

      expect(pushMock).not.toHaveBeenCalled();
    });

    it("shows fallback error on exception", async () => {
      signInEmail.mockImplementation(() =>
        Promise.reject(new Error("Network error")),
      );
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      await userEvent.type(
        screen.getByLabelText(/email/i),
        mockCredentials.email,
      );
      await userEvent.type(
        screen.getByLabelText(/password/i),
        mockCredentials.password,
      );
      await userEvent.click(screen.getByRole("button", { name: "Login" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Something went wrong",
        );
      });

      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
