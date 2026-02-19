import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

mock.module("@/lib/auth-client", () => ({
  signIn: { email: mock(), social: mock() },
  signUp: { email: mock() },
  useSession: mock(() => ({
    data: { user: { name: "Test", email: "t@t.com" }, session: {} },
    isPending: false,
  })),
  signOut: mock(() => Promise.resolve()),
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: mock() }),
  usePathname: mock(() => "/board"),
  useSearchParams: mock(() => new URLSearchParams()),
  redirect: mock(),
  notFound: mock(),
}));

const { default: AuthenticatedLayout } = await import(
  "@/app/(authenticated)/layout"
);

describe("AuthenticatedLayout", () => {
  // Authenticated layout wrapper providing sidebar and header with trigger

  it("should render a sidebar and a header with a sidebar trigger", () => {
    // Acceptance: SB01-US1.1
    // Given the user is on an authenticated page
    // When the layout renders
    render(
      <AuthenticatedLayout>
        <div>Page content</div>
      </AuthenticatedLayout>,
    );

    // Then the sidebar should be displayed
    expect(document.querySelector('[data-slot="sidebar"]')).toBeInTheDocument();

    // And a header with a sidebar trigger should be present
    expect(
      screen.getByRole("button", { name: /toggle sidebar/i }),
    ).toBeInTheDocument();

    // And the page content should be rendered within the layout
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
