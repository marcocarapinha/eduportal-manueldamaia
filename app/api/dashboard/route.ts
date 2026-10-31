export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId, getUserRole } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = getUserId(session);
  const role = getUserRole(session);

  try {
    if (role === "ADMIN") {
      const [totalUsers, totalTurmas, totalTrabalhos, totalEntregas, recentLogs] = await Promise.all([
        prisma.utilizador.count(),
        prisma.turma.count(),
        prisma.trabalho.count(),
        prisma.entrega.count(),
        prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { utilizador: { select: { nome: true } } } }),
      ]);

      const usersByRole = await prisma.utilizador.groupBy({ by: ["role"], _count: true });

      return NextResponse.json({
        role: "ADMIN",
        stats: { totalUsers, totalTurmas, totalTrabalhos, totalEntregas },
        usersByRole: (usersByRole ?? []).map((u: any) => ({ role: u?.role, count: u?._count ?? 0 })),
        recentLogs,
      });
    }

    if (role === "PROFESSOR") {
      const turmaIds = (await prisma.professorTurma.findMany({ where: { professorId: userId }, select: { turmaId: true } })).map((t: any) => t?.turmaId);

      const [turmas, trabalhosPendentes, entregasPorAvaliar, totalTrabalhos] = await Promise.all([
        prisma.turma.findMany({ where: { id: { in: turmaIds } }, include: { _count: { select: { alunos: true } } } }),
        prisma.trabalho.count({ where: { professorId: userId, deadline: { gte: new Date() } } }),
        prisma.entrega.count({ where: { trabalho: { professorId: userId }, estado: { in: ["ENTREGUE", "ATRASADO"] } } }),
        prisma.trabalho.count({ where: { professorId: userId } }),
      ]);

      return NextResponse.json({
        role: "PROFESSOR",
        turmas,
        stats: { totalTurmas: turmaIds?.length ?? 0, trabalhosPendentes, entregasPorAvaliar, totalTrabalhos },
      });
    }

    if (role === "ALUNO") {
      const turmaIds = (await prisma.turmaAluno.findMany({ where: { alunoId: userId }, select: { turmaId: true } })).map((t: any) => t?.turmaId);

      const [trabalhosPendentes, entregasFeitas, avaliacoes] = await Promise.all([
        prisma.trabalho.findMany({
          where: { turmaId: { in: turmaIds }, publicado: true },
          include: {
            turma: { select: { nome: true } },
            entregas: { where: { alunoId: userId } },
          },
          orderBy: { deadline: "asc" },
        }),
        prisma.entrega.count({ where: { alunoId: userId } }),
        prisma.avaliacao.findMany({
          where: { entrega: { alunoId: userId }, publicada: true },
          include: { entrega: { include: { trabalho: { select: { titulo: true, turma: { select: { nome: true } } } } } } },
          orderBy: { publicadaEm: "desc" },
          take: 10,
        }),
      ]);

      const pendentes = (trabalhosPendentes ?? []).filter((t: any) => {
        const hasEntrega = (t?.entregas?.length ?? 0) > 0;
        return !hasEntrega;
      });

      const notas = (avaliacoes ?? []).map((a: any) => a?.nota ?? 0);
      const mediaGeral = notas?.length > 0 ? notas.reduce((s: number, n: number) => s + n, 0) / notas.length : null;

      return NextResponse.json({
        role: "ALUNO",
        pendentes,
        stats: { totalTurmas: turmaIds?.length ?? 0, entregasFeitas, mediaGeral, totalPendentes: pendentes?.length ?? 0 },
        recentAvaliacoes: avaliacoes,
      });
    }

    if (role === "ENCARREGADO") {
      const educandos = await prisma.encarregadoEducando.findMany({
        where: { encarregadoId: userId },
        include: {
          educando: {
            select: {
              id: true, nome: true, email: true,
              turmaAlunos: { include: { turma: { select: { nome: true } } } },
              entregas: {
                include: {
                  trabalho: { select: { titulo: true, deadline: true, turma: { select: { nome: true } } } },
                  avaliacao: true,
                },
                orderBy: { entregueEm: "desc" },
                take: 10,
              },
            },
          },
        },
      });

      const educandoData = (educandos ?? []).map((e: any) => {
        const aluno = e?.educando;
        const avaliacoes = (aluno?.entregas ?? []).filter((ent: any) => ent?.avaliacao?.publicada).map((ent: any) => ent?.avaliacao?.nota ?? 0);
        const media = avaliacoes?.length > 0 ? avaliacoes.reduce((s: number, n: number) => s + n, 0) / avaliacoes.length : null;
        return { ...aluno, mediaGeral: media };
      });

      return NextResponse.json({ role: "ENCARREGADO", educandos: educandoData });
    }

    return NextResponse.json({ role });
  } catch (e: any) {
    console.error("Dashboard error:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
