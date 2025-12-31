import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/responseHelpers.js";
import { REDIS_KEYS, getMultiple, isRedisConnected, getTimeSeriesRange, generateTimeKey } from "../utils/redisUtils.js";

interface StatsOverview {
    totalRequests: number;
    blockedRequests: number;
    allowedRequests: number;
    bannedIPs: number;
    currentRateLimit: {
        points: number;
        duration: number;
    };
}

interface TimelineDataPoint {
    timestamp: string;
    count: number;
}

interface RequestTimelineResponse {
    data: TimelineDataPoint[];
    startTime: string;
    endTime: string;
    totalRequests: number;
}

const DEFAULT_RATE_LIMIT = {
    POINTS: 100,
    DURATION: 60,
} as const;

const TIMELINE_DURATION = {
    LAST_HOUR: 60,
    LAST_24_HOURS: 1440,
} as const;

const generateTimeRange = (minutesBack: number): { startTime: string; endTime: string } => {
    const now = new Date();

    //now(in milliseconds) - minutesBack(converts minutes → milliseconds)
    const start = new Date(now.getTime() - minutesBack * 60 * 1000);

    return {
        startTime: generateTimeKey(start),
        endTime: generateTimeKey(now),
    };
};

export const getOverview = async (
    _req: Request,
    res: Response
): Promise<Response> => {
    try {
        if (!isRedisConnected()) {
            return sendError(res, 503, "Stats service temporarily unavailable")
        }

        //Pipeline call
        const keys = [
            REDIS_KEYS.STATS.TOTAL_REQUESTS,
            REDIS_KEYS.STATS.BLOCKED_REQUESTS,
            REDIS_KEYS.STATS.ALLOWED_REQUESTS,
            REDIS_KEYS.FIREWALL.BANNED_COUNT,
            REDIS_KEYS.RATE_LIMIT.CONFIG_POINTS,
            REDIS_KEYS.RATE_LIMIT.CONFIG_DURATION,
        ];

        const results = await getMultiple(keys);

        const [
            totalRequestsStr,
            blockedRequestsStr,
            allowedRequestsStr,
            bannedIPsStr,
            rateLimitPointsStr,
            rateLimitDurationStr,
        ] = results;

        const totalRequests = totalRequestsStr ? parseInt(totalRequestsStr, 10) || 0 : 0;
        const blockedRequests = blockedRequestsStr ? parseInt(blockedRequestsStr, 10) || 0 : 0;
        const allowedRequests = allowedRequestsStr ? parseInt(allowedRequestsStr, 10) || 0 : 0;
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
            allowedRequests,
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

/** Request counts per minute for the last hour or day
    Query params: duration: "hour" | "day" (default: "hour")  **/
export const getRequestTimeline = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        if (!isRedisConnected()) {
            return sendError(res, 503, "Stats service temporarily unavailable");
        }

        const duration = req.query.duration as string;
        const minutesBack = duration === "day" ? TIMELINE_DURATION.LAST_24_HOURS : TIMELINE_DURATION.LAST_HOUR;

        const { startTime, endTime } = generateTimeRange(minutesBack);

        const timelineData = await getTimeSeriesRange(
            REDIS_KEYS.STATS.PER_MINUTE_PREFIX,
            startTime,
            endTime
        );

        const totalRequests = timelineData.reduce(
            (sum, point) => sum + point.count, 0
        );

        const response: RequestTimelineResponse = {
            data: timelineData,
            startTime,
            endTime,
            totalRequests,
        };

        return sendSuccess<RequestTimelineResponse>(
            res,
            200,
            "Timeline data retrieved successfully",
            response
        );
    } catch (error) {
        console.error("Request timeline error:", error);
        return sendError(res, 500, "Failed to retrieve timeline data");
    }
};