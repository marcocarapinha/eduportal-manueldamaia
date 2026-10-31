"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Bell, LogOut, User, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props {
  onToggleSidebar?: () => void;
}

export default function AppHeader({ onToggleSidebar }: Props) {
  const { data: session } = useSession() || {};
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notificacoes?limit=5");
      if (res?.ok) {
        const data = await res.json();
        setUnreadCount(data?.naoLidas ?? 0);
        setNotifs(data?.notificacoes ?? []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const markAsRead = async (id: string) => {
    await fetch("/api/notificacoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotifs();
  };

  return (
    <header className="h-16 border-b border-border bg-card/70 surface-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden rounded-full active:scale-95" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Tema claro / escuro */}
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notificações" className="relative rounded-full transition-all duration-200 hover:bg-accent active:scale-95">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-in zoom-in-50">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b border-border">
              <p className="font-semibold text-sm">Notificações</p>
            </div>
            {(notifs?.length ?? 0) === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Sem notificações</div>
            ) : (
              (notifs ?? []).slice(0, 5).map((n: any) => (
                <DropdownMenuItem key={n?.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors" onClick={() => markAsRead(n?.id)}>
                  <span className={`text-sm font-medium ${!n?.lida ? "text-foreground" : "text-muted-foreground"}`}>{n?.titulo ?? ""}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">{n?.mensagem ?? ""}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notificacoes" className="justify-center text-primary text-sm font-medium">Ver todas</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu do perfil" className="rounded-full transition-all duration-200 hover:bg-accent active:scale-95">
              <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center text-primary font-bold text-sm transition-colors">
                {(session?.user?.name ?? "?")?.charAt(0)?.toUpperCase()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{session?.user?.name ?? ""}</p>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>{session?.user?.email ?? ""}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="gap-2"><User className="h-4 w-4" /> Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" /> Terminar Sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
