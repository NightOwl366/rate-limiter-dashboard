import { Redis } from "ioredis";

type RedisStatus = "connecting" | "connected" | "ready" | "disconnected" | "error";

interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
}

const REDIS_CONFIG: RedisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0", 10),
};

const REDIS_OPTIONS = {
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
    },
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    commandTimeout: 5000,
    enableReadyCheck: true,
    keepAlive: 30000,
    autoResubscribe: false,          
    autoResendUnfulfilledCommands: false, 
} as const;


const validateRedisConfig = (): void => {
    if (!REDIS_CONFIG.host) {
        throw new Error("CRITICAL: REDIS_HOST must be set in environment variables");
    }

    if (isNaN(REDIS_CONFIG.port) || REDIS_CONFIG.port < 1 || REDIS_CONFIG.port > 65535) {
        throw new Error(`CRITICAL: Invalid REDIS_PORT: ${process.env.REDIS_PORT}`);
    }
};

validateRedisConfig();

const redisClient = new Redis({
    ...REDIS_CONFIG,
    ...REDIS_OPTIONS,
});

let currentStatus: RedisStatus = "disconnected";

const updateStatus = (status: RedisStatus): void => {
    currentStatus = status;
};

redisClient.on("connect", () => {
    updateStatus("connecting");
    console.log("Redis connecting...");
});

redisClient.on("ready", () => {
    updateStatus("ready");
    console.log("Redis ready");
    console.log(`Redis DB: ${REDIS_CONFIG.db}`);
});

redisClient.on("error", (err: Error) => {
    updateStatus("error");
    console.error("Redis error:", err.message);
});

redisClient.on("close", () => {
    updateStatus("disconnected");
    console.warn("Redis connection closed");
});

redisClient.on("reconnecting", (ms: number) => {
    updateStatus("connecting");
    console.log(`Redis reconnecting in ${ms}ms...`);
});

redisClient.on("end", () => {
    updateStatus("disconnected");
    console.log("Redis connection ended");
});

export const connectRedis = async (): Promise<void> => {
    try {
        if (currentStatus === "ready") {
            console.log("Redis already connected");
            return;
        }
        await redisClient.connect();
        console.log("Redis connection established");
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
        throw error;
    }
};

export const disconnectRedis = async (): Promise<void> => {
    try {
        if (currentStatus === 'disconnected') {
            console.log("Redis already disconnected");
            return;
        }
        await redisClient.quit();
        console.log("Redis disconnected gracefully");
    } catch (error) {
        console.error("Error disconnecting Redis:", error);
        redisClient.disconnect();
    }
};

export const getRedisStatus = (): RedisStatus => currentStatus;
export const isRedisReady = (): boolean => currentStatus === "ready";

export const checkRedisHealth = async (): Promise<{
    status: "healthy" | "unhealthy";
    latency?: number;
    error?: string;
}> => {
    if (!isRedisReady()) {
        return { status: "unhealthy", error: "Redis not connected" };
    }

    try {
        const start = Date.now();
        await redisClient.ping();
        const latency = Date.now() - start;

        return { status: "healthy", latency };
    } catch (error) {
        return {
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

export default redisClient;