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

  const user =
    getDemoUserById(session.user.id) ??
    (await getUserById(session.user.id).catch(() => null));

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
