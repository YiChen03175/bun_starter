"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEden, useEdenClient } from "@/lib/eden";
import { ColumnHeader } from "./column-header";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";

interface KanbanColumnProps {
  column: { id: number; title: string };
  allColumns: { id: number; title: string }[];
  onRenameColumn: (id: number, title: string) => void;
  onDeleteColumn: (id: number) => void;
}

const PAGE_SIZE = 10;

export function KanbanColumn({
  column,
  allColumns,
  onRenameColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const eden = useEden();
  const edenClient = useEdenClient();
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery(
    eden.api.tasks.get.queryOptions({
      columnId: column.id,
      limit: PAGE_SIZE,
      offset,
    }),
  );

  const tasks = data?.tasks ?? [];
  const total = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await edenClient.api.tasks.post({
        title,
        columnId: column.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: eden.api.tasks.get.queryKey() }),
  });

  const moveMutation = useMutation({
    mutationFn: async ({
      taskId,
      columnId,
    }: {
      taskId: number;
      columnId: number;
    }) => {
      const { data, error } = await edenClient.api
        .tasks({ id: taskId })
        .put({ columnId });
      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: eden.api.tasks.get.queryKey() }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const { data, error } = await edenClient.api
        .tasks({ id: taskId })
        .delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: eden.api.tasks.get.queryKey() }),
  });

  const handleAddTask = async (title: string) => {
    await createMutation.mutateAsync(title);
  };

  const hasNext = offset + PAGE_SIZE < total;
  const hasPrev = offset > 0;

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/50 p-3">
      <ColumnHeader
        title={column.title}
        taskCount={total}
        onRename={(title) => onRenameColumn(column.id, title)}
        onDelete={() => onDeleteColumn(column.id)}
      />

      <div className="mt-3 flex flex-1 flex-col gap-2">
        {isLoading ? (
          <p className="text-muted-foreground text-xs">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground text-xs">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columns={allColumns}
              currentColumnId={column.id}
              onMove={(taskId, colId) =>
                moveMutation.mutate({ taskId, columnId: colId })
              }
              onDelete={(taskId) => deleteMutation.mutate(taskId)}
            />
          ))
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasPrev}
            onClick={() => setOffset((o) => o - PAGE_SIZE)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasNext}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="mt-2">
        <TaskForm onAdd={handleAddTask} />
      </div>
    </div>
  );
}
