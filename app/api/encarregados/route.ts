export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getUserId } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { encarregadoId, educandoId } = await req.json();
  if (!encarregadoId || !educandoId) {
    return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
  }

  try {
    await prisma.encarregadoEducando.create({ data: { encarregadoId, educandoId } });

    await logAudit({
      utilizadorId: getUserId(session),
      acao: "ASSOCIAR_EE_EDUCANDO",
      entidade: "EncarregadoEducando",
      detalhes: `EE: ${encarregadoId} -> Aluno: ${educandoId}`,
      ip: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Já associado" }, { status: 409 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const encarregadoId = searchParams.get("encarregadoId");
  const educandoId = searchParams.get("educandoId");

  if (!encarregadoId || !educandoId) {
    return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
  }

  await prisma.encarregadoEducando.deleteMany({ where: { encarregadoId, educandoId } });
  return NextResponse.json({ ok: true });
}
