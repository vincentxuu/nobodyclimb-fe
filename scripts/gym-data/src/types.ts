import { z } from 'zod';

// ============================================
// JSON Data Types (from gyms.json)
// ============================================

export interface GymJsonLocation {
  address: string;
  addressEn?: string;
  city: string;
  district?: string;
  region: string;
  regionEn?: string;
  latitude: number;
  longitude: number;
}

export interface GymJsonPricing {
  singleEntry: {
    weekday?: number;
    weekend?: number;
    twilight?: number;
  };
  rental?: {
    shoes?: number;
    harness?: number;
  };
}

export interface GymJsonOpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
}

export interface GymJsonContact {
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  facebookUrl?: string;
  instagram?: string;
  instagramUrl?: string;
  line?: string;
  youtube?: string;
}

export interface GymJsonTransportation {
  mrt?: string;
  parking?: string;
}

export interface GymJsonUnboxingReview {
  type: 'youtube' | 'instagram' | 'blog';
  title: string;
  url: string;
}

export interface GymJsonData {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  type: string; // 'lead' | 'bouldering' | 'mixed'
  location: GymJsonLocation;
  description: string;
  descriptionEn?: string;
  coverImage?: string;
  images?: string[];
  facilities: string[];
  facilitiesEn?: string[];
  openingHours: GymJsonOpeningHours;
  pricing: GymJsonPricing;
  transportation?: GymJsonTransportation;
  contact: GymJsonContact;
  unboxingReviews?: GymJsonUnboxingReview[];
  notes?: string;
  rating?: number;
  featured?: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GymsJsonFile {
  gyms: GymJsonData[];
}

// ============================================
// Database Types (matching D1 schema)
// ============================================

export interface GymDB {
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
  opening_hours: string | null; // JSON string
  facilities: string | null; // JSON string array
  price_info: string | null; // JSON string
  rating_avg: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Zod Validation Schemas
// ============================================

export const GymStatus = z.enum(['draft', 'pending', 'published', 'archived']);
export type GymStatusType = z.infer<typeof GymStatus>;

export const GymRegion = z.enum(['北部', '中部', '南部', '東部', '離島']);
export type GymRegionType = z.infer<typeof GymRegion>;

export const GymType = z.enum(['lead', 'bouldering', 'mixed', 'speed']);
export type GymTypeEnum = z.infer<typeof GymType>;
