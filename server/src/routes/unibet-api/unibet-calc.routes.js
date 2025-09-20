// Unibet Calculator Processing Routes
// Admin-only endpoints for processing bets using unibet-api calculator

import express from 'express';
import { UnibetCalcController } from '../../controllers/unibetCalc.controller.js';
import { authenticateToken, requireAdmin } from '../../middlewares/auth.js';

const router = express.Router();
const unibetCalcController = new UnibetCalcController();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Processing endpoints
router.post('/process', unibetCalcController.processAll);
router.post('/process/:betId', unibetCalcController.processOne);
router.post('/process/:betId/match/:matchId', unibetCalcController.processWithMatch);

// Status endpoint
router.get('/status', unibetCalcController.getProcessingStatus);

export default router;
