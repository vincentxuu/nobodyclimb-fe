import 'dotenv/config';

export const config = {
  // Environment
  environment: (process.env.ENVIRONMENT || 'preview') as 'production' | 'preview',

  // JSON data path (relative to src/ directory)
  jsonDataPath: '../../../apps/web/src/data',

  // Backend path (for wrangler CLI)
  backendPath: process.env.BACKEND_PATH || '/Users/xiaoxu/Projects/nobodyclimb/backend',
};
