import { prisma } from "@/lib/db";

export async function logAudit(params: {
  utilizadorId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  detalhes?: string | null;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        utilizadorId: params?.utilizadorId ?? null,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params?.entidadeId ?? null,
        detalhes: params?.detalhes ?? null,
        ip: params?.ip ?? null,
      },
    });
  } catch (e) {
    console.error("Erro ao registar auditoria:", e);
  }
}
