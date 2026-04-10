"use client";

import { create } from "zustand";

type ViewMode = "grid" | "list" | "compare";

type LibraryState = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

export const useLibraryStore = create<LibraryState>((set: (partial: Partial<LibraryState>) => void) => ({
  viewMode: "grid",
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
}));
