"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";
import type { PhotoEntry } from "@/lib/types";
import { PHOTO_CATEGORIES } from "@/lib/utils";
import { Button, Input, Select, Card } from "./ui";

interface PhotoUploadProps {
  onUploaded: () => void;
}

export function PhotoUpload({ onUploaded }: PhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("meal");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("date", date);
    formData.append("category", category);
    if (caption) formData.append("caption", caption);

    try {
      await fetch("/api/photos", { method: "POST", body: formData });
      setOpen(false);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        <Plus size={16} /> Upload Photo
      </Button>
    );
  }

  return (
    <Card title="Upload Photo">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {PHOTO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-[var(--muted)]">Image</span>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--background)] px-4 py-8 transition-colors hover:border-[var(--accent)]"
          >
            <Upload size={24} className="text-[var(--muted)]" />
            <span className="text-sm text-[var(--muted)]">Click to select image</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" required />
        </label>

        <Input label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional caption..." />

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            <Upload size={16} /> Upload
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface PhotoGalleryProps {
  photos: PhotoEntry[];
  onDelete: (id: string) => void;
  filter?: string;
}

export function PhotoGallery({ photos, onDelete, filter }: PhotoGalleryProps) {
  const filtered = filter ? photos.filter((p) => p.category === filter) : photos;

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted)]">
        No photos yet. Upload meal, body, or progress pics.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {filtered.map((photo) => (
        <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-[var(--card-border)]">
          <div className="relative aspect-square">
            <Image
              src={`/uploads/${photo.filename}`}
              alt={photo.caption ?? photo.category}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <p className="text-xs font-medium capitalize">{photo.category}</p>
              <p className="text-[10px] text-gray-300">{photo.date}</p>
              {photo.caption && <p className="text-[10px] text-gray-400 truncate">{photo.caption}</p>}
            </div>
            <button
              onClick={() => onDelete(photo.id)}
              className="absolute right-2 top-2 rounded-lg bg-red-600/80 p-1.5 text-white"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
