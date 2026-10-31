export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: rawEmail, password, name, role } = body ?? {};

    if (!rawEmail || !password || !name) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
    }

    const email = String(rawEmail).trim().toLowerCase();
    const existing = await prisma.utilizador.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já registado" }, { status: 409 });
    }

    const validRoles = ["ADMIN", "PROFESSOR", "ALUNO", "ENCARREGADO"];
    const safeRole = validRoles.includes(role) ? role : "ALUNO";

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.utilizador.create({
      data: {
        email,
        passwordHash,
        nome: name,
        role: safeRole,
      },
    });

    await logAudit({
      utilizadorId: user.id,
      acao: "REGISTO",
      entidade: "Utilizador",
      entidadeId: user.id,
      ip: req.headers.get("x-forwarded-for") ?? null,
    });

    return NextResponse.json({ id: user.id, email: user.email, nome: user.nome, role: user.role }, { status: 201 });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
