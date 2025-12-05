// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = sessionStorage.getItem("sessionToken") || sessionStorage.getItem("accessToken");
  
  console.log('ProtectedRoute debug - token exists:', !!token);
  console.log('ProtectedRoute debug - sessionToken:', sessionStorage.getItem("sessionToken"));
  console.log('ProtectedRoute debug - accessToken:', sessionStorage.getItem("accessToken"));
  
  if (!token) {
    console.log('ProtectedRoute: No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    
    console.log('ProtectedRoute debug - decoded token:', decodedToken);
    
    // Handle different role formats from different authentication systems
    const userRole = decodedToken.role || decodedToken.userType;
    
    console.log(`ProtectedRoute: Expected role: ${role}, User role: ${userRole}`);
    
    // Normalize roles to lowercase for comparison (except Admin)
    let normalizedUserRole = userRole;
    let normalizedExpectedRole = role;
    
    // Special handling for admin role which should remain "Admin"
    if (role !== "Admin") {
      normalizedUserRole = userRole?.toLowerCase();
      normalizedExpectedRole = role?.toLowerCase();
    }
    
    console.log(`ProtectedRoute: Normalized - Expected: ${normalizedExpectedRole}, User: ${normalizedUserRole}`);
    
    // Check if roles match
    if (normalizedUserRole === normalizedExpectedRole) {
      console.log('ProtectedRoute: Role match successful, allowing access');
      return children;
    }
    
    // If no role match, redirect to login
    console.warn(`Role mismatch: expected ${role}, got ${userRole}`);
    return <Navigate to="/login" replace />;
    
  } catch (err) {
    console.error("Invalid token:", err);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
