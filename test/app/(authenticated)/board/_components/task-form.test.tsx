import { describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "@/app/(authenticated)/board/_components/task-form";

describe("TaskForm", () => {
  // Input form for adding tasks to a column
  describe("rendering", () => {
    it("should display input and submit button", () => {
      // Acceptance: KB01-US2.1
      // Given the task form is rendered
      render(<TaskForm onAdd={mock(() => Promise.resolve())} />);

      // Then it should show the task input field and an Add button
      expect(screen.getByPlaceholderText("Add a task...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    });
  });

  describe("submitting a task", () => {
    it("should call onAdd with trimmed title when submitted", async () => {
      // Acceptance: KB01-US2.1
      // Given the task form is rendered with an onAdd callback
      const onAdd = mock(() => Promise.resolve());
      render(<TaskForm onAdd={onAdd} />);

      // When the user types a title with extra whitespace and submits
      await userEvent.type(
        screen.getByPlaceholderText("Add a task..."),
        "  Buy milk  ",
      );
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then onAdd should be called with the trimmed title
      expect(onAdd).toHaveBeenCalledWith("Buy milk");
    });

    it("should clear input after successful submission", async () => {
      // Acceptance: KB01-US2.1
      // Given the task form is rendered and the user has typed a title
      const onAdd = mock(() => Promise.resolve());
      render(<TaskForm onAdd={onAdd} />);
      const input = screen.getByPlaceholderText("Add a task...");

      // When the user submits the form successfully
      await userEvent.type(input, "Buy milk");
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then the input should be cleared
      expect(input).toHaveValue("");
    });

    it("should disable the submit button while submission is in progress", async () => {
      // Acceptance: KB01-CC1
      // Given the task form with a slow onAdd that won't resolve immediately
      let resolvePromise: () => void = () => {};
      const onAdd = mock(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          }),
      );
      render(<TaskForm onAdd={onAdd} />);

      // When the user submits
      await userEvent.type(
        screen.getByPlaceholderText("Add a task..."),
        "Buy milk",
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
      // Given the task form is rendered and the API will reject
      const onAdd = mock(() => Promise.reject(new Error("API error")));
      render(<TaskForm onAdd={onAdd} />);
      const input = screen.getByPlaceholderText("Add a task...");

      // When the user submits and the API call fails
      await userEvent.type(input, "Buy milk");
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then the input should retain the typed title for retry
      expect(input).toHaveValue("Buy milk");
    });
  });

  describe("input validation", () => {
    it("should not call onAdd when input is empty", async () => {
      // Acceptance: KB01-US2.4
      // Given the task form is rendered with an empty input
      const onAdd = mock(() => Promise.resolve());
      render(<TaskForm onAdd={onAdd} />);

      // When the user clicks Add without typing anything
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then onAdd should not be called
      expect(onAdd).not.toHaveBeenCalled();
    });

    it("should not call onAdd when input is whitespace-only", async () => {
      // Acceptance: KB01-US2.4
      // Given the task form is rendered
      const onAdd = mock(() => Promise.resolve());
      render(<TaskForm onAdd={onAdd} />);

      // When the user types only whitespace and submits
      await userEvent.type(screen.getByPlaceholderText("Add a task..."), "   ");
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then onAdd should not be called
      expect(onAdd).not.toHaveBeenCalled();
    });
  });
});
