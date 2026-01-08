import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, refreshAuth, isAdmin } = useAuth();
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

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="container">
        <div className="error-message">
          <h3>Access Denied</h3>
          <p>This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return children;
}
