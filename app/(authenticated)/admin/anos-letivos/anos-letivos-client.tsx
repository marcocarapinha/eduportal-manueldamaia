"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/animate";

export default function AnosLetivosClient() {
  const [anos, setAnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");

  const fetchAnos = useCallback(async () => {
    const res = await fetch("/api/anos-letivos");
    if (res?.ok) setAnos(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnos(); }, [fetchAnos]);

  const handleCreate = async () => {
    if (!nome) { toast.error("Nome obrigatório"); return; }
    const res = await fetch("/api/anos-letivos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome }) });
    if (res?.ok) { toast.success("Ano letivo criado"); setDialogOpen(false); setNome(""); fetchAnos(); }
    else { const err = await res?.json().catch(() => ({})); toast.error(err?.error ?? "Erro"); }
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Calendar className="h-6 w-6 text-primary" /> Anos Letivos</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerir períodos letivos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Ano</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Ano Letivo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome (ex: 2025/2026)</Label><Input value={nome} onChange={(e: any) => setNome(e?.target?.value ?? "")} placeholder="2025/2026" /></div>
                <Button onClick={handleCreate} className="w-full">Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Turmas</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={3} className="text-center py-8">A carregar...</TableCell></TableRow> :
                  (anos ?? []).map((a: any) => (
                    <TableRow key={a?.id}>
                      <TableCell className="font-medium">{a?.nome ?? ""}</TableCell>
                      <TableCell>{a?._count?.turmas ?? 0}</TableCell>
                      <TableCell><Badge variant={a?.ativo ? "default" : "secondary"}>{a?.ativo ? "Ativo" : "Arquivo"}</Badge></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
