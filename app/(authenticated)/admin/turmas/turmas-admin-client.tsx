"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { School, Plus, UserPlus, Eye } from "lucide-react";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/animate";
import Link from "next/link";

export default function TurmasAdminClient() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [anos, setAnos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<any>(null);
  const [form, setForm] = useState({ nome: "", anoLetivoId: "" });
  const [memberForm, setMemberForm] = useState({ userId: "", tipo: "aluno" });

  const fetchAll = useCallback(async () => {
    const [tRes, aRes, uRes] = await Promise.all([
      fetch("/api/turmas"), fetch("/api/anos-letivos"), fetch("/api/utilizadores")
    ]);
    if (tRes?.ok) setTurmas(await tRes.json());
    if (aRes?.ok) setAnos(await aRes.json());
    if (uRes?.ok) setUsers(await uRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!form.nome || !form.anoLetivoId) { toast.error("Preencha todos os campos"); return; }
    const res = await fetch("/api/turmas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res?.ok) { toast.success("Turma criada"); setCreateOpen(false); setForm({ nome: "", anoLetivoId: "" }); fetchAll(); }
    else { toast.error("Erro ao criar turma"); }
  };

  const handleAddMember = async () => {
    if (!memberForm.userId || !selectedTurma) { toast.error("Selecione um utilizador"); return; }
    const res = await fetch(`/api/turmas/${selectedTurma?.id}/membros`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberForm),
    });
    if (res?.ok) { toast.success("Membro adicionado"); setMemberOpen(false); fetchAll(); }
    else { const err = await res?.json().catch(() => ({})); toast.error(err?.error ?? "Erro"); }
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><School className="h-6 w-6 text-primary" /> Gestão de Turmas</h1>
            <p className="text-muted-foreground text-sm mt-1">Criar turmas e gerir membros</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Turma</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Turma</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome da Turma</Label><Input value={form.nome} onChange={(e: any) => setForm({ ...form, nome: e?.target?.value ?? "" })} placeholder="7ºA" /></div>
                <div><Label>Ano Letivo</Label>
                  <Select value={form.anoLetivoId} onValueChange={(v: string) => setForm({ ...form, anoLetivoId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{(anos ?? []).map((a: any) => <SelectItem key={a?.id} value={a?.id}>{a?.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">Criar Turma</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Ano Letivo</TableHead>
                    <TableHead>Professores</TableHead>
                    <TableHead>Alunos</TableHead>
                    <TableHead>Trabalhos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">A carregar...</TableCell></TableRow> :
                    (turmas ?? []).map((t: any) => (
                      <TableRow key={t?.id}>
                        <TableCell className="font-medium">{t?.nome ?? ""}</TableCell>
                        <TableCell>{t?.anoLetivo?.nome ?? ""}</TableCell>
                        <TableCell><Badge variant="secondary">{t?._count?.professores ?? 0}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{t?._count?.alunos ?? 0}</Badge></TableCell>
                        <TableCell>{t?._count?.trabalhos ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setSelectedTurma(t); setMemberOpen(true); }}>
                              <UserPlus className="h-4 w-4" /> Membro
                            </Button>
                            <Button size="sm" variant="ghost" asChild><Link href={`/turmas?id=${t?.id}`}><Eye className="h-4 w-4" /></Link></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Membro a {selectedTurma?.nome ?? ""}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Tipo</Label>
                <Select value={memberForm.tipo} onValueChange={(v: string) => setMemberForm({ ...memberForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="aluno">Aluno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Utilizador</Label>
                <Select value={memberForm.userId} onValueChange={(v: string) => setMemberForm({ ...memberForm, userId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {(users ?? []).filter((u: any) => memberForm.tipo === "professor" ? u?.role === "PROFESSOR" : u?.role === "ALUNO").map((u: any) => (
                      <SelectItem key={u?.id} value={u?.id}>{u?.nome} ({u?.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} className="w-full">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FadeIn>
  );
}
