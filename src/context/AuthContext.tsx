import React, { createContext, useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  // Add other user properties here
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user?: User;
  token?: string;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

// Create context with default values
const defaultContext: AuthContextType = {
  isAuthenticated: false,
  user: undefined,
  token: undefined,
  login: () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);

  // Check for stored auth on initial load
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
        // Clear invalid stored data
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      }
    }
  }, []);

  const login = (newToken: string, userData: User): void => {
    // Store authentication data
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("authUser", JSON.stringify(userData));

    // Update state
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = (): void => {
    // Clear stored auth data
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");

    // Reset state
    setToken(undefined);
    setUser(undefined);
    setIsAuthenticated(false);
  };

  const contextValue = {
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
