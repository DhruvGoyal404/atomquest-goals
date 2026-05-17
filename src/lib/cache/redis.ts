import Redis from "ioredis";

function makeRedis() {
  if (!process.env.REDIS_URL) return null;
  return new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
  });
}

export const redis = makeRedis();

export async function getCachedJson<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const cached = await redis.get(key);
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function setCachedJson<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function publish(channel: string, data: unknown): Promise<void> {
  if (!redis) return;
  await redis.publish(channel, JSON.stringify(data)).catch(() => null);
}

// Creates a dedicated subscriber connection for SSE — caller is responsible for disconnect.
export function createSubscriber(): Redis | null {
  return makeRedis();
}
