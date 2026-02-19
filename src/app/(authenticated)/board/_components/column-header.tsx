"use client";

import { X } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ColumnHeaderProps {
  title: string;
  taskCount: number;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export function ColumnHeader({
  title,
  taskCount,
  onRename,
  onDelete,
}: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const saveAndClose = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== title) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    saveAndClose();
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-1">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="h-7 text-sm"
          autoFocus
          onBlur={(e) => {
            // Skip save if blur was caused by clicking the delete button,
            // otherwise the rename fires before the delete click registers.
            if (
              e.relatedTarget instanceof HTMLElement &&
              e.relatedTarget.getAttribute("aria-label") === "Delete column"
            ) {
              setEditing(false);
              return;
            }
            saveAndClose();
          }}
        />
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-pointer font-semibold text-sm"
          onClick={() => setEditing(true)}
        >
          {title}
        </button>
        <Badge variant="secondary" className="text-xs">
          {taskCount}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground"
        onClick={onDelete}
        aria-label="Delete column"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
