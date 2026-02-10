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
import { upsertCrag, upsertRoute, updateCragRouteCount } from './utils/d1.js';
import type { CragJsonFullData, CragSheetRow, RouteSheetRow } from './types.js';

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

  return {
    status: 'approved',
    id: crag.id || crag.slug,
    name: crag.name,
    nameEn: crag.nameEn,
    slug: crag.slug,
    region: (crag.region as CragSheetRow['region']) || '北部',
    location: crag.address || '',
    latitude: crag.latitude || 0,
    longitude: crag.longitude || 0,
    altitude: undefined,
    rockType: crag.rockType,
    climbingTypes: climbingTypes.join(',') || 'sport',
    difficultyRange,
    description: undefined, // JSON 沒有這個欄位
    accessInfo: crag.approach,
    parkingInfo: crag.parking,
    approachTime: undefined,
    bestSeasons: crag.seasons?.join(','),
    restrictions: undefined,
    coverImage: undefined,
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

async function loadJsonFiles(): Promise<CragJsonFullData[]> {
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

async function migrateToD1(crags: CragJsonFullData[], dryRun: boolean): Promise<void> {
  let totalCrags = 0;
  let totalRoutes = 0;

  for (const cragData of crags) {
    const cragRow = jsonToCragRow(cragData);

    if (dryRun) {
      console.log(`\n[DRY RUN] Would migrate crag: ${cragRow.name} (${cragRow.slug})`);
      console.log(`          - Region: ${cragRow.region}`);
      console.log(`          - Routes: ${cragData.routes.length}`);
      console.log(`          - Types: ${cragRow.climbingTypes}`);
    } else {
      console.log(`\n🔄 Migrating: ${cragRow.name}...`);

      try {
        // Upsert crag
        await upsertCrag(cragRow);
        totalCrags++;
        console.log(`   ✓ Crag created/updated`);

        // Upsert routes
        let routeCount = 0;
        for (const route of cragData.routes) {
          const routeRow = jsonToRouteRow(route, cragRow.slug);
          try {
            await upsertRoute(routeRow, cragRow.id || cragRow.slug);
            routeCount++;
          } catch (error) {
            console.error(`   ✗ Failed to migrate route "${route.name}":`, error instanceof Error ? error.message : error);
          }
        }
        totalRoutes += routeCount;
        console.log(`   ✓ ${routeCount}/${cragData.routes.length} routes migrated`);

        // Update route count
        await updateCragRouteCount(cragRow.id || cragRow.slug);
        console.log(`   ✓ Route count updated`);

      } catch (error) {
        console.error(`   ✗ Failed to migrate crag:`, error instanceof Error ? error.message : error);
      }
    }
  }

  if (!dryRun) {
    console.log(`\n✅ Migration complete: ${totalCrags} crags, ${totalRoutes} routes`);
  }
}

// ============================================
// CLI Entry Point
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('╔════════════════════════════════════════╗');
  console.log('║    JSON → D1 遷移工具 v1.0            ║');
  console.log('╚════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be written\n');
  }

  // Check config (only need Cloudflare config for non-dry-run)
  if (!dryRun) {
    const configErrors = validateConfig().filter(e =>
      e.includes('CLOUDFLARE') || e.includes('D1')
    );
    if (configErrors.length > 0) {
      console.error('❌ Configuration errors:');
      configErrors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }
    console.log(`📊 Database ID: ${config.cloudflare.databaseId}`);
    console.log(`🌍 Environment: ${config.environment}\n`);
  }

  console.log('📂 Loading JSON files...');
  const crags = await loadJsonFiles();

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
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  await migrateToD1(crags, dryRun);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
