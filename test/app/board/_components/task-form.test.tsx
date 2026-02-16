import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "@/app/board/_components/task-form";

describe("TaskForm", () => {
  it("renders input and submit button", () => {
    render(<TaskForm onAdd={mock(() => Promise.resolve())} />);
    expect(screen.getByPlaceholderText("Add a task...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("calls onAdd with trimmed title on submit", async () => {
    const onAdd = mock(() => Promise.resolve());
    render(<TaskForm onAdd={onAdd} />);

    await userEvent.type(
      screen.getByPlaceholderText("Add a task..."),
      "  Buy milk  ",
    );
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).toHaveBeenCalledWith("Buy milk");
  });

  it("clears input after successful submission", async () => {
    const onAdd = mock(() => Promise.resolve());
    render(<TaskForm onAdd={onAdd} />);

    const input = screen.getByPlaceholderText("Add a task...");
    await userEvent.type(input, "Buy milk");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(input).toHaveValue("");
  });

  it("does not call onAdd with empty input", async () => {
    const onAdd = mock(() => Promise.resolve());
    render(<TaskForm onAdd={onAdd} />);

    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("does not call onAdd with whitespace-only input", async () => {
    const onAdd = mock(() => Promise.resolve());
    render(<TaskForm onAdd={onAdd} />);

    await userEvent.type(screen.getByPlaceholderText("Add a task..."), "   ");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("keeps title on submission failure", async () => {
    const onAdd = mock(() => Promise.reject(new Error("API error")));
    render(<TaskForm onAdd={onAdd} />);

    const input = screen.getByPlaceholderText("Add a task...");
    await userEvent.type(input, "Buy milk");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(input).toHaveValue("Buy milk");
  });
});
