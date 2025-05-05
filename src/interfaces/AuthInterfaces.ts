export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface User {
  id: string;
  username: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user?: User;
  token?: string;
  login: (token: string, userData: User) => void;
  logout: () => void;
}