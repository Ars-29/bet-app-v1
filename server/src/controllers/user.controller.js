import User from "../models/User.js";
import UserService from "../services/UserService.js";

// @desc    Get user profile by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    // Use UserService to get user by ID
    const user = await UserService.getUserById(req.params.id);

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    
    // Handle custom errors from UserService
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    // Use UserService to update user profile
    const user = await UserService.updateUserProfile(req.user._id, req.body);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    // Handle custom errors from UserService
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Use UserService to change password
    await UserService.changeUserPassword(req.user._id, currentPassword, newPassword);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    // Handle custom errors from UserService
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Deactivate user account
// @route   PUT /api/users/deactivate
// @access  Private
export const deactivateAccount = async (req, res) => {
  try {
    // Use UserService to deactivate user
    await UserService.deactivateUser(req.user._id);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    
    // Handle custom errors from UserService
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    // Use UserService to get all users with pagination
    const result = await UserService.getAllUsers({
      page: req.query.page,
      limit: req.query.limit
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    
    // Handle custom errors from UserService
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Search users (Admin only)
// @route   GET /api/users/search
// @access  Private/Admin
export const searchUsers = async (req, res) => {
  try {
    const { email, name, isActive } = req.query;
    
    const searchCriteria = {};
    if (email) searchCriteria.email = email;
    if (name) searchCriteria.name = name;
    if (isActive !== undefined) searchCriteria.isActive = isActive === 'true';

    // Use UserService to search users
    const users = await UserService.searchUsers(searchCriteria);

    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error("Search users error:", error);
    
    // Handle custom errors from UserService
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = async (req, res) => {
  try {
    // Use UserService to get user statistics
    const stats = await UserService.getUserStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    
    // Handle custom errors from UserService
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
