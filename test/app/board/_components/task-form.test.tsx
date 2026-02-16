import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "@/app/board/_components/task-form";

describe("TaskForm", () => {
  // Input form for adding tasks to a column
  describe("rendering", () => {
    it("should display input and submit button", () => {
      // Given the task form is rendered
      render(<TaskForm onAdd={mock(() => Promise.resolve())} />);

      // Then it should show the task input field and an Add button
      expect(screen.getByPlaceholderText("Add a task...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    });
  });

  describe("submitting a task", () => {
    it("should call onAdd with trimmed title when submitted", async () => {
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

    it("should keep title when submission fails", async () => {
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
      // Given the task form is rendered with an empty input
      const onAdd = mock(() => Promise.resolve());
      render(<TaskForm onAdd={onAdd} />);

      // When the user clicks Add without typing anything
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then onAdd should not be called
      expect(onAdd).not.toHaveBeenCalled();
    });

    it("should not call onAdd when input is whitespace-only", async () => {
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
