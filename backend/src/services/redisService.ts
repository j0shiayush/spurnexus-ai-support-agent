import { createClient, RedisClientType } from "redis";

export interface CachedMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string; 
  conversationId: string;
}

const KEY_PREFIX = "spur-nexus:conversation:";
const TTL_SECONDS = 86_400;

const redisClient = createClient({
    url: process.env.REDIS_URL,
    pingInterval: 10000, 
    socket: {
      tls: true,
      rejectUnauthorized: false, 
    }
  });

redisClient.on("connect", () =>
  console.log("[Redis] Connected to Redis server.")
);
redisClient.on("ready", () =>
  console.log("[Redis] Client is ready to accept commands.")
);
redisClient.on("reconnecting", () =>
  console.warn("[Redis] Connection lost — attempting to reconnect…")
);
redisClient.on("error", (err: Error) =>
  console.error("[Redis] Client error:", err.message)
);

export async function connectRedis(): Promise<void> {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error("[Redis] Failed to connect on startup:", (err as Error).message);
  }
}
export { redisClient };

function buildKey(conversationId: string): string {
  return `${KEY_PREFIX}${conversationId}`;
}

export async function cacheConversationHistory(
  conversationId: string,
  history: CachedMessage[]
): Promise<boolean> {
  
  if (!redisClient.isReady) return false;

  try {
    const key = buildKey(conversationId);
    const payload = JSON.stringify(history);
    await redisClient.set(key, payload, { EX: TTL_SECONDS });

    console.log(
      `[Redis] Cached ${history.length} message(s) for conversation "${conversationId}" (TTL: ${TTL_SECONDS}s).`
    );
    return true;
  } catch (err) {
    console.error(
      `[Redis] cacheConversationHistory failed for "${conversationId}":`,
      (err as Error).message
    );
    return false; 
  }
}

export async function getCachedConversationHistory(
  conversationId: string
): Promise<CachedMessage[] | null> {
  if (!redisClient.isReady) return null;

  try {
    const key = buildKey(conversationId);
    const raw = await redisClient.get(key);

    if (raw === null) {
      console.log(`[Redis] Cache miss for conversation "${conversationId}".`);
      return null;
    }

    const history = JSON.parse(raw) as CachedMessage[];
    console.log(
      `[Redis] Cache hit — returned ${history.length} message(s) for conversation "${conversationId}".`
    );
    return history;
  } catch (err) {
    console.error(
      `[Redis] getCachedConversationHistory failed for "${conversationId}":`,
      (err as Error).message
    );
    return null; 
  }
}

export async function invalidateConversationCache(
  conversationId: string
): Promise<boolean> {
  if (!redisClient.isReady) return false;

  try {
    const key = buildKey(conversationId);
    const deleted = await redisClient.del(key);

    if (deleted > 0) {
      console.log(`[Redis] Cache invalidated for conversation "${conversationId}".`);
    } else {
      console.log(
        `[Redis] invalidateConversationCache — key "${key}" did not exist (no-op).`
      );
    }
    return true;
  } catch (err) {
    console.error(
      `[Redis] invalidateConversationCache failed for "${conversationId}":`,
      (err as Error).message
    );
    return false;
  }
}