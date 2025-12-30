import redisClient, { connectRedis, disconnectRedis } from "../config/redis.js";
import { REDIS_KEYS } from "../utils/redisUtils.js";

/**
 * Reset all stats in Redis to zero
 * Usage: npx tsx src/scripts/resetRedisStats.ts
 */
const resetStats = async (): Promise<void> => {
    try {
        console.log("Connecting to Redis...");
        await connectRedis();

        console.log("\nResetting all stats...\n");

        const statsKeys = [
            REDIS_KEYS.STATS.TOTAL_REQUESTS,
            REDIS_KEYS.STATS.BLOCKED_REQUESTS,
            REDIS_KEYS.STATS.ALLOWED_REQUESTS,
            REDIS_KEYS.FIREWALL.BANNED_COUNT,
        ];

        for (const key of statsKeys) {
            await redisClient.set(key, "0");
            console.log(`Reset: ${key}`);
        }

        console.log("\n Clearing rate limit data...\n");
        const rateLimitKeys = await redisClient.keys("rate:ip:*");
        if (rateLimitKeys.length > 0) {
            await redisClient.del(...rateLimitKeys);
            console.log(`Cleared ${rateLimitKeys.length} rate limit keys`);
        } else {
            console.log("No rate limit keys to clear");
        }

        console.log("\n Clearing blocked IPs...\n");
        const blockedIpKeys = await redisClient.keys("firewall:blocked:*");
        if (blockedIpKeys.length > 0) {
            await redisClient.del(...blockedIpKeys);
            console.log(`Cleared ${blockedIpKeys.length} blocked IP keys`);
        } else {
            console.log("No blocked IPs to clear");
        }

        console.log("\n Clearing IP statistics...\n");
        const ipStatsKeys = await redisClient.keys("stats:ips:*");
        if (ipStatsKeys.length > 0) {
            await redisClient.del(...ipStatsKeys);
            console.log(`Cleared ${ipStatsKeys.length} IP stats keys`);
        } else {
            console.log("No IP stats to clear");
        }

        console.log("\n All stats reset successfully!\n");

        console.log("Current values:");
        for (const key of statsKeys) {
            const value = await redisClient.get(key);
            console.log(`${key}: ${value}`);
        }

    } catch (error) {
        console.error("Error resetting stats:", error);
        process.exit(1);
    } finally {
        await disconnectRedis();
        process.exit(0);
    }
};

resetStats();