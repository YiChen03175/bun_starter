import { describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createQueryWrapper,
  EdenProvider,
  useEden,
  useEdenClient,
} from "test/helpers/eden-query";

mock.module("@/lib/eden", () => ({
  api: {},
  EdenProvider,
  useEden,
  useEdenClient,
}));

const { KanbanColumn } = await import("@/app/board/_components/kanban-column");

const allColumns = [
  { id: 1, title: "To Do" },
  { id: 2, title: "In Progress" },
  { id: 3, title: "Completed" },
];

const mockTasks = [
  {
    id: 1,
    title: "Implement login",
    description: null,
    columnId: 1,
    position: 0,
    userId: "u1",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];

function createMockClient(
  overrides: { getTasks?: () => Promise<unknown> } = {},
) {
  const getTasks =
    overrides.getTasks ??
    (() =>
      Promise.resolve({
        data: { tasks: mockTasks, total: 1 },
        error: null,
      }));

  return {
    api: {
      tasks: Object.assign(
        (_params: { id: number }) => ({
          put: () => Promise.resolve({ data: {}, error: null }),
          delete: () => Promise.resolve({ data: {}, error: null }),
        }),
        {
          get: () => getTasks(),
          post: () => Promise.resolve({ data: {}, error: null }),
        },
      ),
    },
  };
}

function renderColumn(overrides?: Parameters<typeof createMockClient>[0]) {
  const mockClient = createMockClient(overrides);
  const { Wrapper } = createQueryWrapper(mockClient);
  return render(
    <KanbanColumn
      column={allColumns[0]}
      allColumns={allColumns}
      onRenameColumn={mock()}
      onDeleteColumn={mock()}
    />,
    { wrapper: Wrapper },
  );
}

describe("KanbanColumn", () => {
  it("renders column title", async () => {
    renderColumn();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("renders tasks after loading", async () => {
    renderColumn();
    await waitFor(() => {
      expect(screen.getByText("Implement login")).toBeInTheDocument();
    });
  });

  it("shows empty state when no tasks", async () => {
    renderColumn({
      getTasks: () =>
        Promise.resolve({ data: { tasks: [], total: 0 }, error: null }),
    });
    await waitFor(() => {
      expect(screen.getByText("No tasks")).toBeInTheDocument();
    });
  });

  it("renders add task form", () => {
    renderColumn();
    expect(screen.getByPlaceholderText("Add a task...")).toBeInTheDocument();
  });

  it("calls create mutation on form submit", async () => {
    const postMock = mock(() => Promise.resolve({ data: {}, error: null }));
    const mockClient = {
      api: {
        tasks: Object.assign(
          (_params: { id: number }) => ({
            put: () => Promise.resolve({ data: {}, error: null }),
            delete: () => Promise.resolve({ data: {}, error: null }),
          }),
          {
            get: () =>
              Promise.resolve({
                data: { tasks: mockTasks, total: 1 },
                error: null,
              }),
            post: postMock,
          },
        ),
      },
    };
    const { Wrapper } = createQueryWrapper(mockClient);
    render(
      <KanbanColumn
        column={allColumns[0]}
        allColumns={allColumns}
        onRenameColumn={mock()}
        onDeleteColumn={mock()}
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(screen.getByText("Implement login")).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByPlaceholderText("Add a task..."),
      "New task",
    );
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalled();
    });
  });
});
