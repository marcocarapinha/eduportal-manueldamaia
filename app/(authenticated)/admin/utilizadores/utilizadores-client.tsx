"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Search, Edit, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/animate";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  PROFESSOR: "Professor",
  ALUNO: "Aluno",
  ENCARREGADO: "Enc. Educação",
};

export default function UtilizadoresClient() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ nome: "", email: "", password: "", role: "ALUNO" });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/utilizadores");
      if (res?.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSave = async () => {
    if (!form.nome || !form.email) { toast.error("Preencha todos os campos"); return; }
    if (!editUser && !form.password) { toast.error("Palavra-passe obrigatória"); return; }

    const url = editUser ? `/api/utilizadores/${editUser.id}` : "/api/utilizadores";
    const method = editUser ? "PUT" : "POST";
    const body: any = { nome: form.nome, email: form.email, role: form.role };
    if (form.password) body.password = form.password;

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res?.ok) {
      toast.success(editUser ? "Utilizador atualizado" : "Utilizador criado");
      setDialogOpen(false);
      setEditUser(null);
      setForm({ nome: "", email: "", password: "", role: "ALUNO" });
      fetchUsers();
    } else {
      const err = await res?.json().catch(() => ({}));
      toast.error(err?.error ?? "Erro");
    }
  };

  const toggleActive = async (user: any) => {
    await fetch(`/api/utilizadores/${user?.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !user?.ativo }),
    });
    fetchUsers();
  };

  const filtered = (users ?? []).filter((u: any) => {
    const matchSearch = (u?.nome ?? "").toLowerCase().includes(search.toLowerCase()) || (u?.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u?.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> Gestão de Utilizadores
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Criar, editar e gerir utilizadores da plataforma</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open: boolean) => { setDialogOpen(open); if (!open) { setEditUser(null); setForm({ nome: "", email: "", password: "", role: "ALUNO" }); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Utilizador</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editUser ? "Editar" : "Novo"} Utilizador</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome</Label><Input value={form.nome} onChange={(e: any) => setForm({ ...form, nome: e?.target?.value ?? "" })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e?.target?.value ?? "" })} /></div>
                <div><Label>{editUser ? "Nova Palavra-passe (opcional)" : "Palavra-passe"}</Label><Input type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e?.target?.value ?? "" })} /></div>
                <div><Label>Perfil</Label>
                  <Select value={form.role} onValueChange={(v: string) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="PROFESSOR">Professor</SelectItem>
                      <SelectItem value="ALUNO">Aluno</SelectItem>
                      <SelectItem value="ENCARREGADO">Enc. Educação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Pesquisar..." value={search} onChange={(e: any) => setSearch(e?.target?.value ?? "")} className="pl-10" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ADMIN">Administradores</SelectItem>
                  <SelectItem value="PROFESSOR">Professores</SelectItem>
                  <SelectItem value="ALUNO">Alunos</SelectItem>
                  <SelectItem value="ENCARREGADO">Enc. Educação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">A carregar...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sem resultados</TableCell></TableRow>
                  ) : (
                    filtered.map((u: any) => (
                      <TableRow key={u?.id}>
                        <TableCell className="font-medium">{u?.nome ?? ""}</TableCell>
                        <TableCell className="text-muted-foreground" suppressHydrationWarning>{u?.email ?? ""}</TableCell>
                        <TableCell><Badge variant="secondary">{ROLE_LABELS[u?.role] ?? u?.role}</Badge></TableCell>
                        <TableCell><Badge variant={u?.ativo ? "default" : "destructive"}>{u?.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditUser(u); setForm({ nome: u?.nome ?? "", email: u?.email ?? "", password: "", role: u?.role ?? "ALUNO" }); setDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => toggleActive(u)}>
                              {u?.ativo ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
