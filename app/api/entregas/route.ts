export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { criarNotificacao } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["ALUNO"]);
  if (error) return error;

  const userId = getUserId(session);
  const body = await req.json();
  const { trabalhoId, ficheiroNome, ficheiroPath, ficheiroPublic } = body ?? {};

  if (!trabalhoId || !ficheiroPath) {
    return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
  }

  const trabalho = await prisma.trabalho.findUnique({ where: { id: trabalhoId }, include: { turma: true } });
  if (!trabalho) return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });

  const isLate = trabalho?.deadline ? new Date() > new Date(trabalho.deadline) : false;
  if (isLate && !trabalho?.permiteEntregaAposPrazo) {
    return NextResponse.json({ error: "Prazo expirado" }, { status: 400 });
  }

  // Get current version count
  const existingCount = await prisma.entrega.count({ where: { trabalhoId, alunoId: userId } });

  const entrega = await prisma.entrega.create({
    data: {
      trabalhoId,
      alunoId: userId,
      ficheiroNome: ficheiroNome ?? null,
      ficheiroPath,
      ficheiroPublic: ficheiroPublic ?? false,
      versao: existingCount + 1,
      emAtraso: isLate,
      estado: isLate ? "ATRASADO" : "ENTREGUE",
    },
  });

  // Notify professor
  await criarNotificacao({
    utilizadorId: trabalho.professorId,
    tipo: "NOVA_ENTREGA",
    titulo: "Nova entrega recebida",
    mensagem: `Entrega para "${trabalho.titulo}" na turma ${trabalho?.turma?.nome ?? ""}.`,
    link: `/trabalhos/${trabalhoId}`,
  });

  await logAudit({
    utilizadorId: userId,
    acao: "SUBMETER_ENTREGA",
    entidade: "Entrega",
    entidadeId: entrega.id,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(entrega, { status: 201 });
}
