"use client";

import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  view: "board" | "table";
  onViewChange: (view: "board" | "table") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 rounded-md border p-1">
      <Button
        variant={view === "board" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("board")}
      >
        Board
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
      >
        Table
      </Button>
    </div>
  );
}
