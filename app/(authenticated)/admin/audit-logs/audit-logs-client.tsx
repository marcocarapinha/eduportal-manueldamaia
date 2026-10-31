"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { FadeIn } from "@/components/ui/animate";

export default function AuditLogsClient() {
  const [data, setData] = useState<any>({ logs: [], total: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async (p: number) => {
    const res = await fetch(`/api/audit-logs?page=${p}&limit=20`);
    if (res?.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <FadeIn>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Logs de Auditoria</h1>
          <p className="text-muted-foreground text-sm mt-1">Histórico de ações realizadas na plataforma</p>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Utilizador</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">A carregar...</TableCell></TableRow> :
                    (data?.logs ?? []).map((log: any) => (
                      <TableRow key={log?.id}>
                        <TableCell className="text-xs font-mono whitespace-nowrap">
                          {log?.createdAt ? new Date(log.createdAt).toLocaleString("pt-PT", { timeZone: "UTC" }) : ""}
                        </TableCell>
                        <TableCell>{log?.utilizador?.nome ?? "Sistema"}</TableCell>
                        <TableCell><Badge variant="outline">{log?.acao ?? ""}</Badge></TableCell>
                        <TableCell>{log?.entidade ?? ""}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{log?.detalhes ?? ""}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
