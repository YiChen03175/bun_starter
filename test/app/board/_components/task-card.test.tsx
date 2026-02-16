import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "@/app/board/_components/task-card";

const columns = [
  { id: 1, title: "To Do" },
  { id: 2, title: "In Progress" },
  { id: 3, title: "Completed" },
];

const task = { id: 1, title: "Implement login", description: null };
const taskWithDesc = {
  id: 2,
  title: "Write tests",
  description: "Unit and integration tests",
};

describe("TaskCard", () => {
  it("renders the task title", () => {
    render(
      <TaskCard
        task={task}
        columns={columns}
        currentColumnId={1}
        onMove={mock()}
        onDelete={mock()}
      />,
    );
    expect(screen.getByText("Implement login")).toBeInTheDocument();
  });

  it("renders description when present", () => {
    render(
      <TaskCard
        task={taskWithDesc}
        columns={columns}
        currentColumnId={1}
        onMove={mock()}
        onDelete={mock()}
      />,
    );
    expect(screen.getByText("Unit and integration tests")).toBeInTheDocument();
  });

  it("calls onDelete from dropdown", async () => {
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

    await userEvent.click(screen.getByText("..."));
    await userEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("shows move options for other columns in dropdown", async () => {
    render(
      <TaskCard
        task={task}
        columns={columns}
        currentColumnId={1}
        onMove={mock()}
        onDelete={mock()}
      />,
    );

    await userEvent.click(screen.getByText("..."));
    expect(screen.getByText("Move to In Progress")).toBeInTheDocument();
    expect(screen.getByText("Move to Completed")).toBeInTheDocument();
    expect(screen.queryByText("Move to To Do")).not.toBeInTheDocument();
  });

  it("calls onMove when move option is clicked", async () => {
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

    await userEvent.click(screen.getByText("..."));
    await userEvent.click(screen.getByText("Move to In Progress"));
    expect(onMove).toHaveBeenCalledWith(1, 2);
  });
});
