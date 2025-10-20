// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = sessionStorage.getItem("sessionToken") || sessionStorage.getItem("accessToken");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    
    // Handle different role formats from different authentication systems
    const userRole = decodedToken.role || decodedToken.userType;
    
    // Check role compatibility - be flexible with role matching
    if (role === "Admin" && userRole === "Admin") {
      return children;
    }
    
    if (role === "student" && userRole === "student") {
      return children;
    }
    
    if (role === "instructor" && userRole === "instructor") {
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
