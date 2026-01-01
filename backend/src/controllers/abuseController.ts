import { Request, Response } from "express";
import net from 'node:net';
import { sendSuccess, sendError } from "../utils/responseHelpers.js";
import {
    REDIS_KEYS,
    isRedisConnected,
    getTopFromSortedSet,
    getInt,
    getString,
    removeFromSortedSet,
    deleteKeys,
    increment,
} from "../utils/redisUtils.js";
import { blockIp } from "../middleware/firewall.js";
import redisClient from "../config/redis.js";

interface IPInfo {
    ip: string;
    requestCount: number;
    isBlocked: boolean;
    blockReason?: string;
    blockedAt?: string;
    expiresAt?: string;
}

interface TopIPsResponse {
    ips: IPInfo[];
    total: number;
}

interface BlockIPRequest {
    ip: string;
    reason: string;
    duration?: number;   // seconds, 0 = permanent
}

interface UnblockIPRequest {
    ip: string;
}

interface BlockedIPInfo {
    reason: string;
    blockedAt: string;
    expiresAt?: string;
}

const DEFAULT_TOP_IPS_LIMIT = 50;
const MAX_TOP_IPS_LIMIT = 100;

const getBlockInfo = async (
    ip: string
): Promise<BlockedIPInfo | null> => {
    try {
        const key = `${REDIS_KEYS.FIREWALL.BLOCKED_IP_PREFIX}${ip}`;
        const data = await getString(key);

        if (!data) {
            return null;
        }

        return JSON.parse(data);
    } catch (error) {
        console.error(`Error getting block info for ${ip}:`, error);
        return null;
    }
};

const enrichIPInfo = async (
    ip: string,
    requestCount: number
): Promise<IPInfo> => {
    const blockInfo = await getBlockInfo(ip);

    if (!blockInfo) {
        return {
            ip,
            requestCount,
            isBlocked: false,
        };
    }

    return {
        ip,
        requestCount,
        isBlocked: true,
        blockReason: blockInfo.reason,
        blockedAt: blockInfo.blockedAt,
        expiresAt: blockInfo.expiresAt,
    };
};

// Return 0(invalid) or 4(IPv4) or 6(IPv6)
const isValidIP = (ip: string): boolean => {
    return net.isIP(ip) !== 0;
};

// Get top abusive IPs ranked by request count , Query params: limit: number (default: 50, max: 100)
export const getTopIPs = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        if (!isRedisConnected()) {
            return sendError(res, 503, "Service temporarily unavailable");
        }

        const limitParam = req.query.limit as string;
        let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_TOP_IPS_LIMIT;

        if (isNaN(limit) || limit < 1) {
            limit = DEFAULT_TOP_IPS_LIMIT;
        }
        if (limit > MAX_TOP_IPS_LIMIT) {
            limit = MAX_TOP_IPS_LIMIT     // NOt MORE THAN 100
        }

        const topIPs = await getTopFromSortedSet(REDIS_KEYS.IP_STATS.SORTED_SET, limit);

        const enrichedIPs = await Promise.all(
            topIPs.map((item) => enrichIPInfo(item.member, item.score))
        );

        const response: TopIPsResponse = {
            ips: enrichedIPs,
            total: enrichedIPs.length,
        };

        return sendSuccess<TopIPsResponse>(
            res,
            200,
            "Top IPs retrieved successfully",
            response
        );
    } catch (error) {
        console.error("Get top IPs error:", error);
        return sendError(res, 500, "Failed to retrieve top IPs");
    }
};

// POST - Block an IP address manually , Body: { ip, reason, duration? }
export const blockIPAddress = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        if (!isRedisConnected()) {
            return sendError(res, 503, "Service temporarily unavailable");
        }

        const { ip, reason, duration }: BlockIPRequest = req.body;

        if (!ip || !reason) {
            return sendError(
                res,
                400,
                "Missing required fields",
                ["ip", "reason"]
            );
        }

        if (!isValidIP(ip)) {
            return sendError(res, 400, "Invalid IP address format");
        }
        if (reason.trim().length < 3) {
            return sendError(res, 400, "Reason must be at least 3 characters");
        }

        const blockDuration = duration !== undefined ? duration : 3600;
        if (!blockDuration) {
            return sendError(res, 400, "Duration must be 0 or positive");
        }

        const existingBlock = await getBlockInfo(ip);
        if (existingBlock) {
            return sendError(res, 409, "IP is already blocked");
        }

        const success = await blockIp(ip, reason, blockDuration);
        if (!success) {
            return sendError(res, 500, "Failed to block IP");
        }

        const requestCount = await getInt(`${REDIS_KEYS.IP_STATS.PREFIX}${ip}`, 0);
        const ipInfo = await enrichIPInfo(ip, requestCount);

        return sendSuccess<IPInfo>(
            res,
            200,
            "IP blocked successfully",
            ipInfo
        );
    } catch (error) {
        console.error("Block IP error:", error);
        return sendError(res, 500, "Failed to block IP");
    }
};

// POST - Unblock an IP address , Body: { ip }
export const unblockIPAddress = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        if (!isRedisConnected) {
            return sendError(res, 503, "Service temporarily unavailable");
        }

        const { ip }: UnblockIPRequest = req.body;

        if (!ip) {
            return sendError(res, 400, "Missing required field", ["ip"]);
        }
        if (!isValidIP(ip)) {
            return sendError(res, 400, "Invalid IP address format");
        }

        const blockInfo = await getBlockInfo(ip);
        if (!blockInfo) {
            return sendError(res, 404, "IP is not blocked");
        }

        const key = `${REDIS_KEYS.FIREWALL.BLOCKED_IP_PREFIX}${ip}`;
        const deleted = await deleteKeys(key);

        if (deleted === 0) {
            return sendError(res, 500, "Failed to unblock IP");
        }

        try {
            const currentCount = await getInt(REDIS_KEYS.FIREWALL.BANNED_COUNT, 0);
            if (currentCount > 0) {
                await redisClient.decr(REDIS_KEYS.FIREWALL.BANNED_COUNT)
            }
        } catch (error) {
            console.error("Error decrementing banned count:", error);
            // Don't fail the request
        }

        const requestCount = await getInt(`${REDIS_KEYS.IP_STATS.PREFIX}${ip}`, 0);
        const ipInfo = await enrichIPInfo(ip, requestCount);

        console.log(`IP unblocked: ${ip}`);

        return sendSuccess<IPInfo>(
            res,
            200,
            "IP unblocked successfully",
            ipInfo
        );
    } catch (error) {
        console.error("Unblock IP error:", error);
        return sendError(res, 500, "Failed to unblock IP");
    }
};

//DELETE -  Remove IP from stats tracking (reset request count) , /abuse/ip-stats/:ip 
export const removeIPStats = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        if (!isRedisConnected()) {
            return sendError(res, 503, "Service temporarily unavailable");
        }

        const { ip } = req.params;

        if (!isValidIP(ip)) {
            return sendError(res, 400, "Invalid IP address format");
        }

        const removedFromSet = await removeFromSortedSet(REDIS_KEYS.IP_STATS.SORTED_SET, ip);

        const counterKey = `${REDIS_KEYS.IP_STATS.PREFIX}${ip}`;
        const deletedCounter = await deleteKeys(counterKey);

        if (removedFromSet === 0 && deletedCounter === 0) {
            return sendError(res, 404, "IP not found in stats");
        }

        console.log(`IP stats removed: ${ip}`);

        return sendSuccess(res, 200, "IP stats removed successfully", {
            ip,
            removedFromRanking: removedFromSet > 0,
            removedCounter: deletedCounter > 0,
        });
    } catch (error) {
        console.error("Remove IP stats error:", error);
        return sendError(res, 500, "Failed to remove IP stats");
    }
};