"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, Users, FileText, GraduationCap } from "lucide-react";
import Link from "next/link";
import { FadeIn, Stagger, StaggerItem, HoverLift } from "@/components/ui/animate";

export default function TurmasClient() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/turmas")
      .then((r) => r?.ok ? r.json() : [])
      .then((d) => { setTurmas(d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center p-12 text-muted-foreground">A carregar turmas...</div>;

  return (
    <FadeIn>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <School className="h-6 w-6 text-primary" /> As Minhas Turmas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Turmas em que participa</p>
        </div>

        {turmas.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma turma encontrada.</CardContent></Card>
        ) : (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmas.map((t: any) => (
              <StaggerItem key={t?.id}>
                <HoverLift>
                  <Link href={`/trabalhos?turmaId=${t?.id}`}>
                    <Card className="cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{t?.nome ?? ""}</CardTitle>
                          <Badge variant="secondary">{t?.anoLetivo?.nome ?? ""}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {t?._count?.professores ?? 0} prof.</span>
                          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {t?._count?.alunos ?? 0} alunos</span>
                          <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {t?._count?.trabalhos ?? 0} trab.</span>
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
