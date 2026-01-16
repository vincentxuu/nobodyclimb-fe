import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const statsRoutes = new Hono<{ Bindings: Env }>();

// 全站統計資料快取 key
const STATS_CACHE_KEY = 'site:stats:v1';
const STATS_CACHE_TTL = 600; // 10 分鐘

/**
 * 全站統計資料介面
 */
interface SiteStats {
  crags: number;
  routes: number;
  biographies: number;
  videos: number;
  posts: number;
  gyms: number;
  updatedAt: string;
}

/**
 * 統計查詢結果介面
 */
interface StatsQueryResult {
  crags_count: number;
  routes_count: number;
  biographies_count: number;
  videos_count: number;
  posts_count: number;
  gyms_count: number;
}

/**
 * GET /api/v1/stats
 * 取得全站統計資料（岩場、路線、人物誌、影片等數量）
 * 使用 KV 快取，10 分鐘過期
 */
statsRoutes.get('/', async (c) => {
  // 1. 嘗試從快取讀取
  try {
    const cached = await c.env.CACHE.get(STATS_CACHE_KEY);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached) as SiteStats,
        cached: true,
      });
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }

  // 2. 使用單一查詢取得所有統計數據
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM crags) as crags_count,
        (SELECT COUNT(*) FROM routes) as routes_count,
        (SELECT COUNT(*) FROM biographies WHERE is_public = 1) as biographies_count,
        (SELECT COUNT(*) FROM videos) as videos_count,
        (SELECT COUNT(*) FROM posts WHERE status = 'published') as posts_count,
        (SELECT COUNT(*) FROM gyms) as gyms_count
    `;

    const result = await c.env.DB.prepare(query).first<StatsQueryResult>();

    const stats: SiteStats = {
      crags: result?.crags_count ?? 0,
      routes: result?.routes_count ?? 0,
      biographies: result?.biographies_count ?? 0,
      videos: result?.videos_count ?? 0,
      posts: result?.posts_count ?? 0,
      gyms: result?.gyms_count ?? 0,
      updatedAt: new Date().toISOString(),
    };

    // 3. 寫入快取
    try {
      await c.env.CACHE.put(STATS_CACHE_KEY, JSON.stringify(stats), {
        expirationTtl: STATS_CACHE_TTL,
      });
    } catch (e) {
      console.error('Cache write error:', e);
    }

    return c.json({
      success: true,
      data: stats,
      cached: false,
    });
  } catch (error) {
    console.error('Stats query error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/v1/stats/invalidate
 * 強制清除統計快取（需要管理員權限）
 */
statsRoutes.post('/invalidate', authMiddleware, adminMiddleware, async (c) => {
  try {
    await c.env.CACHE.delete(STATS_CACHE_KEY);
    return c.json({
      success: true,
      message: 'Stats cache invalidated',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to invalidate cache',
      },
      500
    );
  }
});

export { statsRoutes };
