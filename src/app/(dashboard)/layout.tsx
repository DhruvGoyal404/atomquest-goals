import { redirect } from "next/navigation";
import { AppShell } from "@/components/layouts/app-shell";
import { auth } from "@/lib/auth";
import { getDemoUserById } from "@/server/services/demo-store";
import { getUserById } from "@/server/services/db-store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // DB is the source of truth (profile updates write here). Fall back to demo-store
  // only when MongoDB is unreachable so the demo experience still works offline.
  const user =
    (await getUserById(session.user.id).catch(() => null)) ??
    getDemoUserById(session.user.id);

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
