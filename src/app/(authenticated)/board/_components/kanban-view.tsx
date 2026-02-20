"use client";

import type { SelectColumn } from "@/server/db/schema";
import { ColumnCreateForm } from "./column-create-form";
import { KanbanColumn } from "./kanban-column";

interface KanbanViewProps {
  columns: Pick<SelectColumn, "id" | "title">[];
  onAddColumn: (title: string) => Promise<void>;
  onRenameColumn: (id: number, title: string) => void;
  onDeleteColumn: (id: number) => void;
}

export function KanbanView({
  columns,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
}: KanbanViewProps) {
  return (
    <div
      data-testid="kanban-scroll-area"
      className="flex flex-1 gap-4 overflow-x-auto p-1 pb-4"
    >
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          allColumns={columns}
          onRenameColumn={onRenameColumn}
          onDeleteColumn={onDeleteColumn}
        />
      ))}
      <ColumnCreateForm onAdd={onAddColumn} />
    </div>
  );
}
