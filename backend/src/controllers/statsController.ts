import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/responseHelpers.js";
import { REDIS_KEYS, getMultiple, isRedisConnected } from "../utils/redisUtils.js";

interface StatsOverview {
    totalRequests: number;
    blockedRequests: number;
    bannedIPs: number;
    currentRateLimit: {
        points: number;
        duration: number;
    };
}

const DEFAULT_RATE_LIMIT = {
    POINTS: 100,
    DURATION: 60,
} as const;

export const getOverview = async (
    _req: Request,
    res: Response
): Promise<Response> => {
    try {
        if (!isRedisConnected()) {
            return sendError(res, 503, "Stats service temporarily unavailable")
        }

        const keys = [
            REDIS_KEYS.STATS.TOTAL_REQUESTS,
            REDIS_KEYS.STATS.BLOCKED_REQUESTS,
            REDIS_KEYS.FIREWALL.BANNED_COUNT,
            REDIS_KEYS.RATE_LIMIT.CONFIG_POINTS,
            REDIS_KEYS.RATE_LIMIT.CONFIG_DURATION,
        ];

        const results = await getMultiple(keys);

        const [
            totalRequestsStr,
            blockedRequestsStr,
            bannedIPsStr,
            rateLimitPointsStr,
            rateLimitDurationStr,
        ] = results;

        const totalRequests = totalRequestsStr ? parseInt(totalRequestsStr, 10) || 0 : 0;
        const blockedRequests = blockedRequestsStr ? parseInt(blockedRequestsStr, 10) || 0 : 0;
        const bannedIPs = bannedIPsStr ? parseInt(bannedIPsStr, 10) || 0 : 0;
        const rateLimitPoints = rateLimitPointsStr
            ? parseInt(rateLimitPointsStr, 10) || DEFAULT_RATE_LIMIT.POINTS
            : DEFAULT_RATE_LIMIT.POINTS;
        const rateLimitDuration = rateLimitDurationStr
            ? parseInt(rateLimitDurationStr, 10) || DEFAULT_RATE_LIMIT.DURATION
            : DEFAULT_RATE_LIMIT.DURATION;

        const stats: StatsOverview = {
            totalRequests,
            blockedRequests,
            bannedIPs,
            currentRateLimit: {
                points: rateLimitPoints,
                duration: rateLimitDuration,
            },
        };

        return sendSuccess<StatsOverview>(
            res,
            200,
            "Stats retrieved successfully",
            stats
        );
    } catch (error) {
        console.error("Stats overview error:", error);
        return sendError(res, 500, "Failed to retrieve stats");
    }
};