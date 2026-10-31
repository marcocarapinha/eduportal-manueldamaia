"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const opcoes = [
  { valor: "light", rotulo: "Claro", icone: Sun },
  { valor: "dark", rotulo: "Escuro", icone: Moon },
  { valor: "system", rotulo: "Sistema", icone: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme() || {};
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Alternar tema"
          className="relative rounded-full transition-all duration-200 hover:bg-accent active:scale-95"
        >
          <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar entre tema claro e escuro</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Aspeto</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opcoes.map((opcao) => {
          const Icone = opcao.icone;
          const ativo = mounted && theme === opcao.valor;
          return (
            <DropdownMenuItem
              key={opcao.valor}
              onClick={() => setTheme?.(opcao.valor)}
              className="gap-2 cursor-pointer"
            >
              <Icone className="h-4 w-4" />
              <span className="flex-1">{opcao.rotulo}</span>
              <Check className={cn("h-4 w-4 text-primary transition-opacity", ativo ? "opacity-100" : "opacity-0")} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
