"use client";

import { useEffect } from "react";
import { trpc } from "@/components/providers/trpc-provider";

export function useRealtime() {
  const utils = trpc.useUtils();

  useEffect(() => {
    const sse = new EventSource("/api/events");

    sse.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as { type: string };

        // Invalidate relevant tRPC caches based on event type so UI refreshes
        switch (data.type) {
          case "GOAL_APPROVED":
          case "GOAL_REJECTED":
          case "GOAL_DECIDED":
          case "GOAL_SHARED":
            void utils.goals.mine.invalidate();
            void utils.goals.list.invalidate();
            void utils.analytics.summary.invalidate();
            void utils.analytics.predictions.invalidate();
            void utils.notifications.list.invalidate();
            break;

          case "CHECK_IN_ADDED":
            void utils.checkIns.list.invalidate();
            void utils.analytics.summary.invalidate();
            void utils.analytics.predictions.invalidate();
            break;

          case "ESCALATION_CREATED":
          case "ESCALATION_RESOLVED":
            void utils.escalations.list.invalidate();
            void utils.notifications.list.invalidate();
            break;

          default:
            // Catch-all: refresh notifications
            void utils.notifications.list.invalidate();
        }
      } catch {
        // Ignore malformed messages
      }
    };

    sse.onerror = () => {
      // EventSource auto-reconnects; no action needed
    };

    return () => sse.close();
  }, [utils]);
}
