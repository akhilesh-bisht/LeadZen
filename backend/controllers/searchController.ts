/**
 * ============================================================================
 * CONTROLLER: SearchController
 * ============================================================================
 * Coordinates real business prospecting by querying external live business providers
 * (Overpass API / OpenStreetMap), normalizing data fields, and performing
 * duplicate checks against already saved leads in MongoDB.
 * ============================================================================
 */

import { Request, Response } from "express";
import { executeBusinessSearch } from "../providers/business-provider.js";
import { checkDuplicates } from "../mongodb.js";

export class SearchController {
  /**
   * POST /api/search
   * Executes live business prospecting search and checks for existing duplicates in DB
   */
  public static async searchBusinesses(req: Request, res: Response) {
    try {
      const { query, location, limit = 25, provider } = req.body;

      if (!query || typeof query !== "string" || !query.trim()) {
        return res
          .status(400)
          .json({ error: "Business or category query is required." });
      }

      if (!location || typeof location !== "string" || !location.trim()) {
        return res.status(400).json({ error: "City or location is required." });
      }

      const cleanLimit = Math.min(100, Math.max(1, Number(limit) || 25));

      // Fetch real data from live business provider
      const { leads: rawLeads, providerUsed } = await executeBusinessSearch(
        query.trim(),
        location.trim(),
        cleanLimit,
        provider,
      );

      // Check duplicates against MongoDB / persistent database
      const leadsWithDupInfo = await checkDuplicates(rawLeads);

      return res.json({
        success: true,
        query: query.trim(),
        location: location.trim(),
        providerUsed,
        count: leadsWithDupInfo.length,
        leads: leadsWithDupInfo,
      });
    } catch (error) {
      console.error("SearchController.searchBusinesses error:", error);
      return res.status(500).json({
        error:
          (error as Error).message ||
          "Failed to fetch business data from live provider.",
      });
    }
  }
}
