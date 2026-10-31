import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ChunkLoadErrorHandler } from "@/components/chunk-load-error-handler";

export const dynamic = "force-dynamic";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const jakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "EduPortal — Agrupamento Manuel da Maia",
  description: "Plataforma de gestão escolar",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "EduPortal — Agrupamento Manuel da Maia",
    description: "Plataforma de gestão escolar",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>
          {children}
          <ChunkLoadErrorHandler />
        </Providers>
      </body>
    </html>
  );
}
