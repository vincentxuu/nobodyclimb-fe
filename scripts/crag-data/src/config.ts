import 'dotenv/config';

export const config = {
  // Google Sheets
  sheets: {
    credentials: process.env.GOOGLE_SHEETS_CREDENTIALS
      ? JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
      : null,
    spreadsheetId: process.env.SPREADSHEET_ID || '',
    ranges: {
      crags: 'Crags!A2:Z',
      areas: 'Areas!A2:L',
      routes: 'Routes!A2:T',
      auditLog: 'AuditLog!A2:H',
    },
  },

  // Cloudflare D1
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    databaseId: process.env.D1_DATABASE_ID || '',
  },

  // Environment
  environment: (process.env.ENVIRONMENT || 'preview') as 'production' | 'preview',

  // JSON data path (relative to src/ directory)
  jsonDataPath: '../../../apps/web/src/data/crags',

  // Backend path (for wrangler CLI)
  backendPath: process.env.BACKEND_PATH || '/Users/xiaoxu/Projects/nobodyclimb/backend',
};

export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!config.sheets.credentials) {
    errors.push('GOOGLE_SHEETS_CREDENTIALS is not set');
  }
  if (!config.sheets.spreadsheetId) {
    errors.push('SPREADSHEET_ID is not set');
  }
  if (!config.cloudflare.accountId) {
    errors.push('CLOUDFLARE_ACCOUNT_ID is not set');
  }
  if (!config.cloudflare.apiToken) {
    errors.push('CLOUDFLARE_API_TOKEN is not set');
  }
  if (!config.cloudflare.databaseId) {
    errors.push('D1_DATABASE_ID is not set');
  }

  return errors;
}

// Column mappings for Google Sheets
export const CRAG_COLUMNS = {
  status: 0,       // A
  id: 1,           // B
  name: 2,         // C
  nameEn: 3,       // D
  slug: 4,         // E
  region: 5,       // F
  location: 6,     // G
  latitude: 7,     // H
  longitude: 8,    // I
  altitude: 9,     // J
  rockType: 10,    // K
  climbingTypes: 11, // L
  difficultyRange: 12, // M
  description: 13, // N
  accessInfo: 14,  // O
  parkingInfo: 15, // P
  approachTime: 16, // Q
  bestSeasons: 17, // R
  restrictions: 18, // S
  coverImage: 19,  // T
  isFeatured: 20,  // U
  submittedBy: 21, // V
  submittedAt: 22, // W
  reviewedBy: 23,  // X
  reviewedAt: 24,  // Y
  reviewNotes: 25, // Z
};

export const AREA_COLUMNS = {
  status: 0,       // A
  id: 1,           // B
  cragSlug: 2,     // C
  name: 3,         // D
  nameEn: 4,       // E
  description: 5,  // F
  difficultyMin: 6, // G
  difficultyMax: 7, // H
  boltCount: 8,    // I
  image: 9,        // J
  submittedBy: 10, // K
  submittedAt: 11, // L
};

export const ROUTE_COLUMNS = {
  status: 0,       // A
  id: 1,           // B
  cragSlug: 2,     // C
  areaId: 3,       // D
  sector: 4,       // E
  name: 5,         // F
  grade: 6,        // G
  gradeSystem: 7,  // H
  routeType: 8,    // I
  length: 9,       // J
  boltCount: 10,   // K
  boltType: 11,    // L
  anchorType: 12,  // M
  description: 13, // N
  firstAscent: 14, // O
  firstAscentDate: 15, // P
  protection: 16,  // Q
  tips: 17,        // R
  submittedBy: 18, // S
  submittedAt: 19, // T
};
