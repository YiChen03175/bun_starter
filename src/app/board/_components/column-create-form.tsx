"use client";

import { type SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ColumnCreateFormProps {
  onAdd: (title: string) => Promise<void>;
}

export function ColumnCreateForm({ onAdd }: ColumnCreateFormProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setTitle("");
    } catch {
      // Keep title so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-72 shrink-0">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="New column..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          className="h-8 text-sm"
        />
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "..." : "Add"}
        </Button>
      </form>
    </div>
  );
}
