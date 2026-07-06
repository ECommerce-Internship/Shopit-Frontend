type LogoutHandler = () => void;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let logoutHandler: LogoutHandler | null = null;

export const authStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (newAccessToken: string | null, newRefreshToken: string | null) => {
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
  },
  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
  },
  registerLogoutHandler: (handler: LogoutHandler) => {
    logoutHandler = handler;
  },
  triggerLogout: () => {
    logoutHandler?.();
  },
};