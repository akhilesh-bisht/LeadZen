/**
 * ============================================================================
 * CONTROLLER: TeamController
 * ============================================================================
 * Handles sales team roster and rep profile management:
 *   - Fetching all active team members
 *   - Adding new sales team representatives
 *   - Deleting / deactivating sales representatives
 *   - Workload analytics and allocation
 * ============================================================================
 */

import { Request, Response } from "express";
import { getTeamMembers, addTeamMember, deleteTeamMember } from "../mongodb.js";

export class TeamController {
  /**
   * GET /api/team
   * Returns list of sales team members and reps
   */
  public static async getMembers(req: Request, res: Response) {
    try {
      const members = getTeamMembers();
      return res.json({ success: true, members });
    } catch (error) {
      console.error("TeamController.getMembers error:", error);
      return res.status(500).json({ error: "Failed to fetch team members." });
    }
  }

  /**
   * POST /api/team
   * Adds a new sales representative to the team roster
   */
  public static async addMember(req: Request, res: Response) {
    try {
      const { name, role, email, phone, avatarColor } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Team member name is required." });
      }

      const newMember = addTeamMember({
        name,
        role,
        email,
        phone,
        avatarColor,
      });
      return res.status(201).json({ success: true, member: newMember });
    } catch (error) {
      console.error("TeamController.addMember error:", error);
      return res.status(500).json({ error: "Failed to add team member." });
    }
  }

  /**
   * DELETE /api/team/:id
   * Removes a sales representative from the team
   */
  public static async deleteMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = deleteTeamMember(id);
      if (!success) {
        return res.status(404).json({ error: "Team member not found." });
      }
      return res.json({ success: true, message: "Team member removed." });
    } catch (error) {
      console.error("TeamController.deleteMember error:", error);
      return res.status(500).json({ error: "Failed to delete team member." });
    }
  }
}
