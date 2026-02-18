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
    it("should display all form fields", () => {
      // Acceptance: AU01-US2.6
      // Given the signup form is rendered with all providers enabled
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // Then it should show name, email, password, and confirm password fields
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("should display create account button", () => {
      // Acceptance: AU01-US2.6
      // Given the signup form is rendered
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // Then it should show the Create Account submit button
      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });

    it("should display social login buttons", () => {
      // Acceptance: AU01-US3.5
      // Given the signup form is rendered with Google and GitHub enabled
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // Then it should show both social signup buttons
      expect(
        screen.getByRole("button", { name: /google/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /github/i }),
      ).toBeInTheDocument();
    });

    it("should display sign in link with correct href", () => {
      // Acceptance: AU01-US2.6
      // Given the signup form is rendered
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // Then it should show a link to the login page
      const link = screen.getByRole("link", { name: /sign in/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/login");
    });
  });

  describe("form submission", () => {
    it("should call signUp.email and navigate when form is valid", async () => {
      // Acceptance: AU01-US2.1
      // Given the signup form is rendered
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // When the user fills in all fields with valid data and clicks Create Account
      await fillForm();
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      // Then it should call signUp.email with the user's data and redirect to home
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

    it("should show loading state while submitting", async () => {
      // Acceptance: AU01-US2.4, AU01-CC1
      // Given signUp.email is configured to never resolve (simulating slow network)
      signUpEmail.mockImplementation(() => new Promise(() => {}));
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // When the user fills in the form and clicks Create Account
      await fillForm();
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      // Then the button should show "Creating account..." and be disabled
      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /creating account/i,
        });
        expect(button).toBeDisabled();
      });
    });

    it("should show error when passwords do not match", async () => {
      // Acceptance: AU01-US2.2
      // Given the signup form is rendered
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // When the user enters mismatched passwords and clicks Create Account
      await fillForm({ confirmPassword: "different" });
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      // Then it should display a password mismatch error and not call the API
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Passwords do not match",
        );
      });
      expect(signUpEmail).not.toHaveBeenCalled();
    });
  });

  describe("social login", () => {
    it("should call signIn.social with google provider when Google button is clicked", async () => {
      // Acceptance: AU01-US3.3
      // Given the signup form is rendered with Google enabled
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // When the user clicks the Google signup button
      await userEvent.click(screen.getByRole("button", { name: /google/i }));

      // Then it should initiate Google OAuth with the correct callback URL
      expect(signInSocial).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/",
      });
    });

    it("should call signIn.social with github provider when GitHub button is clicked", async () => {
      // Acceptance: AU01-US3.4
      // Given the signup form is rendered with GitHub enabled
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // When the user clicks the GitHub signup button
      await userEvent.click(screen.getByRole("button", { name: /github/i }));

      // Then it should initiate GitHub OAuth with the correct callback URL
      expect(signInSocial).toHaveBeenCalledWith({
        provider: "github",
        callbackURL: "/",
      });
    });
  });

  describe("error handling", () => {
    it("should show API error message when signup fails", async () => {
      // Acceptance: AU01-US2.3
      // Given signUp.email returns an error response with "Email already exists"
      signUpEmail.mockImplementation(() =>
        Promise.resolve({
          data: null,
          error: { message: "Email already exists" },
        }),
      );
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // When the user fills in the form and clicks Create Account
      await fillForm();
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      // Then it should display the API error and not navigate
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Email already exists",
        );
      });
      expect(pushMock).not.toHaveBeenCalled();

      // Acceptance: AU01-CC2
      // Then the form should retain the user's input so they can retry without retyping
      expect(screen.getByLabelText(/name/i)).toHaveValue(mockCredentials.name);
      expect(screen.getByLabelText(/email/i)).toHaveValue(
        mockCredentials.email,
      );
      expect(screen.getByLabelText("Password")).toHaveValue(
        mockCredentials.password,
      );
      expect(screen.getByLabelText(/confirm password/i)).toHaveValue(
        mockCredentials.password,
      );
    });

    it("should show fallback error when an exception occurs", async () => {
      // Acceptance: AU01-US2.5, AU01-CC3
      // Given signUp.email throws a network error
      signUpEmail.mockImplementation(() =>
        Promise.reject(new Error("Network error")),
      );
      render(<SignupForm enabledProviders={{ google: true, github: true }} />);

      // When the user fills in the form and clicks Create Account
      await fillForm();
      await userEvent.click(
        screen.getByRole("button", { name: /create account/i }),
      );

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
