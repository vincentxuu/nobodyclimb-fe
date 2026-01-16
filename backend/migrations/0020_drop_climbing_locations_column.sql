-- Migration: Drop climbing_locations column from biographies table
-- Date: 2026-01-16
-- Description: Remove the deprecated climbing_locations JSON column.
--              Climbing locations data is now stored in the normalized climbing_locations table.

-- SQLite 3.35.0+ supports DROP COLUMN
-- Cloudflare D1 uses SQLite and supports this syntax

ALTER TABLE biographies DROP COLUMN climbing_locations;
