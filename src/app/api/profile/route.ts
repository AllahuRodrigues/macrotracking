import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, upsertUserProfile } from "@/lib/db";
import { saveUploadedFile } from "@/lib/upload";

export async function GET() {
  return NextResponse.json(await getUserProfile());
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
      const { filename } = await saveUploadedFile(file, "avatars");
      data.avatar_filename = filename;
    }

    const profile = await upsertUserProfile(data as Parameters<typeof upsertUserProfile>[0]);
    return NextResponse.json(profile);
  }

  const body = await req.json();
  const profile = await upsertUserProfile(body);
  return NextResponse.json(profile);
}
