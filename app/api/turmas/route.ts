export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId, getUserRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = getUserId(session);
  const role = getUserRole(session);
  const { searchParams } = new URL(req.url);
  const anoLetivoId = searchParams.get("anoLetivoId");

  let where: any = {};
  if (anoLetivoId) where.anoLetivoId = anoLetivoId;

  if (role === "PROFESSOR") {
    where.professores = { some: { professorId: userId } };
  } else if (role === "ALUNO") {
    where.alunos = { some: { alunoId: userId } };
  } else if (role === "ENCARREGADO") {
    const educandos = await prisma.encarregadoEducando.findMany({
      where: { encarregadoId: userId },
      select: { educandoId: true },
    });
    const educandoIds = (educandos ?? []).map((e: any) => e?.educandoId);
    where.alunos = { some: { alunoId: { in: educandoIds } } };
  }

  const turmas = await prisma.turma.findMany({
    where,
    include: {
      anoLetivo: true,
      _count: { select: { alunos: true, professores: true, trabalhos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(turmas);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { nome, anoLetivoId } = await req.json();
  if (!nome || !anoLetivoId) return NextResponse.json({ error: "Dados em falta" }, { status: 400 });

  const turma = await prisma.turma.create({ data: { nome, anoLetivoId } });

  await logAudit({
    utilizadorId: getUserId(session),
    acao: "CRIAR_TURMA",
    entidade: "Turma",
    entidadeId: turma.id,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(turma, { status: 201 });
}
