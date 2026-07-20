/** API 基础路径 */
export const API_BASE = '/api/v1' as const

/** 认证端点 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
} as const

/** 业务端点 */
export const ENDPOINTS = {
  EVENTS: '/events',
  CATEGORIES: '/categories',
  TAGS: '/tags',
  SSE_NOTIFICATIONS: '/sse/notifications',
} as const
