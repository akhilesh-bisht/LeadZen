/**
 * ============================================================================
 * ROUTE: teamRoutes
 * ============================================================================
 * Defines REST endpoints for sales team roster & representative operations:
 *   GET    /api/team      -> Fetch team roster & active reps
 *   POST   /api/team      -> Add a new sales team member
 *   DELETE /api/team/:id  -> Remove a team member
 * ============================================================================
 */

import { Router } from 'express';
import { TeamController } from '../controllers/teamController.js';

const router = Router();

router.get('/', TeamController.getMembers);
router.post('/', TeamController.addMember);
router.delete('/:id', TeamController.deleteMember);

export default router;
