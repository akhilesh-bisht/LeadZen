/**
 * ============================================================================
 * ROUTE: exportRoutes
 * ============================================================================
 * Defines REST endpoints for exporting lead records:
 *   GET    /api/export  -> Streams a formatted Excel (.xlsx) file
 * ============================================================================
 */

import { Router } from 'express';
import { ExportController } from '../controllers/exportController.js';

const router = Router();

router.get('/', ExportController.exportLeads);

export default router;
