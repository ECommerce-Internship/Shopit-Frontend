import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axiosInstance from '../api/axiosInstance';
import { authStore } from './authStore';
import { decodeJwt } from '../utils/jwt';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  storeIds: string[];
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
};

type AuthContextType = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  login: (data: LoginResponse) => AuthUser;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The resolved user is persisted alongside the tokens so a refresh can restore
// the exact account (name, role, storeIds) without a round-trip.
const USER_KEY = 'shopit.user';

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  try {
    if (user === null) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage unavailable — session simply won't survive a refresh.
  }
}

function buildAuthUser(data: LoginResponse): AuthUser {
  let role = data.user.role ?? 'Customer';
  let storeIds: string[] = [];

  try {
    const claims = decodeJwt<Record<string, unknown>>(data.accessToken);
    role = (claims[ROLE_CLAIM] as string) ?? role;
    storeIds = (claims['storeIds'] as string[]) ?? [];
  } catch {
    // If decoding fails for any reason, fall back to the plain response fields.
  }

  return {
    id: data.user.id,
    email: data.user.email,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    role,
    storeIds,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Rehydrate synchronously from storage so the first render already reflects the
  // session — route guards see the token immediately, avoiding a redirect to /login.
  const [accessToken, setAccessToken] = useState<string | null>(() => authStore.getAccessToken());
  const [refreshToken, setRefreshToken] = useState<string | null>(() => authStore.getRefreshToken());
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const login = (data: LoginResponse) => {
    const authUser = buildAuthUser(data);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(authUser);
    authStore.setTokens(data.accessToken, data.refreshToken);
    writeStoredUser(authUser);
    return authUser;
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
      writeStoredUser(null);
    }
  };

  useEffect(() => {
    authStore.registerLogoutHandler(() => {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      authStore.clearTokens();
      writeStoredUser(null);
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

export function getRedirectPathForRole(role: string): string {
  switch (role) {
    case 'Admin':
      return '/admin';
    case 'Seller':
      return '/seller';
    default:
      return '/products';
  }
}