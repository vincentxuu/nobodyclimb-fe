import { z } from 'zod';

// ============================================
// Enums
// ============================================

export const CragStatus = z.enum(['draft', 'pending', 'approved', 'rejected']);
export type CragStatus = z.infer<typeof CragStatus>;

export const Region = z.enum(['北部', '中部', '南部', '東部', '離島']);
export type Region = z.infer<typeof Region>;

export const ClimbingType = z.enum(['sport', 'trad', 'boulder', 'mixed']);
export type ClimbingType = z.infer<typeof ClimbingType>;

export const GradeSystem = z.enum(['yds', 'french', 'v-scale']);
export type GradeSystem = z.infer<typeof GradeSystem>;

export const RouteType = z.enum(['sport', 'trad', 'boulder', 'mixed']);
export type RouteType = z.infer<typeof RouteType>;

// ============================================
// Crag Schema
// ============================================

export const CragSheetRow = z.object({
  status: CragStatus,
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  region: Region,
  location: z.string().min(1, 'Location is required'),
  latitude: z.number().min(21).max(26, 'Latitude must be within Taiwan range (21-26)'),
  longitude: z.number().min(119).max(123, 'Longitude must be within Taiwan range (119-123)'),
  altitude: z.number().optional(),
  rockType: z.string().optional(),
  climbingTypes: z.string().min(1, 'Climbing types required'), // comma-separated
  difficultyRange: z.string().optional(),
  description: z.string().optional(),
  accessInfo: z.string().optional(),
  parkingInfo: z.string().optional(),
  approachTime: z.number().optional(),
  bestSeasons: z.string().optional(), // comma-separated
  restrictions: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  submittedBy: z.string().email(),
  submittedAt: z.string(),
  reviewedBy: z.string().email().optional().or(z.literal('')),
  reviewedAt: z.string().optional(),
  reviewNotes: z.string().optional(),
});

export type CragSheetRow = z.infer<typeof CragSheetRow>;

// ============================================
// Area Schema
// ============================================

export const AreaSheetRow = z.object({
  status: CragStatus,
  id: z.string().optional(),
  cragSlug: z.string().min(1, 'Crag slug is required'),
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  difficultyMin: z.string().optional(),
  difficultyMax: z.string().optional(),
  boltCount: z.number().optional(),
  image: z.string().url().optional().or(z.literal('')),
  submittedBy: z.string().email(),
  submittedAt: z.string(),
});

export type AreaSheetRow = z.infer<typeof AreaSheetRow>;

// ============================================
// Route Schema
// ============================================

export const RouteSheetRow = z.object({
  status: CragStatus,
  id: z.string().optional(),
  cragSlug: z.string().min(1, 'Crag slug is required'),
  areaId: z.string().optional(),
  sector: z.string().optional(),
  name: z.string().min(1, 'Route name is required'),
  grade: z.string().min(1, 'Grade is required'),
  gradeSystem: GradeSystem,
  routeType: RouteType,
  length: z.number().optional(),
  boltCount: z.number().optional(),
  boltType: z.string().optional(),
  anchorType: z.string().optional(),
  description: z.string().optional(),
  firstAscent: z.string().optional(),
  firstAscentDate: z.string().optional(),
  protection: z.string().optional(),
  tips: z.string().optional(),
  submittedBy: z.string().email(),
  submittedAt: z.string(),
});

export type RouteSheetRow = z.infer<typeof RouteSheetRow>;

// ============================================
// D1 Database Types (matching schema.sql)
// ============================================

export interface CragDB {
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
  climbing_types: string | null; // JSON array
  difficulty_range: string | null;
  route_count: number;
  bolt_count: number;
  cover_image: string | null;
  images: string | null; // JSON array
  is_featured: number; // 0 or 1
  access_info: string | null;
  parking_info: string | null;
  approach_time: number | null;
  best_seasons: string | null; // JSON array
  restrictions: string | null;
  rating_avg: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface RouteDB {
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

// ============================================
// JSON Data Types (from existing static files)
// ============================================

export interface CragJsonRoute {
  id: string;
  areaId?: string;
  sector?: string;
  name: string;
  grade: string;
  type: string;
  length?: number;
  firstAscent?: string;
  firstAscentDate?: string;
  description?: string;
  protection?: string;
  tips?: string;
  boltCount?: number;
  boltType?: string;
  anchorType?: string;
  popularity?: number;
  views?: number;
  images?: string[];
  videos?: string[];
  instagramPosts?: string[];
  youtubeVideos?: string[];
  status?: string;
  lastVerified?: string;
  lastUpdated?: string;
}

export interface CragJsonArea {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  difficulty?: {
    min: string;
    max: string;
  };
  image?: string;
  boltCount?: number;
  routesCount?: number;
  sectors?: string[];
}

export interface CragJsonData {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  address?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  type?: string;
  rockType?: string;
  routesCount?: number;
  difficulty?: {
    min: string;
    max: string;
  };
  height?: {
    min: number;
    max: number;
  };
  approach?: string;
  parking?: string;
  transportation?: string;
  seasons?: string[];
  amenities?: string[];
  featured?: boolean;
  rating?: number;
  status?: string;
}

export interface CragJsonFullData {
  crag: CragJsonData;
  areas: CragJsonArea[];
  routes: CragJsonRoute[];
  statistics?: {
    totalRoutes: number;
    totalAreas: number;
    gradeDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
  };
  metadata?: {
    version: string;
    source: string;
    lastUpdated: string;
    maintainer?: string;
  };
}

// ============================================
// Validation Result
// ============================================

export interface ValidationError {
  sheet: string;
  row: number;
  field: string;
  value: unknown;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  stats: {
    crags: { total: number; approved: number; pending: number };
    areas: { total: number; approved: number; pending: number };
    routes: { total: number; approved: number; pending: number };
  };
}

// ============================================
// Sync Result
// ============================================

export interface SyncResult {
  success: boolean;
  synced: {
    crags: number;
    areas: number;
    routes: number;
  };
  errors: string[];
  duration: number;
}
