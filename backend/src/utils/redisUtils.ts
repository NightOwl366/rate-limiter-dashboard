import redisClient, { isRedisReady } from "../config/redis.js";

export const REDIS_KEYS = {
    STATS: {
        TOTAL_REQUESTS: "stats:requests:total",
        BLOCKED_REQUESTS: "stats:requests:blocked",
        ALLOWED_REQUESTS: "stats:requests:allowed",
        PER_MINUTE_PREFIX: "stats:requests:per_minute:",
    },
    FIREWALL: {
        BANNED_COUNT: "firewall:banned:count",
        BANNED_IP_PREFIX: "firewall:banned:ip:",
        BLOCKED_IP_PREFIX: "firewall:blocked:",
    },
    RATE_LIMIT: {
        CONFIG_POINTS: "ratelimit:config:points",
        CONFIG_DURATION: "ratelimit:config:duration",
        IP_PREFIX: "rate:ip:",
    },
    IP_STATS: {
        PREFIX: "stats:ips:",
        SORTED_SET: "stats:ips:sorted",
    },
} as const;

const TIME_SERIES_TTL = 7 * 24 * 60 * 60;

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

export const generateTimeKey = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}${month}${day}-${hours}${minutes}`;
};

export const incrementTimeSeries = async (
    prefix: string,
    timestamp?: string
): Promise<number> => {
    try {
        const timeKey = timestamp || generateTimeKey();
        const key = `${prefix}${timeKey}`;

        const newCount = await increment(key, 1);

        if (newCount === 1) {
            await redisClient.expire(key, TIME_SERIES_TTL);
        }

        return newCount;
    } catch (error) {
        console.error(`Error incrementing time series for ${prefix}:`, error);
        throw error;
    }
};

export const getTimeSeriesRange = async (
    prefix: string,
    startTime: string,
    endTime: string
): Promise<Array<{ timestamp: string; count: number }>> => {
    try {
        const keys: string[] = [];

        //20250130-1430 to 2025-01-30T14:30:00 because JS Date requires this format
        const start = new Date(
            `${startTime.substring(0, 4)}-${startTime.substring(4, 6)}-${startTime.substring(6, 8)}T${startTime.substring(9, 11)}:${startTime.substring(11, 13)}:00`
        );
        const end = new Date(
            `${endTime.substring(0, 4)}-${endTime.substring(4, 6)}-${endTime.substring(6, 8)}T${endTime.substring(9, 11)}:${endTime.substring(11, 13)}:00`
        );

        const current = new Date(start);
        while (current <= end) {
            const timeKey = generateTimeKey(current);
            keys.push(`${prefix}${timeKey}`);
            current.setMinutes(current.getMinutes() + 1);
        }

        const values = await getMultiple(keys);

        return keys.map((key, index) => ({
            timestamp: key.replace(prefix, ""),
            count: values[index] ? parseInt(values[index]!, 10) || 0 : 0, //  ||0 prevents NaN
        }));
    } catch (error) {
        console.error("Error getting time series range:", error);
        return [];
    }
};

export const incrementSortedSet = async (
    key: string,
    member: string,
    amount: number = 1,
): Promise<number> => {
    try {
        const newScore = await redisClient.zincrby(key, amount, member);
        return parseFloat(newScore);  //Redis allows decimal scores in ZSETs.
    } catch (error) {
        console.error(`Error incrementing sorted set ${key} for member ${member}:`, error);
        throw error;
    }
};

export const getTopFromSortedSet = async (
    key: string,
    count: number = 10,
): Promise<Array<{ member: string; score: number }>> => {
    try {
        const results = await redisClient.zrevrange(key, 0, count - 1, "WITHSCORES");

        const formatted: Array<{ member: string; score: number }> = [];

        // Results format: [member1, score1, member2, score2, ...]
        for (let i = 0; i < results.length; i += 2) {
            formatted.push({
                member: results[i],
                score: parseFloat(results[i + 1]),
            });
        }

        return formatted;
    } catch (error) {
        console.error(`Error getting top from sorted set ${key}:`, error);
        return [];
    }
};

export const removeFromSortedSet = async (
    key: string,
    member: string
): Promise<number> => {
    //1 - member existed and was removed & 0 - member did not exist
    try {
        return await redisClient.zrem(key, member);
    } catch (error) {
        console.error(`Error removing from sorted set ${key} member ${member}:`, error);
        return 0;
    }
};