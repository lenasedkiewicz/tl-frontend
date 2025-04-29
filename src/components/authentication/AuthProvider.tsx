import React, { useState, useEffect } from "react";
import { AuthContext, AuthContextType, User } from "../context/AuthContext";

interface AuthProviderProps {
  children: React.ReactNode;
}

// Example login endpoint URL
const LOGIN_ENDPOINT = "https://localhost:5000"; // Replace with your real API

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  console.log("dupa");
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error restoring auth state:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      }
    }
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        console.error("Login failed: ", response.statusText);
        return false;
      }

      const data = await response.json();
      // Assuming the API returns { token: string, user: { id: string, username: string } }
      const { token: newToken, user: userData } = data;

      localStorage.setItem("authToken", newToken);
      localStorage.setItem("authUser", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  };

  const logout = (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");

    setToken(undefined);
    setUser(undefined);
    setIsAuthenticated(false);
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
