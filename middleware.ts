import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req?.nextauth?.token;
    const path = req?.nextUrl?.pathname ?? "";

    // Admin only paths
    if (path?.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/turmas/:path*",
    "/trabalhos/:path*",
    "/perfil/:path*",
    "/notificacoes/:path*",
    "/api/utilizadores/:path*",
    "/api/turmas/:path*",
    "/api/trabalhos/:path*",
    "/api/entregas/:path*",
    "/api/avaliacoes/:path*",
    "/api/notificacoes/:path*",
    "/api/configuracoes/:path*",
    "/api/audit-logs/:path*",
    "/api/anos-letivos/:path*",
    "/api/upload/:path*",
  ],
};
