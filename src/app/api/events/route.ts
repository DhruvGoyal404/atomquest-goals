import { auth } from "@/lib/auth";
import { createSubscriber } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const channel = `events:${userId}`;
  const subscriber = createSubscriber();

  if (!subscriber) {
    // Redis not configured — return a no-op SSE stream that just sends keepalives
    const stream = new ReadableStream({
      start(controller) {
        const interval = setInterval(() => {
          controller.enqueue(": keepalive\n\n");
        }, 25000);
        return () => clearInterval(interval);
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream already closed
        }
      }

      await subscriber.subscribe(channel);

      subscriber.on("message", (_ch: string, message: string) => {
        try {
          send(JSON.parse(message));
        } catch {
          send({ type: "RAW", message });
        }
      });

      // Keepalive every 25 s to prevent proxy timeouts
      const keepalive = setInterval(() => {
        if (isClosed) {
          clearInterval(keepalive);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 25000);
    },
    cancel() {
      isClosed = true;
      subscriber.unsubscribe(channel).catch(() => null);
      subscriber.disconnect();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
