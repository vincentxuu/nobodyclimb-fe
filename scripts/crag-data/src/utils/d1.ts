import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';
import type { CragDB, RouteDB, AreaDB, SectorDB, CragSheetRow, RouteSheetRow, CragJsonArea, CragJsonSector } from '../types.js';

// ============================================
// Wrangler D1 執行器
// ============================================

interface D1QueryResult {
  results: Record<string, unknown>[];
  success: boolean;
  meta?: {
    changes: number;
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

function escapeSQL(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  // Escape single quotes by doubling them
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

function executeD1Query(sql: string): D1QueryResult {
  const dbName = config.environment === 'production' ? 'nobodyclimb-db' : 'nobodyclimb-db-preview';

  // 切換到 backend 目錄執行 wrangler
  const backendDir = config.backendPath;

  // 使用暫存檔案來避免命令列編碼問題
  const tempFile = join(backendDir, `.temp-query-${Date.now()}.sql`);

  try {
    // 寫入 SQL 到暫存檔
    writeFileSync(tempFile, sql, 'utf-8');

    const result = execSync(
      `pnpm wrangler d1 execute ${dbName} --remote --json --file "${tempFile}"`,
      {
        cwd: backendDir,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    // 刪除暫存檔
    try { unlinkSync(tempFile); } catch { /* ignore */ }

    // 過濾掉 wrangler 的進度輸出，只保留 JSON 部分
    const jsonStart = result.indexOf('[');
    const jsonEnd = result.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`Invalid response: ${result.substring(0, 200)}`);
    }
    const jsonStr = result.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    return {
      results: parsed[0]?.results || [],
      success: true,
      meta: parsed[0]?.meta,
    };
  } catch (error) {
    // 確保刪除暫存檔
    try { unlinkSync(tempFile); } catch { /* ignore */ }

    const err = error as { stderr?: string; stdout?: string; message?: string };
    const errorDetail = err.stderr || err.stdout || err.message || 'Unknown error';
    console.error('D1 Query Error:', errorDetail);
    console.error('SQL:', sql.substring(0, 200) + '...');
    throw new Error(`D1 query failed: ${errorDetail}`);
  }
}

/**
 * 批量執行多條 SQL 語句（合併成單一請求）
 * @param sqlStatements SQL 語句陣列
 * @param batchSize 每批次處理的語句數量（預設 50）
 */
export function executeBatchD1Query(
  sqlStatements: string[],
  batchSize: number = 50
): { success: number; failed: number } {
  const dbName = config.environment === 'production' ? 'nobodyclimb-db' : 'nobodyclimb-db-preview';
  const backendDir = config.backendPath;

  let successCount = 0;
  let failedCount = 0;

  // 分批處理
  for (let i = 0; i < sqlStatements.length; i += batchSize) {
    const batch = sqlStatements.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(sqlStatements.length / batchSize);

    // 合併成單一 SQL 文件（每條語句以分號結尾）
    const combinedSql = batch.join(';\n') + ';';
    const tempFile = join(backendDir, `.temp-batch-${Date.now()}.sql`);

    try {
      writeFileSync(tempFile, combinedSql, 'utf-8');

      execSync(
        `pnpm wrangler d1 execute ${dbName} --remote --file "${tempFile}"`,
        {
          cwd: backendDir,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      try { unlinkSync(tempFile); } catch { /* ignore */ }

      successCount += batch.length;
      process.stdout.write(`\r   ⏳ 批次 ${batchNum}/${totalBatches} 完成 (${successCount}/${sqlStatements.length})`);

    } catch (error) {
      try { unlinkSync(tempFile); } catch { /* ignore */ }

      const err = error as { stderr?: string; stdout?: string; message?: string };
      const errorDetail = err.stderr || err.stdout || err.message || 'Unknown error';
      console.error(`\n   ✗ 批次 ${batchNum} 失敗:`, errorDetail.substring(0, 200));
      failedCount += batch.length;
    }
  }

  // 換行
  if (sqlStatements.length > 0) {
    console.log();
  }

  return { success: successCount, failed: failedCount };
}

// ============================================
// Crag CRUD
// ============================================

function cragSheetToDb(crag: CragSheetRow): Partial<CragDB> {
  return {
    id: crag.id || crag.slug,
    name: crag.name,
    slug: crag.slug,
    description: crag.description || null,
    location: crag.location || null,
    region: crag.region || null,
    latitude: crag.latitude || null,
    longitude: crag.longitude || null,
    altitude: crag.altitude || null,
    rock_type: crag.rockType || null,
    climbing_types: crag.climbingTypes ? JSON.stringify(crag.climbingTypes.split(',').map(s => s.trim())) : null,
    difficulty_range: crag.difficultyRange || null,
    cover_image: crag.coverImage || null,
    is_featured: crag.isFeatured ? 1 : 0,
    access_info: crag.accessInfo || null,
    parking_info: crag.parkingInfo || null,
    approach_time: crag.approachTime || null,
    best_seasons: crag.bestSeasons ? JSON.stringify(crag.bestSeasons.split(',').map(s => s.trim())) : null,
    restrictions: crag.restrictions || null,
  };
}

export function upsertCrag(crag: CragSheetRow): void {
  const dbCrag = cragSheetToDb(crag);

  const sql = `
    INSERT INTO crags (
      id, name, slug, description, location, region,
      latitude, longitude, altitude, rock_type, climbing_types,
      difficulty_range, cover_image, is_featured, access_info,
      parking_info, approach_time, best_seasons, restrictions,
      created_at, updated_at
    ) VALUES (
      ${escapeSQL(dbCrag.id)}, ${escapeSQL(dbCrag.name)}, ${escapeSQL(dbCrag.slug)},
      ${escapeSQL(dbCrag.description)}, ${escapeSQL(dbCrag.location)}, ${escapeSQL(dbCrag.region)},
      ${escapeSQL(dbCrag.latitude)}, ${escapeSQL(dbCrag.longitude)}, ${escapeSQL(dbCrag.altitude)},
      ${escapeSQL(dbCrag.rock_type)}, ${escapeSQL(dbCrag.climbing_types)}, ${escapeSQL(dbCrag.difficulty_range)},
      ${escapeSQL(dbCrag.cover_image)}, ${escapeSQL(dbCrag.is_featured)}, ${escapeSQL(dbCrag.access_info)},
      ${escapeSQL(dbCrag.parking_info)}, ${escapeSQL(dbCrag.approach_time)}, ${escapeSQL(dbCrag.best_seasons)},
      ${escapeSQL(dbCrag.restrictions)}, datetime('now'), datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      location = excluded.location,
      region = excluded.region,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      altitude = excluded.altitude,
      rock_type = excluded.rock_type,
      climbing_types = excluded.climbing_types,
      difficulty_range = excluded.difficulty_range,
      cover_image = excluded.cover_image,
      is_featured = excluded.is_featured,
      access_info = excluded.access_info,
      parking_info = excluded.parking_info,
      approach_time = excluded.approach_time,
      best_seasons = excluded.best_seasons,
      restrictions = excluded.restrictions,
      updated_at = datetime('now')
  `.replace(/\n/g, ' ');

  executeD1Query(sql);
}

/**
 * 更新岩場的 metadata 和其他擴展欄位
 */
export interface CragMetadataUpdate {
  metadataSource?: string | null;
  metadataSourceUrl?: string | null;
  metadataMaintainer?: string | null;
  metadataMaintainerUrl?: string | null;
  liveVideoId?: string | null;
  liveVideoTitle?: string | null;
  liveVideoDescription?: string | null;
  transportation?: Array<{ type: string; description: string }> | null;
  amenities?: string[] | null;
  googleMapsUrl?: string | null;
  ratingAvg?: number | null;
  heightMin?: number | null;
  heightMax?: number | null;
}

export function updateCragMetadata(cragId: string, metadata: CragMetadataUpdate): void {
  const sql = `
    UPDATE crags SET
      metadata_source = ${escapeSQL(metadata.metadataSource)},
      metadata_source_url = ${escapeSQL(metadata.metadataSourceUrl)},
      metadata_maintainer = ${escapeSQL(metadata.metadataMaintainer)},
      metadata_maintainer_url = ${escapeSQL(metadata.metadataMaintainerUrl)},
      live_video_id = ${escapeSQL(metadata.liveVideoId)},
      live_video_title = ${escapeSQL(metadata.liveVideoTitle)},
      live_video_description = ${escapeSQL(metadata.liveVideoDescription)},
      transportation = ${escapeSQL(metadata.transportation ? JSON.stringify(metadata.transportation) : null)},
      amenities = ${escapeSQL(metadata.amenities ? JSON.stringify(metadata.amenities) : null)},
      google_maps_url = ${escapeSQL(metadata.googleMapsUrl)},
      rating_avg = COALESCE(${escapeSQL(metadata.ratingAvg)}, rating_avg),
      height_min = COALESCE(${escapeSQL(metadata.heightMin)}, height_min),
      height_max = COALESCE(${escapeSQL(metadata.heightMax)}, height_max),
      updated_at = datetime('now')
    WHERE id = ${escapeSQL(cragId)}
  `.replace(/\n/g, ' ');

  executeD1Query(sql);
}

// ============================================
// Route CRUD (legacy, without relations)
// ============================================

export function upsertRoute(route: RouteSheetRow, cragId: string): void {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const routeId = route.id || `${cragId}-route-${uniqueId}`;

  const sql = `
    INSERT INTO routes (
      id, crag_id, name, grade, grade_system,
      height, bolt_count, route_type, description, first_ascent,
      created_at
    ) VALUES (
      ${escapeSQL(routeId)}, ${escapeSQL(cragId)}, ${escapeSQL(route.name)},
      ${escapeSQL(route.grade)}, ${escapeSQL(route.gradeSystem || 'yds')},
      ${escapeSQL(route.length)}, ${escapeSQL(route.boltCount)},
      ${escapeSQL(route.routeType || 'sport')}, ${escapeSQL(route.description)},
      ${escapeSQL(route.firstAscent)}, datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      grade = excluded.grade,
      grade_system = excluded.grade_system,
      height = excluded.height,
      bolt_count = excluded.bolt_count,
      route_type = excluded.route_type,
      description = excluded.description,
      first_ascent = excluded.first_ascent
  `.replace(/\n/g, ' ');

  executeD1Query(sql);
}

export function updateCragRouteCount(cragId: string): void {
  const sql = `
    UPDATE crags
    SET route_count = (SELECT COUNT(*) FROM routes WHERE crag_id = ${escapeSQL(cragId)}),
        bolt_count = (SELECT COALESCE(SUM(bolt_count), 0) FROM routes WHERE crag_id = ${escapeSQL(cragId)}),
        updated_at = datetime('now')
    WHERE id = ${escapeSQL(cragId)}
  `.replace(/\n/g, ' ');

  executeD1Query(sql);
}

// ============================================
// Area CRUD
// ============================================

export function upsertArea(
  area: CragJsonArea,
  cragId: string,
  sortOrder: number
): void {
  const sql = `
    INSERT INTO areas (
      id, crag_id, name, name_en, slug, description, description_en,
      image, bolt_count, route_count, sort_order, created_at, updated_at
    ) VALUES (
      ${escapeSQL(area.id)}, ${escapeSQL(cragId)}, ${escapeSQL(area.name)},
      ${escapeSQL(area.nameEn)}, ${escapeSQL(area.id)}, ${escapeSQL(area.description)},
      ${escapeSQL(area.descriptionEn)}, ${escapeSQL(area.image)},
      ${escapeSQL(area.boltCount || 0)}, ${escapeSQL(area.routesCount || 0)},
      ${escapeSQL(sortOrder)}, datetime('now'), datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      name_en = excluded.name_en,
      slug = excluded.slug,
      description = excluded.description,
      description_en = excluded.description_en,
      image = excluded.image,
      bolt_count = excluded.bolt_count,
      route_count = excluded.route_count,
      sort_order = excluded.sort_order,
      updated_at = datetime('now')
  `.replace(/\n/g, ' ');

  executeD1Query(sql);
}

// ============================================
// Sector CRUD
// ============================================

export function upsertSector(
  sector: CragJsonSector,
  areaId: string,
  sortOrder: number
): void {
  const sql = `
    INSERT INTO sectors (
      id, area_id, name, name_en, sort_order, created_at, updated_at
    ) VALUES (
      ${escapeSQL(sector.id)}, ${escapeSQL(areaId)}, ${escapeSQL(sector.name)},
      ${escapeSQL(sector.nameEn)}, ${escapeSQL(sortOrder)}, datetime('now'), datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      name_en = excluded.name_en,
      sort_order = excluded.sort_order,
      updated_at = datetime('now')
  `.replace(/\n/g, ' ');

  executeD1Query(sql);
}

// ============================================
// Route with area_id and sector_id
// ============================================

export function upsertRouteWithRelations(
  route: RouteSheetRow,
  cragId: string,
  areaId: string | null,
  sectorId: string | null
): void {
  const sql = buildRouteSQL(route, cragId, areaId, sectorId);
  executeD1Query(sql);
}

/**
 * 生成路線 INSERT SQL（不執行）- 用於批量處理
 */
export function buildRouteSQL(
  route: RouteSheetRow,
  cragId: string,
  areaId: string | null,
  sectorId: string | null
): string {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const routeId = route.id || `${cragId}-route-${uniqueId}`;

  return `
    INSERT INTO routes (
      id, crag_id, area_id, sector_id, name, grade, grade_system,
      height, bolt_count, route_type, description, first_ascent, created_at
    ) VALUES (
      ${escapeSQL(routeId)}, ${escapeSQL(cragId)}, ${escapeSQL(areaId)}, ${escapeSQL(sectorId)},
      ${escapeSQL(route.name)}, ${escapeSQL(route.grade)}, ${escapeSQL(route.gradeSystem || 'yds')},
      ${escapeSQL(route.length)}, ${escapeSQL(route.boltCount)}, ${escapeSQL(route.routeType || 'sport')},
      ${escapeSQL(route.description)}, ${escapeSQL(route.firstAscent)}, datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      area_id = excluded.area_id,
      sector_id = excluded.sector_id,
      name = excluded.name,
      grade = excluded.grade,
      grade_system = excluded.grade_system,
      height = excluded.height,
      bolt_count = excluded.bolt_count,
      route_type = excluded.route_type,
      description = excluded.description,
      first_ascent = excluded.first_ascent
  `.replace(/\n/g, ' ').trim();
}

// ============================================
// Query functions
// ============================================

export function getAllCrags(): CragDB[] {
  const result = executeD1Query('SELECT * FROM crags ORDER BY name');
  return result.results as unknown as CragDB[];
}

export function getCragBySlug(slug: string): CragDB | null {
  const result = executeD1Query(`SELECT * FROM crags WHERE slug = ${escapeSQL(slug)}`);
  return (result.results[0] as unknown as CragDB) || null;
}

export function getRoutesByCragId(cragId: string): RouteDB[] {
  const result = executeD1Query(`SELECT * FROM routes WHERE crag_id = ${escapeSQL(cragId)} ORDER BY name`);
  return result.results as unknown as RouteDB[];
}

export function deleteCrag(id: string): void {
  executeD1Query(`DELETE FROM crags WHERE id = ${escapeSQL(id)}`);
}

export function deleteRoute(id: string): void {
  executeD1Query(`DELETE FROM routes WHERE id = ${escapeSQL(id)}`);
}

// ============================================
// Video CRUD
// ============================================

export interface VideoMetadata {
  id: string; // YouTube video ID
  title: string;
  channel: string;
  channelId: string;
  uploadDate: string;
  duration: number;
  viewCount: number;
  thumbnailUrl: string;
}

export function upsertVideo(video: VideoMetadata): void {
  const slug = `yt-${video.id}`;

  const sql = `
    INSERT INTO videos (
      id, title, slug, youtube_id, thumbnail_url, duration,
      channel, channel_id, published_at, view_count, created_at, updated_at
    ) VALUES (
      ${escapeSQL(video.id)}, ${escapeSQL(video.title)}, ${escapeSQL(slug)},
      ${escapeSQL(video.id)}, ${escapeSQL(video.thumbnailUrl)}, ${escapeSQL(video.duration)},
      ${escapeSQL(video.channel)}, ${escapeSQL(video.channelId)},
      ${escapeSQL(video.uploadDate)}, ${escapeSQL(video.viewCount)},
      datetime('now'), datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      thumbnail_url = excluded.thumbnail_url,
      duration = excluded.duration,
      channel = excluded.channel,
      channel_id = excluded.channel_id,
      published_at = excluded.published_at,
      view_count = excluded.view_count,
      updated_at = datetime('now')
  `.replace(/\n/g, ' ');

  executeD1Query(sql);
}

/**
 * 批量插入影片
 */
export function buildVideoSQL(video: VideoMetadata): string {
  const slug = `yt-${video.id}`;

  return `
    INSERT INTO videos (
      id, title, slug, youtube_id, thumbnail_url, duration,
      channel, channel_id, published_at, view_count, created_at, updated_at
    ) VALUES (
      ${escapeSQL(video.id)}, ${escapeSQL(video.title)}, ${escapeSQL(slug)},
      ${escapeSQL(video.id)}, ${escapeSQL(video.thumbnailUrl)}, ${escapeSQL(video.duration)},
      ${escapeSQL(video.channel)}, ${escapeSQL(video.channelId)},
      ${escapeSQL(video.uploadDate)}, ${escapeSQL(video.viewCount)},
      datetime('now'), datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      thumbnail_url = excluded.thumbnail_url,
      duration = excluded.duration,
      channel = excluded.channel,
      channel_id = excluded.channel_id,
      published_at = excluded.published_at,
      view_count = excluded.view_count,
      updated_at = datetime('now')
  `.replace(/\n/g, ' ').trim();
}

// ============================================
// Route Videos (Many-to-Many)
// ============================================

export function buildRouteVideoSQL(
  routeId: string,
  videoId: string,
  sortOrder: number
): string {
  const id = `${routeId}-${videoId}`;

  return `
    INSERT INTO route_videos (id, route_id, video_id, sort_order, created_at)
    VALUES (${escapeSQL(id)}, ${escapeSQL(routeId)}, ${escapeSQL(videoId)}, ${escapeSQL(sortOrder)}, datetime('now'))
    ON CONFLICT(route_id, video_id) DO UPDATE SET sort_order = excluded.sort_order
  `.replace(/\n/g, ' ').trim();
}

// ============================================
// Extended Route Fields
// ============================================

export interface RouteExtendedFields {
  nameEn?: string | null;
  typeEn?: string | null;
  firstAscentDate?: string | null;
  firstAscentEn?: string | null;
  safetyRating?: string | null;
  status?: string | null;
  sectorEn?: string | null;
  tips?: string | null;
  protection?: string | null;
  anchorType?: string | null;
}

export function buildRouteExtendedSQL(
  route: RouteSheetRow,
  cragId: string,
  areaId: string | null,
  sectorId: string | null,
  extended: RouteExtendedFields
): string {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const routeId = route.id || `${cragId}-route-${uniqueId}`;

  return `
    INSERT INTO routes (
      id, crag_id, area_id, sector_id, name, name_en, grade, grade_system,
      height, bolt_count, route_type, type_en, description, first_ascent,
      first_ascent_date, first_ascent_en, safety_rating, status, sector_en,
      tips, protection, anchor_type, created_at
    ) VALUES (
      ${escapeSQL(routeId)}, ${escapeSQL(cragId)}, ${escapeSQL(areaId)}, ${escapeSQL(sectorId)},
      ${escapeSQL(route.name)}, ${escapeSQL(extended.nameEn)}, ${escapeSQL(route.grade)}, ${escapeSQL(route.gradeSystem || 'yds')},
      ${escapeSQL(route.length)}, ${escapeSQL(route.boltCount)}, ${escapeSQL(route.routeType || 'sport')}, ${escapeSQL(extended.typeEn)},
      ${escapeSQL(route.description)}, ${escapeSQL(route.firstAscent)},
      ${escapeSQL(extended.firstAscentDate)}, ${escapeSQL(extended.firstAscentEn)}, ${escapeSQL(extended.safetyRating)},
      ${escapeSQL(extended.status || 'published')}, ${escapeSQL(extended.sectorEn)},
      ${escapeSQL(extended.tips)}, ${escapeSQL(extended.protection)}, ${escapeSQL(extended.anchorType)},
      datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      area_id = excluded.area_id,
      sector_id = excluded.sector_id,
      name = excluded.name,
      name_en = excluded.name_en,
      grade = excluded.grade,
      grade_system = excluded.grade_system,
      height = excluded.height,
      bolt_count = excluded.bolt_count,
      route_type = excluded.route_type,
      type_en = excluded.type_en,
      description = excluded.description,
      first_ascent = excluded.first_ascent,
      first_ascent_date = excluded.first_ascent_date,
      first_ascent_en = excluded.first_ascent_en,
      safety_rating = excluded.safety_rating,
      status = excluded.status,
      sector_en = excluded.sector_en,
      tips = excluded.tips,
      protection = excluded.protection,
      anchor_type = excluded.anchor_type
  `.replace(/\n/g, ' ').trim();
}
