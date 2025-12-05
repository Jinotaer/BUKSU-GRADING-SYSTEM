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
 * Make authenticated API request
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
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If token is expired or invalid, redirect to login
    if (response.status === 401) {
      clearTokens();
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
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