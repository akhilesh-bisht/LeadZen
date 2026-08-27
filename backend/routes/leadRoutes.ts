/**
 * ============================================================================
 * ROUTE: leadRoutes
 * ============================================================================
 * Defines REST endpoints for CRM lead management:
 *   GET    /api/leads             -> List, search, filter, paginate leads
 *   POST   /api/leads             -> Create / save leads
 *   POST   /api/leads/assign      -> Assign / distribute leads
 *   GET    /api/leads/:id         -> Single lead details
 *   PATCH  /api/leads/:id         -> Update lead status, notes, assignment
 *   DELETE /api/leads/:id         -> Delete single lead
 *   DELETE /api/leads             -> Bulk delete leads
 *   POST   /api/leads/:id/enrich  -> Real-time social profile discovery
 * ============================================================================
 */

import { Router } from "express";
import { LeadsController } from "../controllers/leadsController.js";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Lead Listing & Searching
router.get("/", requireAuth, LeadsController.getLeads);

// Lead Creation & Bulk Saving
router.post("/", requireAdmin, LeadsController.createLeads);

// Rep Assignment & Round-Robin Distribution
router.post("/assign", requireAdmin, LeadsController.assignLeads);

// Bulk Deletion
router.delete("/", requireAdmin, LeadsController.bulkDeleteLeads);

// Single Lead CRUD Operations
router.get("/:id", requireAuth, LeadsController.getLeadById);
router.patch("/:id", requireAuth, LeadsController.updateLead);
router.delete("/:id", requireAdmin, LeadsController.deleteLead);

// Lead Enrichment
router.post("/:id/enrich", requireAdmin, LeadsController.enrichLead);

export default router;
