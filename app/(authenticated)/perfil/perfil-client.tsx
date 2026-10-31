"use client";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield } from "lucide-react";
import { FadeIn } from "@/components/ui/animate";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador", PROFESSOR: "Professor", ALUNO: "Aluno", ENCARREGADO: "Enc. Educação",
};

export default function PerfilClient() {
  const { data: session } = useSession() || {};
  const user = session?.user;
  const role = (user as any)?.role ?? "ALUNO";

  return (
    <FadeIn>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><User className="h-6 w-6 text-primary" /> O Meu Perfil</h1>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                {(user?.name ?? "?")?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{user?.name ?? ""}</h2>
                <Badge>{ROLE_LABELS[role] ?? role}</Badge>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span suppressHydrationWarning>{user?.email ?? ""}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>{ROLE_LABELS[role] ?? role}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
