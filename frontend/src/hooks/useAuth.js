import { useState, useEffect, useCallback } from "react";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  const setAuthToken = useCallback((token) => {
    localStorage.setItem("token", token);
  }, []);

  const removeAuthToken = useCallback(() => {
    localStorage.removeItem("token");
  }, []);

  const isTokenExpired = useCallback((token) => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, []);

  const getUserFromToken = useCallback((token) => {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
      };
    } catch {
      return null;
    }
  }, []);

  const checkAuthStatus = useCallback(() => {
    const token = getAuthToken();

    if (token && !isTokenExpired(token)) {
      const userData = getUserFromToken(token);

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        removeAuthToken();
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, [getAuthToken, isTokenExpired, getUserFromToken, removeAuthToken]);

  useEffect(() => {
    checkAuthStatus();
    setLoading(false);
  }, [checkAuthStatus]);

  const login = useCallback(
    async (email, password) => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          setAuthToken(data.token);
          const userData = getUserFromToken(data.token);
          setUser(userData);
          setIsAuthenticated(true);
          return { success: true, data };
        } else {
          return { success: false, error: data.message || "Login failed" };
        }
      } catch (error) {
        return { success: false, error: "Network error" };
      }
    },
    [setAuthToken, getUserFromToken]
  );

  const register = useCallback(
    async (name, email, password) => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          setAuthToken(data.token);
          const userData = getUserFromToken(data.token);
          setUser(userData);
          setIsAuthenticated(true);
          return { success: true, data };
        } else {
          return {
            success: false,
            error: data.message || "Registration failed",
          };
        }
      } catch (error) {
        return { success: false, error: "Network error" };
      }
    },
    [setAuthToken, getUserFromToken]
  );

  const logout = useCallback(() => {
    removeAuthToken();
    setUser(null);
    setIsAuthenticated(false);
  }, [removeAuthToken]);

  const getAuthHeader = useCallback(() => {
    const token = getAuthToken();

    if (token && !isTokenExpired(token)) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, [getAuthToken, isTokenExpired]);

  const refreshAuth = useCallback(() => {
    return checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    user,
    loading,
    login,
    register,
    logout,
    getAuthHeader,
    refreshAuth,
    isAuthenticated,
    checkAuth: checkAuthStatus,
    getToken: getAuthToken,
  };
};
