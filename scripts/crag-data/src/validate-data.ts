#!/usr/bin/env tsx
/**
 * 資料驗證腳本
 * 驗證 Google Sheets 中的岩場和路線資料
 *
 * Usage:
 *   pnpm validate
 */

import { config, validateConfig } from './config.js';
import { fetchAllSheetData } from './utils/sheets.js';
import { CragSheetRow, AreaSheetRow, RouteSheetRow } from './types.js';
import type { ValidationError, ValidationResult } from './types.js';

// ============================================
// Validation Rules
// ============================================

function validateCrag(crag: CragSheetRow, row: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!crag.name || crag.name.trim() === '') {
    errors.push({ sheet: 'Crags', row, field: 'name', value: crag.name, message: 'Name is required' });
  }

  if (!crag.slug || !/^[a-z0-9-]+$/.test(crag.slug)) {
    errors.push({ sheet: 'Crags', row, field: 'slug', value: crag.slug, message: 'Slug must be lowercase alphanumeric with hyphens' });
  }

  if (!crag.region || !['北部', '中部', '南部', '東部', '離島'].includes(crag.region)) {
    errors.push({ sheet: 'Crags', row, field: 'region', value: crag.region, message: 'Invalid region' });
  }

  if (!crag.location || crag.location.trim() === '') {
    errors.push({ sheet: 'Crags', row, field: 'location', value: crag.location, message: 'Location is required' });
  }

  // Latitude/Longitude validation (Taiwan range)
  if (crag.latitude && (crag.latitude < 21 || crag.latitude > 26)) {
    errors.push({ sheet: 'Crags', row, field: 'latitude', value: crag.latitude, message: 'Latitude must be within Taiwan range (21-26)' });
  }

  if (crag.longitude && (crag.longitude < 119 || crag.longitude > 123)) {
    errors.push({ sheet: 'Crags', row, field: 'longitude', value: crag.longitude, message: 'Longitude must be within Taiwan range (119-123)' });
  }

  // Climbing types validation
  if (crag.climbingTypes) {
    const validTypes = ['sport', 'trad', 'boulder', 'mixed'];
    const types = crag.climbingTypes.split(',').map(t => t.trim());
    const invalidTypes = types.filter(t => !validTypes.includes(t));
    if (invalidTypes.length > 0) {
      errors.push({ sheet: 'Crags', row, field: 'climbingTypes', value: crag.climbingTypes, message: `Invalid climbing types: ${invalidTypes.join(', ')}` });
    }
  }

  // Email validation
  if (crag.submittedBy && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(crag.submittedBy)) {
    errors.push({ sheet: 'Crags', row, field: 'submittedBy', value: crag.submittedBy, message: 'Invalid email format' });
  }

  // URL validation for cover image
  if (crag.coverImage && crag.coverImage.trim() !== '') {
    try {
      new URL(crag.coverImage);
    } catch {
      errors.push({ sheet: 'Crags', row, field: 'coverImage', value: crag.coverImage, message: 'Invalid URL format' });
    }
  }

  return errors;
}

function validateArea(area: AreaSheetRow, row: number, validCragSlugs: Set<string>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!area.name || area.name.trim() === '') {
    errors.push({ sheet: 'Areas', row, field: 'name', value: area.name, message: 'Name is required' });
  }

  if (!area.cragSlug || area.cragSlug.trim() === '') {
    errors.push({ sheet: 'Areas', row, field: 'cragSlug', value: area.cragSlug, message: 'Crag slug is required' });
  } else if (!validCragSlugs.has(area.cragSlug)) {
    errors.push({ sheet: 'Areas', row, field: 'cragSlug', value: area.cragSlug, message: `Crag slug "${area.cragSlug}" does not exist in Crags sheet` });
  }

  if (area.submittedBy && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(area.submittedBy)) {
    errors.push({ sheet: 'Areas', row, field: 'submittedBy', value: area.submittedBy, message: 'Invalid email format' });
  }

  return errors;
}

function validateRoute(route: RouteSheetRow, row: number, validCragSlugs: Set<string>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!route.name || route.name.trim() === '') {
    errors.push({ sheet: 'Routes', row, field: 'name', value: route.name, message: 'Route name is required' });
  }

  if (!route.cragSlug || route.cragSlug.trim() === '') {
    errors.push({ sheet: 'Routes', row, field: 'cragSlug', value: route.cragSlug, message: 'Crag slug is required' });
  } else if (!validCragSlugs.has(route.cragSlug)) {
    errors.push({ sheet: 'Routes', row, field: 'cragSlug', value: route.cragSlug, message: `Crag slug "${route.cragSlug}" does not exist in Crags sheet` });
  }

  if (!route.grade || route.grade.trim() === '') {
    errors.push({ sheet: 'Routes', row, field: 'grade', value: route.grade, message: 'Grade is required' });
  }

  if (!route.gradeSystem || !['yds', 'french', 'v-scale'].includes(route.gradeSystem)) {
    errors.push({ sheet: 'Routes', row, field: 'gradeSystem', value: route.gradeSystem, message: 'Invalid grade system (must be yds, french, or v-scale)' });
  }

  if (!route.routeType || !['sport', 'trad', 'boulder', 'mixed'].includes(route.routeType)) {
    errors.push({ sheet: 'Routes', row, field: 'routeType', value: route.routeType, message: 'Invalid route type' });
  }

  if (route.submittedBy && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(route.submittedBy)) {
    errors.push({ sheet: 'Routes', row, field: 'submittedBy', value: route.submittedBy, message: 'Invalid email format' });
  }

  return errors;
}

// ============================================
// Main Validation Function
// ============================================

async function validateSheetData(): Promise<ValidationResult> {
  console.log('🔍 Fetching data from Google Sheets...\n');

  const data = await fetchAllSheetData();

  const errors: ValidationError[] = [];
  const stats = {
    crags: { total: 0, approved: 0, pending: 0 },
    areas: { total: 0, approved: 0, pending: 0 },
    routes: { total: 0, approved: 0, pending: 0 },
  };

  // Build valid crag slugs set (only approved or pending)
  const validCragSlugs = new Set<string>();

  // Validate crags
  console.log('📍 Validating Crags...');
  for (const { row, data: crag } of data.crags) {
    stats.crags.total++;
    if (crag.status === 'approved') stats.crags.approved++;
    if (crag.status === 'pending') stats.crags.pending++;

    // Add to valid slugs if approved or pending
    if (['approved', 'pending'].includes(crag.status) && crag.slug) {
      validCragSlugs.add(crag.slug);
    }

    // Only validate approved/pending entries
    if (['approved', 'pending'].includes(crag.status)) {
      errors.push(...validateCrag(crag, row));
    }
  }

  // Validate areas
  console.log('🏔️  Validating Areas...');
  for (const { row, data: area } of data.areas) {
    stats.areas.total++;
    if (area.status === 'approved') stats.areas.approved++;
    if (area.status === 'pending') stats.areas.pending++;

    if (['approved', 'pending'].includes(area.status)) {
      errors.push(...validateArea(area, row, validCragSlugs));
    }
  }

  // Validate routes
  console.log('🧗 Validating Routes...');
  for (const { row, data: route } of data.routes) {
    stats.routes.total++;
    if (route.status === 'approved') stats.routes.approved++;
    if (route.status === 'pending') stats.routes.pending++;

    if (['approved', 'pending'].includes(route.status)) {
      errors.push(...validateRoute(route, row, validCragSlugs));
    }
  }

  return {
    success: errors.length === 0,
    errors,
    stats,
  };
}

// ============================================
// CLI Entry Point
// ============================================

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║    岩場資料驗證工具 v1.0              ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Check config
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    console.error('❌ Configuration errors:');
    configErrors.forEach(err => console.error(`   - ${err}`));
    console.log('\n📝 Please copy .env.example to .env and fill in the values.');
    process.exit(1);
  }

  console.log(`📊 Spreadsheet ID: ${config.sheets.spreadsheetId}\n`);

  try {
    const result = await validateSheetData();

    // Print statistics
    console.log('\n📊 Statistics:');
    console.log('┌─────────┬───────┬──────────┬─────────┐');
    console.log('│  Sheet  │ Total │ Approved │ Pending │');
    console.log('├─────────┼───────┼──────────┼─────────┤');
    console.log(`│ Crags   │ ${String(result.stats.crags.total).padStart(5)} │ ${String(result.stats.crags.approved).padStart(8)} │ ${String(result.stats.crags.pending).padStart(7)} │`);
    console.log(`│ Areas   │ ${String(result.stats.areas.total).padStart(5)} │ ${String(result.stats.areas.approved).padStart(8)} │ ${String(result.stats.areas.pending).padStart(7)} │`);
    console.log(`│ Routes  │ ${String(result.stats.routes.total).padStart(5)} │ ${String(result.stats.routes.approved).padStart(8)} │ ${String(result.stats.routes.pending).padStart(7)} │`);
    console.log('└─────────┴───────┴──────────┴─────────┘');

    if (result.success) {
      console.log('\n✅ All data is valid!');
      process.exit(0);
    } else {
      console.log(`\n❌ Found ${result.errors.length} validation errors:\n`);

      // Group errors by sheet
      const groupedErrors: Record<string, ValidationError[]> = {};
      for (const error of result.errors) {
        if (!groupedErrors[error.sheet]) {
          groupedErrors[error.sheet] = [];
        }
        groupedErrors[error.sheet].push(error);
      }

      for (const [sheet, sheetErrors] of Object.entries(groupedErrors)) {
        console.log(`📋 ${sheet}:`);
        for (const error of sheetErrors) {
          console.log(`   Row ${error.row}: [${error.field}] ${error.message}`);
          if (error.value !== undefined && error.value !== '') {
            console.log(`           Value: "${error.value}"`);
          }
        }
        console.log('');
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
