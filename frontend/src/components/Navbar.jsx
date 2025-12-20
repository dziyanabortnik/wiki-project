import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

const Navbar = () => {
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

            <div className="user-info">
              <div className="user-avatar">
                {getUserInitials(user?.name || "User")}
              </div>
              <span>{user?.name || "User"}</span>
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
};

export default Navbar;
