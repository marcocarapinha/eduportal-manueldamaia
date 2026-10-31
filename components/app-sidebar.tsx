"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  Settings, FileText, ClipboardList, Bell, Shield,
  School, Calendar, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: Record<string, Array<{ href: string; label: string; icon: any }>> = {
  ADMIN: [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/admin/utilizadores", label: "Utilizadores", icon: Users },
    { href: "/admin/anos-letivos", label: "Anos Letivos", icon: Calendar },
    { href: "/admin/turmas", label: "Turmas", icon: School },
    { href: "/trabalhos", label: "Trabalhos", icon: FileText },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
    { href: "/admin/audit-logs", label: "Logs de Auditoria", icon: Shield },
    { href: "/notificacoes", label: "Notificações", icon: Bell },
  ],
  PROFESSOR: [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/turmas", label: "As Minhas Turmas", icon: School },
    { href: "/trabalhos", label: "Trabalhos", icon: FileText },
    { href: "/notificacoes", label: "Notificações", icon: Bell },
  ],
  ALUNO: [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/turmas", label: "As Minhas Turmas", icon: School },
    { href: "/trabalhos", label: "Trabalhos", icon: ClipboardList },
    { href: "/notificacoes", label: "Notificações", icon: Bell },
  ],
  ENCARREGADO: [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/trabalhos", label: "Trabalhos", icon: FileText },
    { href: "/notificacoes", label: "Notificações", icon: Bell },
  ],
};

export default function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const role = (session?.user as any)?.role ?? "ALUNO";
  const items = navItems[role] ?? navItems.ALUNO;

  return (
    <aside className="w-64 h-full bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2 group rounded-lg">
          <GraduationCap className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-foreground">EduPortal</h1>
            <p className="text-xs text-muted-foreground">Agrupamento Manuel da Maia</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-none">
        {items.map((item: any) => {
          const Icon = item?.icon;
          const isActive = pathname === item?.href || pathname?.startsWith(item?.href + "/");
          return (
            <Link
              key={item?.href}
              href={item?.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                "transition-all duration-200 ease-out",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-primary transition-all duration-300",
                  isActive ? "h-6 opacity-100" : "h-0 opacity-0"
                )}
              />
              {Icon && <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />}
              <span className="truncate">{item?.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {(session?.user?.name ?? "?")?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name ?? ""}</p>
            <p className="text-xs text-muted-foreground truncate">
              {role === "ADMIN" ? "Administrador" : role === "PROFESSOR" ? "Professor" : role === "ALUNO" ? "Aluno" : "Enc. Educação"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
