import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { mockSession, mockUser } from "test/fixtures/auth";

const useSessionMock = mock(() => ({
  data: { user: mockUser, session: mockSession },
  isPending: false,
}));

mock.module("@/lib/auth-client", () => ({
  signIn: { email: mock(), social: mock() },
  signUp: { email: mock() },
  useSession: useSessionMock,
  signOut: mock(() => Promise.resolve()),
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: mock() }),
  usePathname: mock(() => "/"),
  useSearchParams: mock(() => new URLSearchParams()),
  redirect: mock(),
  notFound: mock(),
}));

const { SidebarProvider } = await import("@/components/ui/sidebar");
const { TooltipProvider } = await import("@/components/ui/tooltip");
const { AppSidebar } = await import(
  "@/app/(authenticated)/_components/app-sidebar"
);

function renderAppSidebar() {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </TooltipProvider>,
  );
}

describe("AppSidebar", () => {
  // Main sidebar component with navigation links and user menu

  describe("navigation", () => {
    it("should render Home and Board navigation links", () => {
      // Acceptance: SB01-US2.1
      // Given the sidebar is rendered with an authenticated session
      renderAppSidebar();

      // Then navigation links for Home and Board should be present
      const homeLink = screen.getByRole("link", { name: /Home/i });
      const boardLink = screen.getByRole("link", { name: /Board/i });
      expect(homeLink).toHaveAttribute("href", "/");
      expect(boardLink).toHaveAttribute("href", "/board");
    });
  });

  describe("user menu", () => {
    it("should render NavUser with session user data", () => {
      // Acceptance: SB01-US3.1
      // Given the user is authenticated
      renderAppSidebar();

      // Then the user's name should be displayed in the sidebar footer
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    it("should not render NavUser when session is unavailable", () => {
      // Acceptance: SB01-US3.1 (edge)
      // Given no active session
      useSessionMock.mockReturnValueOnce({
        data: null as unknown as ReturnType<typeof useSessionMock>["data"],
        isPending: false,
      });
      renderAppSidebar();

      // Then the user's name should not be displayed
      expect(screen.queryByText(mockUser.name)).not.toBeInTheDocument();
    });
  });
});
