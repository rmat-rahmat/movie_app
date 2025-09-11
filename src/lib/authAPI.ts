import axios from 'axios';
import { BASE_URL } from '../config';
import i18next from 'i18next';

// Lightweight auth helpers using axios
// Assumption: backend exposes REST endpoints under /api/auth
// Contract:
// - login(email,password,deviceId) -> { token, user }
// - register(name,email,password) -> { token, user }
// - logout() -> void
// - getCurrentUser() -> User | null
// - getDeviceId() -> string (generates/retrieves unique device identifier)

type User = { id: string; email: string; name?: string; [key: string]: unknown };
type AuthResponse = { token: string; refreshToken: string; user: User };

// Types matching the provided API documentation
type LoginUserVo = {
  id: string;
  passwordHash?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  nickname?: string;
  gender?: number;
  birthday?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
  token?: string;
  refreshToken?: string;
  [key: string]: unknown;
};

type StandardResponse<T> = {
  status?: number;
  code?: string;
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
};

export const setAuthHeader = (token: string | null) => {
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete axios.defaults.headers.common['Authorization'];
};

// small helper to translate error messages, with a fallback
function tr(key: string, fallback: string) {
  try {
    // i18next.t will return the key if not initialized; defaultValue ensures fallback used when key missing
    return i18next.t(key, { defaultValue: fallback });
  } catch {
    return fallback;
  }
}

// Device ID generation and management
const DEVICE_ID_KEY = 'device_id';

function generateDeviceId(): string {
  // Generate a unique device ID using timestamp, random values, and browser info
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2);
  
  if (typeof navigator !== 'undefined') {
    // Use browser fingerprinting for consistency
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenResolution = `${screen.width}x${screen.height}`;
    
    // Create a simple hash from browser info
    const browserInfo = `${userAgent}-${language}-${platform}-${screenResolution}`;
    let hash = 0;
    for (let i = 0; i < browserInfo.length; i++) {
      const char = browserInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const browserHash = Math.abs(hash).toString(36);
    
    return `${timestamp}-${randomPart}-${browserHash}`;
  }
  
  return `${timestamp}-${randomPart}-server`;
}

function getDeviceId(): string {
  try {
    if (typeof window !== 'undefined') {
      let deviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      return deviceId;
    }
  } catch {
    // Fallback for SSR or when localStorage is not available
  }
  
  return generateDeviceId();
}

// Export device ID function for use in other parts of the app
export { getDeviceId };

// Token and refresh token storage keys and helpers
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function saveTokenToStorage(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors (e.g. SSR)
  }
}

function saveRefreshTokenToStorage(refreshToken: string | null) {
  try {
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore storage errors (e.g. SSR)
  }
}

export function loadTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function loadRefreshTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAllTokensFromStorage() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore storage errors (e.g. SSR)
  }
}

export function restoreAuthFromStorage() {
  const t = loadTokenFromStorage();
  if (t) setAuthHeader(t);
}

/**
 * Login using the movie API endpoint: POST {BASE_URL}/api-movie/v1/auth/login
 * Supports JSON by default; set `form = true` to send application/x-www-form-urlencoded
 * Now includes device ID for tracking user sessions across devices
 */
export async function login(email: string, password: string, form = false): Promise<AuthResponse> {
  const url = `${BASE_URL}/api-movie/v1/auth/login`;
  const deviceId = getDeviceId();
  
  try {
    let res;
    if (form) {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);
      params.append('deviceId', deviceId);
      res = await axios.post<StandardResponse<LoginUserVo>>(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } else {
      res = await axios.post<StandardResponse<LoginUserVo>>(url, { 
        email, 
        password, 
        deviceId 
      });
    }

    const body = res.data as StandardResponse<LoginUserVo>;
    if (!body || !body.success) {
      throw new Error(tr('auth.error.login_failed', body?.message || 'Login failed'));
    }

    const userVo = body.data as LoginUserVo;
    const token = userVo?.token || '';
    const refreshToken = userVo?.refreshToken || '';
    const userData: Partial<User> = (userVo as Partial<User>) || {};

    const user: User = { ...userData, id: userVo.id, email: userData.email || '' };
    setAuthHeader(token || null);
    saveTokenToStorage(token || null);
    saveRefreshTokenToStorage(refreshToken || null);
    return { token: token || '', refreshToken: refreshToken || '', user };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(`${tr('auth.error.login_failed', 'Login failed')}: ${message}`);
  }
}

/**
 * Call the movie API login endpoint documented as POST /api-movie/v1/auth/login
 * Supports application/json (default) or application/x-www-form-urlencoded when form=true
 */

/**
 * Register a new user via movie API endpoint: POST {BASE_URL}/api-movie/v1/auth/register
 * Accepts JSON by default; set `form = true` to send application/x-www-form-urlencoded
 * payload may include: email, password, phone?, avatar?, nickname?, gender?, birthday?
 */
export async function register(
  payload: {
    email: string;
    password: string;
    deviceId: string;
    emailCaptcha: string;
    phone?: string;
    avatar?: string;
    nickname?: string;
    gender?: number;
    birthday?: string;
  },
  form = false
): Promise<AuthResponse> {
  const url = `${BASE_URL}/api-movie/v1/auth/register`;
  try {
    let res;
    if (form) {
      const params = new URLSearchParams();
      params.append('email', payload.email);
      params.append('password', payload.password);
      params.append('deviceId', payload.deviceId);
      params.append('emailCaptcha', payload.emailCaptcha);
      if (payload.phone) params.append('phone', payload.phone);
      if (payload.avatar) params.append('avatar', payload.avatar);
      if (payload.nickname) params.append('nickname', payload.nickname);
      if (typeof payload.gender !== 'undefined') params.append('gender', String(payload.gender));
      if (payload.birthday) params.append('birthday', payload.birthday);
      res = await axios.post<StandardResponse<LoginUserVo>>(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } else {
      res = await axios.post<StandardResponse<LoginUserVo>>(url, payload);
    }

    const body = res.data as StandardResponse<LoginUserVo>;
    if (!body || !body.success) {
      throw new Error(tr('auth.error.register_failed', body?.message || 'Register failed'));
    }

    const userVo = body.data as LoginUserVo;
    const token = userVo?.token || '';
    const refreshToken = userVo?.refreshToken || '';
    const user: User = { ...userVo, id: userVo.id, email: userVo.email || '' };
    setAuthHeader(token || null);
    saveTokenToStorage(token || null);
    saveRefreshTokenToStorage(refreshToken || null);
    return { token: token || '', refreshToken: refreshToken || '', user };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(`Register failed: ${message}`);
  }
}

export async function logout(): Promise<string> {
  const url = `${BASE_URL}/api-movie/v1/auth/logout`;
  try {
    const res = await axios.get<StandardResponse<string>>(url, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const body = res.data as StandardResponse<string>;
    // clear client tokens regardless of server response
    setAuthHeader(null);
    clearAllTokensFromStorage();
    if (!body || !body.success) {
      throw new Error(tr('auth.error.logout_failed', body?.message || 'Logout failed'));
    }
    return body.data || '';
  } catch (err: unknown) {
    // clear client tokens even if server call fails
    setAuthHeader(null);
    clearAllTokensFromStorage();
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(tr('auth.error.logout_failed', `Logout failed: ${message}`));
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await axios.get<{ user: User }>(`${BASE_URL}/api/auth/me`);
    return (res.data && (res.data as { user: User }).user) || null;
  } catch {
    return null;
  }
}

/**
 * Send email verification code: POST {BASE_URL}/api-movie/v1/auth/sendEmailCaptcha
 * Supports application/x-www-form-urlencoded
 */
export async function sendEmailCaptcha(email: string): Promise<string> {
  const url = `${BASE_URL}/api-movie/v1/auth/sendEmailCaptcha?email=${encodeURIComponent(email)}`;
  try {
    const res = await axios.get<StandardResponse<string>>(url, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const body = res.data as StandardResponse<string>;
    if (!body || !body.success) {
      throw new Error(tr('auth.error.send_captcha_failed', body?.message || 'Send captcha failed'));
    }

    return body.message || 'Verification email sent';
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(tr('auth.error.send_captcha_failed', `Send captcha failed: ${message}`));
  }
}

/**
 * Refresh access token: POST {BASE_URL}/api-movie/v1/auth/refresh
 * Requires current token in Authorization header and refreshToken in refreshToken header
 */
export async function refreshToken(): Promise<AuthResponse> {
  const url = `${BASE_URL}/api-movie/v1/auth/refresh`;
  const currentToken = loadTokenFromStorage();
  const currentRefreshToken = loadRefreshTokenFromStorage();

  if (!currentToken || !currentRefreshToken) {
    throw new Error('No tokens available for refresh');
  }

  try {
    const res = await axios.post<StandardResponse<{ token: string; refreshToken: string }>>(url, '', {
      headers: {
        'Authorization': currentToken,
        'refreshToken': currentRefreshToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const body = res.data as StandardResponse<{ token: string; refreshToken: string }>;
    if (!body || !body.success || !body.data) {
      throw new Error(tr('auth.error.refresh_failed', body?.message || 'Token refresh failed'));
    }

    const newToken = body.data.token;
    const newRefreshToken = body.data.refreshToken;

    // Update stored tokens and headers
    setAuthHeader(newToken);
    saveTokenToStorage(newToken);
    saveRefreshTokenToStorage(newRefreshToken);

    // Get current user info - we might need to call isLogin to get user data
    // For now, we'll return a minimal user object since refresh endpoint may not return full user data
    const user: User = { id: '', email: '' }; // This might need to be populated from existing state

    return { token: newToken, refreshToken: newRefreshToken, user };
  } catch (err: unknown) {
    // Clear tokens on refresh failure
    clearAllTokensFromStorage();
    setAuthHeader(null);
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(tr('auth.error.refresh_failed', `Token refresh failed: ${message}`));
  }
}

/**
 * Check if current session is logged in: GET {BASE_URL}/api-movie/v1/auth/isLogin
 * Returns AuthResponse when logged in, otherwise null
 */
export async function isLogin(): Promise<AuthResponse | null> {
  const url = `${BASE_URL}/api-movie/v1/auth/isLogin`;
  try {
    // ensure we have header set (restore from storage if needed)
    if (!axios.defaults.headers.common['Authorization']) {
      restoreAuthFromStorage();
    }

    const res = await axios.get<StandardResponse<LoginUserVo>>(url);
    const body = res.data as StandardResponse<LoginUserVo>;
    if (!body || !body.success) return null;
    const userVo = body.data as LoginUserVo;
    const token = userVo?.token || loadTokenFromStorage() || '';
    const refreshToken = userVo?.refreshToken || loadRefreshTokenFromStorage() || '';
    const user: User = { ...userVo, id: userVo.id, email: userVo.email || '' };
    // ensure header and storage are up-to-date
    setAuthHeader(token || null);
    saveTokenToStorage(token || null);
    saveRefreshTokenToStorage(refreshToken || null);
    return { token: token || '', refreshToken: refreshToken || '', user };
  } catch {
    return null;
  }
}

/**
 * Update user information via movie API endpoint: POST {BASE_URL}/api-movie/v1/auth/updateUserInfo
 * Accepts JSON by default; set `form = true` to send application/x-www-form-urlencoded
 * payload may include: phone?, avatar?, nickname?, gender?, birthday?, password?
 */
export async function updateUserInfo(
  payload: {
    phone?: string;
    avatar?: string;
    nickname?: string;
    gender?: number;
    birthday?: string;
    password?: string;
  },
  form = false
): Promise<AuthResponse> {
  const url = `${BASE_URL}/api-movie/v1/auth/updateUserInfo`;
  try {
    let res;
    if (form) {
      const params = new URLSearchParams();
      if (payload.phone) params.append('phone', payload.phone);
      if (payload.avatar) params.append('avatar', payload.avatar);
      if (payload.nickname) params.append('nickname', payload.nickname);
      if (typeof payload.gender !== 'undefined') params.append('gender', String(payload.gender));
      if (payload.birthday) params.append('birthday', payload.birthday);
      if (payload.password) params.append('password', payload.password);
      res = await axios.post<StandardResponse<LoginUserVo>>(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } else {
      res = await axios.post<StandardResponse<LoginUserVo>>(url, payload);
    }

    const body = res.data as StandardResponse<LoginUserVo>;
    if (!body || !body.success) {
      throw new Error(tr('auth.error.update_failed', body?.message || 'Update user info failed'));
    }

    const userVo = body.data as LoginUserVo;
    const token = userVo?.token || '';
    const refreshToken = userVo?.refreshToken || loadRefreshTokenFromStorage() || '';
    const user: User = { ...userVo, id: userVo.id, email: userVo.email || '' };
    setAuthHeader(token || null);
    saveTokenToStorage(token || null);
    saveRefreshTokenToStorage(refreshToken || null);
    return { token: token || '', refreshToken: refreshToken || '', user };
  } catch (err: unknown) {
  const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
  throw new Error(tr('auth.error.update_failed', `Update user info failed: ${message}`));
  }
}

/**
 * Change password via movie API endpoint: POST {BASE_URL}/api-movie/v1/auth/changePassword
 * Accepts JSON by default; set `form = true` to send application/x-www-form-urlencoded
 * payload must include: oldPassword and password
 */
export async function changePassword(
  payload: {
    oldPassword: string;
    password: string;
  },
  form = false
): Promise<string> {
  const url = `${BASE_URL}/api-movie/v1/auth/changePassword`;
  try {
    let res;
    if (form) {
      const params = new URLSearchParams();
      params.append('oldPassword', payload.oldPassword);
      params.append('password', payload.password);
      res = await axios.post<StandardResponse<string>>(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } else {
      res = await axios.post<StandardResponse<string>>(url, payload);
    }

    const body = res.data as StandardResponse<string>;
    if (!body || !body.success) {
      throw new Error(tr('auth.error.change_password_failed', body?.message || 'Change password failed'));
    }

    return body.message || 'Password changed successfully';
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(tr('auth.error.change_password_failed', `Change password failed: ${message}`));
  }
}

const authAPI = {
  login,
  register,
  logout,
  getCurrentUser,
  setAuthHeader,
  updateUserInfo,
  changePassword,
  isLogin,
  sendEmailCaptcha,
  refreshToken,
  restoreAuthFromStorage,
  loadTokenFromStorage,
  loadRefreshTokenFromStorage,
  clearAllTokensFromStorage,
};

export default authAPI;
