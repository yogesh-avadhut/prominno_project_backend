import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";
import { errorResponse } from "../utils/response";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}


export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      errorResponse(res, "Access denied. No token provided.", 401);
      return;
    }

    const token = authHeader.split(" ")[1]; 

    const decoded = verifyToken(token);

    if (!decoded) {
      errorResponse(res, "Invalid or expired token.", 401);
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    errorResponse(res, "Authentication failed.", 401);
  }
};

export const authorizeRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, "Unauthorized. Please login first.", 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(
        res,
        `Access denied. Only [${roles.join(", ")}] can access this route.`,
        403
      );
      return;
    }

    next();
  };
};
