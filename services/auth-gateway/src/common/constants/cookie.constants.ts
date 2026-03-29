import { API_BASE } from './api.constants';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const SESSION_ID_COOKIE = 'session_id';

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const REFRESH_COOKIE_PATH = `${API_BASE}/auth/refresh`;
export const SESSION_COOKIE_PATH = `${API_BASE}/auth`;
