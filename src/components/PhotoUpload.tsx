"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/storage";
import { Plus, Trash2, Upload, AlertCircle } from "lucide-react";
import type { PhotoEntry } from "@/lib/types";
import { PHOTO_CATEGORIES, todayISO } from "@/lib/utils";
import { Button, Input, Select, Card } from "./ui";
import { DatePickerField } from "./DatePicker";

interface PhotoUploadProps {
  onUploaded: () => void;
  defaultCategory?: string;
}

export function PhotoUpload({ onUploaded, defaultCategory = "body" }: PhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState(defaultCategory);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("date", date);
    formData.append("category", category);
    if (caption) formData.append("caption", caption);

    try {
      const res = await fetch("/api/photos", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      setOpen(false);
      setCaption("");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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
        <DatePickerField label="Date" value={date} onChange={setDate} />
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
            className="relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--background)] px-4 py-8 transition-colors hover:border-[var(--accent)]"
          >
            {preview ? (
              <div className="relative h-48 w-full">
                <Image src={preview} alt="Preview" fill className="object-contain" unoptimized />
              </div>
            ) : (
              <>
                <Upload size={24} className="text-[var(--muted)]" />
                <span className="text-sm text-[var(--muted)]">Tap to select photo</span>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            required
            onChange={handleFileSelect}
          />
        </label>

        <Input
          label="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. May 28 — front flex"
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            <Upload size={16} /> {loading ? "Saving…" : "Save Photo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setPreview(null);
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface PhotoGalleryProps {
  photos: PhotoEntry[];
  onDelete?: (id: string) => void;
  filter?: string;
}

function PhotoImage({ photo }: { photo: PhotoEntry }) {
  const [failed, setFailed] = useState(false);
  const src = getImageUrl(photo.filename);

  if (failed || !src) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--card-border)] text-xs text-[var(--muted)]">
        Failed to load
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={photo.caption ?? photo.category}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 50vw, 25vw"
      unoptimized
      onError={() => setFailed(true)}
    />
  );
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
        <div
          key={photo.id}
          className="group relative overflow-hidden rounded-xl border border-[var(--card-border)]"
        >
          <div className="relative aspect-[3/4]">
            <PhotoImage photo={photo} />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <p className="text-xs font-medium capitalize text-white">{photo.category}</p>
            <p className="text-[10px] text-gray-300">{photo.date}</p>
            {photo.caption && (
              <p className="text-[10px] text-gray-400 truncate">{photo.caption}</p>
            )}
          </div>
          {onDelete && (
          <button
            onClick={() => onDelete(photo.id)}
            className="absolute right-2 top-2 rounded-lg bg-red-600/80 p-1.5 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            aria-label="Delete photo"
          >
            <Trash2 size={14} />
          </button>
          )}
        </div>
      ))}
    </div>
  );
}
