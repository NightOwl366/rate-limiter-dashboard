import { Request } from "express";

export const getClientIp = (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];  //Load balancers, proxies
    const realIp = req.headers["x-real-ip"];  //Nginx, reverse proxy
    const cfConnectingIp = req.headers["cf-connecting-ip"];  //Cloudflare

    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
        return ips.trim();
    }

    if (realIp) {
        return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    if (cfConnectingIp) {
        return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
    }

    return req.ip || req.socket.remoteAddress || "unknown";
};

export const normalizeIp = (ip: string): string => {
    if (ip.startsWith("::ffff:")) {
        return ip.substring(7);
    }
    return ip;
};