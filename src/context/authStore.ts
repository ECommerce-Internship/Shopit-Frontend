type LogoutHandler = () => void;

// Persisted so a full page refresh keeps the session alive. axiosInstance reads
// tokens from here on every request, and the 401 refresh-rotation flow writes the
// rotated tokens back here — persisting means both survive a reload.
const ACCESS_KEY = 'shopit.accessToken';
const REFRESH_KEY = 'shopit.refreshToken';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Storage unavailable (private mode / disabled) — degrade to in-memory only.
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Ignore — falls back to the in-memory copy below.
  }
}

// Seed the in-memory copy from storage at module load so the very first request
// (and the initial React render) already sees an existing session.
let accessToken: string | null = readStorage(ACCESS_KEY);
let refreshToken: string | null = readStorage(REFRESH_KEY);
let logoutHandler: LogoutHandler | null = null;

export const authStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (newAccessToken: string | null, newRefreshToken: string | null) => {
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
    writeStorage(ACCESS_KEY, newAccessToken);
    writeStorage(REFRESH_KEY, newRefreshToken);
  },
  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
    writeStorage(ACCESS_KEY, null);
    writeStorage(REFRESH_KEY, null);
  },
  registerLogoutHandler: (handler: LogoutHandler) => {
    logoutHandler = handler;
  },
  triggerLogout: () => {
    logoutHandler?.();
  },
};
