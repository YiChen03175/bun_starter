import { describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnCreateForm } from "@/app/(authenticated)/board/_components/column-create-form";

describe("ColumnCreateForm", () => {
  // Input form for adding new columns to the board
  describe("rendering", () => {
    it("should display input and submit button", () => {
      // Acceptance: KB01-US1.3
      // Given the column create form is rendered
      render(<ColumnCreateForm onAdd={mock(() => Promise.resolve())} />);

      // Then it should show the column name input and an Add button
      expect(screen.getByPlaceholderText("New column...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    });
  });

  describe("submitting a column", () => {
    it("should call onAdd with trimmed title when submitted", async () => {
      // Acceptance: KB01-US1.3
      // Given the column create form is rendered with an onAdd callback
      const onAdd = mock(() => Promise.resolve());
      render(<ColumnCreateForm onAdd={onAdd} />);

      // When the user types a column name with extra whitespace and submits
      await userEvent.type(
        screen.getByPlaceholderText("New column..."),
        "  Backlog  ",
      );
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then onAdd should be called with the trimmed column name
      expect(onAdd).toHaveBeenCalledWith("Backlog");
    });

    it("should clear input after successful submission", async () => {
      // Acceptance: KB01-US1.3
      // Given the column create form is rendered and the user has typed a name
      const onAdd = mock(() => Promise.resolve());
      render(<ColumnCreateForm onAdd={onAdd} />);
      const input = screen.getByPlaceholderText("New column...");

      // When the user submits the form successfully
      await userEvent.type(input, "Backlog");
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then the input should be cleared
      expect(input).toHaveValue("");
    });

    it("should disable the submit button while submission is in progress", async () => {
      // Acceptance: KB01-CC1
      // Given the column create form with a slow onAdd that won't resolve immediately
      let resolvePromise: () => void = () => {};
      const onAdd = mock(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          }),
      );
      render(<ColumnCreateForm onAdd={onAdd} />);

      // When the user submits
      await userEvent.type(
        screen.getByPlaceholderText("New column..."),
        "Backlog",
      );
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then the button should show the submitting label and be disabled
      expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();

      // When the promise resolves
      resolvePromise();

      // Then the button should revert to its idle label and be re-enabled
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Add" })).not.toBeDisabled();
      });
    });

    it("should keep title when submission fails", async () => {
      // Acceptance: KB01-CC2
      // Given the column create form is rendered and the API will reject
      const onAdd = mock(() => Promise.reject(new Error("API error")));
      render(<ColumnCreateForm onAdd={onAdd} />);
      const input = screen.getByPlaceholderText("New column...");

      // When the user submits and the API call fails
      await userEvent.type(input, "Backlog");
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then the input should retain the typed name for retry
      expect(input).toHaveValue("Backlog");
    });
  });

  describe("input validation", () => {
    it("should not call onAdd when input is empty", async () => {
      // Acceptance: KB01-US1.6
      // Given the column create form is rendered with an empty input
      const onAdd = mock(() => Promise.resolve());
      render(<ColumnCreateForm onAdd={onAdd} />);

      // When the user clicks Add without typing anything
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then onAdd should not be called
      expect(onAdd).not.toHaveBeenCalled();
    });

    it("should not call onAdd when input is whitespace-only", async () => {
      // Acceptance: KB01-US1.6
      // Given the column create form is rendered
      const onAdd = mock(() => Promise.resolve());
      render(<ColumnCreateForm onAdd={onAdd} />);

      // When the user types only whitespace and submits
      await userEvent.type(screen.getByPlaceholderText("New column..."), "   ");
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then onAdd should not be called
      expect(onAdd).not.toHaveBeenCalled();
    });
  });
});
