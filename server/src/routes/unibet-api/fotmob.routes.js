// FotMob Cache Management Routes
// Admin-only endpoints for managing FotMob caches

import express from 'express';
import { FotmobController } from '../../controllers/fotmob.controller.js';
import { authenticateToken, requireAdmin } from '../../middlewares/auth.js';

const router = express.Router();
const fotmobController = new FotmobController();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Cache management endpoints
router.post('/clear-cache', fotmobController.clearCache);
router.post('/refresh-cache/:date', fotmobController.refreshCache);
router.post('/refresh-cache', fotmobController.refreshCache);
router.post('/refresh-multiday-cache', fotmobController.refreshMultidayCache);

// Cache information endpoints
router.get('/cache-content', fotmobController.getCacheContent);
router.get('/cache-analysis', fotmobController.getCacheAnalysis);
router.get('/cache-stats', fotmobController.getCacheStats);

// Auto-refresh endpoints
router.post('/trigger-auto-refresh', fotmobController.triggerAutoRefresh);
router.get('/auto-refresh-status', fotmobController.getAutoRefreshStatus);

// Test endpoint
router.get('/test-fotmob/:date', fotmobController.testFotmob);
router.get('/test-fotmob', fotmobController.testFotmob);

export default router;
