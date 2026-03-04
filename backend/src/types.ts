// ============================================
// Cloudflare AI Bindings
// ============================================

export interface AI {
  run(model: string, inputs: Record<string, unknown>, options?: { gateway?: { id: string } }): Promise<unknown>;
}

export interface VectorizeIndex {
  query(vector: number[], options?: VectorizeQueryOptions): Promise<VectorizeMatches>;
  insert(vectors: VectorizeVector[]): Promise<VectorizeInsertResult>;
  upsert(vectors: VectorizeVector[]): Promise<VectorizeUpsertResult>;
  deleteByIds(ids: string[]): Promise<VectorizeDeleteResult>;
  getByIds(ids: string[]): Promise<VectorizeVector[]>;
}

export interface VectorizeQueryOptions {
  topK?: number;
  filter?: Record<string, unknown>;
  returnValues?: boolean;
  returnMetadata?: 'all' | 'indexed' | 'none';
}

export interface VectorizeMatches {
  matches: VectorizeMatch[];
  count: number;
}

export interface VectorizeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
  namespace?: string;
}

export interface VectorizeInsertResult {
  count: number;
  ids: string[];
}

export interface VectorizeUpsertResult {
  count: number;
}

export interface VectorizeDeleteResult {
  count: number;
}

// ============================================
// AI Document Types
// ============================================

export interface AIDocument {
  id: string;
  type: 'route' | 'crag' | 'video';
  source_id: string;
  text: string;
  metadata: string | null; // JSON string
  embedding_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIDocumentMetadata {
  name?: string;
  name_en?: string;
  region?: string;
  // 路線專用
  grade?: string;
  grade_numeric?: number;
  route_type?: string;
  crag_id?: string;
  crag_name?: string;
  area_id?: string;
  area_name?: string;
  // 岩場專用
  climbing_types?: string[];
  best_seasons?: string[];
  // 影片專用
  channel?: string;
  youtube_id?: string;
  category?: string;
}

// ============================================
// AI Query Parsing Types
// ============================================

export interface ParsedQuery {
  tool: 'search_routes' | 'search_crags' | 'general_knowledge';
  query_type?: 'simple' | 'complex' | 'general-knowledge';
  params: {
    crag_name?: string;
    area_name?: string;
    grade?: string;         // "5.11b" 或 "5.10-5.12"
    route_type?: string;
    region?: string;
    climbing_type?: string;
  };
}

// ============================================
// AI Query Log Types
// ============================================

export interface AIQueryLog {
  id: string;
  user_id: string | null;
  query: string;
  response: string | null;
  sources: string | null; // JSON string
  latency_ms: number | null;
  token_count: number | null;
  feedback_score: number | null;
  feedback_text: string | null;
  created_at: string;
}

// ============================================
// AI API Source Types
// ============================================

export interface AISource {
  id: string;
  type: 'route' | 'crag' | 'video';
  title: string;
  excerpt: string;
  url?: string;
  score: number;
  latestVideoUrl?: string; // 路線最新影片 YouTube URL（僅 route 類型）
}

// ============================================
// AI API Request / Response Types
// ============================================

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIAskRequest {
  query: string;
  limit?: number;            // 搜尋結果數量，預設 5
  include_sources?: boolean; // 是否回傳來源，預設 true
  chat_history?: AIChatMessage[]; // 最近幾輪對話（不含本次 query），供 LLM 記憶和 context 補充
  no_cache?: boolean;        // 強制跳過 KV 快取（如重新產生時使用）
}

export interface AIAskResponse {
  answer: string;
  sources: AISource[];
  query_id: string; // 供後續回饋使用
  suggested_questions: string[]; // AI 生成的追問建議
}

export interface AISearchRequest {
  query: string;
  type?: 'route' | 'crag' | 'video';
  limit?: number;
  filters?: {
    region?: string;
    grade_min?: number;
    grade_max?: number;
    route_type?: string;
    crag_id?: string;
  };
}

export interface AIFeedbackRequest {
  query_id: string;
  score: 1 | 2 | 3 | 4 | 5;
  text?: string;
}

// ============================================
// Cloudflare Workers Environment Bindings
// ============================================

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
  // AI 相關 bindings
  AI: AI;
  VECTOR_INDEX: VectorizeIndex;
  AI_GATEWAY_SLUG?: string;
}

// Type alias for backwards compatibility
export type Bindings = Env;

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
  // 新增欄位
  metadata_source: string | null;
  metadata_source_url: string | null;
  metadata_maintainer: string | null;
  metadata_maintainer_url: string | null;
  live_video_id: string | null;
  live_video_title: string | null;
  live_video_description: string | null;
  transportation: string | null;
  amenities: string | null;
  google_maps_url: string | null;
  // 岩壁高度 (與 altitude 海拔高度區分)
  height_min: number | null;
  height_max: number | null;
}

export interface Area {
  id: string;
  crag_id: string;
  name: string;
  name_en: string | null;
  slug: string | null;
  description: string | null;
  description_en: string | null;
  image: string | null;
  bolt_count: number;
  route_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Sector {
  id: string;
  area_id: string;
  name: string;
  name_en: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  crag_id: string;
  area_id: string | null;
  sector_id: string | null;
  name: string;
  name_en: string | null;
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

  // 媒體與社群
  social_links: string | null;
  youtube_channel_id: string | null;
  featured_video_id: string | null;

  // 狀態
  achievements: string | null;
  is_featured: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;

  // 統計
  total_likes: number;
  total_views: number;
  follower_count: number;
  comment_count: number;

  // V2 欄位 - 資料儲存在 JSON 欄位和獨立表
  visibility: 'private' | 'anonymous' | 'community' | 'public' | null;
  tags_data: string | null; // JSON: 標籤資料
  basic_info_data: string | null; // JSON: 基本資訊 (climbing_start_year, frequent_locations, favorite_route_type 等)
  one_liners_data: string | null; // JSON: 一句話問答 (已移至獨立表，此欄位保留供查詢使用)
  stories_data: string | null; // JSON: 故事內容 (已移至獨立表，此欄位保留供查詢使用)
  autosave_at: string | null; // 自動儲存時間戳

  // 攀岩者身體數據與目標
  height_cm: number | null;
  arm_span_cm: number | null;
  grade_targets: string | null; // JSON: 年度攀爬目標陣列

  // 等級資訊（from user_ranks）
  user_rank_id: string | null;
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
  username?: string;
  display_name?: string | null;
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

// Biography Content Types
export interface CoreStoryQuestion {
  id: string;
  title: string;
  subtitle: string | null;
  placeholder: string | null;
  display_order: number;
  is_active: number;
}

export interface BiographyCoreStory {
  id: string;
  biography_id: string;
  question_id: string;
  content: string;
  is_hidden: number;
  like_count: number;
  comment_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface OneLinerQuestion {
  id: string;
  question: string;
  format_hint: string | null;
  placeholder: string | null;
  display_order: number;
  is_active: number;
}

export interface BiographyOneLiner {
  id: string;
  biography_id: string;
  question_id: string;
  question_text: string | null;
  answer: string;
  source: string;
  is_hidden: number;
  like_count: number;
  comment_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StoryCategory {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  display_order: number;
  is_active: number;
}

export interface StoryQuestion {
  id: string;
  category_id: string;
  title: string;
  subtitle: string | null;
  placeholder: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  display_order: number;
  is_active: number;
}

export interface BiographyStory {
  id: string;
  biography_id: string;
  question_id: string;
  question_text: string | null;
  category_id: string | null;
  content: string;
  source: string;
  character_count: number;
  is_hidden: number;
  like_count: number;
  comment_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Like Types
export interface ContentLike {
  id: string;
  user_id: string;
  created_at: string;
}

export interface CoreStoryLike extends ContentLike {
  core_story_id: string;
}

export interface OneLinerLike extends ContentLike {
  one_liner_id: string;
}

export interface StoryLike extends ContentLike {
  story_id: string;
}

// Comment Types
export interface ContentComment {
  id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoreStoryComment extends ContentComment {
  core_story_id: string;
}

export interface OneLinerComment extends ContentComment {
  one_liner_id: string;
}

export interface StoryComment extends ContentComment {
  story_id: string;
}

// Extended types with user information
export interface CommentWithUser extends ContentComment {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  user_rank_id: string | null;
}

// Content with additional fields
export interface ContentWithLikeStatus {
  is_liked?: boolean;
}

export interface ContentWithOwner {
  owner_id: string;
}

// ============================================
// Route User Integration Types
// ============================================

export type AscentType =
  | 'redpoint'
  | 'flash'
  | 'onsight'
  | 'attempt'
  | 'toprope'
  | 'lead'
  | 'seconding'
  | 'repeat';

export interface UserRouteAscent {
  id: string;
  user_id: string;
  route_id: string;
  ascent_type: AscentType;
  ascent_date: string;
  attempts_count: number;
  rating: number | null;
  perceived_grade: string | null;
  notes: string | null;
  photos: string | null; // JSON array
  youtube_url: string | null;
  instagram_url: string | null;
  is_public: number;
  created_at: string;
  updated_at: string;
}

export type RouteStoryType =
  | 'beta'
  | 'experience'
  | 'first_ascent'
  | 'history'
  | 'safety'
  | 'conditions'
  | 'gear'
  | 'approach'
  | 'other';

export interface RouteStory {
  id: string;
  user_id: string;
  route_id: string;
  story_type: RouteStoryType;
  title: string | null;
  content: string;
  photos: string | null; // JSON array
  youtube_url: string | null;
  instagram_url: string | null;
  visibility: 'public' | 'community' | 'private';
  is_featured: number;
  is_verified: number;
  like_count: number;
  comment_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}
