export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = getUserId(session);
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const unreadOnly = searchParams.get("unread") === "true";

  const where: any = { utilizadorId: userId };
  if (unreadOnly) where.lida = false;

  const [notifs, unreadCount] = await Promise.all([
    prisma.notificacao.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notificacao.count({ where: { utilizadorId: userId, lida: false } }),
  ]);

  return NextResponse.json({ notificacoes: notifs, naoLidas: unreadCount });
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = getUserId(session);
  const body = await req.json();

  if (body?.marcarTodas) {
    await prisma.notificacao.updateMany({
      where: { utilizadorId: userId, lida: false },
      data: { lida: true },
    });
  } else if (body?.id) {
    await prisma.notificacao.updateMany({
      where: { id: body.id, utilizadorId: userId },
      data: { lida: true },
    });
  }

  return NextResponse.json({ ok: true });
}
