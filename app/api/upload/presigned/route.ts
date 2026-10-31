export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { generatePresignedUploadUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { fileName, contentType, isPublic } = await req.json();
  if (!fileName || !contentType) {
    return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
  }

  const result = await generatePresignedUploadUrl(fileName, contentType, isPublic ?? false);
  return NextResponse.json(result);
}
