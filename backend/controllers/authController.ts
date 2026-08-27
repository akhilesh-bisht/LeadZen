/**
 * ============================================================================
 * CONTROLLER: AuthController
 * ============================================================================
 * Handles user authentication operations including login, user creation/registration,
 * profile fetching, user listing, and user account deletion.
 *
 * Implements MVC separation: Controllers process incoming HTTP requests,
 * validate body parameters, invoke Services, and return structured JSON responses.
 * ============================================================================
 */

import { Request, Response } from "express";
import {
  authenticate,
  createUser,
  findUserById,
  listAllUsers,
  removeUser,
  generateAuthToken,
  updateUserPermissions,
} from "../services/authService.js";
import { DashboardPermission } from "../../src/types/index.js";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.js";

export class AuthController {
  /**
   * POST /api/auth/login
   * Validates credentials and returns sanitized user object + signed JWT token
   */
  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email address is required." });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required." });
      }

      const user = await authenticate(email, password);
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password. Please verify your credentials.",
        });
      }

      const token = generateAuthToken(user);

      return res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        user,
        token,
      });
    } catch (error) {
      console.error("AuthController.login error:", error);
      return res.status(500).json({
        error: (error as Error).message || "Failed to authenticate user.",
      });
    }
  }

  /**
   * POST /api/auth/register (or /api/auth/users)
   * Creates a new user in the system (Admin or self-registration)
   */
  public static async register(req: Request, res: Response) {
    try {
      const {
        name,
        email,
        password,
        role = "sales_rep",
        phone,
        teamMemberId,
        permissions,
      } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Full name is required." });
      }

      if (
        !email ||
        typeof email !== "string" ||
        !email.trim() ||
        !email.includes("@")
      ) {
        return res
          .status(400)
          .json({ error: "A valid email address is required." });
      }

      if (!password || typeof password !== "string" || password.length < 4) {
        return res.status(400).json({
          error: "Password must be at least 4 characters long.",
        });
      }

      const validRole = role === "admin" ? "admin" : "sales_rep";

      const newUser = await createUser({
        name,
        email,
        password,
        role: validRole,
        phone,
        teamMemberId,
        permissions: Array.isArray(permissions)
          ? (permissions as DashboardPermission[])
          : undefined,
      });

      const token = generateAuthToken(newUser);

      return res.status(201).json({
        success: true,
        message: `User account for ${newUser.name} created successfully.`,
        user: newUser,
        token,
      });
    } catch (error) {
      console.error("AuthController.register error:", error);
      return res.status(400).json({
        error: (error as Error).message || "Failed to create user account.",
      });
    }
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user profile
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated." });
      }

      const user = await findUserById(req.user.sub);
      if (!user) {
        return res.status(404).json({ error: "User not found in system." });
      }

      return res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("AuthController.getProfile error:", error);
      return res.status(500).json({ error: "Failed to retrieve profile." });
    }
  }

  /**
   * GET /api/auth/users
   * Returns list of all registered system users (Admins & reps)
   */
  public static async listUsers(req: Request, res: Response) {
    try {
      const users = await listAllUsers();
      return res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error("AuthController.listUsers error:", error);
      return res.status(500).json({ error: "Failed to list users." });
    }
  }

  /**
   * DELETE /api/auth/users/:id
   * Removes a user from the system
   */
  public static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await removeUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found." });
      }

      return res.json({
        success: true,
        message: "User removed from system.",
      });
    } catch (error) {
      console.error("AuthController.deleteUser error:", error);
      return res.status(500).json({ error: "Failed to delete user." });
    }
  }

  public static async updatePermissions(req: Request, res: Response) {
    try {
      const permissions = req.body?.permissions;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: "Permissions must be an array." });
      }

      const user = await updateUserPermissions(req.params.id, permissions);
      if (!user) return res.status(404).json({ error: "User not found." });

      return res.json({ success: true, user });
    } catch (error) {
      console.error("AuthController.updatePermissions error:", error);
      return res.status(500).json({ error: "Failed to update permissions." });
    }
  }
}
