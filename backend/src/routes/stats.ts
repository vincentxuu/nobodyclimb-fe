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
        (SELECT COUNT(*) FROM biographies WHERE visibility = 'public') as biographies_count,
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
        u.avatar_url as avatar,
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
        u.avatar_url as avatar,
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
        (SELECT COUNT(*) FROM biographies WHERE visibility = 'public') as public_biographies,
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
        u.avatar_url as avatar,
        b.total_views,
        b.total_likes,
        b.follower_count
      FROM biographies b
      JOIN users u ON u.id = b.user_id
      WHERE b.visibility = 'public'
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

// ═══════════════════════════════════════════════════════════
// 社群統計 (Public)
// 用於首頁「故事展示區」
// ═══════════════════════════════════════════════════════════

const COMMUNITY_STATS_CACHE_KEY = 'site:community-stats:v1';
const COMMUNITY_STATS_CACHE_TTL = 300; // 5 分鐘

// 常數定義
const MIN_FEATURED_STORY_LENGTH = 20; // 最少字數才算有意義的內容
const DEFAULT_TOP_LOCATIONS = ['龍洞', '內湖運動中心']; // 當無資料時的後備值

// 有效的內容類型
const VALID_CONTENT_TYPES = ['core_story', 'one_liner', 'story'] as const;
type ContentType = (typeof VALID_CONTENT_TYPES)[number];

/**
 * 驗證內容類型是否有效
 */
function isValidContentType(type: string): type is ContentType {
  return VALID_CONTENT_TYPES.includes(type as ContentType);
}

interface CommunityStats {
  featuredStory: {
    id: string;
    content: string;
    contentType: 'core_story' | 'one_liner' | 'story';
    author: {
      displayName: string;
      slug: string;
    };
    reactions: {
      me_too: number;
    };
  } | null;
  stats: {
    friendInvited: number;
    topLocations: string[];
    totalStories: number;
  };
  updatedAt: string;
}

/**
 * GET /api/v1/stats/community
 * 取得首頁故事展示區所需的社群統計資料
 * 公開 API，使用 KV 快取
 */
statsRoutes.get('/community', async (c) => {
  // 1. 嘗試從快取讀取
  try {
    const cached = await c.env.CACHE.get(COMMUNITY_STATS_CACHE_KEY);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached) as CommunityStats,
        cached: true,
      });
    }
  } catch (e) {
    console.error('Community stats cache read error:', e);
  }

  try {
    // 2. 取得精選故事（按「我也是」反應數量排序）
    // 從三種內容類型中選取最受歡迎的故事
    // 使用參數化查詢避免 SQL 注入風險
    const featuredStoryResult = await c.env.DB.prepare(`
      SELECT * FROM (
        SELECT
          bs.id,
          bs.content,
          'story' as content_type,
          COALESCE(u.display_name, u.username, b.name) as author_name,
          b.slug as author_slug,
          COALESCE(bs.reaction_me_too_count, 0) as me_too_count,
          bs.created_at
        FROM biography_stories bs
        JOIN biographies b ON b.id = bs.biography_id
        LEFT JOIN users u ON u.id = b.user_id
        WHERE b.visibility = 'public'
          AND bs.is_hidden = 0
          AND bs.content IS NOT NULL
          AND LENGTH(bs.content) > ?1
        UNION ALL
        SELECT
          cs.id,
          cs.content,
          'core_story' as content_type,
          COALESCE(u.display_name, u.username, b.name) as author_name,
          b.slug as author_slug,
          COALESCE(cs.reaction_me_too_count, 0) as me_too_count,
          cs.created_at
        FROM biography_core_stories cs
        JOIN biographies b ON b.id = cs.biography_id
        LEFT JOIN users u ON u.id = b.user_id
        WHERE b.visibility = 'public'
          AND cs.is_hidden = 0
          AND cs.content IS NOT NULL
          AND LENGTH(cs.content) > ?2
      ) AS combined
      ORDER BY me_too_count DESC, created_at DESC
      LIMIT 1
    `).bind(MIN_FEATURED_STORY_LENGTH, MIN_FEATURED_STORY_LENGTH).first<{
      id: string;
      content: string;
      content_type: string;
      author_name: string;
      author_slug: string;
      me_too_count: number;
    }>();

    // 3. 統計「被朋友拉進攀岩坑」的人數
    const friendInvitedResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM choice_answers ca
      JOIN choice_options co ON co.id = ca.option_id
      WHERE co.value = 'friend_invited'
    `).first<{ count: number }>();

    // 4. 統計熱門地點（從 frequent_locations 欄位）
    const locationsResult = await c.env.DB.prepare(`
      SELECT
        b.basic_info_data
      FROM biographies b
      WHERE b.visibility = 'public'
        AND b.basic_info_data IS NOT NULL
    `).all<{ basic_info_data: string }>();

    // 解析 basic_info_data 中的 frequent_locations
    const locationCounts: Record<string, number> = {};
    let parseErrors = 0;
    for (const row of locationsResult.results || []) {
      try {
        const data = JSON.parse(row.basic_info_data);
        const locations = data?.frequent_locations;
        if (Array.isArray(locations)) {
          for (const loc of locations) {
            if (typeof loc === 'string' && loc.trim()) {
              locationCounts[loc.trim()] = (locationCounts[loc.trim()] || 0) + 1;
            }
          }
        } else if (typeof locations === 'string' && locations.trim()) {
          // 可能是逗號分隔的字串
          const locs = locations.split(/[,，、]/);
          for (const loc of locs) {
            if (loc.trim()) {
              locationCounts[loc.trim()] = (locationCounts[loc.trim()] || 0) + 1;
            }
          }
        }
      } catch (err) {
        parseErrors++;
        // 只記錄前幾筆錯誤，避免日誌過多
        if (parseErrors <= 3) {
          console.warn('Failed to parse basic_info_data:', {
            error: err instanceof Error ? err.message : 'Unknown',
            preview: row.basic_info_data?.substring(0, 50),
          });
        }
      }
    }
    if (parseErrors > 0) {
      console.info(`Community stats: Skipped ${parseErrors} biographies due to JSON parse errors`);
    }

    // 取得前 2 個熱門地點
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name]) => name);

    // 5. 統計故事總數（公開的人物誌數量）
    const totalStoriesResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM biographies
      WHERE visibility = 'public'
    `).first<{ count: number }>();

    // 6. 組裝結果
    // 驗證內容類型
    let featuredStory: CommunityStats['featuredStory'] = null;
    if (featuredStoryResult) {
      const contentType = featuredStoryResult.content_type;
      if (isValidContentType(contentType)) {
        featuredStory = {
          id: featuredStoryResult.id,
          content: featuredStoryResult.content,
          contentType,
          author: {
            displayName: featuredStoryResult.author_name,
            slug: featuredStoryResult.author_slug,
          },
          reactions: {
            me_too: featuredStoryResult.me_too_count,
          },
        };
      } else {
        console.warn(`Invalid content_type from database: ${contentType}`);
      }
    }

    const communityStats: CommunityStats = {
      featuredStory,
      stats: {
        friendInvited: friendInvitedResult?.count ?? 0,
        topLocations: topLocations.length > 0 ? topLocations : DEFAULT_TOP_LOCATIONS,
        totalStories: totalStoriesResult?.count ?? 0,
      },
      updatedAt: new Date().toISOString(),
    };

    // 7. 寫入快取
    try {
      await c.env.CACHE.put(COMMUNITY_STATS_CACHE_KEY, JSON.stringify(communityStats), {
        expirationTtl: COMMUNITY_STATS_CACHE_TTL,
      });
    } catch (e) {
      console.error('Community stats cache write error:', e);
    }

    return c.json({
      success: true,
      data: communityStats,
      cached: false,
    });
  } catch (error) {
    console.error('Community stats query error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch community stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export { statsRoutes };
