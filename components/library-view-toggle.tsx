"use client";

import { Button } from "@cia/ui";

import { useLibraryStore } from "@/lib/library-store";

const modes = ["grid", "list", "compare"] as const;

export function LibraryViewToggle() {
  const viewMode = useLibraryStore((state: { viewMode: "grid" | "list" | "compare" }) => state.viewMode);
  const setViewMode = useLibraryStore(
    (state: { setViewMode: (mode: "grid" | "list" | "compare") => void }) => state.setViewMode,
  );

  return (
    <div className="flex items-center gap-2">
      {modes.map((mode) => (
        <Button
          key={mode}
          size="sm"
          variant={viewMode === mode ? "default" : "secondary"}
          onClick={() => setViewMode(mode)}
        >
          {mode}
        </Button>
      ))}
    </div>
  );
}
