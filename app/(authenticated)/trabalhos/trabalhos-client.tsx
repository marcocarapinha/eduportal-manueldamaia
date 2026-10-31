"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Clock, CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { FadeIn, Stagger, StaggerItem, HoverLift } from "@/components/ui/animate";

export default function TrabalhosClient() {
  const { data: session } = useSession() || {};
  const searchParams = useSearchParams();
  const turmaIdParam = searchParams?.get("turmaId") ?? "";
  const role = (session?.user as any)?.role ?? "ALUNO";

  const [trabalhos, setTrabalhos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [turmaFilter, setTurmaFilter] = useState(turmaIdParam || "ALL");

  const [form, setForm] = useState({
    titulo: "", descricao: "", turmaId: turmaIdParam, deadline: "",
    pesoAvaliacao: "1", permiteEntregaAposPrazo: false,
    ficheiroNome: "", ficheiroPath: "", ficheiroPublic: false,
  });
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    const params = turmaFilter && turmaFilter !== "ALL" ? `?turmaId=${turmaFilter}` : "";
    const [tRes, turmasRes] = await Promise.all([
      fetch(`/api/trabalhos${params}`),
      fetch("/api/turmas"),
    ]);
    if (tRes?.ok) setTrabalhos(await tRes.json());
    if (turmasRes?.ok) setTurmas(await turmasRes.json());
    setLoading(false);
  }, [turmaFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream", isPublic: false }),
      });
      if (!presignRes?.ok) { toast.error("Erro ao preparar upload"); return; }
      const { uploadUrl, cloud_storage_path } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadRes?.ok) { toast.error("Erro no upload"); return; }

      setForm((prev) => ({ ...prev, ficheiroNome: file.name, ficheiroPath: cloud_storage_path }));
      toast.success("Ficheiro carregado");
    } catch (e) {
      console.error(e);
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.titulo || !form.turmaId) { toast.error("Título e turma obrigatórios"); return; }
    const res = await fetch("/api/trabalhos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        pesoAvaliacao: parseFloat(form.pesoAvaliacao) || 1,
        deadline: form.deadline || null,
      }),
    });
    if (res?.ok) {
      toast.success("Trabalho criado e alunos notificados!");
      setCreateOpen(false);
      setForm({ titulo: "", descricao: "", turmaId: turmaIdParam, deadline: "", pesoAvaliacao: "1", permiteEntregaAposPrazo: false, ficheiroNome: "", ficheiroPath: "", ficheiroPublic: false });
      fetchData();
    } else toast.error("Erro ao criar trabalho");
  };

  const getEstadoBadge = (t: any) => {
    if (!t?.deadline) return <Badge variant="secondary">Sem prazo</Badge>;
    const now = new Date();
    const dl = new Date(t.deadline);
    if (dl < now) return <Badge variant="destructive">Expirado</Badge>;
    const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return <Badge className="bg-amber-100 text-amber-800">{diffDays}d restantes</Badge>;
    return <Badge variant="secondary">{diffDays}d restantes</Badge>;
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Trabalhos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Lista de trabalhos das turmas</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={turmaFilter} onValueChange={setTurmaFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Todas as turmas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {(turmas ?? []).map((t: any) => <SelectItem key={t?.id} value={t?.id}>{t?.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {(role === "PROFESSOR" || role === "ADMIN") && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo</Button></DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Novo Trabalho</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Título</Label><Input value={form.titulo} onChange={(e: any) => setForm({ ...form, titulo: e?.target?.value ?? "" })} /></div>
                    <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e: any) => setForm({ ...form, descricao: e?.target?.value ?? "" })} rows={3} /></div>
                    <div><Label>Turma</Label>
                      <Select value={form.turmaId} onValueChange={(v: string) => setForm({ ...form, turmaId: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                        <SelectContent>{(turmas ?? []).map((t: any) => <SelectItem key={t?.id} value={t?.id}>{t?.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Prazo</Label><Input type="datetime-local" value={form.deadline} onChange={(e: any) => setForm({ ...form, deadline: e?.target?.value ?? "" })} /></div>
                      <div><Label>Peso</Label><Input type="number" step="0.1" min="0" value={form.pesoAvaliacao} onChange={(e: any) => setForm({ ...form, pesoAvaliacao: e?.target?.value ?? "1" })} /></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.permiteEntregaAposPrazo} onCheckedChange={(v: boolean) => setForm({ ...form, permiteEntregaAposPrazo: v })} />
                      <Label>Permitir entrega após prazo</Label>
                    </div>
                    <div>
                      <Label>Ficheiro do Enunciado</Label>
                      <div className="mt-2">
                        <input
                          type="file"
                          onChange={(e: any) => { const f = e?.target?.files?.[0]; if (f) handleFileUpload(f); }}
                          className="text-sm"
                          disabled={uploading}
                        />
                        {form.ficheiroNome && <p className="text-xs text-green-600 mt-1">✓ {form.ficheiroNome}</p>}
                        {uploading && <p className="text-xs text-muted-foreground mt-1">A carregar...</p>}
                      </div>
                    </div>
                    <Button onClick={handleCreate} className="w-full">Publicar Trabalho</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : trabalhos.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Sem trabalhos publicados.</CardContent></Card>
        ) : (
          <Stagger className="space-y-3">
            {trabalhos.map((t: any) => (
              <StaggerItem key={t?.id}>
                <HoverLift>
                  <Link href={`/trabalhos/${t?.id}`}>
                    <Card className="cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base">{t?.titulo ?? ""}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline">{t?.turma?.nome ?? ""}</Badge>
                              <span className="text-xs text-muted-foreground">por {t?.professor?.nome ?? ""}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getEstadoBadge(t)}
                            <Badge variant="secondary">{t?._count?.entregas ?? 0} entregas</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </FadeIn>
  );
}
