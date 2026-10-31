export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { utilizador: { select: { id: true, nome: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
