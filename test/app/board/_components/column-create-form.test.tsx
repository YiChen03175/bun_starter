import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnCreateForm } from "@/app/board/_components/column-create-form";

describe("ColumnCreateForm", () => {
  it("renders input and submit button", () => {
    render(<ColumnCreateForm onAdd={mock(() => Promise.resolve())} />);
    expect(screen.getByPlaceholderText("New column...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("calls onAdd with trimmed title on submit", async () => {
    const onAdd = mock(() => Promise.resolve());
    render(<ColumnCreateForm onAdd={onAdd} />);

    await userEvent.type(
      screen.getByPlaceholderText("New column..."),
      "  Backlog  ",
    );
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).toHaveBeenCalledWith("Backlog");
  });

  it("clears input after successful submission", async () => {
    const onAdd = mock(() => Promise.resolve());
    render(<ColumnCreateForm onAdd={onAdd} />);

    const input = screen.getByPlaceholderText("New column...");
    await userEvent.type(input, "Backlog");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(input).toHaveValue("");
  });

  it("keeps title on submission failure", async () => {
    const onAdd = mock(() => Promise.reject(new Error("API error")));
    render(<ColumnCreateForm onAdd={onAdd} />);

    const input = screen.getByPlaceholderText("New column...");
    await userEvent.type(input, "Backlog");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(input).toHaveValue("Backlog");
  });

  it("does not call onAdd with empty input", async () => {
    const onAdd = mock(() => Promise.resolve());
    render(<ColumnCreateForm onAdd={onAdd} />);

    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("does not call onAdd with whitespace-only input", async () => {
    const onAdd = mock(() => Promise.resolve());
    render(<ColumnCreateForm onAdd={onAdd} />);

    await userEvent.type(screen.getByPlaceholderText("New column..."), "   ");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });
});
