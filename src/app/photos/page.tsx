"use client";

import { useEffect, useState, useCallback } from "react";
import type { BodyMetric, PhotoEntry } from "@/lib/types";
import { PhotoUpload, PhotoGallery } from "@/components/PhotoUpload";
import { BodyProgressTracker } from "@/components/BodyProgressTracker";
import { QuickLogPanel } from "@/components/QuickLogPanel";
import { Card } from "@/components/ui";
import { GuestBanner } from "@/components/GuestBanner";
import { useAccess } from "@/context/AccessProvider";

export default function PhotosPage() {
  const { canWrite } = useAccess();
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [galleryFilter, setGalleryFilter] = useState<"meal" | "all">("meal");

  const load = useCallback(async () => {
    const [photosRes, bodyRes] = await Promise.all([
      fetch("/api/photos"),
      fetch("/api/body?limit=30"),
    ]);
    setPhotos(await photosRes.json());
    setBodyMetrics(await bodyRes.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const nonBodyCount = photos.filter((p) => p.category !== "body" && p.category !== "progress").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Photo Tracking</h1>
        <p className="text-sm text-[var(--muted)]">
          Body check-ins through Aug 14, 2026 — progress pics, weight, and meal photos.
        </p>
      </div>

      <GuestBanner />

      {canWrite && <QuickLogPanel onSaved={load} />}

      <BodyProgressTracker photos={photos} bodyMetrics={bodyMetrics} />

      {canWrite && <PhotoUpload onUploaded={load} defaultCategory="body" />}

      {nonBodyCount > 0 && (
        <Card
          title="Other photos"
          action={
            <div className="flex gap-1">
              <FilterBtn
                active={galleryFilter === "meal"}
                onClick={() => setGalleryFilter("meal")}
                label="Meals"
              />
              <FilterBtn
                active={galleryFilter === "all"}
                onClick={() => setGalleryFilter("all")}
                label="All non-body"
              />
            </div>
          }
        >
          <PhotoGallery
            photos={photos.filter((p) => p.category !== "body" && p.category !== "progress")}
            filter={galleryFilter === "meal" ? "meal" : undefined}
            onDelete={
              canWrite
                ? async (id) => {
                    await fetch(`/api/photos/${id}`, { method: "DELETE" });
                    load();
                  }
                : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
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
