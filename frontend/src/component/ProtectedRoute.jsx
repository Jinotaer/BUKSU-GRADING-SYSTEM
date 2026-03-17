// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const location = useLocation();

  const sessionToken =
    sessionStorage.getItem("sessionToken") ||
    sessionStorage.getItem("accessToken");
  const adminLocalToken = localStorage.getItem("admin_access_token");
  const token = role === "Admin" ? sessionToken || adminLocalToken : sessionToken;

  //D073-2
  const loginPath = role === "Admin" ? "/admin/admin-login" : "/login";

  if (!token) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));

    // Handle different role formats from different authentication systems
    const userRole = decodedToken.role || decodedToken.userType;
    const normalizedUserRole = userRole?.toLowerCase();
    const normalizedExpectedRole = role?.toLowerCase();

    // Check if roles match
    if (normalizedUserRole === normalizedExpectedRole) {
      return children;
    }

    // If no role match, redirect to login
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  } catch (err) {
    console.error("Invalid token:", err);
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
};

export default ProtectedRoute;
