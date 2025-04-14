/**
 * API 端點常量
 * 集中管理所有 API 路徑
 */

// 認證相關
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  ME: '/auth/me',
  UPDATE_PROFILE: '/auth/profile',
}

// 文章相關
export const BLOG_ENDPOINTS = {
  POSTS: '/posts',
  POST_BY_ID: (id: string) => `/posts/${id}`,
  POST_BY_SLUG: (slug: string) => `/posts/slug/${slug}`,
  FEATURED_POSTS: '/posts/featured',
  RELATED_POSTS: (id: string) => `/posts/${id}/related`,
  COMMENTS: (id: string) => `/posts/${id}/comments`,
  TAGS: '/posts/tags',
}

// 攀岩館相關
export const GYM_ENDPOINTS = {
  GYMS: '/gyms',
  GYM_BY_ID: (id: string) => `/gyms/${id}`,
  GYM_BY_SLUG: (slug: string) => `/gyms/slug/${slug}`,
  FEATURED_GYMS: '/gyms/featured',
  NEARBY_GYMS: '/gyms/nearby',
  REVIEWS: (id: string) => `/gyms/${id}/reviews`,
  FACILITIES: '/gyms/facilities',
}

// 相簿相關
export const GALLERY_ENDPOINTS = {
  GALLERIES: '/galleries',
  GALLERY_BY_ID: (id: string) => `/galleries/${id}`,
  GALLERY_BY_SLUG: (slug: string) => `/galleries/slug/${slug}`,
  POPULAR_GALLERIES: '/galleries/popular',
}

// 個人資料相關
export const PROFILE_ENDPOINTS = {
  PROFILES: '/profiles',
  PROFILE_BY_ID: (id: string) => `/profiles/${id}`,
  PROFILE_BY_USERNAME: (username: string) => `/profiles/username/${username}`,
}

// 搜尋相關
export const SEARCH_ENDPOINTS = {
  SEARCH: '/search',
}

// 通知相關
export const NOTIFICATION_ENDPOINTS = {
  NOTIFICATIONS: '/notifications',
  MARK_READ: '/notifications/read',
  MARK_ALL_READ: '/notifications/read-all',
}

// 上傳相關
export const UPLOAD_ENDPOINTS = {
  UPLOAD_IMAGE: '/upload/image',
  UPLOAD_AVATAR: '/upload/avatar',
}
