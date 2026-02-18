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
  // Single kanban column — displays tasks with pagination, handles task CRUD and move
  describe("rendering", () => {
    it("should display the column title", async () => {
      // Acceptance: KB01-US1.2
      // Given + When the kanban column is rendered for "To Do"
      renderColumn();

      // Then it should display the column title
      expect(screen.getByText("To Do")).toBeInTheDocument();
    });

    it("should render tasks after loading", async () => {
      // Acceptance: KB01-US2.1
      // Given + When the kanban column is rendered with one task
      renderColumn();

      // Then it should display the task title after data loads
      await waitFor(() => {
        expect(screen.getByText("Implement login")).toBeInTheDocument();
      });
    });

    it("should show empty state when no tasks exist", async () => {
      // Acceptance: KB01-US2.1
      // Given + When the kanban column is rendered with an empty task list
      renderColumn({
        getTasks: () =>
          Promise.resolve({ data: { tasks: [], total: 0 }, error: null }),
      });

      // Then it should display the "No tasks" empty state
      await waitFor(() => {
        expect(screen.getByText("No tasks")).toBeInTheDocument();
      });
    });

    it("should render the add task form", () => {
      // Acceptance: KB01-US2.1
      // Given + When the kanban column is rendered
      renderColumn();

      // Then it should include the task creation input
      expect(screen.getByPlaceholderText("Add a task...")).toBeInTheDocument();
    });
  });

  describe("creating a task", () => {
    it("should call create mutation when form is submitted", async () => {
      // Acceptance: KB01-US2.1
      // Given the kanban column is rendered with a mock create endpoint
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

      // When the user types a task title and clicks Add
      await userEvent.type(
        screen.getByPlaceholderText("Add a task..."),
        "New task",
      );
      await userEvent.click(screen.getByRole("button", { name: /add/i }));

      // Then a new task should be created via the API
      await waitFor(() => {
        expect(postMock).toHaveBeenCalledWith({
          title: "New task",
          columnId: 1,
        });
      });
    });
  });

  describe("task actions", () => {
    it("should call move mutation when move option is clicked", async () => {
      // Acceptance: KB01-US3.2
      // Given the kanban column is rendered with a mock move endpoint
      const putMock = mock(() => Promise.resolve({ data: {}, error: null }));
      const mockClient = {
        api: {
          tasks: Object.assign(
            (_params: { id: number }) => ({
              put: putMock,
              delete: () => Promise.resolve({ data: {}, error: null }),
            }),
            {
              get: () =>
                Promise.resolve({
                  data: { tasks: mockTasks, total: 1 },
                  error: null,
                }),
              post: () => Promise.resolve({ data: {}, error: null }),
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

      // When the user opens the task dropdown and clicks "Move to In Progress"
      await userEvent.click(screen.getByRole("button", { name: "..." }));
      await userEvent.click(screen.getByText("Move to In Progress"));

      // Then the task should be moved via the API
      await waitFor(() => {
        expect(putMock).toHaveBeenCalledWith({ columnId: 2 });
      });
    });

    it("should call delete mutation when delete option is clicked", async () => {
      // Acceptance: KB01-US2.3
      // Given the kanban column is rendered with a mock delete endpoint
      const deleteMock = mock(() => Promise.resolve({ data: {}, error: null }));
      const mockClient = {
        api: {
          tasks: Object.assign(
            (_params: { id: number }) => ({
              put: () => Promise.resolve({ data: {}, error: null }),
              delete: deleteMock,
            }),
            {
              get: () =>
                Promise.resolve({
                  data: { tasks: mockTasks, total: 1 },
                  error: null,
                }),
              post: () => Promise.resolve({ data: {}, error: null }),
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

      // When the user opens the task dropdown and clicks Delete
      await userEvent.click(screen.getByRole("button", { name: "..." }));
      await userEvent.click(screen.getByText("Delete"));

      // Then the task should be deleted via the API
      await waitFor(() => {
        expect(deleteMock).toHaveBeenCalled();
      });
    });
  });

  describe("pagination", () => {
    it("should paginate forward and backward", async () => {
      // Acceptance: KB01-US2.5
      // Given 11 tasks exist and the kanban column shows the first page of 10
      const tasks = Array.from({ length: 11 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        description: null,
        columnId: 1,
        position: i,
        userId: "u1",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      }));
      let currentOffset = 0;
      renderColumn({
        getTasks: () => {
          const page = tasks.slice(currentOffset, currentOffset + 10);
          return Promise.resolve({
            data: { tasks: page, total: 11 },
            error: null,
          });
        },
      });

      await waitFor(() => {
        expect(screen.getByText("Task 1")).toBeInTheDocument();
      });

      const nextBtn = screen.getByRole("button", { name: "Next page" });
      const prevBtn = screen.getByRole("button", { name: "Previous page" });
      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // When the user clicks Next page to see the remaining task
      currentOffset = 10;
      await userEvent.click(nextBtn);

      // Then page 2 should show Task 11 and Previous should be enabled
      await waitFor(() => {
        expect(screen.getByText("Task 11")).toBeInTheDocument();
      });
      expect(
        screen.getByRole("button", { name: "Previous page" }),
      ).not.toBeDisabled();

      // When the user clicks Previous page to go back
      currentOffset = 0;
      await userEvent.click(
        screen.getByRole("button", { name: "Previous page" }),
      );

      // Then page 1 should show Task 1 again
      await waitFor(() => {
        expect(screen.getByText("Task 1")).toBeInTheDocument();
      });
    });
  });
});
