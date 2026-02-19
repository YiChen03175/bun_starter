import { describe, expect, it, mock, spyOn } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockUser } from "test/fixtures/auth";

const signOutMock = mock(() => Promise.resolve());
const pushMock = mock((_href: string) => {});
const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

mock.module("@/lib/auth-client", () => ({
  signIn: { email: mock(), social: mock() },
  signUp: { email: mock() },
  useSession: mock(() => ({ data: null, isPending: false })),
  signOut: signOutMock,
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: mock(() => "/"),
  useSearchParams: mock(() => new URLSearchParams()),
  redirect: mock(),
  notFound: mock(),
}));

const { SidebarProvider } = await import("@/components/ui/sidebar");
const { TooltipProvider } = await import("@/components/ui/tooltip");
const { NavUser } = await import("@/app/(authenticated)/_components/nav-user");

const testUser = { name: mockUser.name, email: mockUser.email };

function renderNavUser(user = testUser) {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <NavUser user={user} />
      </SidebarProvider>
    </TooltipProvider>,
  );
}

describe("NavUser", () => {
  // Sidebar footer component displaying user info and sign-out action

  describe("rendering", () => {
    it("should display user name and email", () => {
      // Acceptance: SB01-US3.1
      // Given an authenticated user with name and email
      // When the NavUser component renders
      renderNavUser();

      // Then the user's name and email should be displayed
      expect(screen.getByText(testUser.name)).toBeInTheDocument();
      expect(screen.getByText(testUser.email)).toBeInTheDocument();
    });

    it("should display user initials in avatar", () => {
      // Acceptance: SB01-US3.1
      // Given an authenticated user named "Test User"
      // When the NavUser component renders
      renderNavUser();

      // Then the avatar should show the initials "TU"
      expect(screen.getByText("TU")).toBeInTheDocument();
    });
  });

  describe("sign out", () => {
    it("should call signOut and navigate to /login when Sign out is clicked", async () => {
      // Acceptance: SB01-US3.2
      // Given the NavUser component is rendered with a user
      const user = userEvent.setup();
      renderNavUser();

      // When the user opens the dropdown and clicks "Sign out"
      await user.click(
        screen.getByRole("button", { name: new RegExp(testUser.name) }),
      );
      const signOutItem = await screen.findByText("Sign out");
      await user.click(signOutItem);

      // Then the user should be signed out and redirected to the login page
      await waitFor(() => {
        expect(signOutMock).toHaveBeenCalled();
        expect(pushMock).toHaveBeenCalledWith("/login");
      });
    });

    it("should still navigate to /login when signOut fails", async () => {
      // Acceptance: SB01-US3.2 (error)
      // Given signOut will reject with a network error
      signOutMock.mockRejectedValueOnce(new Error("Network error"));
      const user = userEvent.setup();
      renderNavUser();

      // When the user clicks Sign out
      await user.click(
        screen.getByRole("button", { name: new RegExp(testUser.name) }),
      );
      const signOutItem = await screen.findByText("Sign out");
      await user.click(signOutItem);

      // Then the error should be logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Sign-out failed:",
          expect.any(Error),
        );
      });

      // And the user should still be navigated to the login page
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });
});
