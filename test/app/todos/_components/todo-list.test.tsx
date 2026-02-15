import { describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { completedTodo, mockTodo } from "test/fixtures/todo";
import {
  createQueryWrapper,
  EdenProvider,
  useEden,
  useEdenClient,
} from "test/helpers/eden-query";

// Mock the eden module so TodoList uses the test instance
mock.module("@/lib/eden", () => ({
  api: {},
  EdenProvider,
  useEden,
  useEdenClient,
}));

// Import after mocking
const { TodoList } = await import("@/app/todos/_components/todo-list");

function createMockClient(
  overrides: {
    getTodos?: () => Promise<unknown>;
    createTodo?: (body: unknown) => Promise<unknown>;
    updateTodo?: (body: unknown) => Promise<unknown>;
    deleteTodo?: () => Promise<unknown>;
  } = {},
) {
  const getTodos =
    overrides.getTodos ??
    (() =>
      Promise.resolve({
        data: [mockTodo, completedTodo],
        error: null,
      }));
  const createTodo =
    overrides.createTodo ??
    (() =>
      Promise.resolve({
        data: { id: 3, title: "New todo", completed: false },
        error: null,
      }));
  const updateTodo =
    overrides.updateTodo ??
    (() =>
      Promise.resolve({
        data: { ...mockTodo, completed: true },
        error: null,
      }));
  const deleteTodo =
    overrides.deleteTodo ??
    (() =>
      Promise.resolve({
        data: mockTodo,
        error: null,
      }));

  return {
    api: {
      todos: Object.assign(
        (_params: { id: number }) => ({
          put: (body: unknown) => updateTodo(body),
          delete: () => deleteTodo(),
        }),
        {
          get: () => getTodos(),
          post: (body: unknown) => createTodo(body),
        },
      ),
    },
  };
}

function renderTodoList(
  clientOverrides?: Parameters<typeof createMockClient>[0],
) {
  const mockClient = createMockClient(clientOverrides);
  const { Wrapper, queryClient } = createQueryWrapper(mockClient);
  const result = render(<TodoList />, { wrapper: Wrapper });
  return { ...result, queryClient, mockClient };
}

describe("TodoList", () => {
  it("renders loading state initially", () => {
    renderTodoList({
      getTodos: () => new Promise(() => {}), // never resolves
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders todo list after data loads", async () => {
    renderTodoList();
    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });
    expect(screen.getByText("Walk dog")).toBeInTheDocument();
  });

  it("renders empty state when no todos", async () => {
    renderTodoList({
      getTodos: () => Promise.resolve({ data: [], error: null }),
    });
    await waitFor(() => {
      expect(
        screen.getByText("No todos yet. Add one above!"),
      ).toBeInTheDocument();
    });
  });

  it("renders error state on fetch failure", async () => {
    renderTodoList({
      getTodos: () =>
        Promise.resolve({
          data: null,
          error: { status: 500, value: "Internal Server Error" },
        }),
    });
    await waitFor(() => {
      expect(screen.getByText("Failed to load todos")).toBeInTheDocument();
    });
  });

  it("creates a todo and refetches", async () => {
    const user = userEvent.setup();
    const createTodo = mock(() =>
      Promise.resolve({
        data: { id: 3, title: "New task", completed: false },
        error: null,
      }),
    );
    renderTodoList({ createTodo });

    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "New task",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(createTodo).toHaveBeenCalled();
    });
  });

  it("toggles a todo", async () => {
    const user = userEvent.setup();
    const updateTodo = mock(() =>
      Promise.resolve({
        data: { ...mockTodo, completed: true },
        error: null,
      }),
    );
    renderTodoList({ updateTodo });

    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    await waitFor(() => {
      expect(updateTodo).toHaveBeenCalledWith({ completed: true });
    });
  });

  it("displays mutation error", async () => {
    const user = userEvent.setup();
    renderTodoList({
      deleteTodo: () =>
        Promise.resolve({
          data: null,
          error: { status: 500, value: "Server error" },
        }),
    });

    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
    });
  });

  it("deletes a todo", async () => {
    const user = userEvent.setup();
    const deleteTodo = mock(() =>
      Promise.resolve({ data: mockTodo, error: null }),
    );
    renderTodoList({ deleteTodo });

    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteTodo).toHaveBeenCalled();
    });
  });
});
