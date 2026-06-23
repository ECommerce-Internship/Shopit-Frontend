import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { authStore } from '../context/authStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header if an access token exists.
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = authStore.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

// Response interceptor: on 401, attempt a token refresh and retry the original request.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      skipAuthRefresh?: boolean;
    };

    // Some requests (e.g. change-password) treat a 401 as a domain error
    // ("wrong current password"), NOT an expired session — they opt out here.
    if (originalRequest?.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    const refreshToken = authStore.getRefreshToken();
    if (!refreshToken) {
      authStore.triggerLogout();
      return Promise.reject(error);
    }
    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes.
      return new Promise((resolve, reject) => {
        pendingRequests.push(() => {
          axiosInstance(originalRequest).then(resolve).catch(reject);
        });
      });
    }
    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh-token`,
        { refreshToken }
      );
      const newAccessToken: string = response.data.accessToken;
      const newRefreshToken: string = response.data.refreshToken ?? refreshToken;
      authStore.setTokens(newAccessToken, newRefreshToken);
      pendingRequests.forEach((retry) => retry());
      pendingRequests = [];
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      pendingRequests = [];
      authStore.triggerLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;