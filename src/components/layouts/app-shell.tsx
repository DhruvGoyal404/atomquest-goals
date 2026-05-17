"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Accessibility,
  BarChart3,
  CheckSquare,
  ClipboardCheck,
  Flame,
  Gauge,
  Goal,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { Role, User } from "@/types/domain";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layouts/theme-toggle";
import { NotificationBell } from "@/components/layouts/notification-bell";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";
import { usePortalStore } from "@/hooks/use-portal-store";
import { useRealtime } from "@/hooks/use-realtime";
import { APP_NAME } from "@/lib/constants/app";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

const navItems: NavItem[] = [
  { href: "/employee/goals", label: "My Goals", icon: Goal, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { href: "/employee/check-ins", label: "Check-ins", icon: CheckSquare, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { href: "/employee/analytics", label: "Analytics", icon: BarChart3, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { href: "/manager/approvals", label: "Approvals", icon: ClipboardCheck, roles: ["MANAGER", "ADMIN"] },
  { href: "/manager/team", label: "Team", icon: Users, roles: ["MANAGER", "ADMIN"] },
  { href: "/manager/escalations", label: "Escalations", icon: ShieldAlert, roles: ["MANAGER", "ADMIN"] },
  { href: "/admin/cycles", label: "Admin", icon: Settings, roles: ["ADMIN"] },
];

export function AppShell({ children, user }: { children: React.ReactNode; user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { commandOpen, setCommandOpen, highContrast, toggleHighContrast, fontScale, setFontScale } = usePortalStore();
  const [isSigningOut, setIsSigningOut] = useState(false);
  useRealtime();

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }
  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className={cn("min-h-screen bg-background", highContrast && "contrast-125")} style={{ fontSize: `${fontScale}rem` }}>
      <div className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card/78 backdrop-blur-xl lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gauge className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">Hackathon 2026</p>
          </div>
        </div>
        {user.streakCount > 0 && (
          <div className="mx-3 mb-1 flex items-center gap-2 rounded-md border bg-warning/10 px-3 py-2">
            <Flame className="size-4 text-warning" />
            <span className="text-sm font-medium text-warning">{user.streakCount}-day streak</span>
          </div>
        )}
        <nav className="space-y-1 p-3">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/82 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setCommandOpen(true)}>
              <Menu />
            </Button>
            <Button type="button" variant="outline" className="hidden w-64 justify-start text-muted-foreground sm:inline-flex" onClick={() => setCommandOpen(true)}>
              <Search />
              Command center
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="Toggle high contrast" onClick={toggleHighContrast}>
              <Accessibility />
            </Button>
            <ThemeToggle />
            <NotificationBell />
            <Separator orientation="vertical" className="mx-1 hidden h-8 sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <Avatar>
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut} disabled={isSigningOut}>
              <LogOut />
            </Button>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Command center</DialogTitle>
            <DialogDescription>Quickly navigate to any section or adjust accessibility settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  type="button"
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setCommandOpen(false);
                    router.push(item.href);
                  }}
                >
                  <Icon />
                  {item.label}
                </Button>
              );
            })}
            <Separator />
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <span className="text-sm font-medium">Font size</span>
              <div className="flex gap-2">
                {[0.95, 1, 1.08].map((scale) => (
                  <Button key={scale} type="button" variant={fontScale === scale ? "default" : "outline"} size="sm" onClick={() => setFontScale(scale)}>
                    {scale === 1 ? "A" : scale < 1 ? "A-" : "A+"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
