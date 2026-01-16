import { Hono } from 'hono';
import { Env } from '../types';

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

  // 2. 查詢資料庫
  try {
    // 岩場數量
    const cragsResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM crags'
    ).first<{ count: number }>();

    // 路線數量
    const routesResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM routes'
    ).first<{ count: number }>();

    // 人物誌數量（只計算公開的）
    const biographiesResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM biographies WHERE is_public = 1'
    ).first<{ count: number }>();

    // 影片數量
    const videosResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM videos'
    ).first<{ count: number }>();

    // 文章數量（只計算已發布的）
    const postsResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE status = 'published'"
    ).first<{ count: number }>();

    // 岩館數量
    const gymsResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM gyms'
    ).first<{ count: number }>();

    const stats: SiteStats = {
      crags: cragsResult?.count ?? 0,
      routes: routesResult?.count ?? 0,
      biographies: biographiesResult?.count ?? 0,
      videos: videosResult?.count ?? 0,
      posts: postsResult?.count ?? 0,
      gyms: gymsResult?.count ?? 0,
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
 * 強制清除統計快取（管理員用）
 */
statsRoutes.post('/invalidate', async (c) => {
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
