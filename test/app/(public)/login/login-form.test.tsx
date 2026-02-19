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

const { LoginForm } = await import(
  "@/app/(public)/login/_components/login-form"
);

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
    it("should display email and password fields", () => {
      // Acceptance: AU01-US1.5
      // Given the login form is rendered with all providers enabled
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // Then it should show email and password input fields
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("should display login button", () => {
      // Acceptance: AU01-US1.5
      // Given the login form is rendered
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // Then it should show the Login submit button
      expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    });

    it("should display social login buttons", () => {
      // Acceptance: AU01-US3.5
      // Given the login form is rendered with Google and GitHub enabled
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // Then it should show both social login buttons
      expect(
        screen.getByRole("button", { name: /google/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /github/i }),
      ).toBeInTheDocument();
    });

    it("should display sign up link with correct href", () => {
      // Acceptance: AU01-US1.5
      // Given the login form is rendered
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // Then it should show a link to the signup page
      const link = screen.getByRole("link", { name: /sign up/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/signup");
    });
  });

  describe("form submission", () => {
    it("should call signIn.email and navigate when credentials are valid", async () => {
      // Acceptance: AU01-US1.1
      // Given the login form is rendered
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // When the user fills in valid credentials and clicks Login
      await userEvent.type(
        screen.getByLabelText(/email/i),
        mockCredentials.email,
      );
      await userEvent.type(
        screen.getByLabelText(/password/i),
        mockCredentials.password,
      );
      await userEvent.click(screen.getByRole("button", { name: "Login" }));

      // Then it should call signIn.email and redirect to the home page
      await waitFor(() => {
        expect(signInEmail).toHaveBeenCalledWith({
          email: mockCredentials.email,
          password: mockCredentials.password,
        });
      });

      expect(pushMock).toHaveBeenCalledWith("/");
      expect(refreshMock).toHaveBeenCalled();
    });

    it("should show loading state while submitting", async () => {
      // Acceptance: AU01-US1.3, AU01-CC1
      // Given signIn.email is configured to never resolve (simulating slow network)
      signInEmail.mockImplementation(() => new Promise(() => {}));
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // When the user fills in credentials and clicks Login
      await userEvent.type(
        screen.getByLabelText(/email/i),
        mockCredentials.email,
      );
      await userEvent.type(
        screen.getByLabelText(/password/i),
        mockCredentials.password,
      );
      await userEvent.click(screen.getByRole("button", { name: "Login" }));

      // Then the button should show "Signing in..." and be disabled
      await waitFor(() => {
        const button = screen.getByRole("button", { name: /signing in/i });
        expect(button).toBeDisabled();
      });
    });
  });

  describe("social login", () => {
    it("should call signIn.social with google provider when Google button is clicked", async () => {
      // Acceptance: AU01-US3.1
      // Given the login form is rendered with Google enabled
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // When the user clicks the Google login button
      await userEvent.click(screen.getByRole("button", { name: /google/i }));

      // Then it should initiate Google OAuth with the correct callback URL
      expect(signInSocial).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/",
      });
    });

    it("should call signIn.social with github provider when GitHub button is clicked", async () => {
      // Acceptance: AU01-US3.2
      // Given the login form is rendered with GitHub enabled
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // When the user clicks the GitHub login button
      await userEvent.click(screen.getByRole("button", { name: /github/i }));

      // Then it should initiate GitHub OAuth with the correct callback URL
      expect(signInSocial).toHaveBeenCalledWith({
        provider: "github",
        callbackURL: "/",
      });
    });
  });

  describe("error handling", () => {
    it("should show API error message when login fails", async () => {
      // Acceptance: AU01-US1.2
      // Given signIn.email returns an error response with "Invalid credentials"
      signInEmail.mockImplementation(() =>
        Promise.resolve({
          data: null,
          error: { message: "Invalid credentials" },
        }),
      );
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // When the user fills in wrong credentials and clicks Login
      await userEvent.type(screen.getByLabelText(/email/i), "bad@example.com");
      await userEvent.type(screen.getByLabelText(/password/i), "wrong");
      await userEvent.click(screen.getByRole("button", { name: "Login" }));

      // Then it should display the API error and not navigate
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Invalid credentials",
        );
      });
      expect(pushMock).not.toHaveBeenCalled();

      // Acceptance: AU01-CC2
      // Then the form should retain the user's input so they can retry without retyping
      expect(screen.getByLabelText(/email/i)).toHaveValue("bad@example.com");
      expect(screen.getByLabelText(/password/i)).toHaveValue("wrong");
    });

    it("should show fallback error when an exception occurs", async () => {
      // Acceptance: AU01-US1.4, AU01-CC3
      // Given signIn.email throws a network error
      signInEmail.mockImplementation(() =>
        Promise.reject(new Error("Network error")),
      );
      render(<LoginForm enabledProviders={{ google: true, github: true }} />);

      // When the user fills in credentials and clicks Login
      await userEvent.type(
        screen.getByLabelText(/email/i),
        mockCredentials.email,
      );
      await userEvent.type(
        screen.getByLabelText(/password/i),
        mockCredentials.password,
      );
      await userEvent.click(screen.getByRole("button", { name: "Login" }));

      // Then it should display a generic fallback error and not navigate
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Something went wrong",
        );
      });
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
