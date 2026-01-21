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

// ═══════════════════════════════════════════════════════════
// 追蹤數據分析 (Admin Only)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/v1/stats/admin/follows
 * 取得追蹤數據分析（增長趨勢、關係分析）
 */
statsRoutes.get('/admin/follows', authMiddleware, adminMiddleware, async (c) => {
  try {
    // 基礎統計
    const basicStats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM follows) as total_follows,
        (SELECT COUNT(DISTINCT follower_id) FROM follows) as unique_followers,
        (SELECT COUNT(DISTINCT following_id) FROM follows) as unique_following,
        (SELECT COUNT(*) FROM follows WHERE created_at >= datetime('now', '-1 day')) as follows_today,
        (SELECT COUNT(*) FROM follows WHERE created_at >= datetime('now', '-7 days')) as follows_week,
        (SELECT COUNT(*) FROM follows WHERE created_at >= datetime('now', '-30 days')) as follows_month
    `).first<{
      total_follows: number;
      unique_followers: number;
      unique_following: number;
      follows_today: number;
      follows_week: number;
      follows_month: number;
    }>();

    // 每日追蹤趨勢（過去 30 天）
    const dailyTrend = await c.env.DB.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as count
      FROM follows
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all<{ date: string; count: number }>();

    // 追蹤者排行（被追蹤最多的用戶）
    const topFollowed = await c.env.DB.prepare(`
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar,
        b.id as biography_id,
        COALESCE(b.follower_count, 0) as follower_count
      FROM users u
      LEFT JOIN biographies b ON b.user_id = u.id
      WHERE b.follower_count > 0
      ORDER BY b.follower_count DESC
      LIMIT 10
    `).all<{
      id: string;
      username: string;
      display_name: string | null;
      avatar: string | null;
      biography_id: string;
      follower_count: number;
    }>();

    // 活躍追蹤者排行（追蹤最多人的用戶）
    const topFollowers = await c.env.DB.prepare(`
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar,
        COUNT(f.id) as following_count
      FROM users u
      JOIN follows f ON f.follower_id = u.id
      GROUP BY u.id
      ORDER BY following_count DESC
      LIMIT 10
    `).all<{
      id: string;
      username: string;
      display_name: string | null;
      avatar: string | null;
      following_count: number;
    }>();

    // 互相追蹤的關係數量
    const mutualFollows = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT f1.follower_id, f1.following_id
        FROM follows f1
        JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
        WHERE f1.follower_id < f1.following_id
      )
    `).first<{ count: number }>();

    return c.json({
      success: true,
      data: {
        summary: {
          totalFollows: basicStats?.total_follows ?? 0,
          uniqueFollowers: basicStats?.unique_followers ?? 0,
          uniqueFollowing: basicStats?.unique_following ?? 0,
          mutualFollows: mutualFollows?.count ?? 0,
          followsToday: basicStats?.follows_today ?? 0,
          followsWeek: basicStats?.follows_week ?? 0,
          followsMonth: basicStats?.follows_month ?? 0,
        },
        dailyTrend: dailyTrend.results || [],
        topFollowed: topFollowed.results || [],
        topFollowers: topFollowers.results || [],
      },
    });
  } catch (error) {
    console.error('Follow stats error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch follow stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// ═══════════════════════════════════════════════════════════
// 用戶活躍度分析 (Admin Only)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/v1/stats/admin/activity
 * 取得用戶活躍度分析（DAU/WAU/MAU、活動趨勢）
 */
statsRoutes.get('/admin/activity', authMiddleware, adminMiddleware, async (c) => {
  try {
    // DAU/WAU/MAU 計算（基於最後活動時間）
    const activityStats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE last_active_at >= datetime('now', '-1 day')) as dau,
        (SELECT COUNT(*) FROM users WHERE last_active_at >= datetime('now', '-7 days')) as wau,
        (SELECT COUNT(*) FROM users WHERE last_active_at >= datetime('now', '-30 days')) as mau,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-1 day')) as new_users_today,
        (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-7 days')) as new_users_week,
        (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-30 days')) as new_users_month
    `).first<{
      dau: number;
      wau: number;
      mau: number;
      total_users: number;
      active_users: number;
      new_users_today: number;
      new_users_week: number;
      new_users_month: number;
    }>();

    // 每日活躍用戶趨勢（過去 30 天）
    const dailyActiveUsers = await c.env.DB.prepare(`
      SELECT
        date(last_active_at) as date,
        COUNT(*) as count
      FROM users
      WHERE last_active_at >= datetime('now', '-30 days')
        AND last_active_at IS NOT NULL
      GROUP BY date(last_active_at)
      ORDER BY date ASC
    `).all<{ date: string; count: number }>();

    // 新用戶註冊趨勢（過去 30 天）
    const dailyNewUsers = await c.env.DB.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all<{ date: string; count: number }>();

    // 用戶活動分佈（基於不同動作）
    const activityBreakdown = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE created_at >= datetime('now', '-7 days')) as posts_week,
        (SELECT COUNT(*) FROM bucket_list_items WHERE created_at >= datetime('now', '-7 days')) as goals_week,
        (SELECT COUNT(*) FROM bucket_list_likes WHERE created_at >= datetime('now', '-7 days')) as likes_week,
        (SELECT COUNT(*) FROM bucket_list_comments WHERE created_at >= datetime('now', '-7 days')) as comments_week,
        (SELECT COUNT(*) FROM follows WHERE created_at >= datetime('now', '-7 days')) as follows_week
    `).first<{
      posts_week: number;
      goals_week: number;
      likes_week: number;
      comments_week: number;
      follows_week: number;
    }>();

    // 計算留存率
    const retentionStats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-7 days') AND created_at < datetime('now', '-1 day')) as cohort_week,
        (SELECT COUNT(*) FROM users
         WHERE created_at >= datetime('now', '-7 days')
         AND created_at < datetime('now', '-1 day')
         AND last_active_at >= datetime('now', '-1 day')) as returned_week
    `).first<{
      cohort_week: number;
      returned_week: number;
    }>();

    const retentionRate = retentionStats && retentionStats.cohort_week > 0
      ? Math.round((retentionStats.returned_week / retentionStats.cohort_week) * 100)
      : 0;

    return c.json({
      success: true,
      data: {
        summary: {
          dau: activityStats?.dau ?? 0,
          wau: activityStats?.wau ?? 0,
          mau: activityStats?.mau ?? 0,
          totalUsers: activityStats?.total_users ?? 0,
          activeUsers: activityStats?.active_users ?? 0,
          newUsersToday: activityStats?.new_users_today ?? 0,
          newUsersWeek: activityStats?.new_users_week ?? 0,
          newUsersMonth: activityStats?.new_users_month ?? 0,
          retentionRate,
        },
        dailyActiveUsers: dailyActiveUsers.results || [],
        dailyNewUsers: dailyNewUsers.results || [],
        activityBreakdown: {
          postsWeek: activityBreakdown?.posts_week ?? 0,
          goalsWeek: activityBreakdown?.goals_week ?? 0,
          likesWeek: activityBreakdown?.likes_week ?? 0,
          commentsWeek: activityBreakdown?.comments_week ?? 0,
          followsWeek: activityBreakdown?.follows_week ?? 0,
        },
      },
    });
  } catch (error) {
    console.error('Activity stats error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch activity stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// ═══════════════════════════════════════════════════════════
// 內容統計分析 (Admin Only)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/v1/stats/admin/content
 * 取得內容統計分析（文章、影片、人物誌趨勢）
 */
statsRoutes.get('/admin/content', authMiddleware, adminMiddleware, async (c) => {
  try {
    // 內容基礎統計
    const contentStats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE status = 'published') as published_posts,
        (SELECT COUNT(*) FROM posts WHERE status = 'draft') as draft_posts,
        (SELECT COUNT(*) FROM posts WHERE created_at >= datetime('now', '-7 days')) as posts_week,
        (SELECT COUNT(*) FROM biographies) as total_biographies,
        (SELECT COUNT(*) FROM biographies WHERE is_public = 1) as public_biographies,
        (SELECT COUNT(*) FROM biographies WHERE created_at >= datetime('now', '-7 days')) as biographies_week,
        (SELECT COUNT(*) FROM videos) as total_videos,
        (SELECT SUM(total_views) FROM biographies) as total_views,
        (SELECT SUM(total_likes) FROM biographies) as total_likes
    `).first<{
      total_posts: number;
      published_posts: number;
      draft_posts: number;
      posts_week: number;
      total_biographies: number;
      public_biographies: number;
      biographies_week: number;
      total_videos: number;
      total_views: number;
      total_likes: number;
    }>();

    // 每日文章發布趨勢（過去 30 天）
    const dailyPosts = await c.env.DB.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all<{ date: string; count: number }>();

    // 每日人物誌建立趨勢（過去 30 天）
    const dailyBiographies = await c.env.DB.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as count
      FROM biographies
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all<{ date: string; count: number }>();

    // 熱門人物誌（以瀏覽數排名）
    const topBiographies = await c.env.DB.prepare(`
      SELECT
        b.id,
        u.username,
        u.display_name,
        u.avatar,
        b.total_views,
        b.total_likes,
        b.follower_count
      FROM biographies b
      JOIN users u ON u.id = b.user_id
      WHERE b.is_public = 1
      ORDER BY b.total_views DESC
      LIMIT 10
    `).all<{
      id: string;
      username: string;
      display_name: string | null;
      avatar: string | null;
      total_views: number;
      total_likes: number;
      follower_count: number;
    }>();

    // 熱門文章（以瀏覽數排名）
    const topPosts = await c.env.DB.prepare(`
      SELECT
        p.id,
        p.title,
        p.slug,
        u.username as author_name,
        p.view_count as views,
        p.created_at
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.status = 'published'
      ORDER BY p.view_count DESC
      LIMIT 10
    `).all<{
      id: string;
      title: string;
      slug: string;
      author_name: string;
      views: number;
      created_at: string;
    }>();

    // 文章分類分佈
    const categoryDistribution = await c.env.DB.prepare(`
      SELECT
        category,
        COUNT(*) as count
      FROM posts
      WHERE status = 'published'
      GROUP BY category
      ORDER BY count DESC
    `).all<{ category: string; count: number }>();

    return c.json({
      success: true,
      data: {
        summary: {
          totalPosts: contentStats?.total_posts ?? 0,
          publishedPosts: contentStats?.published_posts ?? 0,
          draftPosts: contentStats?.draft_posts ?? 0,
          postsWeek: contentStats?.posts_week ?? 0,
          totalBiographies: contentStats?.total_biographies ?? 0,
          publicBiographies: contentStats?.public_biographies ?? 0,
          biographiesWeek: contentStats?.biographies_week ?? 0,
          totalVideos: contentStats?.total_videos ?? 0,
          totalViews: contentStats?.total_views ?? 0,
          totalLikes: contentStats?.total_likes ?? 0,
        },
        dailyPosts: dailyPosts.results || [],
        dailyBiographies: dailyBiographies.results || [],
        topBiographies: topBiographies.results || [],
        topPosts: topPosts.results || [],
        categoryDistribution: categoryDistribution.results || [],
      },
    });
  } catch (error) {
    console.error('Content stats error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch content stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export { statsRoutes };
