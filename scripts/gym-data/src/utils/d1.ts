import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';
import type { GymDB, GymJsonData } from '../types.js';

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
// Gym CRUD
// ============================================

function gymJsonToDb(gym: GymJsonData): Partial<GymDB> {
  return {
    id: gym.id,
    name: gym.name,
    slug: gym.slug,
    description: gym.description || null,
    address: gym.location.address || null,
    city: gym.location.city || null,
    region: gym.location.region || null,
    latitude: gym.location.latitude || null,
    longitude: gym.location.longitude || null,
    phone: gym.contact?.phone || null,
    email: gym.contact?.email || null,
    website: gym.contact?.website || null,
    cover_image: gym.coverImage || null,
    is_featured: gym.featured ? 1 : 0,
    opening_hours: gym.openingHours ? JSON.stringify(gym.openingHours) : null,
    facilities: gym.facilities ? JSON.stringify(gym.facilities) : null,
    price_info: gym.pricing ? JSON.stringify(gym.pricing) : null,
    rating_avg: gym.rating || 0,
  };
}

export function upsertGym(gym: GymJsonData): void {
  const dbGym = gymJsonToDb(gym);

  const sql = `
    INSERT INTO gyms (
      id, name, slug, description, address, city, region,
      latitude, longitude, phone, email, website, cover_image,
      is_featured, opening_hours, facilities, price_info, rating_avg,
      created_at, updated_at
    ) VALUES (
      ${escapeSQL(dbGym.id)}, ${escapeSQL(dbGym.name)}, ${escapeSQL(dbGym.slug)},
      ${escapeSQL(dbGym.description)}, ${escapeSQL(dbGym.address)}, ${escapeSQL(dbGym.city)},
      ${escapeSQL(dbGym.region)}, ${escapeSQL(dbGym.latitude)}, ${escapeSQL(dbGym.longitude)},
      ${escapeSQL(dbGym.phone)}, ${escapeSQL(dbGym.email)}, ${escapeSQL(dbGym.website)},
      ${escapeSQL(dbGym.cover_image)}, ${escapeSQL(dbGym.is_featured)},
      ${escapeSQL(dbGym.opening_hours)}, ${escapeSQL(dbGym.facilities)},
      ${escapeSQL(dbGym.price_info)}, ${escapeSQL(dbGym.rating_avg)},
      datetime('now'), datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      address = excluded.address,
      city = excluded.city,
      region = excluded.region,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      phone = excluded.phone,
      email = excluded.email,
      website = excluded.website,
      cover_image = excluded.cover_image,
      is_featured = excluded.is_featured,
      opening_hours = excluded.opening_hours,
      facilities = excluded.facilities,
      price_info = excluded.price_info,
      rating_avg = excluded.rating_avg,
      updated_at = datetime('now')
  `.replace(/\n/g, ' ');

  executeD1Query(sql);
}

/**
 * 生成岩館 INSERT SQL（不執行）- 用於批量處理
 */
export function buildGymSQL(gym: GymJsonData): string {
  const dbGym = gymJsonToDb(gym);

  return `
    INSERT INTO gyms (
      id, name, slug, description, address, city, region,
      latitude, longitude, phone, email, website, cover_image,
      is_featured, opening_hours, facilities, price_info, rating_avg,
      created_at, updated_at
    ) VALUES (
      ${escapeSQL(dbGym.id)}, ${escapeSQL(dbGym.name)}, ${escapeSQL(dbGym.slug)},
      ${escapeSQL(dbGym.description)}, ${escapeSQL(dbGym.address)}, ${escapeSQL(dbGym.city)},
      ${escapeSQL(dbGym.region)}, ${escapeSQL(dbGym.latitude)}, ${escapeSQL(dbGym.longitude)},
      ${escapeSQL(dbGym.phone)}, ${escapeSQL(dbGym.email)}, ${escapeSQL(dbGym.website)},
      ${escapeSQL(dbGym.cover_image)}, ${escapeSQL(dbGym.is_featured)},
      ${escapeSQL(dbGym.opening_hours)}, ${escapeSQL(dbGym.facilities)},
      ${escapeSQL(dbGym.price_info)}, ${escapeSQL(dbGym.rating_avg)},
      datetime('now'), datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      address = excluded.address,
      city = excluded.city,
      region = excluded.region,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      phone = excluded.phone,
      email = excluded.email,
      website = excluded.website,
      cover_image = excluded.cover_image,
      is_featured = excluded.is_featured,
      opening_hours = excluded.opening_hours,
      facilities = excluded.facilities,
      price_info = excluded.price_info,
      rating_avg = excluded.rating_avg,
      updated_at = datetime('now')
  `.replace(/\n/g, ' ').trim();
}

// ============================================
// Query functions
// ============================================

export function getAllGyms(): GymDB[] {
  const result = executeD1Query('SELECT * FROM gyms ORDER BY name');
  return result.results as unknown as GymDB[];
}

export function getGymBySlug(slug: string): GymDB | null {
  const result = executeD1Query(`SELECT * FROM gyms WHERE slug = ${escapeSQL(slug)}`);
  return (result.results[0] as unknown as GymDB) || null;
}

export function deleteGym(id: string): void {
  executeD1Query(`DELETE FROM gyms WHERE id = ${escapeSQL(id)}`);
}
