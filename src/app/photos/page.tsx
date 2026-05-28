"use client";

import { useEffect, useState, useCallback } from "react";
import type { PhotoEntry } from "@/lib/types";
import { PHOTO_CATEGORIES } from "@/lib/utils";
import { PhotoUpload, PhotoGallery } from "@/components/PhotoUpload";
import { Card } from "@/components/ui";

export default function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/photos");
    setPhotos(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Photo Tracking</h1>
        <p className="text-sm text-[var(--muted)]">
          Upload meal pics, body progress shots, and comparison photos.
        </p>
      </div>

      <PhotoUpload onUploaded={load} defaultCategory="body" />

      <Card
        title="Gallery"
        action={
          <div className="flex gap-1">
            <FilterBtn active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            {PHOTO_CATEGORIES.map((c) => (
              <FilterBtn key={c} active={filter === c} onClick={() => setFilter(c)} label={c} />
            ))}
          </div>
        }
      >
        <PhotoGallery
          photos={photos}
          filter={filter === "all" ? undefined : filter}
          onDelete={async (id) => {
            await fetch(`/api/photos/${id}`, { method: "DELETE" });
            load();
          }}
        />
      </Card>
    </div>
  );
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2 py-0.5 text-xs capitalize transition-colors ${
        active
          ? "bg-[var(--accent)]/15 text-[var(--accent)]"
          : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}
