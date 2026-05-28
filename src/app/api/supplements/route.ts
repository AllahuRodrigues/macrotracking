import { NextRequest, NextResponse } from "next/server";
import {
  createSupplement,
  deleteSupplement,
  getSupplements,
  updateSupplement,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get("active") === "1";
  return NextResponse.json(await getSupplements(activeOnly));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json(createSupplement(body), { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const updated = await updateSupplement(id, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteSupplement(id);
  return NextResponse.json({ ok: true });
}
