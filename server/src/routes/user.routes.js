import express from "express";
import {
  getUserById,
  updateProfile,
  changePassword,
  deactivateAccount,
  getAllUsers,
  searchUsers,
  getUserStats,
} from "../controllers/user.controller.js";
import { authenticateToken, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

// All routes are protected - require authentication
router.use(authenticateToken);

// User profile routes
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.put("/deactivate", deactivateAccount);

// Admin only routes
router.get("/search", requireAdmin, searchUsers);
router.get("/stats", requireAdmin, getUserStats);
router.get("/", requireAdmin, getAllUsers);
router.get("/:id", requireAdmin, getUserById);

export default router;
