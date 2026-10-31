export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { userId, tipo } = await req.json();
  if (!userId || !tipo) return NextResponse.json({ error: "Dados em falta" }, { status: 400 });

  try {
    if (tipo === "professor") {
      await prisma.professorTurma.create({ data: { professorId: userId, turmaId: params?.id } });
    } else if (tipo === "aluno") {
      await prisma.turmaAluno.create({ data: { alunoId: userId, turmaId: params?.id } });
    }

    await logAudit({
      utilizadorId: getUserId(session),
      acao: "ADICIONAR_MEMBRO_TURMA",
      entidade: "Turma",
      entidadeId: params?.id,
      detalhes: `${tipo}: ${userId}`,
      ip: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Já é membro" }, { status: 409 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const tipo = searchParams.get("tipo");

  if (!userId || !tipo) return NextResponse.json({ error: "Dados em falta" }, { status: 400 });

  if (tipo === "professor") {
    await prisma.professorTurma.deleteMany({ where: { professorId: userId, turmaId: params?.id } });
  } else {
    await prisma.turmaAluno.deleteMany({ where: { alunoId: userId, turmaId: params?.id } });
  }

  await logAudit({
    utilizadorId: getUserId(session),
    acao: "REMOVER_MEMBRO_TURMA",
    entidade: "Turma",
    entidadeId: params?.id,
    detalhes: `${tipo}: ${userId}`,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true });
}
