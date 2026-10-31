"use client";
import { useState, useEffect } from "react";
import AppSidebar from "@/components/app-sidebar";
import AppHeader from "@/components/app-header";
import { cn } from "@/lib/utils";

export default function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  // Fecha a barra lateral automaticamente ao redimensionar para ecrã grande (>= lg)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarOpen(false);
    };
    handleChange(mq);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Fecha ao premir Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Bloqueia o scroll do corpo quando a barra lateral está aberta em ecrã pequeno
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sobreposição em ecrã pequeno */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/70 surface-blur z-40 lg:hidden animate-in fade-in duration-200"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      {/* Barra lateral */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-out will-change-transform",
        sidebarOpen ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full lg:translate-x-0"
      )}>
        <AppSidebar onNavigate={closeSidebar} />
      </div>
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 lg:p-6 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
