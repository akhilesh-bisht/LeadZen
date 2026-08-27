/**
 * ============================================================================
 * CONTROLLER: LeadsController
 * ============================================================================
 * Handles CRM lead entity lifecycle:
 *   - Paginated listing, full-text search, filtering by status, category, city, assignee
 *   - Creation (single or bulk batch saving from search queries)
 *   - Dynamic lead updates (status progression, rep assignment, CRM notes)
 *   - Lead deletion (single & bulk)
 *   - Lead rep assignment & round-robin allocation
 *   - Social enrichment integration
 * ============================================================================
 */

import { Request, Response } from "express";
import {
  getLeads,
  getLeadById,
  saveLeads,
  updateLead,
  deleteLead,
  deleteManyLeads,
  assignLeads,
} from "../mongodb.js";
import { SocialProvider } from "../providers/social-provider.js";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.js";

export class LeadsController {
  /**
   * GET /api/leads
   * Returns paginated, filtered, and sorted leads
   */
  public static async getLeads(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        search,
        category,
        city,
        status,
        assignedTo,
        sortBy,
        sortOrder,
        page = "1",
        limit = "20",
      } = req.query;

      const memberAssignedTo =
        req.user?.role === "sales_rep" ? req.user.name : undefined;

      const result = await getLeads({
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        city: city ? String(city) : undefined,
        status: status ? String(status) : undefined,
        assignedTo:
          memberAssignedTo || (assignedTo ? String(assignedTo) : undefined),
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page: Number(page),
        limit: Number(limit),
      });

      return res.json(result);
    } catch (error) {
      console.error("LeadsController.getLeads error:", error);
      return res
        .status(500)
        .json({ error: "Failed to retrieve leads from database." });
    }
  }

  /**
   * GET /api/leads/:id
   * Returns a single lead document by its ID
   */
  public static async getLeadById(req: AuthenticatedRequest, res: Response) {
    try {
      const lead = await getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found in database." });
      }
      if (
        req.user?.role === "sales_rep" &&
        lead.assignedTo?.toLowerCase() !== req.user.name.toLowerCase()
      ) {
        return res
          .status(404)
          .json({ error: "Lead not found in your assignments." });
      }
      return res.json(lead);
    } catch (error) {
      console.error("LeadsController.getLeadById error:", error);
      return res.status(500).json({ error: "Failed to fetch lead details." });
    }
  }

  /**
   * POST /api/leads
   * Saves one or multiple leads to MongoDB database
   */
  public static async createLeads(req: AuthenticatedRequest, res: Response) {
    try {
      const body = req.body;
      let leadsToSave: any[] = [];

      if (Array.isArray(body)) {
        leadsToSave = body;
      } else if (body.leads && Array.isArray(body.leads)) {
        leadsToSave = body.leads;
      } else if (body.businessName) {
        leadsToSave = [body];
      } else {
        return res.status(400).json({ error: "Invalid lead data provided." });
      }

      const result = await saveLeads(leadsToSave);
      return res.status(201).json({
        success: true,
        savedCount: result.saved.length,
        duplicatesCount: result.duplicatesCount,
        leads: result.saved,
      });
    } catch (error) {
      console.error("LeadsController.createLeads error:", error);
      return res
        .status(500)
        .json({ error: "Failed to save leads to database." });
    }
  }

  /**
   * PATCH /api/leads/:id
   * Updates lead properties (status, notes, assignedTo, phone, email, etc.)
   */
  public static async updateLead(req: AuthenticatedRequest, res: Response) {
    try {
      const existingLead = await getLeadById(req.params.id);
      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found." });
      }
      if (
        req.user?.role === "sales_rep" &&
        existingLead.assignedTo?.toLowerCase() !== req.user.name.toLowerCase()
      ) {
        return res
          .status(404)
          .json({ error: "Lead not found in your assignments." });
      }

      const updates =
        req.user?.role === "admin"
          ? req.body
          : Object.keys(req.body).length === 1 &&
              typeof req.body.status === "string"
            ? { status: req.body.status }
            : null;

      if (!updates) {
        return res.status(403).json({
          error: "Members may only update lead status.",
        });
      }

      const updated = await updateLead(req.params.id, updates);
      if (!updated) {
        return res
          .status(404)
          .json({ error: "Lead not found or update failed." });
      }
      return res.json(updated);
    } catch (error) {
      console.error("LeadsController.updateLead error:", error);
      return res
        .status(500)
        .json({ error: "Failed to update lead in database." });
    }
  }

  /**
   * DELETE /api/leads/:id
   * Deletes a single lead record from MongoDB
   */
  public static async deleteLead(req: Request, res: Response) {
    try {
      const success = await deleteLead(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Lead not found." });
      }
      return res.json({
        success: true,
        message: "Lead deleted from database.",
      });
    } catch (error) {
      console.error("LeadsController.deleteLead error:", error);
      return res
        .status(500)
        .json({ error: "Failed to delete lead from database." });
    }
  }

  /**
   * DELETE /api/leads
   * Bulk deletes multiple leads by their ID array
   */
  public static async bulkDeleteLeads(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res
          .status(400)
          .json({ error: "Array of lead IDs is required." });
      }
      const deletedCount = await deleteManyLeads(ids);
      return res.json({ success: true, deletedCount });
    } catch (error) {
      console.error("LeadsController.bulkDeleteLeads error:", error);
      return res
        .status(500)
        .json({ error: "Failed to delete selected leads." });
    }
  }

  /**
   * POST /api/leads/assign
   * Assigns leads to a specific representative or auto-distributes via round-robin
   */
  public static async assignLeads(req: Request, res: Response) {
    try {
      const { leadIds, assignTo, memberList } = req.body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res
          .status(400)
          .json({ error: "Array of lead IDs is required." });
      }

      const result = await assignLeads(leadIds, assignTo, memberList);
      return res.json({
        success: true,
        updatedCount: result.updatedCount,
        assignTo,
        assignments: result.assignments,
      });
    } catch (error) {
      console.error("LeadsController.assignLeads error:", error);
      return res.status(500).json({ error: "Failed to assign leads." });
    }
  }

  /**
   * POST /api/leads/:id/enrich
   * Discovers social profiles for a lead using public search
   */
  public static async enrichLead(req: Request, res: Response) {
    try {
      const lead = await getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found." });
      }

      const enrichment = await SocialProvider.enrichSocialProfiles(
        lead.businessName,
        lead.city,
        lead.website,
      );

      const updates: any = {};
      if (enrichment.instagram && !lead.instagram)
        updates.instagram = enrichment.instagram;
      if (enrichment.linkedin && !lead.linkedin)
        updates.linkedin = enrichment.linkedin;
      if (enrichment.facebook && !lead.facebook)
        updates.facebook = enrichment.facebook;
      if (enrichment.email && !lead.email) updates.email = enrichment.email;

      let updatedLead = lead;
      if (Object.keys(updates).length > 0) {
        updatedLead = (await updateLead(req.params.id, updates)) || lead;
      }

      return res.json({
        success: true,
        enrichment,
        updatedLead,
      });
    } catch (error) {
      console.error("LeadsController.enrichLead error:", error);
      return res
        .status(500)
        .json({ error: "Failed to enrich social profiles." });
    }
  }
}
