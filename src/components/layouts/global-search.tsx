"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Goal as GoalIcon, Loader2, Search, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fuzzyScore } from "@/lib/utils/fuzzy";
import { trpc } from "@/components/providers/trpc-provider";

type PageItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type FlatRow = {
  key: string;
  href: string;
  label: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Pages" | "Goals" | "Check-ins" | "People";
};

export function GlobalSearch({ items, className }: { items: PageItem[]; className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const enableServerSearch = debouncedQuery.length >= 2;
  const serverSearch = trpc.search.global.useQuery(
    { q: debouncedQuery },
    {
      enabled: enableServerSearch,
      staleTime: 15_000,
      placeholderData: (prev) => prev,
    },
  );

  const rows = useMemo<FlatRow[]>(() => {
    const out: FlatRow[] = [];

    const pageScored = items.map((item) => ({
      score: debouncedQuery ? fuzzyScore(debouncedQuery, item.label) : 0.5,
      item,
    }));
    const visiblePages = debouncedQuery
      ? pageScored.filter((p) => p.score >= 0.3).sort((a, b) => b.score - a.score)
      : pageScored;
    visiblePages.forEach(({ item }) => {
      out.push({
        key: `page:${item.href}`,
        href: item.href,
        label: item.label,
        icon: item.icon,
        group: "Pages",
      });
    });

    const data = serverSearch.data;
    if (data && debouncedQuery) {
      data.goals.forEach((g) => {
        out.push({
          key: `goal:${g.id}`,
          href: `/employee/goals#${g.id}`,
          label: g.title,
          sub: `${g.thrustArea} · ${g.status.toLowerCase()} · ${Math.round(g.progress * 100)}%`,
          icon: GoalIcon,
          group: "Goals",
        });
      });
      data.checkIns.forEach((c) => {
        const trimmed = c.comments.length > 70 ? `${c.comments.slice(0, 70)}…` : c.comments;
        out.push({
          key: `checkin:${c.id}`,
          href: `/employee/check-ins#${c.id}`,
          label: trimmed || `${c.quarter} check-in`,
          sub: `${c.quarter} · ${Math.round(c.progressScore * 100)}% progress`,
          icon: CheckSquare,
          group: "Check-ins",
        });
      });
      data.people.forEach((p) => {
        out.push({
          key: `person:${p.id}`,
          href: "/manager/team",
          label: p.name,
          sub: [p.designation, p.department].filter(Boolean).join(" · ") || p.email,
          icon: UserIcon,
          group: "People",
        });
      });
    }

    return out;
  }, [items, debouncedQuery, serverSearch.data]);

  const [lastQuery, setLastQuery] = useState(debouncedQuery);
  if (lastQuery !== debouncedQuery) {
    setLastQuery(debouncedQuery);
    setActiveIndex(0);
  }
  if (activeIndex >= rows.length && rows.length > 0) {
    setActiveIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = rows[activeIndex];
      if (target) {
        router.push(target.href);
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-row-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const grouped = useMemo(() => {
    const map = new Map<FlatRow["group"], FlatRow[]>();
    rows.forEach((row) => {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    });
    return [...map.entries()];
  }, [rows]);

  const isFetching = enableServerSearch && serverSearch.isFetching;
  const hasResults = rows.length > 0;
  const showEmptyState = open && !!debouncedQuery && !hasResults && !isFetching;
  const shortcutLabel = useShortcutLabel();

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open ? "true" : "false"}
          aria-controls="global-search-listbox"
          aria-autocomplete="list"
          placeholder="Search goals, check-ins, people..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-lg border border-input bg-card/40 pl-9 pr-20 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-card"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-flex"
          >
            {shortcutLabel}
          </kbd>
        )}
      </div>

      {open && (
        <div
          id="global-search-listbox"
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[28rem] overflow-auto rounded-lg border border-border/50 bg-card/95 backdrop-blur-sm shadow-xl"
        >
          {isFetching && !hasResults ? (
            <p className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching...
            </p>
          ) : null}

          {showEmptyState ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &quot;{debouncedQuery}&quot;
            </p>
          ) : null}

          {hasResults ? (
            <div className="p-1" role="group">
              {grouped.map(([groupName, groupRows]) => (
                <div key={groupName} className="py-1">
                  <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {groupName}
                  </p>
                  {groupRows.map((row) => {
                    const flatIndex = rows.findIndex((r) => r.key === row.key);
                    const isActive = flatIndex === activeIndex;
                    const Icon = row.icon;
                    return (
                      <Link
                        key={row.key}
                        href={row.href}
                        role="option"
                        aria-selected={isActive ? "true" : "false"}
                        data-row-index={flatIndex}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={() => {
                          setQuery("");
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                          isActive
                            ? "bg-primary/15 text-primary shadow-sm"
                            : "text-foreground hover:bg-muted/60",
                        )}
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 opacity-70" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{row.label}</p>
                          {row.sub ? (
                            <p className="truncate text-xs text-muted-foreground">{row.sub}</p>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
              {isFetching ? (
                <p className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground/80">
                  <Loader2 className="size-3 animate-spin" />
                  Refreshing results...
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function getShortcutLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl K";
  return /mac/i.test(navigator.platform) || /mac/i.test(navigator.userAgent) ? "⌘ K" : "Ctrl K";
}

function subscribeNoop() {
  return () => {};
}

function useShortcutLabel(): string {
  return useSyncExternalStore(subscribeNoop, getShortcutLabel, () => "Ctrl K");
}
