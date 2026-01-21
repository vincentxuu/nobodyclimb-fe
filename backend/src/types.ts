// Cloudflare Workers Environment Bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ACCESS_LOGS: AnalyticsEngineDataset;
  CORS_ORIGIN: string;
  JWT_ISSUER: string;
  JWT_SECRET: string;
  R2_PUBLIC_URL: string;
  CWA_API_KEY: string; // 中央氣象署 API 授權碼
  GOOGLE_CLIENT_ID: string;
  // Analytics Engine 查詢用（可選，透過 wrangler secret 設定）
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

// Analytics Engine Dataset Type
export interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

// Weather API Types
export interface CwaWeatherElement {
  elementName: string;
  time: Array<{
    startTime: string;
    endTime: string;
    parameter: {
      parameterName: string;
      parameterValue?: string;
      parameterUnit?: string;
    };
  }>;
}

export interface CwaLocationWeather {
  locationName: string;
  weatherElement: CwaWeatherElement[];
}

export interface WeatherData {
  location: string;
  temperature: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  condition: string | null;
  precipitation: number | null; // 降雨機率 %
  humidity?: number | null;
  comfort?: string | null;
  updatedAt: string;
  forecast: Array<{
    date: string;
    minTemp: number | null;
    maxTemp: number | null;
    condition: string | null;
    precipitation: number | null;
  }>;
}

// Database Models
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin' | 'moderator';
  is_active: number;
  email_verified: number;
  google_id: string | null;
  auth_provider: 'local' | 'google';
  created_at: string;
  updated_at: string;
}

// Google OAuth Types
export interface GoogleAuthRequest {
  credential: string;
}

export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Gym {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  cover_image: string | null;
  is_featured: number;
  opening_hours: string | null;
  facilities: string | null;
  price_info: string | null;
  rating_avg: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Crag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  rock_type: string | null;
  climbing_types: string | null;
  difficulty_range: string | null;
  route_count: number;
  bolt_count: number;
  cover_image: string | null;
  images: string | null;
  is_featured: number;
  access_info: string | null;
  parking_info: string | null;
  approach_time: number | null;
  best_seasons: string | null;
  restrictions: string | null;
  rating_avg: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  crag_id: string;
  name: string;
  grade: string | null;
  grade_system: string;
  height: number | null;
  bolt_count: number | null;
  route_type: 'sport' | 'trad' | 'boulder' | 'mixed';
  description: string | null;
  first_ascent: string | null;
  created_at: string;
}

export interface Gallery {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  is_featured: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  youtube_id: string | null;
  vimeo_id: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  category: string | null;
  tags: string | null;
  is_featured: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Biography {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image: string | null;

  // 第一層：攀岩基本資訊
  climbing_start_year: string | null;
  frequent_locations: string | null;
  favorite_route_type: string | null;

  // 第二層：核心故事
  climbing_origin: string | null;
  climbing_meaning: string | null;
  advice_to_self: string | null;

  // 第三層：進階故事 - A. 成長與突破
  memorable_moment: string | null;
  biggest_challenge: string | null;
  breakthrough_story: string | null;
  first_outdoor: string | null;
  first_grade: string | null;
  frustrating_climb: string | null;

  // 第三層：進階故事 - B. 心理與哲學
  fear_management: string | null;
  climbing_lesson: string | null;
  failure_perspective: string | null;
  flow_moment: string | null;
  life_balance: string | null;
  unexpected_gain: string | null;

  // 第三層：進階故事 - C. 社群與連結
  climbing_mentor: string | null;
  climbing_partner: string | null;
  funny_moment: string | null;
  favorite_spot: string | null;
  advice_to_group: string | null;
  climbing_space: string | null;

  // 第三層：進階故事 - D. 實用分享
  injury_recovery: string | null;
  memorable_route: string | null;
  training_method: string | null;
  effective_practice: string | null;
  technique_tip: string | null;
  gear_choice: string | null;

  // 第三層：進階故事 - E. 夢想與探索
  dream_climb: string | null;
  climbing_trip: string | null;
  bucket_list_story: string | null;
  climbing_goal: string | null;
  climbing_style: string | null;
  climbing_inspiration: string | null;

  // 第三層：進階故事 - F. 生活整合
  life_outside_climbing: string | null;

  // 媒體與社群
  gallery_images: string | null;
  social_links: string | null;
  youtube_channel_id: string | null;
  featured_video_id: string | null;

  // 狀態
  achievements: string | null;
  is_featured: number;
  is_public: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;

  // 統計
  total_likes: number;
  total_views: number;
  follower_count: number;

  // V2 欄位 - 漸進式揭露設計
  visibility: 'private' | 'anonymous' | 'community' | 'public' | null;
  tags_data: string | null;
  one_liners_data: string | null;
  stories_data: string | null;
  basic_info_data: string | null;
  autosave_at: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  entity_type: 'gym' | 'crag';
  entity_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  entity_type: 'post' | 'gallery' | 'video';
  entity_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

// Traffic Camera Types (1968 路況服務)
export interface CameraData {
  camid: string;
  camname: string;
  camuri: string;
  location: string;
  latitude: number | null; // HTML 解析時可能無法取得經緯度
  longitude: number | null;
  direction?: string;
  distance?: number; // 距離（公里）
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Auth Types
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
