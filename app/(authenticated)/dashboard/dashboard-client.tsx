"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users, School, FileText, ClipboardList, Clock, CheckCircle2,
  AlertTriangle, TrendingUp, BookOpen, Star
} from "lucide-react";
import { FadeIn, SlideIn, Stagger, StaggerItem } from "@/components/ui/animate";

export default function DashboardClient() {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r?.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </div>
    );
  }

  const role = data?.role ?? (session?.user as any)?.role ?? "ALUNO";
  const name = session?.user?.name ?? "";

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">Olá, {name?.split(" ")?.[0] ?? name} 👋</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo ao Agrupamento Manuel da Maia</p>
        </div>
      </FadeIn>

      {role === "ADMIN" && <AdminDashboard data={data} />}
      {role === "PROFESSOR" && <ProfessorDashboard data={data} />}
      {role === "ALUNO" && <AlunoDashboard data={data} />}
      {role === "ENCARREGADO" && <EncarregadoDashboard data={data} />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "primary" }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center`}>
            <Icon className={`h-6 w-6 text-${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{value ?? 0}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard({ data }: { data: any }) {
  const stats = data?.stats ?? {};
  return (
    <Stagger className="space-y-6">
      <StaggerItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Utilizadores" value={stats?.totalUsers ?? 0} />
          <StatCard icon={School} label="Turmas" value={stats?.totalTurmas ?? 0} />
          <StatCard icon={FileText} label="Trabalhos" value={stats?.totalTrabalhos ?? 0} />
          <StatCard icon={ClipboardList} label="Entregas" value={stats?.totalEntregas ?? 0} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Utilizadores por Perfil</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.usersByRole ?? []).map((u: any) => (
                  <div key={u?.role} className="flex items-center justify-between">
                    <span className="text-sm">{u?.role === "ADMIN" ? "Administradores" : u?.role === "PROFESSOR" ? "Professores" : u?.role === "ALUNO" ? "Alunos" : "Enc. Educação"}</span>
                    <Badge variant="secondary">{u?.count ?? 0}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Ações Rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/admin/utilizadores"><Users className="h-4 w-4" /> Gerir Utilizadores</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/admin/turmas"><School className="h-4 w-4" /> Gerir Turmas</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/admin/configuracoes"><TrendingUp className="h-4 w-4" /> Configurações</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </StaggerItem>
    </Stagger>
  );
}

function ProfessorDashboard({ data }: { data: any }) {
  const stats = data?.stats ?? {};
  return (
    <Stagger className="space-y-6">
      <StaggerItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={School} label="Turmas" value={stats?.totalTurmas ?? 0} />
          <StatCard icon={FileText} label="Trabalhos" value={stats?.totalTrabalhos ?? 0} />
          <StatCard icon={Clock} label="Trabalhos Ativos" value={stats?.trabalhosPendentes ?? 0} />
          <StatCard icon={AlertTriangle} label="Por Avaliar" value={stats?.entregasPorAvaliar ?? 0} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <Card>
          <CardHeader><CardTitle className="text-lg">As Minhas Turmas</CardTitle></CardHeader>
          <CardContent>
            {(data?.turmas?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma turma atribuída.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(data?.turmas ?? []).map((t: any) => (
                  <Link key={t?.id} href={`/turmas?id=${t?.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <p className="font-semibold">{t?.nome ?? ""}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t?._count?.alunos ?? 0} alunos</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </StaggerItem>
    </Stagger>
  );
}

function AlunoDashboard({ data }: { data: any }) {
  const stats = data?.stats ?? {};
  return (
    <Stagger className="space-y-6">
      <StaggerItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={School} label="Turmas" value={stats?.totalTurmas ?? 0} />
          <StatCard icon={AlertTriangle} label="Pendentes" value={stats?.totalPendentes ?? 0} />
          <StatCard icon={CheckCircle2} label="Entregas" value={stats?.entregasFeitas ?? 0} />
          <StatCard icon={Star} label="Média" value={stats?.mediaGeral !== null && stats?.mediaGeral !== undefined ? Number(stats.mediaGeral).toFixed(1) : "--"} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Trabalhos Pendentes</CardTitle></CardHeader>
            <CardContent>
              {(data?.pendentes?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground text-sm">Sem trabalhos pendentes 🎉</p>
              ) : (
                <div className="space-y-3">
                  {(data?.pendentes ?? []).slice(0, 5).map((t: any) => (
                    <Link key={t?.id} href={`/trabalhos/${t?.id}`}>
                      <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <p className="font-medium text-sm">{t?.titulo ?? ""}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{t?.turma?.nome ?? ""}</Badge>
                          {t?.deadline && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(t.deadline).toLocaleDateString("pt-PT")}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Últimas Avaliações</CardTitle></CardHeader>
            <CardContent>
              {(data?.recentAvaliacoes?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground text-sm">Sem avaliações recentes.</p>
              ) : (
                <div className="space-y-3">
                  {(data?.recentAvaliacoes ?? []).map((a: any) => (
                    <div key={a?.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{a?.entrega?.trabalho?.titulo ?? ""}</p>
                        <p className="text-xs text-muted-foreground">{a?.entrega?.trabalho?.turma?.nome ?? ""}</p>
                      </div>
                      <Badge className={`text-sm ${(a?.nota ?? 0) >= 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {a?.nota ?? 0}/20
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </StaggerItem>
    </Stagger>
  );
}

function EncarregadoDashboard({ data }: { data: any }) {
  return (
    <Stagger className="space-y-6">
      <StaggerItem>
        {(data?.educandos?.length ?? 0) === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum educando associado.</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {(data?.educandos ?? []).map((aluno: any) => (
              <Card key={aluno?.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {aluno?.nome ?? ""}
                    </CardTitle>
                    {aluno?.mediaGeral !== null && aluno?.mediaGeral !== undefined && (
                      <Badge className={`${(aluno?.mediaGeral ?? 0) >= 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        Média: {Number(aluno.mediaGeral).toFixed(1)}/20
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-3">Turmas: {(aluno?.turmaAlunos ?? []).map((ta: any) => ta?.turma?.nome).filter(Boolean).join(", ") || "Nenhuma"}</p>
                    {(aluno?.entregas?.length ?? 0) > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Últimas Entregas:</p>
                        {(aluno?.entregas ?? []).slice(0, 5).map((ent: any) => (
                          <div key={ent?.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                            <span>{ent?.trabalho?.titulo ?? ""}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{ent?.estado ?? ""}</Badge>
                              {ent?.avaliacao?.publicada && (
                                <Badge className={`text-xs ${(ent?.avaliacao?.nota ?? 0) >= 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                  {ent?.avaliacao?.nota ?? 0}/20
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem entregas recentes.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </StaggerItem>
    </Stagger>
  );
}
