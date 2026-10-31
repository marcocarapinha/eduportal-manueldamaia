export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId, getUserRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { notificarTurma } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = getUserId(session);
  const role = getUserRole(session);
  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");

  let where: any = { publicado: true };
  if (turmaId) where.turmaId = turmaId;

  if (role === "PROFESSOR") {
    const turmaIds = (await prisma.professorTurma.findMany({ where: { professorId: userId }, select: { turmaId: true } })).map((t: any) => t?.turmaId);
    if (!turmaId) where.turmaId = { in: turmaIds };
    delete where.publicado;
  } else if (role === "ALUNO") {
    const turmaIds = (await prisma.turmaAluno.findMany({ where: { alunoId: userId }, select: { turmaId: true } })).map((t: any) => t?.turmaId);
    if (!turmaId) where.turmaId = { in: turmaIds };
  } else if (role === "ENCARREGADO") {
    const educandos = await prisma.encarregadoEducando.findMany({ where: { encarregadoId: userId }, select: { educandoId: true } });
    const educandoIds = (educandos ?? []).map((e: any) => e?.educandoId);
    const turmaIds = (await prisma.turmaAluno.findMany({ where: { alunoId: { in: educandoIds } }, select: { turmaId: true } })).map((t: any) => t?.turmaId);
    if (!turmaId) where.turmaId = { in: turmaIds };
  }

  const trabalhos = await prisma.trabalho.findMany({
    where,
    include: {
      turma: { select: { id: true, nome: true } },
      professor: { select: { id: true, nome: true } },
      _count: { select: { entregas: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trabalhos);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["PROFESSOR", "ADMIN"]);
  if (error) return error;

  const userId = getUserId(session);
  const body = await req.json();
  const { titulo, descricao, turmaId, deadline, pesoAvaliacao, permiteEntregaAposPrazo, ficheiroNome, ficheiroPath, ficheiroPublic } = body ?? {};

  if (!titulo || !turmaId) {
    return NextResponse.json({ error: "Título e turma são obrigatórios" }, { status: 400 });
  }

  const trabalho = await prisma.trabalho.create({
    data: {
      titulo,
      descricao: descricao ?? null,
      turmaId,
      professorId: userId,
      deadline: deadline ? new Date(deadline) : null,
      pesoAvaliacao: pesoAvaliacao ?? 1.0,
      permiteEntregaAposPrazo: permiteEntregaAposPrazo ?? false,
      ficheiroNome: ficheiroNome ?? null,
      ficheiroPath: ficheiroPath ?? null,
      ficheiroPublic: ficheiroPublic ?? false,
    },
  });

  await notificarTurma({
    turmaId,
    tipo: "NOVO_TRABALHO",
    titulo: "Novo trabalho publicado",
    mensagem: `O trabalho "${titulo}" foi publicado.`,
    link: `/trabalhos/${trabalho.id}`,
    excludeUserId: userId,
  });

  await logAudit({
    utilizadorId: userId,
    acao: "CRIAR_TRABALHO",
    entidade: "Trabalho",
    entidadeId: trabalho.id,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(trabalho, { status: 201 });
}
