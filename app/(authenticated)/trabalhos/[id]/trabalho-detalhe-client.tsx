"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Download, Upload, Clock, CheckCircle2,
  AlertTriangle, Star, MessageSquare, Send
} from "lucide-react";
import { toast } from "sonner";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/animate";

export default function TrabalhoDetalheClient({ id }: { id: string }) {
  const { data: session } = useSession() || {};
  const role = (session?.user as any)?.role ?? "ALUNO";
  const [trabalho, setTrabalho] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avaliarOpen, setAvaliarOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<any>(null);
  const [avalForm, setAvalForm] = useState({ nota: "", comentario: "", publicada: true });

  const fetchTrabalho = useCallback(async () => {
    const res = await fetch(`/api/trabalhos/${id}`);
    if (res?.ok) setTrabalho(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchTrabalho(); }, [fetchTrabalho]);

  const handleDownloadEnunciado = async () => {
    if (!trabalho?.ficheiroUrl) return;
    const a = document.createElement("a");
    a.href = trabalho.ficheiroUrl;
    a.download = trabalho?.ficheiroNome ?? "enunciado";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUploadEntrega = async (file: File) => {
    setUploading(true);
    try {
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream", isPublic: false }),
      });
      if (!presignRes?.ok) { toast.error("Erro ao preparar upload"); return; }
      const { uploadUrl, cloud_storage_path } = await presignRes.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      const entregaRes = await fetch("/api/entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trabalhoId: id, ficheiroNome: file.name, ficheiroPath: cloud_storage_path }),
      });

      if (entregaRes?.ok) {
        toast.success("Entrega submetida com sucesso!");
        fetchTrabalho();
      } else {
        const err = await entregaRes?.json().catch(() => ({}));
        toast.error(err?.error ?? "Erro ao submeter");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadEntrega = async (entregaId: string) => {
    const res = await fetch(`/api/entregas/${entregaId}/download`);
    if (res?.ok) {
      const { url, nome } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = nome ?? "ficheiro";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else toast.error("Erro ao descarregar");
  };

  const handleAvaliar = async () => {
    if (!selectedEntrega || !avalForm.nota) { toast.error("Nota obrigatória"); return; }
    const nota = parseFloat(avalForm.nota);
    if (isNaN(nota) || nota < 0 || nota > 20) { toast.error("Nota entre 0 e 20"); return; }

    const res = await fetch("/api/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entregaId: selectedEntrega.id, nota, comentario: avalForm.comentario, publicada: avalForm.publicada }),
    });
    if (res?.ok) {
      toast.success("Avaliação guardada!");
      setAvaliarOpen(false);
      setSelectedEntrega(null);
      setAvalForm({ nota: "", comentario: "", publicada: true });
      fetchTrabalho();
    } else toast.error("Erro ao avaliar");
  };

  if (loading) return <div className="flex items-center justify-center p-12 text-muted-foreground">A carregar...</div>;
  if (!trabalho) return <div className="flex items-center justify-center p-12 text-muted-foreground">Trabalho não encontrado</div>;

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "ENTREGUE": return <Badge className="bg-blue-100 text-blue-800">Entregue</Badge>;
      case "ATRASADO": return <Badge className="bg-amber-100 text-amber-800">Atrasado</Badge>;
      case "AVALIADO": return <Badge className="bg-green-100 text-green-800">Avaliado</Badge>;
      default: return <Badge variant="secondary">Por realizar</Badge>;
    }
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> {trabalho?.titulo ?? ""}
                </CardTitle>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{trabalho?.turma?.nome ?? ""}</Badge>
                  <span>por {trabalho?.professor?.nome ?? ""}</span>
                </div>
              </div>
              {trabalho?.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Prazo: {new Date(trabalho.deadline).toLocaleString("pt-PT", { timeZone: "UTC" })}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {trabalho?.descricao && (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{trabalho.descricao}</p>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {trabalho?.ficheiroNome && (
                <Button onClick={handleDownloadEnunciado} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> {trabalho.ficheiroNome}
                </Button>
              )}
              {trabalho?.pesoAvaliacao && (
                <Badge variant="secondary">Peso: {trabalho.pesoAvaliacao}</Badge>
              )}
              {trabalho?.permiteEntregaAposPrazo && (
                <Badge variant="secondary">Aceita entregas tardias</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload entrega (aluno) */}
        {role === "ALUNO" && (
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="h-5 w-5" /> Submeter Entrega</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={(e: any) => { const f = e?.target?.files?.[0]; if (f) handleUploadEntrega(f); }}
                  className="mx-auto text-sm"
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-muted-foreground mt-2">A submeter...</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entregas */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Entregas ({(trabalho?.entregas?.length ?? 0)})</CardTitle></CardHeader>
          <CardContent>
            {(trabalho?.entregas?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sem entregas.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {(role === "PROFESSOR" || role === "ADMIN") && <TableHead>Aluno</TableHead>}
                      <TableHead>Ficheiro</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(trabalho?.entregas ?? []).map((ent: any) => (
                      <TableRow key={ent?.id}>
                        {(role === "PROFESSOR" || role === "ADMIN") && <TableCell className="font-medium">{ent?.aluno?.nome ?? ""}</TableCell>}
                        <TableCell>{ent?.ficheiroNome ?? "--"}</TableCell>
                        <TableCell>v{ent?.versao ?? 1}</TableCell>
                        <TableCell className="text-xs">{ent?.entregueEm ? new Date(ent.entregueEm).toLocaleString("pt-PT", { timeZone: "UTC" }) : ""}</TableCell>
                        <TableCell>{getEstadoBadge(ent?.estado ?? "POR_REALIZAR")}</TableCell>
                        <TableCell>
                          {ent?.avaliacao?.publicada ? (
                            <Badge className={`${(ent?.avaliacao?.nota ?? 0) >= 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {ent?.avaliacao?.nota ?? 0}/20
                            </Badge>
                          ) : "--"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {ent?.ficheiroPath && (
                              <Button size="sm" variant="ghost" onClick={() => handleDownloadEntrega(ent.id)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {(role === "PROFESSOR" || role === "ADMIN") && ent?.estado !== "POR_REALIZAR" && (
                              <Button size="sm" variant="ghost" onClick={() => {
                                setSelectedEntrega(ent);
                                setAvalForm({
                                  nota: ent?.avaliacao?.nota?.toString() ?? "",
                                  comentario: ent?.avaliacao?.comentario ?? "",
                                  publicada: ent?.avaliacao?.publicada ?? true,
                                });
                                setAvaliarOpen(true);
                              }}>
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avaliação dialog */}
        <Dialog open={avaliarOpen} onOpenChange={setAvaliarOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Avaliar Entrega de {selectedEntrega?.aluno?.nome ?? ""}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nota (0-20)</Label><Input type="number" min={0} max={20} step={0.5} value={avalForm.nota} onChange={(e: any) => setAvalForm({ ...avalForm, nota: e?.target?.value ?? "" })} /></div>
              <div><Label>Comentário</Label><Textarea value={avalForm.comentario} onChange={(e: any) => setAvalForm({ ...avalForm, comentario: e?.target?.value ?? "" })} rows={3} /></div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={avalForm.publicada} onChange={(e: any) => setAvalForm({ ...avalForm, publicada: e?.target?.checked })} className="rounded" />
                <Label>Publicar avaliação (visível para aluno e EE)</Label>
              </div>
              <Button onClick={handleAvaliar} className="w-full gap-2"><Send className="h-4 w-4" /> Guardar Avaliação</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FadeIn>
  );
}
