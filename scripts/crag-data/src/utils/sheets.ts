import { google, sheets_v4 } from 'googleapis';
import { config, CRAG_COLUMNS, AREA_COLUMNS, ROUTE_COLUMNS } from '../config.js';
import type { CragSheetRow, AreaSheetRow, RouteSheetRow } from '../types.js';

let sheetsClient: sheets_v4.Sheets | null = null;

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    credentials: config.sheets.credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

export async function fetchSheetData(range: string): Promise<string[][]> {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheets.spreadsheetId,
    range,
  });

  return (response.data.values as string[][]) || [];
}

export async function updateSheetCell(
  range: string,
  value: string
): Promise<void> {
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.sheets.spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[value]],
    },
  });
}

export async function appendToAuditLog(entry: {
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  operator: string;
  changes?: Record<string, unknown>;
  notes?: string;
}): Promise<void> {
  const sheets = await getSheetsClient();

  const row = [
    new Date().toISOString(),
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.entityName,
    entry.operator,
    entry.changes ? JSON.stringify(entry.changes) : '',
    entry.notes || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.sheets.spreadsheetId,
    range: 'AuditLog!A:H',
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });
}

// Parse row data into typed objects
export function parseCragRow(row: string[]): CragSheetRow {
  return {
    status: (row[CRAG_COLUMNS.status] || 'draft') as CragSheetRow['status'],
    id: row[CRAG_COLUMNS.id] || undefined,
    name: row[CRAG_COLUMNS.name] || '',
    nameEn: row[CRAG_COLUMNS.nameEn] || undefined,
    slug: row[CRAG_COLUMNS.slug] || '',
    region: (row[CRAG_COLUMNS.region] || '北部') as CragSheetRow['region'],
    location: row[CRAG_COLUMNS.location] || '',
    latitude: parseFloat(row[CRAG_COLUMNS.latitude]) || 0,
    longitude: parseFloat(row[CRAG_COLUMNS.longitude]) || 0,
    altitude: row[CRAG_COLUMNS.altitude] ? parseInt(row[CRAG_COLUMNS.altitude]) : undefined,
    rockType: row[CRAG_COLUMNS.rockType] || undefined,
    climbingTypes: row[CRAG_COLUMNS.climbingTypes] || '',
    difficultyRange: row[CRAG_COLUMNS.difficultyRange] || undefined,
    description: row[CRAG_COLUMNS.description] || undefined,
    accessInfo: row[CRAG_COLUMNS.accessInfo] || undefined,
    parkingInfo: row[CRAG_COLUMNS.parkingInfo] || undefined,
    approachTime: row[CRAG_COLUMNS.approachTime] ? parseInt(row[CRAG_COLUMNS.approachTime]) : undefined,
    bestSeasons: row[CRAG_COLUMNS.bestSeasons] || undefined,
    restrictions: row[CRAG_COLUMNS.restrictions] || undefined,
    coverImage: row[CRAG_COLUMNS.coverImage] || undefined,
    isFeatured: row[CRAG_COLUMNS.isFeatured]?.toLowerCase() === 'true',
    submittedBy: row[CRAG_COLUMNS.submittedBy] || '',
    submittedAt: row[CRAG_COLUMNS.submittedAt] || '',
    reviewedBy: row[CRAG_COLUMNS.reviewedBy] || undefined,
    reviewedAt: row[CRAG_COLUMNS.reviewedAt] || undefined,
    reviewNotes: row[CRAG_COLUMNS.reviewNotes] || undefined,
  };
}

export function parseAreaRow(row: string[]): AreaSheetRow {
  return {
    status: (row[AREA_COLUMNS.status] || 'draft') as AreaSheetRow['status'],
    id: row[AREA_COLUMNS.id] || undefined,
    cragSlug: row[AREA_COLUMNS.cragSlug] || '',
    name: row[AREA_COLUMNS.name] || '',
    nameEn: row[AREA_COLUMNS.nameEn] || undefined,
    description: row[AREA_COLUMNS.description] || undefined,
    difficultyMin: row[AREA_COLUMNS.difficultyMin] || undefined,
    difficultyMax: row[AREA_COLUMNS.difficultyMax] || undefined,
    boltCount: row[AREA_COLUMNS.boltCount] ? parseInt(row[AREA_COLUMNS.boltCount]) : undefined,
    image: row[AREA_COLUMNS.image] || undefined,
    submittedBy: row[AREA_COLUMNS.submittedBy] || '',
    submittedAt: row[AREA_COLUMNS.submittedAt] || '',
  };
}

export function parseRouteRow(row: string[]): RouteSheetRow {
  return {
    status: (row[ROUTE_COLUMNS.status] || 'draft') as RouteSheetRow['status'],
    id: row[ROUTE_COLUMNS.id] || undefined,
    cragSlug: row[ROUTE_COLUMNS.cragSlug] || '',
    areaId: row[ROUTE_COLUMNS.areaId] || undefined,
    sector: row[ROUTE_COLUMNS.sector] || undefined,
    name: row[ROUTE_COLUMNS.name] || '',
    grade: row[ROUTE_COLUMNS.grade] || '',
    gradeSystem: (row[ROUTE_COLUMNS.gradeSystem] || 'yds') as RouteSheetRow['gradeSystem'],
    routeType: (row[ROUTE_COLUMNS.routeType] || 'sport') as RouteSheetRow['routeType'],
    length: row[ROUTE_COLUMNS.length] ? parseInt(row[ROUTE_COLUMNS.length]) : undefined,
    boltCount: row[ROUTE_COLUMNS.boltCount] ? parseInt(row[ROUTE_COLUMNS.boltCount]) : undefined,
    boltType: row[ROUTE_COLUMNS.boltType] || undefined,
    anchorType: row[ROUTE_COLUMNS.anchorType] || undefined,
    description: row[ROUTE_COLUMNS.description] || undefined,
    firstAscent: row[ROUTE_COLUMNS.firstAscent] || undefined,
    firstAscentDate: row[ROUTE_COLUMNS.firstAscentDate] || undefined,
    protection: row[ROUTE_COLUMNS.protection] || undefined,
    tips: row[ROUTE_COLUMNS.tips] || undefined,
    submittedBy: row[ROUTE_COLUMNS.submittedBy] || '',
    submittedAt: row[ROUTE_COLUMNS.submittedAt] || '',
  };
}

// Fetch all data from sheets
export async function fetchAllSheetData() {
  const [cragsRaw, areasRaw, routesRaw] = await Promise.all([
    fetchSheetData(config.sheets.ranges.crags),
    fetchSheetData(config.sheets.ranges.areas),
    fetchSheetData(config.sheets.ranges.routes),
  ]);

  return {
    crags: cragsRaw.map((row, index) => ({ row: index + 2, data: parseCragRow(row) })),
    areas: areasRaw.map((row, index) => ({ row: index + 2, data: parseAreaRow(row) })),
    routes: routesRaw.map((row, index) => ({ row: index + 2, data: parseRouteRow(row) })),
  };
}
