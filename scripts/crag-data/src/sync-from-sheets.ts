#!/usr/bin/env tsx
/**
 * Google Sheets → D1 同步腳本
 * 將已審核通過的資料同步到 D1 資料庫
 *
 * Usage:
 *   pnpm sync               # 執行同步
 *   pnpm sync --dry-run     # 預覽模式
 *   pnpm sync --crags-only  # 只同步岩場
 *   pnpm sync --routes-only # 只同步路線
 */

import { config, validateConfig } from './config.js';
import { fetchAllSheetData, appendToAuditLog, updateSheetCell } from './utils/sheets.js';
import { upsertCrag, upsertRoute, updateCragRouteCount, getCragBySlug } from './utils/d1.js';
import type { SyncResult } from './types.js';

// ============================================
// Sync Logic
// ============================================

interface SyncOptions {
  dryRun: boolean;
  cragsOnly: boolean;
  routesOnly: boolean;
}

async function syncApprovedData(options: SyncOptions): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: true,
    synced: { crags: 0, areas: 0, routes: 0 },
    errors: [],
    duration: 0,
  };

  console.log('🔍 Fetching data from Google Sheets...\n');
  const data = await fetchAllSheetData();

  // Filter approved entries
  const approvedCrags = data.crags.filter(c => c.data.status === 'approved');
  const approvedRoutes = data.routes.filter(r => r.data.status === 'approved');

  console.log(`📊 Found ${approvedCrags.length} approved crags, ${approvedRoutes.length} approved routes\n`);

  // Build crag slug to ID mapping
  const cragSlugToId = new Map<string, string>();

  // Sync crags
  if (!options.routesOnly) {
    console.log('📍 Syncing Crags...');

    for (const { row, data: crag } of approvedCrags) {
      const cragId = crag.id || crag.slug;
      cragSlugToId.set(crag.slug, cragId);

      if (options.dryRun) {
        console.log(`   [DRY RUN] Would sync crag: ${crag.name} (${crag.slug})`);
        result.synced.crags++;
        continue;
      }

      try {
        await upsertCrag(crag);
        result.synced.crags++;
        console.log(`   ✓ Synced: ${crag.name}`);

        // Update ID in sheet if it was auto-generated
        if (!crag.id) {
          await updateSheetCell(`Crags!B${row}`, cragId);
        }
      } catch (error) {
        const message = `Failed to sync crag "${crag.name}": ${error instanceof Error ? error.message : error}`;
        result.errors.push(message);
        console.error(`   ✗ ${message}`);
      }
    }

    console.log(`   Total: ${result.synced.crags} crags synced\n`);
  }

  // Sync routes
  if (!options.cragsOnly) {
    console.log('🧗 Syncing Routes...');

    // Group routes by crag
    const routesByCrag = new Map<string, typeof approvedRoutes>();
    for (const routeEntry of approvedRoutes) {
      const cragSlug = routeEntry.data.cragSlug;
      if (!routesByCrag.has(cragSlug)) {
        routesByCrag.set(cragSlug, []);
      }
      routesByCrag.get(cragSlug)!.push(routeEntry);
    }

    for (const [cragSlug, routes] of routesByCrag) {
      // Get crag ID
      let cragId = cragSlugToId.get(cragSlug);

      if (!cragId && !options.dryRun) {
        // Try to get from database
        const existingCrag = await getCragBySlug(cragSlug);
        if (existingCrag) {
          cragId = existingCrag.id;
          cragSlugToId.set(cragSlug, cragId);
        } else {
          const message = `Crag "${cragSlug}" not found in database. Skipping ${routes.length} routes.`;
          result.errors.push(message);
          console.error(`   ✗ ${message}`);
          continue;
        }
      }

      cragId = cragId || cragSlug; // Fallback for dry run

      console.log(`   📍 ${cragSlug}: ${routes.length} routes`);

      for (const { row, data: route } of routes) {
        if (options.dryRun) {
          console.log(`      [DRY RUN] Would sync route: ${route.name} (${route.grade})`);
          result.synced.routes++;
          continue;
        }

        try {
          await upsertRoute(route, cragId);
          result.synced.routes++;

          // Update ID in sheet if it was auto-generated
          if (!route.id) {
            const routeId = `${cragSlug}-route-${Date.now()}`;
            await updateSheetCell(`Routes!B${row}`, routeId);
          }
        } catch (error) {
          const message = `Failed to sync route "${route.name}": ${error instanceof Error ? error.message : error}`;
          result.errors.push(message);
          console.error(`      ✗ ${message}`);
        }
      }

      // Update crag route count
      if (!options.dryRun && cragId) {
        try {
          await updateCragRouteCount(cragId);
        } catch {
          // Ignore count update errors
        }
      }
    }

    console.log(`   Total: ${result.synced.routes} routes synced\n`);
  }

  // Log to audit
  if (!options.dryRun && (result.synced.crags > 0 || result.synced.routes > 0)) {
    try {
      await appendToAuditLog({
        action: 'sync',
        entityType: 'batch',
        entityId: `sync-${Date.now()}`,
        entityName: 'Batch Sync',
        operator: 'system',
        changes: {
          crags: result.synced.crags,
          routes: result.synced.routes,
        },
        notes: `Synced ${result.synced.crags} crags and ${result.synced.routes} routes`,
      });
    } catch {
      // Ignore audit log errors
    }
  }

  result.duration = Date.now() - startTime;
  result.success = result.errors.length === 0;

  return result;
}

// ============================================
// CLI Entry Point
// ============================================

async function main() {
  const args = process.argv.slice(2);

  const options: SyncOptions = {
    dryRun: args.includes('--dry-run'),
    cragsOnly: args.includes('--crags-only'),
    routesOnly: args.includes('--routes-only'),
  };

  console.log('╔════════════════════════════════════════╗');
  console.log('║    Sheets → D1 同步工具 v1.0          ║');
  console.log('╚════════════════════════════════════════╝\n');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be written\n');
  }

  if (options.cragsOnly && options.routesOnly) {
    console.error('❌ Cannot use --crags-only and --routes-only together');
    process.exit(1);
  }

  // Check config
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    console.error('❌ Configuration errors:');
    configErrors.forEach(err => console.error(`   - ${err}`));
    console.log('\n📝 Please copy .env.example to .env and fill in the values.');
    process.exit(1);
  }

  console.log(`📊 Spreadsheet ID: ${config.sheets.spreadsheetId}`);
  console.log(`📊 Database ID: ${config.cloudflare.databaseId}`);
  console.log(`🌍 Environment: ${config.environment}\n`);

  if (options.cragsOnly) {
    console.log('📍 Mode: Crags only\n');
  } else if (options.routesOnly) {
    console.log('🧗 Mode: Routes only\n');
  }

  try {
    const result = await syncApprovedData(options);

    // Print summary
    console.log('═══════════════════════════════════════');
    console.log('📊 Sync Summary:');
    console.log(`   Crags synced:  ${result.synced.crags}`);
    console.log(`   Routes synced: ${result.synced.routes}`);
    console.log(`   Duration:      ${(result.duration / 1000).toFixed(2)}s`);

    if (result.errors.length > 0) {
      console.log(`\n❌ ${result.errors.length} errors occurred:`);
      result.errors.forEach(err => console.log(`   - ${err}`));
      process.exit(1);
    } else {
      console.log('\n✅ Sync completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
