import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/responseHelpers.js";
import { getClientIp, normalizeIp } from "../utils/ipExtractor.js";
import {
    REDIS_KEYS,
    getInt,
    increment,
    isRedisConnected,
    incrementTimeSeries,
    incrementSortedSet,
    generateTimeKey,
    getJSON,
    setJSON,
    pushAndTrimList,
} from "../utils/redisUtils.js";
import redisClient from "../config/redis.js";

interface RateLimitConfig {
    points: number;
    duration: number;  // seconds
}

interface RateLimitInfo {
    remaining: number;
    resetTime: number;
    total: number;
}

interface RequestLog {
    timestamp: string;
    ip: string;
    route: string;
    method: string;
    status: number;
    type: "allowed" | "blocked";
    userAgent?: string;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
    points: 100,
    duration: 60
} as const;

const AUTO_BAN_THRESHOLD = 3;

const getRateLimitConfig = async (): Promise<RateLimitConfig> => {
    try {
        const unifiedConfig = await getJSON<RateLimitConfig>(REDIS_KEYS.CONFIG.RATE_LIMIT, null);
        if (unifiedConfig) {
            return unifiedConfig;
        }

        // Fallback to legacy separate keys (backward compatibility)
        const points = await getInt(
            REDIS_KEYS.RATE_LIMIT.CONFIG_POINTS,
            DEFAULT_RATE_LIMIT.points
        );

        const duration = await getInt(
            REDIS_KEYS.RATE_LIMIT.CONFIG_DURATION,
            DEFAULT_RATE_LIMIT.duration
        );

        return { points, duration };
    } catch (error) {
        console.error("Error fetching rate limit config:", error);
        return DEFAULT_RATE_LIMIT;
    }
};

const getTokenCount = async (
    ip: string,
    duration: number
): Promise<{ count: number; ttl: number }> => {
    try {
        const key = `${REDIS_KEYS.RATE_LIMIT.IP_PREFIX}${ip}`;
        const count = await getInt(key, 0);

        let ttl = await redisClient.ttl(key);
        if (ttl === -1 || ttl === -2) {            // -1=(key exists but no expiry) , -2=(key doesn’t exist)
            ttl = duration;
        }

        return { count, ttl };
    } catch (error) {
        console.error(`Error getting token count for ${ip}:`, error);
        return { count: 0, ttl: duration };
    }
};

const consumeToken = async (
    ip: string,
    duration: number
): Promise<number> => {
    try {
        const key = `${REDIS_KEYS.RATE_LIMIT.IP_PREFIX}${ip}`;

        const newCount = await increment(key, 1);
        if (newCount === 1) {
            await redisClient.expire(key, duration);
        }

        return newCount;
    } catch (error) {
        console.error(`Error consuming token for ${ip}:`, error);
        throw error;
    }
};

const trackViolation = async (ip: string): Promise<number> => {
    try {
        const key = `${REDIS_KEYS.RATE_LIMIT.IP_PREFIX}${ip}:violations`;

        const violations = await increment(key, 1);
        if (violations === 1) {
            await redisClient.expire(key, 3600);
        }

        return violations;
    } catch (error) {
        console.error(`Error tracking violation for ${ip}:`, error);
        return 0;
    }
};

const autobanIfNeeded = async (
    ip: string,
    violations: number
): Promise<void> => {
    if (violations >= AUTO_BAN_THRESHOLD) {
        try {
            const { blockIp } = await import("./firewall.js");
            await blockIp(
                ip,
                `Auto-banned: ${violations} rate limit violations`,
                3600
            );
            console.log(`Auto-banned IP ${ip} after ${violations} violations`);
        } catch (error) {
            console.error(`Error auto-banning IP ${ip}:`, error);
        }
    }
};

const setRateLimitHeaders = (
    res: Response,
    info: RateLimitInfo
): void => {
    res.setHeader("X-RateLimit-Limit", info.total.toString());
    res.setHeader("X-RateLimit-Remaining", info.remaining.toString());
    res.setHeader("X-RateLimit-Reset", info.resetTime.toString());
};

const trackAnalytics = async (
    ip: string,
): Promise<void> => {
    try {
        const now = new Date();
        const timeKey = generateTimeKey(now);
        const ipKey = `${REDIS_KEYS.IP_STATS.PREFIX}${ip}`;

        await Promise.all([
            incrementTimeSeries(REDIS_KEYS.STATS.PER_MINUTE_PREFIX, timeKey),   // Track per-minute timeline
            incrementSortedSet(REDIS_KEYS.IP_STATS.SORTED_SET, ip, 1),   // Track per-IP stats in sorted set (for ranking)
            increment(ipKey)  // Track per-IP counter
        ]);
    } catch (error) {
        console.error(`Error tracking analytics for ${ip}:`, error);
        // analytics failure shouldn't block requests
    }
};

const logRequest = async (
    req: Request,
    status: number,
    type: "allowed" | "blocked"
): Promise<void> => {
    try {
        const ip = req.clientIp || normalizeIp(getClientIp(req));

        const logEntry: RequestLog = {
            timestamp: new Date().toISOString(),
            ip,
            route: req.path,
            method: req.method,
            status,
            type,
            userAgent: req.headers['user-agent']
        };

        await pushAndTrimList(REDIS_KEYS.LOGS.REQUESTS, logEntry, 1000);
    } catch (error) {
        console.error("Error logging request:", error);
        // logging failure shouldn't block requests
    }
};


export const rateLimiter = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    try {
        if (!isRedisConnected()) {
            console.warn("Redis unavailable - rate limiter bypassed");
            return next();
        }

        const ip = req.clientIp || normalizeIp(getClientIp(req));

        const config = await getRateLimitConfig();

        const { count: currentCount, ttl } = await getTokenCount(ip, config.duration);

        if (currentCount >= config.points) {
            // Track analytics (blocked request)
            trackAnalytics(ip).catch((err) => {
                console.error("Analytics tracking error:", err);     //If this Promise fails, handle it here
            });

            // Log blocked request 
            logRequest(req, 429, "blocked").catch((err) => {
                console.error("Request logging error:", err);
            });

            await increment(REDIS_KEYS.STATS.BLOCKED_REQUESTS);

            const violations = await trackViolation(ip);
            autobanIfNeeded(ip, violations).catch((err) => {
                console.error("Auto-ban error:", err);
            });

            const resetTime = Math.floor(Date.now() / 1000) + ttl;

            setRateLimitHeaders(res, {
                remaining: 0,
                resetTime,
                total: config.points
            });
            console.log(`Rate limit exceeded for ${ip} | ${currentCount}/${config.points} | Violations: ${violations}`);
            return sendError(res, 429, `Rate limit exceeded. Try again in ${ttl} seconds.`);
        }

        const newCount = await consumeToken(ip, config.duration);

        // Track analytics (allowed request)
        trackAnalytics(ip).catch((err) => {
            console.error("Analytics tracking error:", err);      //If this Promise fails, handle it here
        });

        // Log allowed request
        logRequest(req, 200, "allowed").catch((err) => {
            console.error("Request logging error:", err);
        });

        const remaining = Math.max(0, config.points - newCount);
        const resetTime = Math.floor(Date.now() / 1000) + ttl;

        setRateLimitHeaders(res, {
            remaining,
            resetTime,
            total: config.points,
        });

        await Promise.all([
            increment(REDIS_KEYS.STATS.TOTAL_REQUESTS),
            increment(REDIS_KEYS.STATS.ALLOWED_REQUESTS),
        ]).catch(err => {
            console.error("Stats increment failed:", err);
        });

        next();
    } catch (error) {
        console.error("Rate limiter error:", error);
        next();
    }
};

export const updateRateLimitConfig = async (
    points: number,
    duration: number
): Promise<boolean> => {
    try {
        if (points < 1 || duration < 1) {
            console.error("Invalid rate limit config: points and duration must be > 0");
            return false;
        }

        const config: RateLimitConfig = {
            points,
            duration
        };

        const success = await setJSON(REDIS_KEYS.CONFIG.RATE_LIMIT, config);
        if (success) {
            console.log(`Rate limit updated: ${points} requests per ${duration}s`);
        }

        return success;
    } catch (error) {
        console.error("Error updating rate limit config:", error);
        return false;
    }
};



