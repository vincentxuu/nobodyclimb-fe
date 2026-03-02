#!/usr/bin/env tsx
/**
 * JSON → D1 遷移腳本 (岩館資料)
 * 將現有的 gyms.json 靜態資料遷移到 D1 資料庫
 *
 * Usage:
 *   pnpm migrate:json           # 執行遷移
 *   pnpm migrate:json --dry-run # 預覽模式
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { upsertGym, buildGymSQL, executeBatchD1Query } from './utils/d1.js';
import type { GymJsonData, GymsJsonFile } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================
// Migration Logic
// ============================================

function loadGymsJson(): GymJsonData[] {
  const dataPath = join(__dirname, config.jsonDataPath, 'gyms.json');

  try {
    const content = readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(content) as GymsJsonFile;

    if (!data.gyms || !Array.isArray(data.gyms)) {
      console.error('❌ Invalid gyms.json format: missing "gyms" array');
      process.exit(1);
    }

    console.log(`   ✓ Loaded gyms.json (${data.gyms.length} gyms)`);
    return data.gyms;
  } catch (error) {
    console.error(`❌ Failed to load gyms.json:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function migrateToD1(gyms: GymJsonData[], dryRun: boolean): void {
  let totalGyms = 0;

  if (dryRun) {
    console.log('\n[DRY RUN] Would migrate the following gyms:\n');

    for (const gym of gyms) {
      console.log(`   - ${gym.name} (${gym.slug})`);
      console.log(`     Region: ${gym.location.region}, City: ${gym.location.city}`);
      console.log(`     Type: ${gym.type}`);
      console.log(`     Featured: ${gym.featured ? 'Yes' : 'No'}`);
      console.log();
    }

    console.log(`\n📊 Total: ${gyms.length} gyms would be migrated`);
    return;
  }

  console.log('\n🔄 Starting migration...\n');

  // Build all SQL statements
  const sqlStatements: string[] = [];
  for (const gym of gyms) {
    sqlStatements.push(buildGymSQL(gym));
  }

  // Execute batch
  const { success, failed } = executeBatchD1Query(sqlStatements, 20);
  totalGyms = success;

  if (failed > 0) {
    console.log(`\n⚠️  Migration completed with errors: ${totalGyms}/${gyms.length} gyms migrated (${failed} failed)`);
  } else {
    console.log(`\n✅ Migration complete: ${totalGyms} gyms successfully migrated`);
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
  console.log('║    岩館 JSON → D1 遷移工具 v1.0       ║');
  console.log('╚════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be written\n');
  } else {
    console.log(`🌍 Environment: ${config.environment}`);
    console.log(`📂 Backend path: ${config.backendPath}\n`);
  }

  console.log('📂 Loading gyms.json...');
  const gyms = loadGymsJson();

  if (gyms.length === 0) {
    console.log('\n⚠️  No gyms found to migrate.');
    process.exit(0);
  }

  // Summary
  console.log('\n📋 Migration Summary:');
  console.log('┌────────────────────────────────┬────────────┬──────────┐');
  console.log('│ Gym Name                       │ City       │ Type     │');
  console.log('├────────────────────────────────┼────────────┼──────────┤');

  for (const gym of gyms) {
    const name = gym.name.padEnd(30).slice(0, 30);
    const city = (gym.location.city || '-').padEnd(10).slice(0, 10);
    const type = (gym.type || '-').padEnd(8).slice(0, 8);
    console.log(`│ ${name} │ ${city} │ ${type} │`);
  }
  console.log('└────────────────────────────────┴────────────┴──────────┘');

  // Count by region
  const regionCounts = gyms.reduce((acc, gym) => {
    const region = gym.location.region || '其他';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📊 By Region:');
  for (const [region, count] of Object.entries(regionCounts)) {
    console.log(`   ${region}: ${count} gyms`);
  }

  if (!dryRun) {
    console.log('\n⚠️  This will write data to the D1 database.');
    console.log('   Press Ctrl+C within 3 seconds to cancel...');
    sleep(3000);
  }

  migrateToD1(gyms, dryRun);
}

try {
  main();
} catch (error) {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
}
