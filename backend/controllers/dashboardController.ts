/**
 * ============================================================================
 * CONTROLLER: DashboardController
 * ============================================================================
 * Aggregates live database statistics for the command center dashboard:
 *   - Overall lead count & conversion rates
 *   - Breakdown by status (new, contacted, interested, converted, not interested)
 *   - Workload allocation per active sales representative
 *   - Geographic distribution & top categories
 *   - Most recent saved leads
 * ============================================================================
 */

import { Request, Response } from "express";
import { getDashboardStats } from "../mongodb.js";

export class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Calculates and returns aggregated prospecting metrics
   */
  public static async getStats(req: Request, res: Response) {
    try {
      const stats = await getDashboardStats();
      return res.json(stats);
    } catch (error) {
      console.error("DashboardController.getStats error:", error);
      return res
        .status(500)
        .json({ error: "Failed to calculate dashboard statistics." });
    }
  }
}
