import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { CustomError } from "../utils/customErrors.js";

class UserService {
  constructor() {
    console.log("🔧 UserService initialized");
  }

  /**
   * Create a new user account
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        dateOfBirth,
        gender,
      } = userData; // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new CustomError(
          "User Registration: Email already exists",
          409,
          "DUPLICATE_EMAIL"
        );
      }

      // Validate date of birth format
      if (
        !dateOfBirth ||
        !dateOfBirth.day ||
        !dateOfBirth.month ||
        !dateOfBirth.year
      ) {
        throw new CustomError(
          "User Registration: Complete date of birth is required",
          400,
          "VALIDATION_ERROR"
        );
      }

      // Create new user instance
      const user = new User({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        dateOfBirth,
        gender,
      }); // Check if user is of legal age
      if (!user.isOfLegalAge()) {
        throw new CustomError(
          "User Registration: You must be at least 18 years old to register",
          400,
          "VALIDATION_ERROR"
        );
      }

      // Save user to database
      await user.save();

      console.log(`✅ User created successfully: ${user.email}`);
      return user;
    } catch (error) {
      console.error("❌ Error creating user:", error.message);

      if (error instanceof CustomError) {
        throw error;
      }

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        throw new CustomError(
          `User Registration: Validation failed - ${errors.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        );
      }

      throw new CustomError(
        "User Registration: Failed to create user account",
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authenticated user object
   */
  async authenticateUser(email, password) {
    try {
      if (!email || !password) {
        throw new CustomError(
          "User Authentication: Email and password are required",
          400,
          "VALIDATION_ERROR"
        );
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new CustomError(
          "User Authentication: Invalid email or password",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      // Check if user is active
      if (!user.isActive) {
        throw new CustomError(
          "User Authentication: Account is deactivated. Please contact support.",
          401,
          "UNAUTHORIZED"
        );
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new CustomError(
          "User Authentication: Invalid email or password",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      console.log(`✅ User authenticated successfully: ${user.email}`);
      return user;
    } catch (error) {
      console.error("❌ Authentication error:", error.message);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "User Authentication: Authentication failed",
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select("-password");

      if (!user) {
        throw new CustomError(
          "User Data: User not found",
          404,
          "USER_NOT_FOUND"
        );
      }

      if (!user.isActive) {
        throw new CustomError(
          "User Data: User account is not active",
          401,
          "UNAUTHORIZED"
        );
      }

      return user;
    } catch (error) {
      console.error("❌ Error fetching user by ID:", error.message);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "User Data: Failed to fetch user",
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUserProfile(userId, updateData) {
    try {
      const allowedUpdates = [
        "firstName",
        "lastName",
        "phoneNumber",
        "dateOfBirth",
        "gender",
      ];
      const updates = {};

      // Filter only allowed updates
      Object.keys(updateData).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          if (typeof updateData[key] === "string") {
            updates[key] = updateData[key].trim();
          } else {
            updates[key] = updateData[key];
          }
        }
      }); // Validate date of birth if provided
      if (updates.dateOfBirth) {
        const user = await User.findById(userId);
        if (!user) {
          throw new CustomError(
            "User Profile: User not found",
            404,
            "USER_NOT_FOUND"
          );
        }

        const tempUser = new User({
          ...user.toObject(),
          dateOfBirth: updates.dateOfBirth,
        });

        if (!tempUser.isOfLegalAge()) {
          throw new CustomError(
            "User Profile: You must be at least 18 years old",
            400,
            "VALIDATION_ERROR"
          );
        }
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!updatedUser) {
        throw new CustomError(
          "User Profile: User not found",
          404,
          "USER_NOT_FOUND"
        );
      }

      console.log(`✅ User profile updated: ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      console.error("❌ Error updating user profile:", error.message);

      if (error instanceof CustomError) {
        throw error;
      }

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        throw new CustomError(
          `User Profile: Validation failed - ${errors.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        );
      }

      throw new CustomError(
        "User Profile: Failed to update user profile",
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changeUserPassword(userId, currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new CustomError(
          "Password Change: Current password and new password are required",
          400,
          "VALIDATION_ERROR"
        );
      }

      if (currentPassword === newPassword) {
        throw new CustomError(
          "Password Change: New password must be different from current password",
          400,
          "VALIDATION_ERROR"
        );
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new CustomError(
          "Password Change: User not found",
          404,
          "USER_NOT_FOUND"
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new CustomError(
          "Password Change: Current password is incorrect",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      // Update password
      user.password = newPassword;
      await user.save();

      console.log(`✅ Password changed for user: ${user.email}`);
      return true;
    } catch (error) {
      console.error("❌ Error changing password:", error.message);

      if (error instanceof CustomError) {
        throw error;
      }

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        throw new CustomError(
          `Password Change: Password validation failed - ${errors.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        );
      }

      throw new CustomError(
        "Password Change: Failed to change password",
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deactivateUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw new CustomError(
          "Account Deactivation: User not found",
          404,
          "USER_NOT_FOUND"
        );
      }

      console.log(`✅ User account deactivated: ${user.email}`);
      return true;
    } catch (error) {
      console.error("❌ Error deactivating user:", error.message);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Account Deactivation: Failed to deactivate user account",
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Get all users with pagination (Admin only)
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Users list with pagination info
   */
  async getAllUsers(options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find({})
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const totalUsers = await User.countDocuments();

      const result = {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPrevPage: page > 1,
        },
      };
      console.log(`✅ Retrieved ${users.length} users (page ${page})`);
      return result;
    } catch (error) {
      console.error("❌ Error fetching all users:", error.message);
      throw new CustomError(
        "User Management: Failed to fetch users",
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Search users by criteria
   * @param {Object} searchCriteria - Search parameters
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(searchCriteria) {
    try {
      const { email, name, isActive } = searchCriteria;
      const query = {};

      if (email) {
        query.email = { $regex: email, $options: "i" };
      }

      if (name) {
        query.$or = [
          { firstName: { $regex: name, $options: "i" } },
          { lastName: { $regex: name, $options: "i" } },
        ];
      }

      if (typeof isActive === "boolean") {
        query.isActive = isActive;
      }

      const users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(50); // Limit search results      console.log(`✅ Found ${users.length} users matching search criteria`);
      return users;
    } catch (error) {
      console.error("❌ Error searching users:", error.message);
      throw new CustomError(
        "User Search: Failed to search users",
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });
      const adminUsers = await User.countDocuments({ role: "admin" });

      // Get users registered in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      });

      const stats = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
        recentUsers,
        percentageActive:
          totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0,
      };
      console.log("✅ User statistics retrieved successfully");
      return stats;
    } catch (error) {
      console.error("❌ Error fetching user statistics:", error.message);
      throw new CustomError(
        "User Statistics: Failed to fetch user statistics",
        500,
        "INTERNAL_ERROR"
      );
    }
  }
}

export default new UserService();
