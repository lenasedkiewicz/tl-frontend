import React, { createContext, useState, useEffect } from "react";
import {
  AuthContextType,
  AuthProviderProps,
  User,
} from "../interfaces/AuthInterfaces";

const defaultContext: AuthContextType = {
  isAuthenticated: false,
  user: undefined,
  token: undefined,
  login: () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);

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

  const login = (newToken: string, userData: User): void => {
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("authUser", JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");

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
