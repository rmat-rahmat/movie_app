import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  isLogin as apiIsLogin,
   apiUpdateUserInfo,
  changePassword as apiChangePassword,
  sendEmailCaptcha as apiSendEmailCaptcha,
  refreshToken as apiRefreshToken,
  setAuthHeader as setAuthHeader,
  restoreAuthFromStorage as restoreAuthFromStorage,
} from '@/lib/authAPI';
import { getImageById } from '@/lib/uploadAPI';

export type User = {
  id?: string;
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
  refreshAuthToken: () => Promise<string>;
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


// init token 
// Helper function to wrap API calls with token refresh logic
export const withTokenRefresh = async <T>(apiCall: (newToken?: string) => Promise<T>): Promise<T> => {
  try {
    const currentToken = useAuthStore.getState().token;
    console.log('withTokenRefresh current token:', currentToken);
    return await apiCall();
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } } | undefined;
    if (error?.response?.status === 401) {
      try {
        const currentToken = useAuthStore.getState().token;
        const newToken = await useAuthStore.getState().refreshAuthToken();
        
        // Retry the original call up to 5 times after a token refresh
        let lastErr: unknown;
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            const authToken = useAuthStore.getState().token;
            // Pass the new token to the callback so it can update headers if needed
            return await apiCall(newToken);
          } catch (retryErr: unknown) {
            lastErr = retryErr;
            const retryError = retryErr as { response?: { status?: number } } | undefined;
            // If we get another 401, don't retry further - token refresh didn't work
            // if (retryError?.response?.status === 401) {
            //   console.error('Still getting 401 after token refresh, logging out user');
            //   await useAuthStore.getState().logout();
            //   throw new Error('Authentication failed after token refresh');
            // }
            
            // If this was the last attempt, rethrow the error
            if (attempt === 5) {
              throw lastErr;
            }

            // Small delay before next retry (3 seconds)
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
        // Fallback in case loop exits unexpectedly
        throw new Error('Retry attempts exhausted');
      } catch (refreshErr: unknown) {
        console.error('Token refresh failed:', refreshErr);
        // If token refresh fails, log out the user
        await useAuthStore.getState().logout();
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
        try {
        set({ isLoading: true, error: null });
        const response = await apiLogin(email, password, form);
         if (response?.user?.avatar && typeof response.user.avatar === 'string' && !response.user.avatar.startsWith('http')&& !response.user.avatar.startsWith('data')) {
            const avatarUrl = await getImageById(response.user.avatar, '360');
            response.user.avatar = avatarUrl?.url ?? '';
          }
          
         // CRITICAL: Set auth header after successful login
         setAuthHeader(response.token);
          
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
          const response = await apiRegister(payload, form);
          
          // CRITICAL: Set auth header after successful registration
          setAuthHeader(response.token);
          
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
      getAvatarUrl: async (avatarID: string) => {
        try {
           // fetch full URL from upload API
                    const imageUrl = await getImageById(avatarID, '360');
                    // guard against undefined and provide empty string fallback
                    return imageUrl?.url ?? '';
        } catch (error) {
        }
      },
      checkAuth: async () => {
        console.log("checkAuth called");
        try {
          set({ isLoading: true });
          // Use API helper that restores headers if needed
          const response = await apiIsLogin();
          console.log("checkAuth response:", response);
          if (response?.user?.avatar && typeof response.user.avatar === 'string' && !response.user.avatar.startsWith('http')&& !response.user.avatar.startsWith('data')) {
            const avatarUrl = await getImageById(response.user.avatar, '360');
            response.user.avatar = avatarUrl?.url ?? '';
          }
          if (response) {
            // CRITICAL: Set auth header when checkAuth succeeds
            setAuthHeader(response.token);
            
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
              // CRITICAL: Set auth header when retry checkAuth succeeds
              setAuthHeader(retryResponse.token);
              
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
            // error: error instanceof Error ? error.message : 'Authentication failed',
          });
        }
      },
      checkAuth2: async () => {
        console.log("checkAuth called");
        try {
          set({ isLoading: true });
          // Use API helper that restores headers if needed
          const response = await apiIsLogin();
          console.log("checkAuth response:", response);
          if (response?.user?.avatar && typeof response.user.avatar === 'string' && !response.user.avatar.startsWith('http') && !response.user.avatar.startsWith('data')) {
            const avatarUrl = await getImageById(response.user.avatar, '360');
            response.user.avatar = avatarUrl?.url ?? '';
          }
          if (response) {
            // CRITICAL: Set auth header when checkAuth succeeds
            setAuthHeader(response.token);
            
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
              // CRITICAL: Set auth header when retry checkAuth succeeds
              setAuthHeader(retryResponse.token);
              
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
            // error: error instanceof Error ? error.message : 'Authentication failed',
          });
        }
      },

      refreshAuthToken: async () => {
        try {
          console.log('Attempting to refresh auth token...');
          const response = await apiRefreshToken();
          const currentUser = get().user; // Keep existing user data
          
          // Note: apiRefreshToken already calls setAuthHeader() and saveTokenToStorage()
          
          set({
            token: response.token,
            refreshToken: response.refreshToken,
            user: currentUser || response.user, // Prefer existing user data
            isAuthenticated: true,
            error: null,
          });
          
          console.log('Auth token refreshed successfully');
          return response.token;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // On refresh failure, log out the user
          set({
            user: null,
            isAuthenticated: false,
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
        return await withTokenRefresh(async (newToken) => {
          set({ isLoading: true, error: null });
          await apiUpdateUserInfo(payload);
          set({
            isLoading: false,
            error: null,
          });
          get().checkAuth(); // Refresh user data after profile update
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

