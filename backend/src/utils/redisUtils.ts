import redisClient, { isRedisReady } from "../config/redis.js";

export const REDIS_KEYS = {
    STATS: {
        TOTAL_REQUESTS: "stats:requests:total",
        BLOCKED_REQUESTS: "stats:requests:blocked",
    },
    FIREWALL: {
        BANNED_COUNT: "firewall:banned:count",
        BANNED_IP_PREFIX: "firewall:banned:ip:",
    },
    RATE_LIMIT: {
        CONFIG_POINTS: "ratelimit:config:points",
        CONFIG_DURATION: "ratelimit:config:duration",
    },
} as const;

export const getInt = async (
    key: string,
    defaultValue: number = 0
): Promise<number> => {
    try {
        const value = await redisClient.get(key);
        if (value === null || value === undefined) {
            return defaultValue;
        }

        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : defaultValue;
    } catch (error) {
        console.error(`Redis getInt error for key "${key}":`, error);
        return defaultValue;
    }
};

export const getString = async (
    key: string,
    defaultValue: string = ""
): Promise<string> => {
    try {
        const value = await redisClient.get(key);
        return value ?? defaultValue;
    } catch (error) {
        console.error(`Redis getString error for key "${key}":`, error);
        return defaultValue;
    }
};

export const getMultiple = async (
    keys: string[]
): Promise<(string | null)[]> => {
    try {
        if (keys.length === 0) return [];

        const pipeline = redisClient.pipeline();
        keys.forEach((key) => pipeline.get(key));

        const results = await pipeline.exec();
        if (!results) return keys.map(() => null);

        return results.map((result) => {
            const [err, value] = result;
            if (err) {
                console.error("Pipeline error:", err);
                return null;
            }
            return value as string | null;
        });
    } catch (error) {
        console.error("Redis getMultiple error:", error);
        return keys.map(() => null);
    }
};

export const increment = async (
    key: string,
    amount: number = 1
): Promise<number> => {
    try {
        return await redisClient.incrby(key, amount);
    } catch (error) {
        console.error(`Redis increment error for key "${key}":`, error);
        throw error;
    }
};

export const setValue = async (
    key: string,
    value: string | number,
    expirySeconds?: number
): Promise<boolean> => {
    try {
        if (expirySeconds) {
            await redisClient.setex(key, expirySeconds, String(value));
        } else {
            await redisClient.set(key, String(value));
        }
        return true;
    } catch (error) {
        console.error(`Redis setValue error for key "${key}":`, error);
        return false;
    }
};

export const deleteKeys = async (
    keys: string | string[]
): Promise<number> => {
    try {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        if (keysArray.length === 0) return 0;
        return await redisClient.del(...keysArray);
    } catch (error) {
        console.error("Redis deleteKeys error:", error);
        return 0;
    }
};

export const isRedisConnected = (): boolean => {
    return isRedisReady();
};