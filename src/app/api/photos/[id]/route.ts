import { NextRequest, NextResponse } from "next/server";
import { deletePhoto } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deletePhoto(id);
  return NextResponse.json({ ok: true });
}
