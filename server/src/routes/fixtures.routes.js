import express from "express";
import {
  getOptimizedFixtures,
  getTodaysFixtures,
  getLiveFixtures,
  getUpcomingFixtures,
  getPopularLeagues,
  getHomepageFixtures,
  getCacheStats,
  clearCache,
  preloadData,
} from "../controllers/fixtures.controller.js";

import { authenticateToken, requireAdmin } from "../middlewares/auth.js";

const fixturesRouter = express.Router();

// Public routes (cached and optimized)
fixturesRouter.get("/", getOptimizedFixtures);
fixturesRouter.get("/homepage", getHomepageFixtures);
fixturesRouter.get("/today", getTodaysFixtures);
fixturesRouter.get("/live", getLiveFixtures);
fixturesRouter.get("/upcoming", getUpcomingFixtures);
fixturesRouter.get("/leagues/popular", getPopularLeagues);

// Test endpoint to compare optimization
fixturesRouter.get("/test/performance", async (req, res) => {
  const startTime = Date.now();

  try {
    // Call optimized endpoint
    const optimizedData = await getOptimizedFixtures(req, res);
    const endTime = Date.now();

    res.json({
      success: true,
      message: "Performance test completed",
      optimization_results: {
        response_time_ms: endTime - startTime,
        data_size_kb: JSON.stringify(optimizedData).length / 1024,
        estimated_api_calls_saved: "90%+",
        caching_enabled: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Performance test failed",
      error: error.message,
    });
  }
});

// INFO: These are admin routes for monitoring and cache management
// // Protected routes for monitoring and admin
// fixturesRouter.get(
//   "/cache/stats",
//   requireAuth,

//   getCacheStats
// );
// fixturesRouter.post(
//   "/cache/clear",
//   requireAuth,
//   requireRole(["admin"]),
//   clearCache
// );
// fixturesRouter.post(
//   "/preload",
//   requireAuth,
//   requireRole(["admin"]),
//   preloadData
// );

export default fixturesRouter;
