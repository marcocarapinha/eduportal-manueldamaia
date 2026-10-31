export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const turma = await prisma.turma.findUnique({
    where: { id: params?.id },
    include: {
      anoLetivo: true,
      professores: { include: { professor: { select: { id: true, nome: true, email: true } } } },
      alunos: { include: { aluno: { select: { id: true, nome: true, email: true } } } },
      trabalhos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!turma) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  return NextResponse.json(turma);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const data: any = {};
  if (body?.nome) data.nome = body.nome;
  if (typeof body?.ativo === "boolean") data.ativo = body.ativo;

  const turma = await prisma.turma.update({ where: { id: params?.id }, data });

  await logAudit({
    utilizadorId: getUserId(session),
    acao: "EDITAR_TURMA",
    entidade: "Turma",
    entidadeId: turma.id,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(turma);
}
