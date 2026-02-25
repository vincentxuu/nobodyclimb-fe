-- Migration: 0033_add_crag_metadata_fields
-- Description: Add metadata, live video, transportation, amenities fields to crags table

-- Add metadata fields
ALTER TABLE crags ADD COLUMN metadata_source TEXT;
ALTER TABLE crags ADD COLUMN metadata_source_url TEXT;
ALTER TABLE crags ADD COLUMN metadata_maintainer TEXT;
ALTER TABLE crags ADD COLUMN metadata_maintainer_url TEXT;

-- Add live video fields
ALTER TABLE crags ADD COLUMN live_video_id TEXT;
ALTER TABLE crags ADD COLUMN live_video_title TEXT;
ALTER TABLE crags ADD COLUMN live_video_description TEXT;

-- Add transportation and amenities (JSON arrays)
ALTER TABLE crags ADD COLUMN transportation TEXT; -- JSON array of {type, description}
ALTER TABLE crags ADD COLUMN amenities TEXT; -- JSON array of strings

-- Add Google Maps URL
ALTER TABLE crags ADD COLUMN google_maps_url TEXT;
