import redisClient, { connectRedis, disconnectRedis } from "../config/redis.js";
import { REDIS_KEYS } from "../utils/redisUtils.js";

/**
 * Unban a specific IP address or all IPs
 * Usage: 
 *   npx tsx src/scripts/unbanIP.ts              # Unban all IPs
 *   npx tsx src/scripts/unbanIP.ts 127.0.0.1    # Unban specific IP
 *   npx tsx src/scripts/unbanIP.ts ::1          # Unban IPv6 localhost
 */
const unbanIP = async (targetIp?: string): Promise<void> => {
    try {
        console.log("Connecting to Redis...");
        await connectRedis();

        if (targetIp) {
            console.log(`\n Unbanning IP: ${targetIp}\n`);

            const blockKey = `${REDIS_KEYS.FIREWALL.BLOCKED_IP_PREFIX}${targetIp}`;
            const violationKey = `${REDIS_KEYS.RATE_LIMIT.IP_PREFIX}${targetIp}:violations`;

            const deleted = await redisClient.del(blockKey, violationKey);

            if (deleted > 0) {
                console.log(`Unbanned IP: ${targetIp}`);
                console.log(`Removed ${deleted} key(s)`);
            } else {
                console.log(`IP ${targetIp} was not banned`);
            }
        } else {
            console.log("\n Unbanning all IPs...\n");

            const blockedKeys = await redisClient.keys(`${REDIS_KEYS.FIREWALL.BLOCKED_IP_PREFIX}*`);
            const violationKeys = await redisClient.keys(`${REDIS_KEYS.RATE_LIMIT.IP_PREFIX}*:violations`);

            const allKeys = [...blockedKeys, ...violationKeys];

            if (allKeys.length > 0) {
                await redisClient.del(...allKeys);
                console.log(`Unbanned ${blockedKeys.length} IP(s)`);
                console.log(`Cleared ${violationKeys.length} violation record(s)`);
            } else {
                console.log("No banned IPs found");
            }
        }

        console.log("\n Unban complete!\n");

    } catch (error) {
        console.error("Error unbanning IP:", error);
        process.exit(1);
    } finally {
        await disconnectRedis();
        process.exit(0);
    }
};

const targetIp = process.argv[2];
unbanIP(targetIp);