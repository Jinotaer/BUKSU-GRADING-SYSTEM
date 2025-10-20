import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isTokenExpired, getAccessToken, clearTokens } from "../utils/auth";

export default function AdminProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAccessToken();
      
      if (!token) {
        setIsAuth(false);
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        clearTokens();
        setIsAuth(false);
        setIsLoading(false);
        return;
      }

      setIsAuth(true);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-buksu-primary"></div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}