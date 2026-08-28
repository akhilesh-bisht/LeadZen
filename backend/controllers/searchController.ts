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
import { SocialProvider } from "../providers/social-provider.js";
import { checkDuplicates } from "../mongodb.js";

export class SearchController {
  /**
   * POST /api/search
   * Executes live business prospecting search and checks for existing duplicates in DB
   */
  public static async searchBusinesses(req: Request, res: Response) {
    try {
      const {
        query,
        location,
        locations,
        radiusKm = 25,
        limit = 25,
        provider,
      } = req.body;
      const selectedLocations = Array.isArray(locations)
        ? locations.filter(
            (item: unknown): item is string =>
              typeof item === "string" && item.trim().length > 0,
          )
        : typeof location === "string" && location.trim()
          ? [location.trim()]
          : [];

      const cleanQuery =
        query && typeof query === "string" && query.trim()
          ? query.trim()
          : "All Businesses";

      if (selectedLocations.length === 0) {
        return res.status(400).json({ error: "City or location is required." });
      }

      const cleanLimit = Math.min(100, Math.max(1, Number(limit) || 25));
      const cleanRadius = Math.min(50, Math.max(1, Number(radiusKm) || 25));

      // Fetch real data from live business provider
      const results = await Promise.all(
        selectedLocations.map((selectedLocation) =>
          executeBusinessSearch(
            cleanQuery,
            selectedLocation.trim(),
            cleanLimit,
            provider,
            cleanRadius,
          ),
        ),
      );
      const rawLeads = results
        .flatMap((result) => result.leads)
        .slice(0, cleanLimit);
      const providerUsed = [
        ...new Set(results.map((result) => result.providerUsed)),
      ].join(" + ");

      // Some providers omit phone numbers but still return the official website.
      // Use that public page as a source for links the provider did not include.
      const enrichedLeads = await Promise.all(
        rawLeads.map(async (lead) => {
          if (lead.phone || !lead.website) return lead;

          const socialLinks = await SocialProvider.scrapeWebsiteSocialLinks(
            lead.website,
          );
          return {
            ...lead,
            instagram: lead.instagram || socialLinks.instagram,
            linkedin: lead.linkedin || socialLinks.linkedin,
            facebook: lead.facebook || socialLinks.facebook,
          };
        }),
      );

      // Check duplicates against MongoDB / persistent database
      const leadsWithDupInfo = await checkDuplicates(enrichedLeads);

      return res.json({
        success: true,
        query: query.trim(),
        location: selectedLocations.join(", "),
        locations: selectedLocations,
        radiusKm: cleanRadius,
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
