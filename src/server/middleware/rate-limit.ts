import { redis } from "@/lib/cache/redis";

const limit = Number(process.env.RATE_LIMIT_REQUESTS ?? 100);
const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60);

export async function assertRateLimit(identifier: string): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    const now = Date.now();
    const key = `rate-limit:${identifier}`;
    const windowStart = now - windowSeconds * 1000;

    const results = await redis
      .multi()
      .zremrangebyscore(key, 0, windowStart)
      .zadd(key, now, `${now}:${crypto.randomUUID()}`)
      .zcard(key)
      .expire(key, windowSeconds)
      .exec();

    const countResult = results?.[2]?.[1];
    const count = typeof countResult === "number" ? countResult : Number(countResult ?? 0);

    if (count > limit) {
      throw new Error("Rate limit exceeded. Please retry in a minute.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Rate limit exceeded")) {
      throw error;
    }

    console.warn("Valkey rate limiter unavailable; failing open.", error);
  }
}
