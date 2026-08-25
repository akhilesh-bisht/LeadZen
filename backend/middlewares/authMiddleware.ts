/**
 * ============================================================================
 * MIDDLEWARE: AuthMiddleware
 * ============================================================================
 * Intercepts incoming HTTP requests to validate bearer authentication tokens,
 * attach the authenticated user context to the Express Request object,
 * and enforce Role-Based Access Control (RBAC).
 *
 * Supported Roles:
 *   - 'admin': Has authority to perform all actions (user creation, reassignments, deletion).
 *   - 'sales_rep': Authorized for lead updates, outreach tasks, notes logging.
 * ============================================================================
 */

import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../services/authService.js";
import { UserRole } from "../../src/types/index.js";

// Extend Express Request interface to include authenticated user metadata
export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    name: string;
    role: UserRole;
    teamMemberId?: string;
  };
}

/**
 * Middleware: Requires a valid Bearer Token in Authorization header
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader =
    req.headers.authorization || (req.headers["x-auth-token"] as string);

  if (!authHeader) {
    return res.status(401).json({
      error: "Authentication required. Please provide a valid Bearer token.",
      code: "AUTH_REQUIRED",
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : authHeader.trim();

  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({
      error: "Invalid or expired session token. Please log in again.",
      code: "INVALID_TOKEN",
    });
  }

  req.user = payload;
  next();
}

/**
 * Middleware: Requires Administrator role ('admin')
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  // First ensure user is authenticated
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        error:
          "Forbidden. Administrator privileges required for this operation.",
        code: "ADMIN_REQUIRED",
      });
    }
    next();
  });
}

/**
 * Middleware: Optional Authentication (attaches user if token present, but does not block)
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader =
    req.headers.authorization || (req.headers["x-auth-token"] as string);
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : authHeader.trim();
    const payload = verifyAuthToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}
