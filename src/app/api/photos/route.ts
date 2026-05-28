import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createPhoto, deletePhoto, getPhotos, getUploadsDir } from "@/lib/db";
import type { PhotoCategory } from "@/lib/types";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const photos = getPhotos(category);
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
  const category = ((formData.get("category") as string) || "meal") as PhotoCategory;
  const caption = (formData.get("caption") as string) || undefined;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${uuidv4()}${ext}`;
  const uploadsDir = getUploadsDir();
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

  const photo = createPhoto({ date, category, filename, caption });
  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  deletePhoto(id);
  return NextResponse.json({ ok: true });
}
