/**
 * View tracking utilities for unique view count
 * Uses Cloudflare KV to deduplicate views based on IP + entity
 */

type EntityType = 'post' | 'video' | 'gallery';

// Table names for each entity type
const TABLE_MAP: Record<EntityType, string> = {
  post: 'posts',
  video: 'videos',
  gallery: 'galleries',
};

// Hash IP address for privacy (using Web Crypto API)
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Use first 8 bytes for shorter key
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Get client IP from request
export function getClientIP(request: Request): string {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// Track view and return whether this is a unique view
export async function trackUniqueView(
  kv: KVNamespace,
  entityType: EntityType,
  entityId: string,
  clientIP: string
): Promise<boolean> {
  const ipHash = await hashIP(clientIP);
  const viewKey = `view:${entityType}:${entityId}:${ipHash}`;

  // Check if already viewed
  const existing = await kv.get(viewKey);
  if (existing) {
    return false; // Not a unique view
  }

  // Mark as viewed with 24-hour TTL
  await kv.put(viewKey, '1', { expirationTtl: 86400 });
  return true; // This is a unique view
}

/**
 * Track and update view count for an entity
 * Returns the updated view count to display
 */
export async function trackAndUpdateViewCount(
  db: D1Database,
  kv: KVNamespace,
  request: Request,
  entityType: EntityType,
  entityId: string,
  currentViewCount: number
): Promise<number> {
  const clientIP = getClientIP(request);
  const isUniqueView = await trackUniqueView(kv, entityType, entityId, clientIP);

  if (isUniqueView) {
    const table = TABLE_MAP[entityType];
    await db
      .prepare(`UPDATE ${table} SET view_count = view_count + 1 WHERE id = ?`)
      .bind(entityId)
      .run();
    return currentViewCount + 1;
  }

  return currentViewCount;
}
