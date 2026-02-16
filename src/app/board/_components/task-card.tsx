"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description: string | null;
  };
  columns: { id: number; title: string }[];
  currentColumnId: number;
  onMove: (taskId: number, columnId: number) => void;
  onDelete: (taskId: number) => void;
}

export function TaskCard({
  task,
  columns,
  currentColumnId,
  onMove,
  onDelete,
}: TaskCardProps) {
  const otherColumns = columns.filter((c) => c.id !== currentColumnId);

  return (
    <div className="rounded-md border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{task.title}</p>
          {task.description && (
            <p className="mt-1 text-muted-foreground text-xs">
              {task.description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {otherColumns.map((col) => (
              <DropdownMenuItem
                key={col.id}
                onClick={() => onMove(task.id, col.id)}
              >
                Move to {col.title}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
