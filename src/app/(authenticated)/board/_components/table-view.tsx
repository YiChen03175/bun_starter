"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEden, useEdenClient } from "@/lib/eden-query";
import type { SelectColumn } from "@/server/db/schema";

interface TableViewProps {
  columns: Pick<SelectColumn, "id" | "title">[];
}

const PAGE_SIZE = 20;

export function TableView({ columns }: TableViewProps) {
  const eden = useEden();
  const edenClient = useEdenClient();
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery(
    eden.api.tasks.get.queryOptions({
      limit: PAGE_SIZE,
      offset,
    }),
  );

  const tasks = data?.tasks ?? [];
  const total = data?.total ?? 0;

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

  const columnMap = useMemo(
    () => new Map(columns.map((c) => [c.id, c.title])),
    [columns],
  );

  const hasNext = offset + PAGE_SIZE < total;
  const hasPrev = offset > 0;
  const showing =
    tasks.length > 0
      ? `${offset + 1}-${offset + tasks.length} of ${total}`
      : "0";

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>;
  }

  if (tasks.length === 0 && offset === 0) {
    return <p className="text-muted-foreground text-sm">No tasks yet.</p>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Column</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {columnMap.get(task.columnId) ?? "Unknown"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {task.description || "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(task.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Showing {showing}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => setOffset((o) => o - PAGE_SIZE)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
