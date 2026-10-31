export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const configs = await prisma.configuracaoPlataforma.findMany();
  const map: Record<string, string> = {};
  for (const c of configs ?? []) {
    map[c.chave] = c.valor;
  }
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const userId = getUserId(session);
  const body = await req.json();
  const entries = Object.entries(body ?? {});

  for (const [chave, valor] of entries) {
    await prisma.configuracaoPlataforma.upsert({
      where: { chave },
      update: { valor: String(valor) },
      create: { chave, valor: String(valor) },
    });
  }

  await logAudit({
    utilizadorId: userId,
    acao: "ATUALIZAR_CONFIGURACAO",
    entidade: "ConfiguracaoPlataforma",
    detalhes: entries.map(([k]: any) => k).join(", "),
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true });
}
