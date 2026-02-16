"use client";

import { ColumnCreateForm } from "./column-create-form";
import { KanbanColumn } from "./kanban-column";

interface KanbanViewProps {
  columns: { id: number; title: string }[];
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
    <div className="flex gap-4 overflow-x-auto pb-4">
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
