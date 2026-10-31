export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { criarNotificacao } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["PROFESSOR", "ADMIN"]);
  if (error) return error;

  const userId = getUserId(session);
  const body = await req.json();
  const { entregaId, nota, comentario, publicada } = body ?? {};

  if (!entregaId || nota === undefined || nota === null) {
    return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
  }

  if (nota < 0 || nota > 20) {
    return NextResponse.json({ error: "Nota deve estar entre 0 e 20" }, { status: 400 });
  }

  const entrega = await prisma.entrega.findUnique({
    where: { id: entregaId },
    include: { trabalho: true },
  });
  if (!entrega) return NextResponse.json({ error: "Entrega não encontrada" }, { status: 404 });

  // Upsert avaliacao
  const avaliacao = await prisma.avaliacao.upsert({
    where: { entregaId },
    update: {
      nota,
      comentario: comentario ?? null,
      publicada: publicada ?? false,
      publicadaEm: publicada ? new Date() : null,
      professorId: userId,
    },
    create: {
      entregaId,
      professorId: userId,
      nota,
      comentario: comentario ?? null,
      publicada: publicada ?? false,
      publicadaEm: publicada ? new Date() : null,
    },
  });

  // Update entrega status
  await prisma.entrega.update({ where: { id: entregaId }, data: { estado: "AVALIADO" } });

  // Notify student if published
  if (publicada) {
    await criarNotificacao({
      utilizadorId: entrega.alunoId,
      tipo: "AVALIACAO_PUBLICADA",
      titulo: "Avaliação publicada",
      mensagem: `A sua entrega de "${entrega?.trabalho?.titulo ?? ""}" foi avaliada: ${nota}/20.`,
      link: `/trabalhos/${entrega.trabalhoId}`,
    });

    // Notify EE
    const ees = await prisma.encarregadoEducando.findMany({
      where: { educandoId: entrega.alunoId },
      select: { encarregadoId: true },
    });
    for (const ee of ees ?? []) {
      await criarNotificacao({
        utilizadorId: ee.encarregadoId,
        tipo: "AVALIACAO_EDUCANDO",
        titulo: "Avaliação do educando",
        mensagem: `Avaliação publicada para "${entrega?.trabalho?.titulo ?? ""}": ${nota}/20.`,
        link: `/trabalhos/${entrega.trabalhoId}`,
      });
    }
  }

  await logAudit({
    utilizadorId: userId,
    acao: "AVALIAR_ENTREGA",
    entidade: "Avaliacao",
    entidadeId: avaliacao.id,
    detalhes: `Nota: ${nota}`,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(avaliacao, { status: 201 });
}
