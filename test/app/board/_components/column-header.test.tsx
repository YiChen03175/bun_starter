import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnHeader } from "@/app/board/_components/column-header";

describe("ColumnHeader", () => {
  // Inline-editable column title with delete action
  const defaults = {
    title: "To Do",
    taskCount: 3,
    onRename: mock(),
    onDelete: mock(),
  };

  describe("rendering", () => {
    it("should display title and task count", () => {
      // Given a column header is rendered with title "To Do" and 3 tasks
      render(<ColumnHeader {...defaults} />);

      // Then it should display the column title and task count badge
      expect(screen.getByText("To Do")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  describe("editing", () => {
    it("should enter edit mode when title is clicked", async () => {
      // Given a column header is rendered in display mode
      render(<ColumnHeader {...defaults} />);

      // When the user clicks the column title
      await userEvent.click(screen.getByText("To Do"));

      // Then it should switch to an editable input with the current title
      expect(screen.getByDisplayValue("To Do")).toBeInTheDocument();
    });

    it("should save on form submit when title changes", async () => {
      // Given a column header is rendered with an onRename callback
      const onRename = mock();
      render(<ColumnHeader {...defaults} onRename={onRename} />);

      // When the user clicks the title, clears it, types a new name, and presses Enter
      await userEvent.click(screen.getByText("To Do"));
      const input = screen.getByDisplayValue("To Do");
      await userEvent.clear(input);
      await userEvent.type(input, "Done{Enter}");

      // Then onRename should be called with the new title
      expect(onRename).toHaveBeenCalledWith("Done");
    });

    it("should save on blur when clicking outside", async () => {
      // Given a column header is in edit mode with a changed title
      const onRename = mock();
      render(
        <div>
          <ColumnHeader {...defaults} onRename={onRename} />
          <button type="button">outside</button>
        </div>,
      );

      // When the user edits the title and clicks outside the input
      await userEvent.click(screen.getByText("To Do"));
      const input = screen.getByDisplayValue("To Do");
      await userEvent.clear(input);
      await userEvent.type(input, "Done");
      await userEvent.click(screen.getByText("outside"));

      // Then onRename should be called with the new title
      expect(onRename).toHaveBeenCalledWith("Done");
    });

    it("should skip rename when title is unchanged", async () => {
      // Given a column header is rendered with an onRename callback
      const onRename = mock();
      render(<ColumnHeader {...defaults} onRename={onRename} />);

      // When the user enters edit mode and presses Enter without changing the title
      await userEvent.click(screen.getByText("To Do"));
      await userEvent.type(screen.getByDisplayValue("To Do"), "{Enter}");

      // Then onRename should not be called
      expect(onRename).not.toHaveBeenCalled();
    });

    it("should skip rename on blur when delete button is clicked", async () => {
      // Given a column header is in edit mode with a changed title
      const onRename = mock();
      const onDelete = mock();
      render(
        <div>
          <ColumnHeader {...defaults} onRename={onRename} onDelete={onDelete} />
          <button type="button" aria-label="Delete column">
            Sibling delete
          </button>
        </div>,
      );
      await userEvent.click(screen.getByText("To Do"));
      const input = screen.getByDisplayValue("To Do");
      await userEvent.clear(input);
      await userEvent.type(input, "Changed");

      // When the input loses focus because a delete button was clicked
      await userEvent.click(screen.getByText("Sibling delete"));

      // Then onRename should not be called (delete takes priority)
      expect(onRename).not.toHaveBeenCalled();
    });
  });

  describe("deleting", () => {
    it("should call onDelete when delete button is clicked", async () => {
      // Given a column header is rendered with an onDelete callback
      const onDelete = mock();
      render(<ColumnHeader {...defaults} onDelete={onDelete} />);

      // When the user clicks the delete column button
      await userEvent.click(
        screen.getByRole("button", { name: "Delete column" }),
      );

      // Then onDelete should be called once
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
