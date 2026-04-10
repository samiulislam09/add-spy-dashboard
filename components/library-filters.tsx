"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";

import { Button, Input, Select } from "@cia/ui";

const platformOptions = [
  { label: "All platforms", value: "" },
  { label: "Meta", value: "META" },
  { label: "TikTok", value: "TIKTOK" },
  { label: "Google", value: "GOOGLE" },
];

const formatOptions = [
  { label: "All formats", value: "" },
  { label: "Image", value: "IMAGE" },
  { label: "Video", value: "VIDEO" },
  { label: "Carousel", value: "CAROUSEL" },
  { label: "Text", value: "TEXT" },
];

const sortOptions = [
  { label: "Newest last seen", value: "LAST_SEEN_DESC" },
  { label: "Newest first seen", value: "FIRST_SEEN_DESC" },
  { label: "Longest running", value: "LONGEST_RUNNING" },
  { label: "Recently changed", value: "MOST_RECENTLY_CHANGED" },
];

export function LibraryFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    next.set("page", "1");
    router.push(`/library?${next.toString()}`);
  };

  return (
    <aside className="sticky top-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-medium text-slate-900">Filters</h3>
      <div className="mt-3 space-y-3">
        <Input
          placeholder="Keyword, hook, competitor"
          defaultValue={params.get("q") || ""}
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              update("q", (event.target as HTMLInputElement).value);
            }
          }}
        />

        <Select
          options={platformOptions}
          value={params.get("platform") || ""}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => update("platform", event.target.value)}
        />

        <Select
          options={formatOptions}
          value={params.get("adFormat") || ""}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => update("adFormat", event.target.value)}
        />

        <Select
          options={sortOptions}
          value={params.get("sortBy") || "LAST_SEEN_DESC"}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => update("sortBy", event.target.value)}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={params.get("activeOnly") === "true"}
            onChange={(event) => update("activeOnly", event.target.checked ? "true" : "")}
          />
          Active ads only
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={params.get("hasVideo") === "true"}
            onChange={(event) => update("hasVideo", event.target.checked ? "true" : "")}
          />
          Has video
        </label>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => router.push("/library")}
        >
          Clear filters
        </Button>
      </div>
    </aside>
  );
}
