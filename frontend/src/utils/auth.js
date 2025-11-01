// Authentication utility functions
const API_BASE_URL = "http://localhost:5000";

/**
 * Get token from sessionStorage
 */
export const getAccessToken = () => {
  // Check for both possible token keys for backward compatibility
  return sessionStorage.getItem("accessToken") || sessionStorage.getItem("sessionToken");
};

/**
 * Get refresh token from sessionStorage
 */
export const getRefreshToken = () => {
  return sessionStorage.getItem("refreshToken");
};

/**
 * Save tokens to sessionStorage
 */
export const saveTokens = (accessToken, refreshToken) => {
  sessionStorage.setItem("accessToken", accessToken);
  if (refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
  }
};

/**
 * Clear tokens from sessionStorage
 */
export const clearTokens = () => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    if (data.success && data.accessToken) {
      saveTokens(data.accessToken, refreshToken);
      return data.accessToken;
    } else {
      throw new Error("Invalid refresh token response");
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearTokens();
    throw error;
  }
};

/**
 * Make authenticated API request with automatic token refresh
 */
export const authenticatedFetch = async (url, options = {}) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error("No access token available");
  }

  // Add Authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    // Make the initial request
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token is expired, try to refresh it
    if (response.status === 401) {
      const errorData = await response.json();
      
      // Check if it's specifically a token expiration error
      if (errorData.message === "Token is not valid" || errorData.message?.includes("expired")) {
        try {
          const newAccessToken = await refreshAccessToken();
          
          // Retry the request with the new token
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        } catch {
          // If refresh fails, redirect to login
          clearTokens();
          window.location.href = "/login";
          throw new Error("Session expired. Please login again.");
        }
      }
    }

    return response;
  } catch (error) {
    // Don't log AbortError (happens when component unmounts during fetch)
    if (error.name !== 'AbortError') {
      console.error("Authenticated fetch error:", error);
    }
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = () => {
  clearTokens();
  window.location.href = "/login";
};

/**
 * Decode JWT token (without verification)
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Get user info from token
 */
export const getUserFromToken = () => {
  const token = getAccessToken();
  if (!token) return null;
  
  return decodeToken(token);
};