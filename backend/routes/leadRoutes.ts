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

import { Router } from 'express';
import { LeadsController } from '../controllers/leadsController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Lead Listing & Searching
router.get('/', LeadsController.getLeads);

// Lead Creation & Bulk Saving
router.post('/', optionalAuth, LeadsController.createLeads);

// Rep Assignment & Round-Robin Distribution
router.post('/assign', LeadsController.assignLeads);

// Bulk Deletion
router.delete('/', LeadsController.bulkDeleteLeads);

// Single Lead CRUD Operations
router.get('/:id', LeadsController.getLeadById);
router.patch('/:id', optionalAuth, LeadsController.updateLead);
router.delete('/:id', LeadsController.deleteLead);

// Lead Enrichment
router.post('/:id/enrich', LeadsController.enrichLead);

export default router;
