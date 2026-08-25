/**
 * ============================================================================
 * ROUTE: dashboardRoutes
 * ============================================================================
 * Defines REST endpoints for dashboard analytics and metrics:
 *   GET    /api/dashboard/stats  -> Aggregated conversion and workload metrics
 * ============================================================================
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';

const router = Router();

router.get('/stats', DashboardController.getStats);

export default router;
