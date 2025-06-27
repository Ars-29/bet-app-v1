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
  getMatchById,
  getMatchesByLeague,
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
fixturesRouter.get("/:matchId", getMatchById);

// Add new route for matches by league
fixturesRouter.get("/league/:leagueId/matches", getMatchesByLeague);

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
