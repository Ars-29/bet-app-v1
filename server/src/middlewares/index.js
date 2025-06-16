// Middleware exports - now using centralized error handling
export {
  notFoundHandler as notFound,
  errorHandler,
  asyncHandler,
} from "../utils/customErrors.js";

// Auth middleware exports
export { authenticateToken, requireAdmin, optionalAuth } from "./auth.js";
