import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import Home from "@/app/(public)/page";

describe("Home", () => {
  // Public landing page with a single call-to-action to open the Kanban Board

  describe("rendering", () => {
    it("should render a single Open Kanban Board button linking to /board", () => {
      // Acceptance: HP01-US1.1
      // Given the home page is visited
      // When it renders
      render(<Home />);

      // Then a single "Open Kanban Board" button linking to /board should be displayed
      const button = screen.getByRole("button", { name: "Open Kanban Board" });
      expect(button).toHaveAttribute("href", "/board");
    });

    it("should not render a Sign in button", () => {
      // Acceptance: HP01-US1.1
      // Given the home page is visited
      // When it renders
      render(<Home />);

      // Then no sign-in button should be present
      expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
    });
  });
});
