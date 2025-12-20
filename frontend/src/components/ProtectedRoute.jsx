import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, refreshAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  if (loading) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
