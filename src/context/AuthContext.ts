import React from 'react';

export interface User {
  id: string;
  username: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user?: User;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType>({
  isAuthenticated: false,
  user: undefined,
  login: () => false,
  logout: () => { }
});