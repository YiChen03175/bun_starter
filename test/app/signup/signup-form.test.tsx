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
const signUpEmail = mock(
  (): Promise<unknown> => Promise.resolve({ data: {}, error: null }),
);
const signInSocial = mock(() => {});
mock.module("@/lib/auth-client", () => ({
  signIn: {
    email: mock(() => Promise.resolve({ data: {}, error: null })),
    social: signInSocial,
  },
  signUp: { email: signUpEmail },
  signOut: mock(() => Promise.resolve()),
  useSession: mock(() => ({ data: null, isPending: false })),
}));

const { SignupForm } = await import("@/app/signup/_components/signup-form");

async function fillForm(
  overrides: Partial<typeof mockCredentials & { confirmPassword: string }> = {},
) {
  const values = {
    name: mockCredentials.name,
    email: mockCredentials.email,
    password: mockCredentials.password,
    confirmPassword: mockCredentials.password,
    ...overrides,
  };

  await userEvent.type(screen.getByLabelText(/name/i), values.name);
  await userEvent.type(screen.getByLabelText(/email/i), values.email);
  await userEvent.type(screen.getByLabelText("Password"), values.password);
  await userEvent.type(
    screen.getByLabelText(/confirm password/i),
    values.confirmPassword,
  );
}

describe("SignupForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    signUpEmail.mockClear();
    signInSocial.mockClear();
    signUpEmail.mockImplementation(() =>
      Promise.resolve({ data: {}, error: null }),
    );
  });

  describe("rendering", () => {
    it("renders all form fields", () => {
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("renders create account button", () => {
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });

    it("renders social login buttons", () => {
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      expect(
        screen.getByRole("button", { name: /google/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /github/i }),
      ).toBeInTheDocument();
    });

    it("renders sign in link with correct href", () => {
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      const link = screen.getByRole("link", { name: /sign in/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/login");
    });
  });

  describe("form submission", () => {
    it("calls signUp.email with credentials and navigates on success", async () => {
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      await fillForm();
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      await waitFor(() => {
        expect(signUpEmail).toHaveBeenCalledWith({
          name: mockCredentials.name,
          email: mockCredentials.email,
          password: mockCredentials.password,
        });
      });

      expect(pushMock).toHaveBeenCalledWith("/");
      expect(refreshMock).toHaveBeenCalled();
    });

    it("shows loading state while submitting", async () => {
      signUpEmail.mockImplementation(() => new Promise(() => {}));
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      await fillForm();
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /creating account/i,
        });
        expect(button).toBeDisabled();
      });
    });

    it("shows error when passwords don't match", async () => {
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      await fillForm({ confirmPassword: "different" });
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Passwords do not match",
        );
      });

      expect(signUpEmail).not.toHaveBeenCalled();
    });
  });

  describe("social login", () => {
    it("calls signIn.social with google provider", async () => {
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      await userEvent.click(screen.getByRole("button", { name: /google/i }));
      expect(signInSocial).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/",
      });
    });

    it("calls signIn.social with github provider", async () => {
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      await userEvent.click(screen.getByRole("button", { name: /github/i }));
      expect(signInSocial).toHaveBeenCalledWith({
        provider: "github",
        callbackURL: "/",
      });
    });
  });

  describe("error handling", () => {
    it("shows API error message", async () => {
      signUpEmail.mockImplementation(() =>
        Promise.resolve({
          data: null,
          error: { message: "Email already exists" },
        }),
      );
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      await fillForm();
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Email already exists",
        );
      });

      expect(pushMock).not.toHaveBeenCalled();
    });

    it("shows fallback error on exception", async () => {
      signUpEmail.mockImplementation(() =>
        Promise.reject(new Error("Network error")),
      );
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);
      await fillForm();
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Something went wrong",
        );
      });

      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
