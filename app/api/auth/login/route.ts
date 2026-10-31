export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, password } = await req.json();
    if (!rawEmail || !password) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
    }

    const email = String(rawEmail).trim().toLowerCase();
    const user = await prisma.utilizador.findUnique({ where: { email } });
    if (!user || !user?.ativo) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    return NextResponse.json({ id: user.id, email: user.email, nome: user.nome, role: user.role });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
