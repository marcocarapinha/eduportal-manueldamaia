"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Mail, HardDrive, Save, Info, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/animate";

export default function ConfiguracoesClient() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/configuracoes");
      if (res?.ok) setConfigs(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleSave = async (section: Record<string, string>) => {
    const res = await fetch("/api/configuracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(section),
    });
    if (res?.ok) {
      toast.success("Configurações guardadas");
      fetchConfigs();
    } else toast.error("Erro ao guardar");
  };

  const updateField = (key: string, value: string) => {
    setConfigs((prev) => ({ ...(prev ?? {}), [key]: value }));
  };

  if (loading) return <div className="flex items-center justify-center p-12 text-muted-foreground">A carregar...</div>;

  return (
    <FadeIn>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Configurações da Plataforma</h1>
          <p className="text-muted-foreground text-sm mt-1">Configurar integrações e parâmetros do sistema</p>
        </div>

        <Stagger className="space-y-6">
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><HardDrive className="h-5 w-5" /> Google Drive</CardTitle>
                <CardDescription>Configurar a integração com o Google Drive para armazenamento de ficheiros</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-2">
                  <p className="flex items-center gap-2 font-medium text-foreground"><Info className="h-4 w-4 text-primary" /> Como configurar a ligação ao Google Drive</p>
                  <ol className="list-decimal ml-5 space-y-1.5 text-muted-foreground">
                    <li>Aceda à <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a> e inicie sessão com a conta Google da escola.</li>
                    <li>Crie um novo projeto (no topo, em "Selecionar projeto" &rarr; "Novo projeto") e dê-lhe um nome, por exemplo <span className="font-medium text-foreground">EduPortal</span>.</li>
                    <li>No menu lateral, vá a <span className="font-medium text-foreground">APIs e serviços &rarr; Biblioteca</span>, procure por <span className="font-medium text-foreground">Google Drive API</span> e clique em <span className="font-medium text-foreground">Ativar</span>.</li>
                    <li>Em <span className="font-medium text-foreground">APIs e serviços &rarr; Ecrã de consentimento OAuth</span>, escolha o tipo "Externo", preencha o nome da aplicação e o email de apoio e guarde.</li>
                    <li>Em <span className="font-medium text-foreground">APIs e serviços &rarr; Credenciais</span>, clique em <span className="font-medium text-foreground">Criar credenciais &rarr; ID de cliente OAuth</span>, escolha "Aplicação Web" e adicione o endereço da plataforma como URI de redirecionamento autorizado.</li>
                    <li>Copie o <span className="font-medium text-foreground">Client ID</span> e o <span className="font-medium text-foreground">Client Secret</span> gerados e cole-os nos campos abaixo.</li>
                    <li>No <a href="https://drive.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-1">Google Drive <ExternalLink className="h-3 w-3" /></a>, crie (ou escolha) a pasta onde os ficheiros serão guardados. Abra a pasta e copie o <span className="font-medium text-foreground">Folder ID</span> do endereço &mdash; é a parte final do link, depois de <span className="font-mono text-xs">/folders/</span>.</li>
                    <li>Ative o botão abaixo, preencha os campos e clique em <span className="font-medium text-foreground">Guardar Google Drive</span>.</li>
                  </ol>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={configs?.["gdrive_enabled"] === "true"}
                    onCheckedChange={(v: boolean) => updateField("gdrive_enabled", String(v))}
                  />
                  <Label>Ativar Google Drive</Label>
                </div>
                {configs?.["gdrive_enabled"] === "true" && (
                  <div className="space-y-3">
                    <div><Label>Client ID</Label><Input value={configs?.["gdrive_client_id"] ?? ""} onChange={(e: any) => updateField("gdrive_client_id", e?.target?.value ?? "")} /></div>
                    <div><Label>Client Secret</Label><Input type="password" value={configs?.["gdrive_client_secret"] ?? ""} onChange={(e: any) => updateField("gdrive_client_secret", e?.target?.value ?? "")} /></div>
                    <div><Label>Folder ID (pasta raíz)</Label><Input value={configs?.["gdrive_folder_id"] ?? ""} onChange={(e: any) => updateField("gdrive_folder_id", e?.target?.value ?? "")} /></div>
                  </div>
                )}
                <Button onClick={() => handleSave({
                  gdrive_enabled: configs?.["gdrive_enabled"] ?? "false",
                  gdrive_client_id: configs?.["gdrive_client_id"] ?? "",
                  gdrive_client_secret: configs?.["gdrive_client_secret"] ?? "",
                  gdrive_folder_id: configs?.["gdrive_folder_id"] ?? "",
                })} className="gap-2"><Save className="h-4 w-4" /> Guardar Google Drive</Button>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5" /> Email (SMTP)</CardTitle>
                <CardDescription>Configurar servidor de email para notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-2">
                  <p className="flex items-center gap-2 font-medium text-foreground"><Info className="h-4 w-4 text-primary" /> Como configurar a ligação ao email (SMTP)</p>
                  <ol className="list-decimal ml-5 space-y-1.5 text-muted-foreground">
                    <li>Peça ao seu fornecedor de email (ou departamento de informática) os dados do servidor de envio: <span className="font-medium text-foreground">Host SMTP</span> e <span className="font-medium text-foreground">Porta</span>.</li>
                    <li>Se usar Gmail / Google Workspace, o Host é <span className="font-mono text-xs">smtp.gmail.com</span> e a Porta é <span className="font-mono text-xs">587</span> (com TLS).</li>
                    <li>Para contas Gmail, ative primeiro a <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-1">verificação em 2 passos <ExternalLink className="h-3 w-3" /></a> e depois crie uma <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-1">palavra-passe de aplicação <ExternalLink className="h-3 w-3" /></a>. Use essa palavra-passe (e não a normal) no campo abaixo.</li>
                    <li>No campo <span className="font-medium text-foreground">Utilizador</span> indique o endereço de email completo (ex.: <span className="font-mono text-xs">escola@gmail.com</span>).</li>
                    <li>No campo <span className="font-medium text-foreground">Palavra-passe</span> coloque a palavra-passe de aplicação (ou a palavra-passe SMTP fornecida).</li>
                    <li>Em <span className="font-medium text-foreground">Email Remetente</span> indique o endereço que aparecerá como remetente das mensagens.</li>
                    <li>Ative o botão abaixo, preencha os campos e clique em <span className="font-medium text-foreground">Guardar Email</span>.</li>
                  </ol>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={configs?.["smtp_enabled"] === "true"}
                    onCheckedChange={(v: boolean) => updateField("smtp_enabled", String(v))}
                  />
                  <Label>Ativar Email</Label>
                </div>
                {configs?.["smtp_enabled"] === "true" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><Label>Host SMTP</Label><Input value={configs?.["smtp_host"] ?? ""} onChange={(e: any) => updateField("smtp_host", e?.target?.value ?? "")} placeholder="smtp.gmail.com" /></div>
                      <div><Label>Porta</Label><Input value={configs?.["smtp_port"] ?? ""} onChange={(e: any) => updateField("smtp_port", e?.target?.value ?? "")} placeholder="587" /></div>
                    </div>
                    <div><Label>Utilizador</Label><Input value={configs?.["smtp_user"] ?? ""} onChange={(e: any) => updateField("smtp_user", e?.target?.value ?? "")} /></div>
                    <div><Label>Palavra-passe</Label><Input type="password" value={configs?.["smtp_password"] ?? ""} onChange={(e: any) => updateField("smtp_password", e?.target?.value ?? "")} /></div>
                    <div><Label>Email Remetente</Label><Input value={configs?.["smtp_from"] ?? ""} onChange={(e: any) => updateField("smtp_from", e?.target?.value ?? "")} placeholder="noreply@escola.pt" /></div>
                  </div>
                )}
                <Button onClick={() => handleSave({
                  smtp_enabled: configs?.["smtp_enabled"] ?? "false",
                  smtp_host: configs?.["smtp_host"] ?? "",
                  smtp_port: configs?.["smtp_port"] ?? "",
                  smtp_user: configs?.["smtp_user"] ?? "",
                  smtp_password: configs?.["smtp_password"] ?? "",
                  smtp_from: configs?.["smtp_from"] ?? "",
                })} className="gap-2"><Save className="h-4 w-4" /> Guardar Email</Button>
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>
      </div>
    </FadeIn>
  );
}
