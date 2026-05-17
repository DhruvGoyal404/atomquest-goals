"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Toggle theme" onClick={toggle}>
          <Sun className="hidden h-4 w-4 dark:inline" />
          <Moon className="inline h-4 w-4 dark:hidden" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="hidden dark:inline">Light theme</span>
        <span className="inline dark:hidden">Dark theme</span>
      </TooltipContent>
    </Tooltip>
  );
}
