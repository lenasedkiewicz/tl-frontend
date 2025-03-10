import React, { useState } from "react";
import { AuthContext, AuthContextType, User } from "../context/AuthContext";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | undefined>(undefined);

  const login = (username: string, password: string) => {
    if (username === "admin" && password === "admin") {
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;

      setIsAuthenticated(true);
      setUser({
        id: userId,
        username: username,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(undefined);
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
