export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { getFileUrl } from "@/lib/s3";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const entrega = await prisma.entrega.findUnique({ where: { id: params?.id } });
  if (!entrega?.ficheiroPath) return NextResponse.json({ error: "Sem ficheiro" }, { status: 404 });

  const url = await getFileUrl(entrega.ficheiroPath, "application/octet-stream", entrega.ficheiroPublic);
  return NextResponse.json({ url, nome: entrega?.ficheiroNome ?? "ficheiro" });
}
