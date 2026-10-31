import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await getAuthSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }), session: null };
  }
  const userRole = (session.user as any)?.role as Role;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return { error: NextResponse.json({ error: "Sem permissão" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export function getUserId(session: any): string {
  return (session?.user as any)?.id ?? "";
}

export function getUserRole(session: any): Role {
  return ((session?.user as any)?.role ?? "ALUNO") as Role;
}
