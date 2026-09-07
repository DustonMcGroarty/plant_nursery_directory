"use client";

import { useState } from "react";
import { NurseryCard } from "@/components/NurseryCard";
import { NurseryMap } from "@/components/NurseryMap";
import type { NurserySearchResultItem } from "@/lib/nursery-queries";

export function SearchResultsView({ items }: { items: NurserySearchResultItem[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const mappable = items.filter((n) => n.latitude !== 0 || n.longitude !== 0);

  return (
    <div>
      <div className="mt-6 mb-4 inline-flex rounded-xl border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
            view === "list" ? "bg-primary text-primary-contrast" : "text-muted"
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
            view === "map" ? "bg-primary text-primary-contrast" : "text-muted"
          }`}
        >
          Map
        </button>
      </div>

      {view === "list" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <NurseryCard key={n.id} nursery={n} />
          ))}
        </div>
      ) : (
        <NurseryMap
          markers={mappable.map((n) => ({
            id: n.id,
            slug: n.slug,
            name: n.name,
            lat: n.latitude,
            lng: n.longitude,
          }))}
          height={480}
          className="rounded-[20px]"
        />
      )}
    </div>
  );
}
