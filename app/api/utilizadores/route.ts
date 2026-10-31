export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const ativo = searchParams.get("ativo");

  const where: any = {};
  if (role) where.role = role;
  if (ativo !== null && ativo !== undefined && ativo !== "") where.ativo = ativo === "true";

  const users = await prisma.utilizador.findMany({
    where,
    select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { email: rawEmail, password, nome, role } = body ?? {};
    if (!rawEmail || !password || !nome || !role) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
    }

    const email = String(rawEmail).trim().toLowerCase();
    const existing = await prisma.utilizador.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já existe" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.utilizador.create({
      data: { email, passwordHash, nome, role },
    });

    await logAudit({
      utilizadorId: getUserId(session),
      acao: "CRIAR_UTILIZADOR",
      entidade: "Utilizador",
      entidadeId: user.id,
      detalhes: `Criado ${role}: ${nome}`,
      ip: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ id: user.id, email: user.email, nome: user.nome, role: user.role }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
