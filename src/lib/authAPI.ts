import axios from 'axios';
import { BASE_URL } from '../config';

// Lightweight auth helpers using axios
// Assumption: backend exposes REST endpoints under /api/auth
// Contract:
// - login(email,password) -> { token, user }
// - register(name,email,password) -> { token, user }
// - logout() -> void
// - getCurrentUser() -> User | null

type User = { id: string; email: string; name?: string; [key: string]: unknown };
type AuthResponse = { token: string; user: User };

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

// add token storage key and helpers
const TOKEN_KEY = 'auth_token';

function saveTokenToStorage(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
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

export function restoreAuthFromStorage() {
  const t = loadTokenFromStorage();
  if (t) setAuthHeader(t);
}

/**
 * Login using the movie API endpoint: POST {BASE_URL}/api-movie/v1/auth/login
 * Supports JSON by default; set `form = true` to send application/x-www-form-urlencoded
 */
export async function login(email: string, password: string, form = false): Promise<AuthResponse> {
  const url = `${BASE_URL}/api-movie/v1/auth/login`;
  try {
    let res;
    if (form) {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);
      res = await axios.post<StandardResponse<LoginUserVo>>(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } else {
      res = await axios.post<StandardResponse<LoginUserVo>>(url, { email, password });
    }

    const body = res.data as StandardResponse<LoginUserVo>;
    if (!body || !body.success) {
      throw new Error(body?.message || 'Login failed');
    }

    const userVo = body.data as LoginUserVo;
    const token = userVo?.token || '';
    const user: User = { ...userVo, id: userVo.id, email: userVo.email || '' };
    setAuthHeader(token || null);
    saveTokenToStorage(token || null); // persist token
    return { token: token || '', user };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(`Login failed: ${message}`);
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
      throw new Error(body?.message || 'Register failed');
    }

    const userVo = body.data as LoginUserVo;
    const token = userVo?.token || '';
    const user: User = { ...userVo, id: userVo.id, email: userVo.email || '' };
    setAuthHeader(token || null);
    saveTokenToStorage(token || null); // persist token
    return { token: token || '', user };
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
    // clear client header regardless
    setAuthHeader(null);
    saveTokenToStorage(null); // remove token
    if (!body || !body.success) {
      throw new Error(body?.message || 'Logout failed');
    }
    return body.data || '';
  } catch (err: unknown) {
    setAuthHeader(null);
    saveTokenToStorage(null); // remove token
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(`Logout failed: ${message}`);
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
    const user: User = { ...userVo, id: userVo.id, email: userVo.email || '' };
    // ensure header and storage are up-to-date
    setAuthHeader(token || null);
    saveTokenToStorage(token || null);
    return { token: token || '', user };
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
      throw new Error(body?.message || 'Update user info failed');
    }

    const userVo = body.data as LoginUserVo;
    const token = userVo?.token || '';
    const user: User = { ...userVo, id: userVo.id, email: userVo.email || '' };
    setAuthHeader(token || null);
    return { token: token || '', user };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(`Update user info failed: ${message}`);
  }
}

/**
 * Change password via movie API endpoint: POST {BASE_URL}/api-movie/v1/auth/changePassword
 * Accepts JSON by default; set `form = true` to send application/x-www-form-urlencoded
 * payload may include: password and optional profile fields
 */
export async function changePassword(
  payload: {
    password?: string;
    phone?: string;
    avatar?: string;
    nickname?: string;
    gender?: number;
    birthday?: string;
  },
  form = false
): Promise<string> {
  const url = `${BASE_URL}/api-movie/v1/auth/changePassword`;
  try {
    let res;
    if (form) {
      const params = new URLSearchParams();
      if (payload.password) params.append('password', payload.password);
      if (payload.phone) params.append('phone', payload.phone);
      if (payload.avatar) params.append('avatar', payload.avatar);
      if (payload.nickname) params.append('nickname', payload.nickname);
      if (typeof payload.gender !== 'undefined') params.append('gender', String(payload.gender));
      if (payload.birthday) params.append('birthday', payload.birthday);
      res = await axios.post<StandardResponse<string>>(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } else {
      res = await axios.post<StandardResponse<string>>(url, payload);
    }

    const body = res.data as StandardResponse<string>;
    if (!body || !body.success) {
      throw new Error(body?.message || 'Change password failed');
    }

    return body.data || '';
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as StandardResponse<unknown>)?.message || err.message : String(err);
    throw new Error(`Change password failed: ${message}`);
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
  restoreAuthFromStorage, // export the restore helper
};

export default authAPI;
