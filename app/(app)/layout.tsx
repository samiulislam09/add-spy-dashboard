import { AppShell } from "@/components/app-shell";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
