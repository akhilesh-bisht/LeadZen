/**
 * ============================================================================
 * ROUTE: searchRoutes
 * ============================================================================
 * Defines REST endpoints for live business prospecting searches:
 *   POST   /api/search  -> Query external business directories with duplicate check
 * ============================================================================
 */

import { Router } from "express";
import { SearchController } from "../controllers/searchController.js";
import { requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", requireAdmin, SearchController.searchBusinesses);

export default router;
