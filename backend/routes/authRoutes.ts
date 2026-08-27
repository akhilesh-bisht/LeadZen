/**
 * ============================================================================
 * ROUTE: authRoutes
 * ============================================================================
 * Defines REST endpoints for user authentication, registration, session checks,
 * and user management:
 *   POST   /api/auth/login      -> Authenticates user & returns JWT
 *   POST   /api/auth/register   -> Registers new user account
 *   GET    /api/auth/me         -> Returns logged-in user profile (requireAuth)
 *   GET    /api/auth/users      -> Returns all system users (requireAuth)
 *   DELETE /api/auth/users/:id  -> Removes a user account (requireAdmin)
 * ============================================================================
 */

import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Public Authentication Endpoints
router.post("/login", AuthController.login);
router.post("/register", requireAdmin, AuthController.register);

// Authenticated User Endpoints
router.get("/me", requireAuth, AuthController.getProfile);
router.get("/users", requireAdmin, AuthController.listUsers);

// Admin-Only Operations
router.delete("/users/:id", requireAdmin, AuthController.deleteUser);
router.patch(
  "/users/:id/permissions",
  requireAdmin,
  AuthController.updatePermissions,
);

export default router;
