"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TRPCProvider>
          <TooltipProvider delayDuration={250}>
          <ServiceWorkerRegister />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
              },
              success: { iconTheme: { primary: "hsl(var(--success))", secondary: "white" } },
              error: { iconTheme: { primary: "hsl(var(--destructive))", secondary: "white" } },
            }}
          />
        </TooltipProvider>
      </TRPCProvider>
    </ThemeProvider>
    </SessionProvider>
  );
}
