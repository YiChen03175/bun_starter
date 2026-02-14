"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface TodoItemProps {
  todo: {
    id: number;
    title: string;
    completed: boolean;
  };
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-md border px-3 py-2">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id, todo.completed)}
      />
      <span
        className={`flex-1 ${todo.completed ? "text-muted-foreground line-through" : ""}`}
      >
        {todo.title}
      </span>
      <Button variant="ghost" size="sm" onClick={() => onDelete(todo.id)}>
        Delete
      </Button>
    </li>
  );
}
