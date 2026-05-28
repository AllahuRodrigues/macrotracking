import { NextRequest, NextResponse } from "next/server";
import {
  createBodyMetric,
  deleteBodyMetric,
  getBodyMetrics,
  updateBodyMetric,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get("limit");
  const metrics = await getBodyMetrics(limit ? parseInt(limit) : undefined);
  return NextResponse.json(metrics);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await createBodyMetric(body);
  return NextResponse.json(entry, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const updated = await updateBodyMetric(id, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteBodyMetric(id);
  return NextResponse.json({ ok: true });
}
