import { NextRequest, NextResponse } from "next/server";
import { createPhoto, deletePhoto, getPhotos } from "@/lib/db";
import { saveUploadedFile } from "@/lib/upload";
import { todayISO } from "@/lib/timezone";
import type { PhotoCategory } from "@/lib/types";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const photos = await getPhotos(category);
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const date = (formData.get("date") as string) || todayISO();
  const category = ((formData.get("category") as string) || "meal") as PhotoCategory;
  const caption = (formData.get("caption") as string) || undefined;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const { filename } = await saveUploadedFile(file, "photos");
  const photo = await createPhoto({ date, category, filename, caption });
  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deletePhoto(id);
  return NextResponse.json({ ok: true });
}
