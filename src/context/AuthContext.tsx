import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axiosInstance from '../api/axiosInstance';
import { authStore } from './authStore';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type AuthContextType = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  login: (data: LoginResponse) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (data: LoginResponse) => {
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    authStore.setTokens(data.accessToken, data.refreshToken);
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/api/v1/auth/logout');
    } catch {
      // Ignore errors on logout - local state is cleared regardless.
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      authStore.clearTokens();
    }
  };

  useEffect(() => {
    // Called by the Axios response interceptor when a token refresh fails.
    authStore.registerLogoutHandler(() => {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      authStore.clearTokens();
      window.location.href = '/login';
    });
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}