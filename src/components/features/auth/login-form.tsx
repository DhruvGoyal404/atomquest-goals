"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_CREDENTIALS, ROLE_HOME } from "@/lib/constants/app";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.validation";
import type { Role } from "@/types/domain";

export function LoginForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "employee@atomquest.com",
      password: "demo123",
    },
  });

  // ✅ Client-side redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const home = ROLE_HOME[session.user.role as Role];
      if (home) {
        toast.success(`Already signed in! Redirecting...`);
        router.push(home);
        router.refresh();
      }
    }
  }, [status, session, router]);

  async function onSubmit(values: LoginInput) {
    setError(null);
    setLoadingProvider("credentials");
    const loadingToast = toast.loading("Signing you in...");
    const response = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setLoadingProvider(null);
    toast.dismiss(loadingToast);

    if (response?.error) {
      const message = "Those credentials did not match a demo user.";
      setError(message);
      toast.error(message);
      return;
    }

    const role = inferRole(values.email);
    toast.success(`Welcome back! Redirecting to your ${role.toLowerCase()} dashboard.`);
    router.push(ROLE_HOME[role]);
    router.refresh();
  }

  return (
    <Card className="glass-panel w-full max-w-md">
      <CardHeader>
        <div className="mb-3 flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <CardTitle className="text-2xl">Sign in to AtomQuest Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loadingProvider === "credentials"}>
            <LogIn />
            {loadingProvider === "credentials" ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-5 grid gap-2">
          {DEMO_CREDENTIALS.map((credential) => (
            <button
              key={credential.email}
              type="button"
              className="rounded-md border bg-background/80 p-3 text-left text-sm transition-colors hover:bg-muted"
              onClick={() => {
                form.setValue("email", credential.email);
                form.setValue("password", credential.password);
              }}
            >
              <span className="font-medium">{credential.role}</span>
              <span className="block text-muted-foreground">{credential.email} / {credential.password}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function inferRole(email: string): Role {
  if (email.startsWith("manager")) {
    return "MANAGER";
  }

  if (email.startsWith("admin")) {
    return "ADMIN";
  }

  return "EMPLOYEE";
}
