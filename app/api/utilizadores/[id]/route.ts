export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const user = await prisma.utilizador.findUnique({
    where: { id: params?.id },
    select: {
      id: true, nome: true, email: true, role: true, ativo: true, createdAt: true,
      professorTurmas: { include: { turma: { include: { anoLetivo: true } } } },
      turmaAlunos: { include: { turma: { include: { anoLetivo: true } } } },
      encarregadoDe: { include: { educando: { select: { id: true, nome: true, email: true } } } },
      educandoDe: { include: { encarregado: { select: { id: true, nome: true, email: true } } } },
    },
  });

  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const data: any = {};
    if (body?.nome) data.nome = body.nome;
    if (body?.email) data.email = body.email;
    if (body?.role) data.role = body.role;
    if (typeof body?.ativo === "boolean") data.ativo = body.ativo;
    if (body?.password) data.passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.utilizador.update({
      where: { id: params?.id },
      data,
    });

    await logAudit({
      utilizadorId: getUserId(session),
      acao: "EDITAR_UTILIZADOR",
      entidade: "Utilizador",
      entidadeId: user.id,
      detalhes: JSON.stringify(Object.keys(data)),
      ip: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ id: user.id, email: user.email, nome: user.nome, role: user.role, ativo: user.ativo });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  await prisma.utilizador.update({ where: { id: params?.id }, data: { ativo: false } });

  await logAudit({
    utilizadorId: getUserId(session),
    acao: "DESATIVAR_UTILIZADOR",
    entidade: "Utilizador",
    entidadeId: params?.id,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true });
}
