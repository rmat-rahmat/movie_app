import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login, register, logout, isLogin, updateUserInfo, changePassword, sendEmailCaptcha, refreshToken } from '@/lib/authAPI';

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
  checkAuth: () => Promise<void>;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, form = false) => {
        try {
          set({ isLoading: true, error: null });
          const response = await login(email, password, form);
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
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
          });
          throw error;
        }
      },

      register: async (payload, form = false) => {
        try {
          set({ isLoading: true, error: null });
          const response = await register(payload, form);
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
          await logout();
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
        // Avoid concurrent check runs and unnecessary state updates which can trigger render loops
        const { isLoading: currentlyLoading, isAuthenticated: currentlyAuthenticated, token: currentToken, user: currentUser } = get();
        if (currentlyLoading) return;

        try {
          set({ isLoading: true, error: null });
          const response = await isLogin();

          if (response) {
            // Update only if something changed to avoid extra renders
            const needsUpdate =
              currentUser?.id !== response.user?.id ||
              currentToken !== response.token ||
              get().refreshToken !== response.refreshToken ||
              !currentlyAuthenticated;

            if (needsUpdate) {
              set({
                user: response.user,
                token: response.token,
                refreshToken: response.refreshToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              // nothing changed, just clear loading
              set({ isLoading: false });
            }
          } else {
            // If already cleared, avoid setting state again to prevent re-render loops
            if (currentlyAuthenticated || currentToken || currentUser) {
              set({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            } else {
              set({ isLoading: false });
            }
          }
        } catch (error) {
          // On error ensure the store is in a clean unauthenticated state
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

      refreshAuthToken: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await refreshToken();
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
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Token refresh failed',
          });
          throw error;
        }
      },

      sendEmailVerification: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          const result = await sendEmailCaptcha(email);
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
        try {
          set({ isLoading: true, error: null });
          const response = await updateUserInfo(payload, form);
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Update failed',
            isLoading: false,
          });
          throw error;
        }
      },

      changePassword: async (payload, form = false) => {
        try {
          set({ isLoading: true, error: null });
          const result = await changePassword(payload, form);
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
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
