"use client";

import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/components/providers/trpc-provider";
import { formatDate } from "@/lib/utils/format";

export function NotificationBell() {
  const utils = trpc.useUtils();
  const notifications = trpc.notifications.list.useQuery();
  const markRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });
  const unread = notifications.data?.filter((notification) => !notification.isRead).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Open notifications" className="relative">
          <Bell />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <Button type="button" variant="ghost" size="sm" onClick={() => markRead.mutate()}>
            <CheckCheck />
            Read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.data?.length ? (
          notifications.data.slice(0, 6).map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 whitespace-normal">
              <span className="text-sm font-medium">{notification.title}</span>
              <span className="text-xs text-muted-foreground">{notification.message}</span>
              <span className="text-[11px] text-muted-foreground">{formatDate(notification.createdAt)}</span>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
