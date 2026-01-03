import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

export default function Navbar() {
  const { user, logout, isAuthenticated, loading, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    refreshAuth();
  }, [location.pathname, refreshAuth]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          Wiki App
        </Link>
        <div className="navbar-nav">
          <span>Loading...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Wiki App
      </Link>
      <div className="navbar-nav">
        {isAuthenticated ? (
          <>
            <Link to="/" className="nav-link">
              Articles
            </Link>
            <Link to="/new" className="nav-link">
              New Article
            </Link>

            {user?.role === "admin" && (
              <Link to="/admin/users" className="nav-link">
                User Management
              </Link>
            )}

            <div className="user-info">
              <div className="user-avatar">
                {getUserInitials(user?.name || "User")}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.name || "User"}</span>
                {user?.role === "admin" && (
                  <span className="user-role admin-badge">Admin</span>
                )}
              </div>
              <button onClick={handleLogout} className="nav-link logout">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/register" className="nav-link">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
