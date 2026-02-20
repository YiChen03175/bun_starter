import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "@/app/(authenticated)/board/_components/task-card";
import type { SelectColumn, SelectTask } from "@/server/db/schema";

const columns: Pick<SelectColumn, "id" | "title">[] = [
  { id: 1, title: "To Do" },
  { id: 2, title: "In Progress" },
  { id: 3, title: "Completed" },
];

const task: Pick<SelectTask, "id" | "title" | "description"> = {
  id: 1,
  title: "Implement login",
  description: null,
};
const taskWithDesc: Pick<SelectTask, "id" | "title" | "description"> = {
  id: 2,
  title: "Write tests",
  description: "Unit and integration tests",
};

describe("TaskCard", () => {
  // Task display with dropdown menu for move and delete actions
  describe("rendering", () => {
    it("should display the task title", () => {
      // Acceptance: KB01-US2.2
      // Given a task card is rendered with a task that has no description
      render(
        <TaskCard
          task={task}
          columns={columns}
          currentColumnId={1}
          onMove={mock()}
          onDelete={mock()}
        />,
      );

      // Then the task title should be visible
      expect(screen.getByText("Implement login")).toBeInTheDocument();
    });

    it("should display description when present", () => {
      // Acceptance: KB01-US2.2
      // Given a task card is rendered with a task that has a description
      render(
        <TaskCard
          task={taskWithDesc}
          columns={columns}
          currentColumnId={1}
          onMove={mock()}
          onDelete={mock()}
        />,
      );

      // Then both the title and description should be visible
      expect(
        screen.getByText("Unit and integration tests"),
      ).toBeInTheDocument();
    });
  });

  describe("dropdown actions", () => {
    it("should call onDelete when delete is clicked", async () => {
      // Acceptance: KB01-US2.3
      // Given a task card is rendered with an onDelete callback
      const onDelete = mock();
      render(
        <TaskCard
          task={task}
          columns={columns}
          currentColumnId={1}
          onMove={mock()}
          onDelete={onDelete}
        />,
      );

      // When the user opens the dropdown and clicks Delete
      await userEvent.click(screen.getByText("..."));
      await userEvent.click(screen.getByText("Delete"));

      // Then onDelete should be called with the task id
      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it("should show move options for other columns", async () => {
      // Acceptance: KB01-US3.1
      // Given a task card is rendered in column 1 (To Do)
      render(
        <TaskCard
          task={task}
          columns={columns}
          currentColumnId={1}
          onMove={mock()}
          onDelete={mock()}
        />,
      );

      // When the user opens the dropdown menu
      await userEvent.click(screen.getByText("..."));

      // Then it should show move options for other columns but not the current one
      expect(screen.getByText("Move to In Progress")).toBeInTheDocument();
      expect(screen.getByText("Move to Completed")).toBeInTheDocument();
      expect(screen.queryByText("Move to To Do")).not.toBeInTheDocument();
    });

    it("should call onMove when move option is clicked", async () => {
      // Acceptance: KB01-US3.2
      // Given a task card is rendered with an onMove callback
      const onMove = mock();
      render(
        <TaskCard
          task={task}
          columns={columns}
          currentColumnId={1}
          onMove={onMove}
          onDelete={mock()}
        />,
      );

      // When the user opens the dropdown and clicks "Move to In Progress"
      await userEvent.click(screen.getByText("..."));
      await userEvent.click(screen.getByText("Move to In Progress"));

      // Then onMove should be called with the task id and target column id
      expect(onMove).toHaveBeenCalledWith(1, 2);
    });
  });
});
