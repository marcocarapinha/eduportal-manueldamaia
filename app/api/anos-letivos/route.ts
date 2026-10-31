export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const anos = await prisma.anoLetivo.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { turmas: true } } } });
  return NextResponse.json(anos);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { nome } = await req.json();
  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const ano = await prisma.anoLetivo.create({ data: { nome } });

  await logAudit({
    utilizadorId: getUserId(session),
    acao: "CRIAR_ANO_LETIVO",
    entidade: "AnoLetivo",
    entidadeId: ano.id,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(ano, { status: 201 });
}
