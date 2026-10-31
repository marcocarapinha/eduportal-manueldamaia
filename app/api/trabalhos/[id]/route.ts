export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId, getUserRole } from "@/lib/auth-guard";
import { getFileUrl } from "@/lib/s3";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = getUserId(session);
  const role = getUserRole(session);

  const trabalho = await prisma.trabalho.findUnique({
    where: { id: params?.id },
    include: {
      turma: { include: { alunos: { select: { alunoId: true } }, professores: { select: { professorId: true } } } },
      professor: { select: { id: true, nome: true } },
      entregas: {
        include: {
          aluno: { select: { id: true, nome: true, email: true } },
          avaliacao: true,
        },
        orderBy: { entregueEm: "desc" },
      },
    },
  });

  if (!trabalho) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Row-level: filter entregas based on role
  let filteredEntregas = trabalho.entregas ?? [];
  if (role === "ALUNO") {
    filteredEntregas = filteredEntregas.filter((e: any) => e?.alunoId === userId);
  } else if (role === "ENCARREGADO") {
    const educandos = await prisma.encarregadoEducando.findMany({ where: { encarregadoId: userId }, select: { educandoId: true } });
    const educandoIds = (educandos ?? []).map((e: any) => e?.educandoId);
    filteredEntregas = filteredEntregas.filter((e: any) => educandoIds.includes(e?.alunoId));
  }

  // Generate download URLs for files
  let ficheiroUrl: string | null = null;
  if (trabalho?.ficheiroPath) {
    ficheiroUrl = await getFileUrl(trabalho.ficheiroPath, "application/octet-stream", trabalho.ficheiroPublic);
  }

  return NextResponse.json({
    ...trabalho,
    entregas: filteredEntregas,
    ficheiroUrl,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["PROFESSOR", "ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const data: any = {};
  if (body?.titulo) data.titulo = body.titulo;
  if (body?.descricao !== undefined) data.descricao = body.descricao;
  if (body?.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;
  if (body?.pesoAvaliacao !== undefined) data.pesoAvaliacao = body.pesoAvaliacao;
  if (typeof body?.permiteEntregaAposPrazo === "boolean") data.permiteEntregaAposPrazo = body.permiteEntregaAposPrazo;
  if (typeof body?.publicado === "boolean") data.publicado = body.publicado;
  if (body?.ficheiroNome !== undefined) data.ficheiroNome = body.ficheiroNome;
  if (body?.ficheiroPath !== undefined) data.ficheiroPath = body.ficheiroPath;

  const trabalho = await prisma.trabalho.update({ where: { id: params?.id }, data });
  return NextResponse.json(trabalho);
}
