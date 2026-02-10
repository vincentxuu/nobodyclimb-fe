import { config } from '../config.js';
import type { CragDB, RouteDB, CragSheetRow, RouteSheetRow } from '../types.js';

const D1_API_BASE = 'https://api.cloudflare.com/client/v4';

interface D1Response<T> {
  success: boolean;
  errors: Array<{ message: string }>;
  result: T[];
}

interface D1QueryResult {
  results: Record<string, unknown>[];
  success: boolean;
  meta: {
    changes: number;
    duration: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

async function executeD1Query(sql: string, params: unknown[] = []): Promise<D1QueryResult> {
  const url = `${D1_API_BASE}/accounts/${config.cloudflare.accountId}/d1/database/${config.cloudflare.databaseId}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.cloudflare.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql,
      params,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D1 API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as D1Response<D1QueryResult>;

  if (!data.success) {
    throw new Error(`D1 query failed: ${data.errors.map(e => e.message).join(', ')}`);
  }

  return data.result[0];
}

// Convert sheet row to DB format
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

function routeSheetToDb(route: RouteSheetRow, cragId: string): Partial<RouteDB> {
  // 使用時間戳 + 隨機數避免批量導入時 ID 重複
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id: route.id || `${cragId}-route-${uniqueId}`,
    crag_id: cragId,
    name: route.name,
    grade: route.grade || null,
    grade_system: route.gradeSystem || 'yds',
    height: route.length || null,
    bolt_count: route.boltCount || null,
    route_type: route.routeType || 'sport',
    description: route.description || null,
    first_ascent: route.firstAscent || null,
  };
}

// CRUD operations
export async function upsertCrag(crag: CragSheetRow): Promise<void> {
  const dbCrag = cragSheetToDb(crag);

  const sql = `
    INSERT INTO crags (
      id, name, slug, description, location, region,
      latitude, longitude, altitude, rock_type, climbing_types,
      difficulty_range, cover_image, is_featured, access_info,
      parking_info, approach_time, best_seasons, restrictions,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
  `;

  await executeD1Query(sql, [
    dbCrag.id,
    dbCrag.name,
    dbCrag.slug,
    dbCrag.description,
    dbCrag.location,
    dbCrag.region,
    dbCrag.latitude,
    dbCrag.longitude,
    dbCrag.altitude,
    dbCrag.rock_type,
    dbCrag.climbing_types,
    dbCrag.difficulty_range,
    dbCrag.cover_image,
    dbCrag.is_featured,
    dbCrag.access_info,
    dbCrag.parking_info,
    dbCrag.approach_time,
    dbCrag.best_seasons,
    dbCrag.restrictions,
  ]);
}

export async function upsertRoute(route: RouteSheetRow, cragId: string): Promise<void> {
  const dbRoute = routeSheetToDb(route, cragId);

  const sql = `
    INSERT INTO routes (
      id, crag_id, name, grade, grade_system,
      height, bolt_count, route_type, description, first_ascent,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      grade = excluded.grade,
      grade_system = excluded.grade_system,
      height = excluded.height,
      bolt_count = excluded.bolt_count,
      route_type = excluded.route_type,
      description = excluded.description,
      first_ascent = excluded.first_ascent
  `;

  await executeD1Query(sql, [
    dbRoute.id,
    dbRoute.crag_id,
    dbRoute.name,
    dbRoute.grade,
    dbRoute.grade_system,
    dbRoute.height,
    dbRoute.bolt_count,
    dbRoute.route_type,
    dbRoute.description,
    dbRoute.first_ascent,
  ]);
}

export async function updateCragRouteCount(cragId: string): Promise<void> {
  const sql = `
    UPDATE crags
    SET route_count = (SELECT COUNT(*) FROM routes WHERE crag_id = ?),
        bolt_count = (SELECT COALESCE(SUM(bolt_count), 0) FROM routes WHERE crag_id = ?),
        updated_at = datetime('now')
    WHERE id = ?
  `;

  await executeD1Query(sql, [cragId, cragId, cragId]);
}

export async function getAllCrags(): Promise<CragDB[]> {
  const result = await executeD1Query('SELECT * FROM crags ORDER BY name');
  return result.results as unknown as CragDB[];
}

export async function getCragBySlug(slug: string): Promise<CragDB | null> {
  const result = await executeD1Query('SELECT * FROM crags WHERE slug = ?', [slug]);
  return (result.results[0] as unknown as CragDB) || null;
}

export async function getRoutesByCragId(cragId: string): Promise<RouteDB[]> {
  const result = await executeD1Query('SELECT * FROM routes WHERE crag_id = ? ORDER BY name', [cragId]);
  return result.results as unknown as RouteDB[];
}

export async function deleteCrag(id: string): Promise<void> {
  await executeD1Query('DELETE FROM crags WHERE id = ?', [id]);
}

export async function deleteRoute(id: string): Promise<void> {
  await executeD1Query('DELETE FROM routes WHERE id = ?', [id]);
}
