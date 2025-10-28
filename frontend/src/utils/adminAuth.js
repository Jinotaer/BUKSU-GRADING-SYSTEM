// Admin Authentication Utility
class AdminAuth {
  constructor() {
    this.baseURL = "http://localhost:5000/api/admin";
    this.refreshPromise = null;
  }

  // Get access token from localStorage
  getAccessToken() {
    return localStorage.getItem("admin_access_token");
  }

  // Get refresh token from localStorage
  getRefreshToken() {
    return localStorage.getItem("admin_refresh_token");
  }

  // Set tokens in localStorage
  setTokens(accessToken, refreshToken) {
    localStorage.setItem("admin_access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("admin_refresh_token", refreshToken);
    }
  }

  // Clear tokens from localStorage
  clearTokens() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getAccessToken();
  }

  // Get admin user data
  getAdminUser() {
    const userData = localStorage.getItem("admin_user");
    return userData ? JSON.parse(userData) : null;
  }

  // Set admin user data
  setAdminUser(user) {
    localStorage.setItem("admin_user", JSON.stringify(user));
  }

  // Refresh access token
  async refreshAccessToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      throw new Error("No refresh token available");
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  async performTokenRefresh(refreshToken) {
    try {
      const response = await fetch(`${this.baseURL}/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      if (data.success && data.accessToken) {
        this.setTokens(data.accessToken, refreshToken);
        return data.accessToken;
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      this.logout();
      throw error;
    }
  }

  // Enhanced API call with automatic token refresh
  async apiCall(url, options = {}) {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      throw new Error("No access token available");
    }

    // Add authorization header
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    };

    // Make the API call
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh and retry the request
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));

      if (
        errorData.code === "TOKEN_EXPIRED" ||
        errorData.message?.includes("expired")
      ) {
        try {
          console.log("Token expired, attempting to refresh...");
          const newAccessToken = await this.refreshAccessToken();

          // Retry the original request with new token
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          return retryResponse;
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          this.logout();
          window.location.href = "/admin/login";
          throw refreshError;
        }
      }
    }

    return response;
  }

  // Login method
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens and user data
        this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
        this.setAdminUser(data.admin);
        return data;
      } else {
        // Create error with response data for better error handling
        const error = new Error(data.message || "Login failed");
        error.response = {
          status: response.status,
          message: data.message,
          remainingAttempts: data.remainingAttempts,
          locked: data.locked,
          timeUntilUnlock: data.timeUntilUnlock,
          failedAttempts: data.failedAttempts,
        };
        throw error;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Logout method
  logout() {
    this.clearTokens();
    // Redirect to login page
    window.location.href = "/admin/login";
  }

  // Get admin profile
  async getProfile() {
    try {
      const response = await this.apiCall(`${this.baseURL}/profile`);
      const data = await response.json();

      if (data.success) {
        this.setAdminUser(data.admin);
        return data.admin;
      } else {
        throw new Error(data.message || "Failed to get profile");
      }
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  // Get dashboard stats
  async getDashboardStats() {
    try {
      const response = await this.apiCall(`${this.baseURL}/dashboard/stats`);
      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || "Failed to get dashboard stats");
      }
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      throw error;
    }
  }

  // Get all students
  async getStudents(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${this.baseURL}/students${
        queryParams ? `?${queryParams}` : ""
      }`;

      const response = await this.apiCall(url);
      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || "Failed to get students");
      }
    } catch (error) {
      console.error("Get students error:", error);
      throw error;
    }
  }

  // Update student status
  async updateStudentStatus(studentId, status, reason = "") {
    try {
      const response = await this.apiCall(
        `${this.baseURL}/students/${studentId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status, reason }),
        }
      );

      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || "Failed to update student status");
      }
    } catch (error) {
      console.error("Update student status error:", error);
      throw error;
    }
  }

  // Get all instructors
  async getInstructors(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${this.baseURL}/instructors${
        queryParams ? `?${queryParams}` : ""
      }`;

      const response = await this.apiCall(url);
      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || "Failed to get instructors");
      }
    } catch (error) {
      console.error("Get instructors error:", error);
      throw error;
    }
  }

  // Invite instructor
  async inviteInstructor(instructorData) {
    try {
      const response = await this.apiCall(
        `${this.baseURL}/instructors/invite`,
        {
          method: "POST",
          body: JSON.stringify(instructorData),
        }
      );

      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || "Failed to invite instructor");
      }
    } catch (error) {
      console.error("Invite instructor error:", error);
      throw error;
    }
  }

  // Request password reset code
  async requestResetCode(email) {
    try {
      const response = await fetch(`${this.baseURL}/request-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to request reset code");
      }

      return data;
    } catch (error) {
      console.error("Request reset code error:", error);
      throw error;
    }
  }

  async resetPassword(passcode, newPassword) {
    try {
      const response = await fetch(`${this.baseURL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      return data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  // Verify reset passcode
  async verifyResetCode(passcode) {
    try {
      const response = await fetch(`${this.baseURL}/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify reset code");
      }

      return data;
    } catch (error) {
      console.error("Verify reset code error:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const adminAuth = new AdminAuth();
export default adminAuth;

// Export authenticatedFetch for backward compatibility
export const authenticatedFetch = adminAuth.apiCall.bind(adminAuth);

