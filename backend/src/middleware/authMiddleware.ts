import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { sendError } from "../utils/responseHelpers.js";

interface UserPayload {
    id: string;
    email: string;
    role: string;
}

interface DecodedToken extends JwtPayload {
    id: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

const extractTokenFromHeader = (authHeader?: string): string | null => {
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.substring(7).trim();
};

const verifyToken = (token: string): DecodedToken => {
    return jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
};

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return sendError(res, 401, "Access denied. No token provided");
        }

        let decoded: DecodedToken;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return sendError(res, 401, "Refresh token expired");
            }

            if (error instanceof jwt.JsonWebTokenError) {
                return sendError(res, 401, "Invalid refresh token");
            }

            throw error;
        }

        if (!decoded.id || !decoded.email || !decoded.role) {
            return sendError(res, 401, "Invalid token payload");
        }

        const user = await Admin.findById(decoded.id)
            .select("email role isActive")
            .lean();

        if (!user) {
            return sendError(res, 401, "User no longer exists");
        }

        req.user = {
            id: decoded.id,
            email: user.email,
            role: user.role,
        }

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return sendError(res, 500, "Authentication failed");
    }
};

export const restrictTo = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void | Response => {
        if (!req.user) {
            return sendError(res, 401, "User not authenticated");
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return sendError(res,403,"You do not have permission to perform this action");
        }
        next();
    };
};