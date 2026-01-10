-- Migration: Add location fields to gallery_images
-- Version: 1.3.0
-- Date: 2026-01-10
-- Description: Add location fields (country, city, spot) to gallery_images table

-- Add location fields to gallery_images table
ALTER TABLE gallery_images ADD COLUMN location_country TEXT;
ALTER TABLE gallery_images ADD COLUMN location_city TEXT;
ALTER TABLE gallery_images ADD COLUMN location_spot TEXT;
