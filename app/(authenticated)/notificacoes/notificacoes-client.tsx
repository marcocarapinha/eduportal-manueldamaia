"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/animate";

export default function NotificacoesClient() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = useCallback(async () => {
    const res = await fetch("/api/notificacoes?limit=100");
    if (res?.ok) {
      const data = await res.json();
      setNotifs(data?.notificacoes ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markAllRead = async () => {
    await fetch("/api/notificacoes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marcarTodas: true }) });
    toast.success("Todas marcadas como lidas");
    fetchNotifs();
  };

  const markRead = async (id: string) => {
    await fetch("/api/notificacoes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchNotifs();
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /> Notificações</h1>
          </div>
          <Button variant="outline" onClick={markAllRead} className="gap-2"><CheckCheck className="h-4 w-4" /> Marcar todas como lidas</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : notifs.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Sem notificações.</CardContent></Card>
        ) : (
          <Stagger className="space-y-2">
            {notifs.map((n: any) => (
              <StaggerItem key={n?.id}>
                <Card className={`transition-colors ${!n?.lida ? "bg-primary/5 border-primary/20" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1" onClick={() => !n?.lida && markRead(n?.id)} role="button" tabIndex={0}>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${!n?.lida ? "text-foreground" : "text-muted-foreground"}`}>{n?.titulo ?? ""}</p>
                          {!n?.lida && <Badge className="h-5 px-1.5 text-xs">Nova</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{n?.mensagem ?? ""}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {n?.createdAt ? new Date(n.createdAt).toLocaleString("pt-PT", { timeZone: "UTC" }) : ""}
                        </p>
                      </div>
                      {n?.link && (
                        <Button asChild size="sm" variant="ghost"><Link href={n.link}><ExternalLink className="h-4 w-4" /></Link></Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </FadeIn>
  );
}
