"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Blocks,
  ChartNoAxesCombined,
  DatabaseZap,
  FolderKanban,
  LayoutDashboard,
  Library,
  Settings,
  SplitSquareVertical,
  Users,
} from "lucide-react";

import { cn } from "@cia/ui";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/advertisers", label: "Advertisers", icon: Users },
  { href: "/library", label: "Ad Library", icon: Library },
  { href: "/compare", label: "Compare", icon: SplitSquareVertical },
  { href: "/collections", label: "Collections", icon: FolderKanban },
  { href: "/saved-searches", label: "Saved Searches", icon: Blocks },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/admin/ingestion", label: "Ingestion", icon: DatabaseZap },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container-shell py-4 md:py-6">
      <div className="grid min-h-[calc(100vh-3rem)] gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[1.75rem] border border-cyan-100 bg-white p-4 shadow-md shadow-cyan-100/80">
          <div className="mb-6 flex items-center gap-2 px-2">
            <div className="rounded-xl bg-cyan-700 p-2 text-white">
              <ChartNoAxesCombined className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-700">SeloraX</p>
              <p className="font-[var(--font-grotesk)] text-lg font-semibold">Ad Intelligence</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item, idx) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-cyan-700 text-white"
                        : "text-cyan-800 hover:bg-cyan-100 hover:text-cyan-950",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </aside>

        <div className="rounded-[1.75rem] border border-cyan-100 bg-white/95 p-4 shadow-md shadow-cyan-100/70 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
