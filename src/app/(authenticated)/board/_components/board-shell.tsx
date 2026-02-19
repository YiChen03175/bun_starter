"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useEden, useEdenClient } from "@/lib/eden";
import { KanbanView } from "./kanban-view";
import { TableView } from "./table-view";
import { ViewToggle } from "./view-toggle";

export function BoardShell() {
  const eden = useEden();
  const edenClient = useEdenClient();
  const qc = useQueryClient();
  const [view, setView] = useState<"board" | "table">("board");

  const columnsQueryKey = eden.api.columns.get.queryKey();

  const {
    data: columns,
    isLoading,
    error,
  } = useQuery(eden.api.columns.get.queryOptions());

  const createColumnMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await edenClient.api.columns.post({ title });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: columnsQueryKey }),
  });

  const renameColumnMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const { data, error } = await edenClient.api
        .columns({ id })
        .put({ title });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: columnsQueryKey }),
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await edenClient.api.columns({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: columnsQueryKey });
      qc.invalidateQueries({ queryKey: eden.api.tasks.get.queryKey() });
    },
  });

  const handleAddColumn = async (title: string) => {
    await createColumnMutation.mutateAsync(title);
  };

  if (error) {
    return <p className="text-destructive">Failed to load board</p>;
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading board...</p>;
  }

  const cols = columns ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div
        data-testid="board-header"
        className="flex items-center justify-between"
      >
        <h1 className="font-bold text-2xl">Kanban Board</h1>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === "board" ? (
        <KanbanView
          columns={cols}
          onAddColumn={handleAddColumn}
          onRenameColumn={(id, title) =>
            renameColumnMutation.mutate({ id, title })
          }
          onDeleteColumn={(id) => deleteColumnMutation.mutate(id)}
        />
      ) : (
        <TableView columns={cols} />
      )}
    </div>
  );
}
