import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import "../App.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [stats, setStats] = useState(null);

  const { getAuthHeader, user } = useAuth();

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", {
        headers: getAuthHeader(),
      });

      if (response.status === 403) {
        throw new Error("Access denied. Admin only.");
      }

      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/users/stats", {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update role");
      }

      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      loadStats();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <h3>Access Denied</h3>
          <p>{error}</p>
          <p>Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage user roles and permissions</p>
      </div>

      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Admins</h3>
            <p className="stat-number">{stats.adminCount}</p>
            <small>{stats.adminPercentage}% of total</small>
          </div>
          <div className="stat-card">
            <h3>Regular Users</h3>
            <p className="stat-number">{stats.userCount}</p>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userItem) => (
              <tr
                key={userItem.id}
                className={userItem.id === user?.id ? "current-user" : ""}
              >
                <td>
                  <div className="user-info-cell">
                    <div className="user-avatar">
                      {userItem.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="user-details">
                      <strong>{userItem.name}</strong>
                      {userItem.id === user?.id && (
                        <span className="you-badge">(you)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>{userItem.email}</td>
                <td>
                  <span className={`role-badge ${userItem.role}`}>
                    {userItem.role}
                  </span>
                </td>
                <td>{formatDate(userItem.createdAt)}</td>
                <td>
                  {userItem.id !== user?.id ? (
                    <div className="role-actions">
                      <select
                        value={userItem.role}
                        onChange={(e) =>
                          handleRoleChange(userItem.id, e.target.value)
                        }
                        disabled={updatingUserId === userItem.id}
                        className="role-select"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {updatingUserId === userItem.id && (
                        <span className="updating-indicator">Updating...</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">
                      Cannot change your own role
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="empty-state">
          <p>No users found.</p>
        </div>
      )}
    </div>
  );
}
