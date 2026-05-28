import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getUserProfile, upsertUserProfile, getUploadsDir } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getUserProfile());
}

export async function PUT(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    const data: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (key !== "avatar") data[key] = value;
    }

    if (file) {
      const ext = path.extname(file.name) || ".jpg";
      const filename = `profile-avatar${ext}`;
      const uploadsDir = getUploadsDir();
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      data.avatar_filename = filename;
    }

    const profile = upsertUserProfile(data as Parameters<typeof upsertUserProfile>[0]);
    return NextResponse.json(profile);
  }

  const body = await req.json();
  const profile = upsertUserProfile(body);
  return NextResponse.json(profile);
}
