import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { completedTodo, mockTodo } from "test/fixtures/todo";
import { TodoItem } from "@/app/todos/_components/todo-item";

describe("TodoItem", () => {
  it("renders the todo title", () => {
    render(<TodoItem todo={mockTodo} onToggle={mock()} onDelete={mock()} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("renders a delete button", () => {
    render(<TodoItem todo={mockTodo} onToggle={mock()} onDelete={mock()} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("applies line-through style when completed", () => {
    render(
      <TodoItem todo={completedTodo} onToggle={mock()} onDelete={mock()} />,
    );
    const title = screen.getByText("Walk dog");
    expect(title.className).toContain("line-through");
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = mock();
    render(<TodoItem todo={mockTodo} onToggle={mock()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("calls onToggle when checkbox is clicked", async () => {
    const onToggle = mock();
    render(<TodoItem todo={mockTodo} onToggle={onToggle} onDelete={mock()} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(1, false);
  });
});
