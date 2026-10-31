import { prisma } from "@/lib/db";

export async function criarNotificacao(params: {
  utilizadorId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
}) {
  try {
    await prisma.notificacao.create({
      data: {
        utilizadorId: params.utilizadorId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensagem: params.mensagem,
        link: params?.link ?? null,
      },
    });
  } catch (e) {
    console.error("Erro ao criar notificação:", e);
  }
}

export async function notificarTurma(params: {
  turmaId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
  excludeUserId?: string;
}) {
  try {
    const alunos = await prisma.turmaAluno.findMany({
      where: { turmaId: params.turmaId },
      select: { alunoId: true },
    });
    const ids = (alunos ?? []).map((a: any) => a?.alunoId).filter(Boolean);
    if (params?.excludeUserId) {
      const idx = ids.indexOf(params.excludeUserId);
      if (idx >= 0) ids.splice(idx, 1);
    }
    await prisma.notificacao.createMany({
      data: ids.map((id: string) => ({
        utilizadorId: id,
        tipo: params.tipo,
        titulo: params.titulo,
        mensagem: params.mensagem,
        link: params?.link ?? null,
      })),
    });
  } catch (e) {
    console.error("Erro ao notificar turma:", e);
  }
}
