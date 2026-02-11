#!/usr/bin/env tsx
/**
 * JSON → D1 遷移腳本
 * 將現有的 JSON 靜態資料遷移到 D1 資料庫
 *
 * Usage:
 *   pnpm migrate:json           # 執行遷移
 *   pnpm migrate:json --dry-run # 預覽模式
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config, validateConfig } from './config.js';
import {
  upsertCrag,
  upsertRoute,
  updateCragRouteCount,
  upsertArea,
  upsertSector,
  buildRouteSQL,
  executeBatchD1Query,
  updateCragMetadata,
  type CragMetadataUpdate,
} from './utils/d1.js';
import type { CragJsonFullData, CragSheetRow, RouteSheetRow, CragJsonArea, CragJsonSector } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================
// JSON to Sheet Row Converters
// ============================================

function jsonToCragRow(json: CragJsonFullData): CragSheetRow {
  const crag = json.crag;

  // Determine climbing types from routes
  const routeTypes = new Set(json.routes.map(r => r.type?.toLowerCase() || 'sport'));
  const climbingTypes = Array.from(routeTypes).filter(t =>
    ['sport', 'trad', 'boulder', 'mixed'].includes(t)
  );

  // Calculate difficulty range from routes
  let difficultyRange = '';
  if (crag.difficulty) {
    difficultyRange = `${crag.difficulty.min}-${crag.difficulty.max}`;
  }

  // Handle nested location object or flat fields
  const location = crag.location || {};
  const region = location.region || crag.region || '北部';
  const address = location.address || crag.address || '';
  const latitude = location.latitude || crag.latitude || 0;
  const longitude = location.longitude || crag.longitude || 0;

  // Handle nested access object or flat fields
  const access = crag.access || {};
  const approach = access.approach || crag.approach;
  const parking = access.parking || crag.parking;

  return {
    status: 'approved',
    id: crag.id || crag.slug,
    name: crag.name,
    nameEn: crag.nameEn,
    slug: crag.slug,
    region: region as CragSheetRow['region'],
    location: address,
    latitude,
    longitude,
    altitude: undefined,
    rockType: crag.rockType,
    climbingTypes: climbingTypes.join(',') || 'sport',
    difficultyRange,
    description: crag.description,
    accessInfo: approach,
    parkingInfo: parking,
    approachTime: undefined,
    bestSeasons: crag.seasons?.join(','),
    restrictions: undefined,
    coverImage: crag.images?.[0],
    isFeatured: crag.featured || false,
    submittedBy: 'migration@nobodyclimb.cc',
    submittedAt: new Date().toISOString(),
    reviewedBy: 'migration@nobodyclimb.cc',
    reviewedAt: new Date().toISOString(),
    reviewNotes: 'Migrated from static JSON',
  };
}

function jsonToRouteRow(
  route: CragJsonFullData['routes'][0],
  cragSlug: string
): RouteSheetRow {
  // Determine grade system based on grade format
  let gradeSystem: RouteSheetRow['gradeSystem'] = 'yds';
  if (route.grade.startsWith('V')) {
    gradeSystem = 'v-scale';
  } else if (/^\d+[a-c]?\+?$/.test(route.grade)) {
    gradeSystem = 'french';
  }

  // Map route type
  let routeType: RouteSheetRow['routeType'] = 'sport';
  const type = route.type?.toLowerCase();
  if (type === 'trad' || type === 'traditional') {
    routeType = 'trad';
  } else if (type === 'boulder' || type === 'bouldering') {
    routeType = 'boulder';
  } else if (type === 'mixed') {
    routeType = 'mixed';
  }

  return {
    status: 'approved',
    id: route.id || `${cragSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cragSlug,
    areaId: route.areaId,
    sector: route.sector,
    name: route.name,
    grade: route.grade,
    gradeSystem,
    routeType,
    length: route.length,
    boltCount: route.boltCount,
    boltType: route.boltType,
    anchorType: route.anchorType,
    description: route.description,
    firstAscent: route.firstAscent,
    firstAscentDate: route.firstAscentDate,
    protection: route.protection,
    tips: route.tips,
    submittedBy: 'migration@nobodyclimb.cc',
    submittedAt: new Date().toISOString(),
  };
}

// ============================================
// Migration Logic
// ============================================

function loadJsonFiles(): CragJsonFullData[] {
  const dataPath = join(__dirname, config.jsonDataPath);

  let files: string[];
  try {
    files = readdirSync(dataPath).filter(f => f.endsWith('.json'));
  } catch {
    console.error(`❌ Cannot read directory: ${dataPath}`);
    console.log('   Make sure the path is correct in config.ts');
    process.exit(1);
  }

  const crags: CragJsonFullData[] = [];

  for (const file of files) {
    const filePath = join(dataPath, file);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as CragJsonFullData;
      crags.push(data);
      console.log(`   ✓ Loaded ${file} (${data.routes.length} routes)`);
    } catch (error) {
      console.error(`   ✗ Failed to load ${file}:`, error instanceof Error ? error.message : error);
    }
  }

  return crags;
}

// Build sector name → sector ID mapping for a crag
function buildSectorNameToIdMap(areas: CragJsonArea[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const area of areas) {
    if (area.sectors) {
      for (const sector of area.sectors as CragJsonSector[]) {
        // Map by sector name (用於 route.sector 文字比對)
        map.set(sector.name, sector.id);
        // Also map by sector ID in case route uses ID
        map.set(sector.id, sector.id);
      }
    }
  }
  return map;
}

// Build sector ID → area ID mapping
function buildSectorToAreaMap(areas: CragJsonArea[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const area of areas) {
    if (area.sectors) {
      for (const sector of area.sectors as CragJsonSector[]) {
        map.set(sector.id, area.id);
      }
    }
  }
  return map;
}

function migrateToD1(crags: CragJsonFullData[], dryRun: boolean): void {
  let totalCrags = 0;
  let totalAreas = 0;
  let totalSectors = 0;
  let totalRoutes = 0;

  for (const cragData of crags) {
    const cragRow = jsonToCragRow(cragData);
    const cragId = cragRow.id || cragRow.slug;
    const areas = cragData.areas || [];

    // Build lookup maps
    const sectorNameToId = buildSectorNameToIdMap(areas);
    const sectorToArea = buildSectorToAreaMap(areas);

    if (dryRun) {
      console.log(`\n[DRY RUN] Would migrate crag: ${cragRow.name} (${cragRow.slug})`);
      console.log(`          - Region: ${cragRow.region}`);
      console.log(`          - Areas: ${areas.length}`);
      console.log(`          - Routes: ${cragData.routes.length}`);
      console.log(`          - Types: ${cragRow.climbingTypes}`);

      // Show areas and sectors
      for (const area of areas) {
        const sectors = (area.sectors as CragJsonSector[]) || [];
        console.log(`          - Area: ${area.name} (${sectors.length} sectors)`);
      }
    } else {
      console.log(`\n🔄 Migrating: ${cragRow.name}...`);

      try {
        // 1. Upsert crag
        upsertCrag(cragRow);
        totalCrags++;
        console.log(`   ✓ Crag created/updated`);

        // 2. Upsert areas
        let areaCount = 0;
        for (let i = 0; i < areas.length; i++) {
          const area = areas[i];
          try {
            upsertArea(area, cragId, i);
            areaCount++;

            // 3. Upsert sectors for this area
            const sectors = (area.sectors as CragJsonSector[]) || [];
            for (let j = 0; j < sectors.length; j++) {
              const sector = sectors[j];
              try {
                upsertSector(sector, area.id, j);
                totalSectors++;
              } catch (error) {
                console.error(`   ✗ Failed to migrate sector "${sector.name}":`, error instanceof Error ? error.message : error);
              }
            }
          } catch (error) {
            console.error(`   ✗ Failed to migrate area "${area.name}":`, error instanceof Error ? error.message : error);
          }
        }
        totalAreas += areaCount;
        console.log(`   ✓ ${areaCount} areas migrated`);

        // 4. Batch upsert routes with proper foreign keys
        const routeSQLs: string[] = [];
        for (const route of cragData.routes) {
          const routeRow = jsonToRouteRow(route, cragRow.slug);

          // Resolve area_id and sector_id
          let areaId: string | null = route.areaId || null;
          let sectorId: string | null = null;

          // Try to find sector ID from sector name
          if (route.sector) {
            const foundSectorId = sectorNameToId.get(route.sector);
            if (foundSectorId) {
              sectorId = foundSectorId;
              // If areaId not set, derive from sector
              if (!areaId) {
                areaId = sectorToArea.get(foundSectorId) || null;
              }
            }
          }

          routeSQLs.push(buildRouteSQL(routeRow, cragId, areaId, sectorId));
        }

        // 批量執行路線 SQL（每批 50 條）
        const { success: routeCount, failed: routeFailed } = executeBatchD1Query(routeSQLs, 50);
        totalRoutes += routeCount;
        if (routeFailed > 0) {
          console.log(`   ⚠ ${routeCount}/${cragData.routes.length} routes migrated (${routeFailed} failed)`);
        } else {
          console.log(`   ✓ ${routeCount}/${cragData.routes.length} routes migrated`);
        }

        // 5. Update route count
        updateCragRouteCount(cragId);
        console.log(`   ✓ Route count updated`);

        // 6. Update metadata fields (if present in JSON)
        const cragJson = cragData.crag;
        const metadataJson = cragData.metadata;
        const accessJson = cragJson.access;

        const metadataUpdate: CragMetadataUpdate = {
          metadataSource: metadataJson?.source || null,
          metadataSourceUrl: metadataJson?.sourceUrl || null,
          metadataMaintainer: metadataJson?.maintainer || null,
          metadataMaintainerUrl: metadataJson?.maintainerUrl || null,
          liveVideoId: cragJson.liveVideoId || null,
          liveVideoTitle: cragJson.liveVideoTitle || null,
          liveVideoDescription: cragJson.liveVideoDescription || null,
          transportation: accessJson?.transportation || null,
          amenities: cragJson.amenities || null,
          googleMapsUrl: cragJson.location?.googleMapsUrl || cragJson.googleMapsUrl || null,
          ratingAvg: cragJson.rating || null,
          heightMin: cragJson.height?.min || null,
          heightMax: cragJson.height?.max || null,
        };

        // 只有有值才更新
        const hasMetadata = Object.values(metadataUpdate).some(v => v !== null);
        if (hasMetadata) {
          updateCragMetadata(cragId, metadataUpdate);
          console.log(`   ✓ Metadata updated`);
        }

      } catch (error) {
        console.error(`   ✗ Failed to migrate crag:`, error instanceof Error ? error.message : error);
      }
    }
  }

  if (!dryRun) {
    console.log(`\n✅ Migration complete: ${totalCrags} crags, ${totalAreas} areas, ${totalSectors} sectors, ${totalRoutes} routes`);
  }
}

// ============================================
// CLI Entry Point
// ============================================

function sleep(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy wait
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('╔════════════════════════════════════════╗');
  console.log('║    JSON → D1 遷移工具 v1.0            ║');
  console.log('╚════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be written\n');
  } else {
    console.log(`🌍 Environment: ${config.environment}`);
    console.log(`📂 Backend path: ${config.backendPath}\n`);
  }

  console.log('📂 Loading JSON files...');
  const crags = loadJsonFiles();

  if (crags.length === 0) {
    console.log('\n⚠️  No JSON files found to migrate.');
    process.exit(0);
  }

  console.log(`\n📊 Found ${crags.length} crags with ${crags.reduce((sum, c) => sum + c.routes.length, 0)} total routes`);

  // Summary
  console.log('\n📋 Migration Summary:');
  console.log('┌─────────────────┬────────┬────────┐');
  console.log('│ Crag            │ Routes │ Region │');
  console.log('├─────────────────┼────────┼────────┤');
  for (const crag of crags) {
    const name = crag.crag.name.padEnd(15).slice(0, 15);
    const routes = String(crag.routes.length).padStart(6);
    const region = (crag.crag.region || '北部').padEnd(6);
    console.log(`│ ${name} │ ${routes} │ ${region} │`);
  }
  console.log('└─────────────────┴────────┴────────┘');

  if (!dryRun) {
    console.log('\n⚠️  This will write data to the D1 database.');
    console.log('   Press Ctrl+C within 3 seconds to cancel...');
    sleep(3000);
  }

  migrateToD1(crags, dryRun);
}

try {
  main();
} catch (error) {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
}
