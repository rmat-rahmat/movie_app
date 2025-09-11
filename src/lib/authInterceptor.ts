import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { loadTokenFromStorage, loadRefreshTokenFromStorage, setAuthHeader, clearAllTokensFromStorage, refreshToken } from './authAPI';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth header
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = loadTokenFromStorage();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if the error is due to an expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axios(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshTokenValue = loadRefreshTokenFromStorage();
      console.log('Attempting token refresh with refresh token:', refreshTokenValue);
      
      if (!refreshTokenValue) {
        // No refresh token available, redirect to login
        processQueue(error, null);
        clearAllTokensFromStorage();
        setAuthHeader(null);
        
        // Redirect to login page if we're in the browser
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(error);
      }

      try {
        const response = await refreshToken();
        const newToken = response.token;
        
        setAuthHeader(newToken);
        processQueue(null, newToken);
        
        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAllTokensFromStorage();
        setAuthHeader(null);
        
        // Redirect to login page if we're in the browser
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Export a function to initialize the interceptor
export const initializeAuthInterceptor = () => {
  // This function can be called during app initialization
  // The interceptors are already set up above
  console.log('Auth interceptor initialized');

};

export default { initializeAuthInterceptor };
