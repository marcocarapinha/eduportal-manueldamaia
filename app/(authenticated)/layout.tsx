import AppShellWrapper from "@/components/app-shell-wrapper";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AppShellWrapper>{children}</AppShellWrapper>;
}
