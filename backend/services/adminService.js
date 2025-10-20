import Admin from '../models/admin.js';
import bcrypt from 'bcryptjs';

class AdminService {
  /**
   * Create a new admin account
   * @param {Object} adminData - Admin account data
   * @returns {Object} Result object with success status and admin data
   */
  static async createAdmin(adminData) {
    try {
      const { email, password, firstName, lastName } = adminData;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return {
          success: false,
          message: 'All fields (email, password, firstName, lastName) are required'
        };
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findByEmail(email);
      if (existingAdmin) {
        return {
          success: false,
          message: 'Admin with this email already exists'
        };
      }

      // Create new admin
      const admin = new Admin({
        email,
        password,
        firstName,
        lastName,
        status: 'active',
        isVerified: true
      });

      await admin.save();

      return {
        success: true,
        message: 'Admin created successfully',
        admin: {
          id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
          status: admin.status,
          permissions: admin.permissions
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error creating admin',
        error: error.message
      };
    }
  }

  /**
   * Authenticate admin login
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Object} Authentication result
   */
  static async authenticateAdmin(email, password) {
    try {
      const admin = await Admin.findByEmail(email);
      
      if (!admin) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check if account is locked
      if (admin.isLocked()) {
        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        };
      }

      // Check if account is active
      if (admin.status !== 'active') {
        return {
          success: false,
          message: 'Account is not active'
        };
      }

      // Verify password
      const isPasswordValid = await admin.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment login attempts
        await admin.incLoginAttempts();
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Reset login attempts and update last login
      await admin.updateLastLogin();

      return {
        success: true,
        message: 'Authentication successful',
        admin: {
          id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
          status: admin.status,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Authentication error',
        error: error.message
      };
    }
  }

  /**
   * Update admin permissions
   * @param {string} adminId - Admin ID
   * @param {Object} permissions - New permissions object
   * @returns {Object} Update result
   */
  static async updatePermissions(adminId, permissions) {
    try {
      const admin = await Admin.findById(adminId);
      
      if (!admin) {
        return {
          success: false,
          message: 'Admin not found'
        };
      }

      // Update permissions
      admin.permissions = { ...admin.permissions, ...permissions };
      await admin.save();

      return {
        success: true,
        message: 'Permissions updated successfully',
        admin: {
          id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
          permissions: admin.permissions
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating permissions',
        error: error.message
      };
    }
  }

  /**
   * Change admin password
   * @param {string} adminId - Admin ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Password change result
   */
  static async changePassword(adminId, currentPassword, newPassword) {
    try {
      const admin = await Admin.findById(adminId);
      
      if (!admin) {
        return {
          success: false,
          message: 'Admin not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error changing password',
        error: error.message
      };
    }
  }

  /**
   * Get all admins
   * @param {Object} options - Query options
   * @returns {Array} List of admins
   */
  static async getAllAdmins(options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      
      const query = {};
      if (status) {
        query.status = status;
      }

      const admins = await Admin.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Admin.countDocuments(query);

      return {
        success: true,
        admins,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAdmins: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error fetching admins',
        error: error.message
      };
    }
  }

  /**
   * Update admin status
   * @param {string} adminId - Admin ID
   * @param {string} status - New status (active, inactive, suspended)
   * @returns {Object} Update result
   */
  static async updateStatus(adminId, status) {
    try {
      const validStatuses = ['active', 'inactive', 'suspended'];
      
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          message: 'Invalid status. Must be one of: active, inactive, suspended'
        };
      }

      const admin = await Admin.findByIdAndUpdate(
        adminId,
        { status },
        { new: true }
      ).select('-password');

      if (!admin) {
        return {
          success: false,
          message: 'Admin not found'
        };
      }

      return {
        success: true,
        message: 'Admin status updated successfully',
        admin
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating admin status',
        error: error.message
      };
    }
  }
}

export default AdminService;