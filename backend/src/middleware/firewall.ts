import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/responseHelpers.js";
import { getClientIp, normalizeIp } from "../utils/ipExtractor.js";
import {
    REDIS_KEYS,
    getString,
    setValue,
    increment,
    isRedisConnected,
    pushAndTrimList,
} from "../utils/redisUtils.js";

interface BlockedIpInfo {
    reason: string;
    blockedAt: string;
    expiresAt?: string;
}

interface RequestLog {
    timestamp: string;
    ip: string;
    route: string;
    method: string;
    status: number;
    type: "banned";
    userAgent?: string;
    reason?: string;
}

const BAN_DURATION = {
    TEMPORARY: 3600,
    PERMANENT: 0,
} as const;

const checkBlockedIp = async (ip: string): Promise<BlockedIpInfo | null> => {
    try {
        const key = `${REDIS_KEYS.FIREWALL.BLOCKED_IP_PREFIX}${ip}`;
        const data = await getString(key);

        if (!data) {
            return null;
        }

        const blockInfo: BlockedIpInfo = JSON.parse(data);
        return blockInfo;
    } catch (error) {
        console.error(`Error checking blocked IP ${ip}:`, error);
        return null;
    }
};

export const blockIp = async (
    ip: string,
    reason: string,
    duration: number = BAN_DURATION.TEMPORARY
): Promise<boolean> => {
    try {
        const key = `${REDIS_KEYS.FIREWALL.BLOCKED_IP_PREFIX}${ip}`;
        const blockedAt = new Date().toISOString();

        const blockInfo: BlockedIpInfo = {
            reason,
            blockedAt
        };

        if (duration > 0) {
            blockInfo.expiresAt = new Date(Date.now() + duration * 1000).toISOString();
        }

        const success = await setValue(key, JSON.stringify(blockInfo), duration > 0 ? duration : undefined);
        if (success) {
            await increment(REDIS_KEYS.FIREWALL.BANNED_COUNT);
            console.log(
                `IP blocked: ${ip} | Reason: ${reason} | Duration: ${duration > 0 ? `${duration}s` : "permanent"
                }`
            );
        }

        return success;
    } catch (error) {
        console.error(`Error blocking IP ${ip}:`, error);
        return false;
    }
};

const trackIpRequest = async (ip: string): Promise<void> => {
    try {
        const key = `${REDIS_KEYS.IP_STATS.PREFIX}${ip}`;
        await increment(key);
    } catch (error) {
        console.error(`Error tracking IP request for ${ip}:`, error);
    }
};

const logBannedRequest = async (
    req: Request,
    reason: string
): Promise<void> => {
    try {
        const ip = req.clientIp || normalizeIp(getClientIp(req));

        const logEntry: RequestLog = {
            timestamp: new Date().toISOString(),
            ip,
            route: req.path,
            method: req.method,
            status: 403,
            type: "banned",
            userAgent: req.headers["user-agent"],
            reason,
        };

        await pushAndTrimList(REDIS_KEYS.LOGS.REQUESTS, logEntry, 1000);
    } catch (error) {
        console.error("Error logging banned request:", error);
    }
};

export const firewall = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    try {
        if (!isRedisConnected()) {
            console.warn("Redis unavailable - firewall bypassed");
            return next();
        }

        const rawIp = getClientIp(req);
        const ip = normalizeIp(rawIp);

        req.clientIp = ip;

        const blockInfo = await checkBlockedIp(ip);
        if (blockInfo) {
            logBannedRequest(req, blockInfo.reason).catch((err) => {
                console.error("Banned request logging error:", err);
            });

            await increment(REDIS_KEYS.STATS.BLOCKED_REQUESTS);
            console.log(`Blocked request from ${ip} | Reason: ${blockInfo.reason}`);
            
            return sendError(res, 403, `Access denied. Reason: ${blockInfo.reason}`);
        }

        trackIpRequest(ip).catch((error) => { console.error("Failed to track IP request:", error); });
        next();
    } catch (error) {
        console.error("Firewall middleware error:", error);
        next();
    }
};













