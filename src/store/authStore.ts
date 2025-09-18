import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  isLogin as apiIsLogin,
  updateUserInfo as apiUpdateUserInfo,
  changePassword as apiChangePassword,
  sendEmailCaptcha as apiSendEmailCaptcha,
  refreshToken as apiRefreshToken,
  setAuthHeader as setAuthHeader,
  restoreAuthFromStorage as restoreAuthFromStorage,
} from '@/lib/authAPI';

type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  nickname?: string;
  gender?: number;
  birthday?: string;
  [key: string]: unknown
};

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string, form?: boolean) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    deviceId: string;
    emailCaptcha: string;
    phone?: string;
    avatar?: string;
    nickname?: string;
    gender?: number;
    birthday?: string;
  }, form?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: (retryCount?: number) => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  sendEmailVerification: (email: string) => Promise<string>;
  updateProfile: (payload: {
    phone?: string;
    avatar?: string;
    nickname?: string;
    gender?: number;
    birthday?: string;
  }, form?: boolean) => Promise<void>;
  changePassword: (payload: {
    oldPassword: string;
    password: string;
  }, form?: boolean) => Promise<string>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Helper function to wrap API calls with token refresh logic
export const withTokenRefresh = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall();
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } } | undefined;
    if (error?.response?.status === 401) {
      try {
        await useAuthStore.getState().refreshAuthToken();
        return await apiCall();
      } catch (refreshErr: unknown) {
        throw refreshErr;
      }
    }
    throw err;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Example usage in existing actions
      login: async (email: string, password: string, form = false) => {
        set({ isLoading: true, error: null });
        const response = await apiLogin(email, password, form);
        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      register: async (payload, form = false) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiRegister(payload, form);
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await apiLogout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        console.log("checkAuth called");
        try {
          set({ isLoading: true });
          // Use API helper that restores headers if needed
          const response = await apiIsLogin();
          if (response) {
            set({
              user: response.user,
              token: response.token,
              refreshToken: response.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            console.log('[authStore] state after checkAuth (logged in)');
          } else {
            console.log('[authStore] checkAuth failed, attempting token refresh');
            await get().refreshAuthToken();
            const retryResponse = await apiIsLogin(); // Retry the authentication check after refreshing the token
            if (retryResponse) {
              set({
                user: retryResponse.user,
                token: retryResponse.token,
                refreshToken: retryResponse.refreshToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              console.log('[authStore] state after retry checkAuth (logged in)');
            } else {
              set({
                user: null,
                // token: null,
                // refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              console.log('[authStore] state after retry checkAuth (not logged in)');
            }
          }
        } catch (error) {
          console.log('[authStore] checkAuth failed completely', error);
          set({
            user: null,
            // token: null,
            // refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
          });
        }
      },

      refreshAuthToken: async () => {
        console.log("refreshAuthToken called");
        try {
          set({ isLoading: true, error: null });
          const response = await apiRefreshToken();
          const currentUser = get().user; // Keep existing user data
          set({
            token: response.token,
            refreshToken: response.refreshToken,
            user: currentUser || response.user, // Prefer existing user data
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // On refresh failure, log out the user
          set({
            user: null,
            // token: null,
            // refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Token refresh failed',
          });
          throw error;
        }
      },

      sendEmailVerification: async (email: string) => {
        try {
          // set({ isLoading: true, error: null });
          const result = await apiSendEmailCaptcha(email);
          set({ isLoading: false });
          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to send verification email',
            isLoading: false,
          });
          throw error;
        }
      },

      updateProfile: async (payload, form = false) => {
        return await withTokenRefresh(async () => {
          set({ isLoading: true, error: null });
          const response = await apiUpdateUserInfo(payload, form);
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null,
          });
        });
      },

      changePassword: async (payload, form = false) => {
        try {
          set({ isLoading: true, error: null });
          const result = await apiChangePassword(payload, form);
          set({ isLoading: false, error: null });
          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Password change failed',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      // Restore axios header after rehydration so subsequent isLogin calls have the header
      onRehydrateStorage: () => (state) => {
        console.log("Rehydrating auth store...")
        try {
          if (state && state.token) {
            // setAuthHeader expects a raw token (it will add the Bearer prefix)
            setAuthHeader(state.token);
            console.log('[authStore] restored auth header from persisted token');
          } else {
            // attempt to restore from storage if no token in persisted state
            restoreAuthFromStorage();
            console.log('[authStore] attempted restoreAuthFromStorage');

          }
        } catch (e) {
          // ignore
        }
      },
    }
  )
);

