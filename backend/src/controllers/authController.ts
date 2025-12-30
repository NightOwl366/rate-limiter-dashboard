import Admin, { IAdminDocument } from "../models/Admin.js";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sendSuccess, sendError } from "../utils/responseHelpers.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface DecodedToken extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
}


const JWT_CONFIG = {
  secret: process.env.JWT_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
} as const;


const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(payload, JWT_CONFIG.refreshSecret, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token: string): DecodedToken => {
  return jwt.verify(token, JWT_CONFIG.refreshSecret) as DecodedToken;
};

const createUserPayload = (user: IAdminDocument): TokenPayload => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
});

const createUserResponse = (user: IAdminDocument) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  });
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};

export const login = async (
  req: Request<{}, {}, LoginRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const user = await Admin.findOne({ email, isActive: true })
      .select('+password')

    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials');
    };

    setImmediate(async () => {
      try {
        await Admin.findByIdAndUpdate(user._id, { lastLogin: new Date() })
      } catch (error) {
        console.error("Failed to update last login:", error);
      }
    });

    const userPayload = createUserPayload(user);
    const { accessToken, refreshToken } = generateTokens(userPayload);

    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess<AuthResponse>(res, 200, "Login successful", {
      accessToken,
      user: createUserResponse(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, 500, "An error occurred during login");
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return sendError(res, 401, "Refresh token required");
    }

    let decoded: DecodedToken;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      clearRefreshTokenCookie(res);

      if (error instanceof jwt.TokenExpiredError) {
        return sendError(res, 401, "Refresh token expired");
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return sendError(res, 401, "Invalid refresh token");
      }

      throw error;
    }

    const user = await Admin.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      clearRefreshTokenCookie(res);
      return sendError(res, 401, "User not found or inactive");
    }

    const userPayload = createUserPayload(user);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userPayload);
    setRefreshTokenCookie(res, newRefreshToken);
    return sendSuccess<AuthResponse>(res, 200, "Token refreshed successfully", {
      accessToken,
      user: createUserResponse(user),
    });

  } catch (error) {
    console.error("Token refresh error:", error);
    return sendError(res, 500, "An error occurred during token refresh");
  }
};

export const logout = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    clearRefreshTokenCookie(res);
    return sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    return sendError(res, 500, "An error occurred during logout");
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = req.user;  
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }
    return sendSuccess(res, 200, "User retrieved successfully", {
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve user",
    });
  }
};
