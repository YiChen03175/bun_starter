import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnHeader } from "@/app/board/_components/column-header";

describe("ColumnHeader", () => {
  const defaults = {
    title: "To Do",
    taskCount: 3,
    onRename: mock(),
    onDelete: mock(),
  };

  it("renders title and task count", () => {
    render(<ColumnHeader {...defaults} />);
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("enters edit mode on title click", async () => {
    render(<ColumnHeader {...defaults} />);
    await userEvent.click(screen.getByText("To Do"));
    expect(screen.getByDisplayValue("To Do")).toBeInTheDocument();
  });

  it("saves on form submit", async () => {
    const onRename = mock();
    render(<ColumnHeader {...defaults} onRename={onRename} />);

    await userEvent.click(screen.getByText("To Do"));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Done{Enter}");

    expect(onRename).toHaveBeenCalledWith("Done");
  });

  it("saves on blur", async () => {
    const onRename = mock();
    render(
      <div>
        <ColumnHeader {...defaults} onRename={onRename} />
        <button type="button">outside</button>
      </div>,
    );

    await userEvent.click(screen.getByText("To Do"));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Done");
    await userEvent.click(screen.getByText("outside"));

    expect(onRename).toHaveBeenCalledWith("Done");
  });

  it("calls onDelete", async () => {
    const onDelete = mock();
    render(<ColumnHeader {...defaults} onDelete={onDelete} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Delete column" }),
    );
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("skips rename if title is unchanged", async () => {
    const onRename = mock();
    render(<ColumnHeader {...defaults} onRename={onRename} />);

    await userEvent.click(screen.getByText("To Do"));
    // Submit without changing the value
    await userEvent.type(screen.getByDisplayValue("To Do"), "{Enter}");

    expect(onRename).not.toHaveBeenCalled();
  });
});
