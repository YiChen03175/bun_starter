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

const { TableView } = await import(
  "@/app/(authenticated)/board/_components/table-view"
);

const columns = [
  { id: 1, title: "To Do" },
  { id: 2, title: "In Progress" },
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
  {
    id: 2,
    title: "Write tests",
    description: "Unit tests",
    columnId: 2,
    position: 0,
    userId: "u1",
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
  },
];

function createMockClient(
  overrides: { getTasks?: () => Promise<unknown> } = {},
) {
  const getTasks =
    overrides.getTasks ??
    (() =>
      Promise.resolve({
        data: { tasks: mockTasks, total: 2 },
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

function renderTableView(overrides?: Parameters<typeof createMockClient>[0]) {
  const mockClient = createMockClient(overrides);
  const { Wrapper } = createQueryWrapper(mockClient);
  return render(<TableView columns={columns} />, { wrapper: Wrapper });
}

describe("TableView", () => {
  // Flat table view of all tasks across columns with pagination and delete
  describe("rendering", () => {
    it("should show loading state initially", () => {
      // Acceptance: KB01-US4.1
      // Given + When the table view is rendered with a query that never resolves
      renderTableView({
        getTasks: () => new Promise(() => {}),
      });

      // Then it should display a loading indicator
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render tasks in table when loaded", async () => {
      // Acceptance: KB01-US4.1
      // Given + When the table view is rendered with tasks in two columns
      renderTableView();

      // Then it should display all tasks with their column names
      await waitFor(() => {
        expect(screen.getByText("Implement login")).toBeInTheDocument();
      });
      expect(screen.getByText("Write tests")).toBeInTheDocument();
      expect(screen.getByText("To Do")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    it("should show empty state when no tasks exist", async () => {
      // Acceptance: KB01-US4.1
      // Given + When the table view is rendered with an empty task list
      renderTableView({
        getTasks: () =>
          Promise.resolve({ data: { tasks: [], total: 0 }, error: null }),
      });

      // Then it should display the empty state message
      await waitFor(() => {
        expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
      });
    });
  });

  describe("pagination", () => {
    it("should show pagination info", async () => {
      // Acceptance: KB01-US4.2
      // Given + When the table view is rendered with 2 tasks
      renderTableView();

      // Then it should display the pagination summary
      await waitFor(() => {
        expect(screen.getByText("Showing 1-2 of 2")).toBeInTheDocument();
      });
    });

    it("should paginate forward and backward", async () => {
      // Acceptance: KB01-US4.2
      // Given 21 tasks exist and the table view shows the first page
      const tasks = Array.from({ length: 21 }, (_, i) => ({
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
      renderTableView({
        getTasks: () => {
          const page = tasks.slice(currentOffset, currentOffset + 20);
          return Promise.resolve({
            data: { tasks: page, total: 21 },
            error: null,
          });
        },
      });

      await waitFor(() => {
        expect(screen.getByText("Task 1")).toBeInTheDocument();
      });
      expect(screen.getByText("Showing 1-20 of 21")).toBeInTheDocument();

      const nextBtn = screen.getByRole("button", { name: "Next page" });
      const prevBtn = screen.getByRole("button", { name: "Previous page" });
      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // When the user clicks Next page to go to page 2
      currentOffset = 20;
      await userEvent.click(nextBtn);

      // Then the second page should show the last task
      await waitFor(() => {
        expect(screen.getByText("Task 21")).toBeInTheDocument();
      });

      // When the user clicks Previous page to go back to page 1
      currentOffset = 0;
      await userEvent.click(
        screen.getByRole("button", { name: "Previous page" }),
      );

      // Then the first page should show the first task again
      await waitFor(() => {
        expect(screen.getByText("Task 1")).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should show empty state when query fails", async () => {
      // Acceptance: KB01-CC3
      // Given + When the table view is rendered and the API rejects with an error
      renderTableView({
        getTasks: () => Promise.reject(new Error("Server Error")),
      });

      // Then it should gracefully show the empty state
      await waitFor(() => {
        expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
      });
    });
  });

  describe("task actions", () => {
    it("should call delete mutation when delete button is clicked", async () => {
      // Acceptance: KB01-US4.3
      // Given the table view is rendered with tasks and a mock delete endpoint
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
                  data: { tasks: mockTasks, total: 2 },
                  error: null,
                }),
              post: () => Promise.resolve({ data: {}, error: null }),
            },
          ),
        },
      };
      const { Wrapper } = createQueryWrapper(mockClient);
      render(<TableView columns={columns} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText("Implement login")).toBeInTheDocument();
      });

      // When the user clicks the Delete button on the first task
      const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
      await userEvent.click(deleteButtons[0]);

      // Then the task should be deleted via the API
      await waitFor(() => {
        expect(deleteMock).toHaveBeenCalled();
      });
    });
  });
});
