// Cloudflare Workers Environment Bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  CORS_ORIGIN: string;
  JWT_ISSUER: string;
  JWT_SECRET: string;
}

// Database Models
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin' | 'moderator';
  is_active: number;
  email_verified: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
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
  // Climbing-specific fields for persona feature
  climbing_start_year: string | null;
  frequent_locations: string | null;
  favorite_route_type: string | null;
  climbing_reason: string | null;
  climbing_meaning: string | null;
  bucket_list: string | null;
  advice: string | null;
  achievements: string | null;
  social_links: string | null;
  is_featured: number;
  is_public: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
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
