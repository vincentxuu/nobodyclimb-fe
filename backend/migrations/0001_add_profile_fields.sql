-- Migration: Add profile fields for climbing preferences
-- Date: 2026-01-09

-- Add climbing_start_year column
ALTER TABLE users ADD COLUMN climbing_start_year TEXT;

-- Add frequent_gym column
ALTER TABLE users ADD COLUMN frequent_gym TEXT;

-- Add favorite_route_type column
ALTER TABLE users ADD COLUMN favorite_route_type TEXT;
