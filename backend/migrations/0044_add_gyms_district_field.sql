-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add district field to gyms table
-- Description: Add district (行政區) column to store more precise location info
-- Date: 2026-02-27
-- ═══════════════════════════════════════════════════════════════════════════

-- Add district column to gyms table
ALTER TABLE gyms ADD COLUMN district TEXT;

-- Create index for district queries
CREATE INDEX IF NOT EXISTS idx_gyms_district ON gyms(district);

-- Add comment for documentation
-- The district field stores administrative district information (e.g., "中和區", "信義區")
-- This provides more precise location data than city alone
