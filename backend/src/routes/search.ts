import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { parsePagination } from '../utils/id';

export const searchRoutes = new Hono<{ Bindings: Env }>();

// Query parameter schemas
const searchQuerySchema = z.object({
  q: z.string().min(2, '搜尋關鍵字至少需要 2 個字元'),
  type: z.enum(['posts', 'crags', 'gyms', 'galleries', 'videos']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const suggestionsQuerySchema = z.object({
  q: z.string().min(2, '搜尋關鍵字至少需要 2 個字元').optional(),
});

// GET /search - Global search
searchRoutes.get(
  '/',
  describeRoute({
    tags: ['Search'],
    summary: '全域搜尋',
    description: '搜尋文章、岩場、岩館、相簿、影片等內容。可透過 type 參數指定搜尋類型，若未指定則搜尋所有類型。',
    responses: {
      200: { description: '搜尋成功，回傳符合條件的結果' },
      400: { description: '搜尋關鍵字不符合要求（至少需要 2 個字元）' },
    },
  }),
  validator('query', searchQuerySchema),
  async (c) => {
    const { q: query, type, page: pageStr, limit: limitStr } = c.req.valid('query');
    const { page, limit, offset } = parsePagination(pageStr, limitStr);

    const searchPattern = `%${query}%`;
    const results: Record<string, unknown[]> = {};

    // Search posts
    if (!type || type === 'posts') {
      const posts = await c.env.DB.prepare(
        `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, 'post' as type,
                u.username as author_username, u.display_name as author_name
         FROM posts p
         JOIN users u ON p.author_id = u.id
         WHERE p.status = 'published'
           AND (p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)
         ORDER BY p.published_at DESC
         LIMIT ?`
      )
        .bind(searchPattern, searchPattern, searchPattern, type ? limit : 5)
        .all();
      results.posts = posts.results;
    }

    // Search crags
    if (!type || type === 'crags') {
      const crags = await c.env.DB.prepare(
        `SELECT id, name, slug, description, cover_image, region, 'crag' as type
         FROM crags
         WHERE name LIKE ? OR description LIKE ? OR location LIKE ? OR region LIKE ?
         ORDER BY is_featured DESC, name ASC
         LIMIT ?`
      )
        .bind(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          type ? limit : 5
        )
        .all();
      results.crags = crags.results;
    }

    // Search gyms
    if (!type || type === 'gyms') {
      const gyms = await c.env.DB.prepare(
        `SELECT id, name, slug, description, cover_image, city, 'gym' as type
         FROM gyms
         WHERE name LIKE ? OR description LIKE ? OR address LIKE ? OR city LIKE ?
         ORDER BY is_featured DESC, rating_avg DESC
         LIMIT ?`
      )
        .bind(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          type ? limit : 5
        )
        .all();
      results.gyms = gyms.results;
    }

    // Search galleries
    if (!type || type === 'galleries') {
      const galleries = await c.env.DB.prepare(
        `SELECT g.id, g.title, g.slug, g.description, g.cover_image, 'gallery' as type,
                u.username as author_username, u.display_name as author_name
         FROM galleries g
         JOIN users u ON g.author_id = u.id
         WHERE g.title LIKE ? OR g.description LIKE ?
         ORDER BY g.view_count DESC
         LIMIT ?`
      )
        .bind(searchPattern, searchPattern, type ? limit : 5)
        .all();
      results.galleries = galleries.results;
    }

    // Search videos
    if (!type || type === 'videos') {
      const videos = await c.env.DB.prepare(
        `SELECT id, title, slug, description, thumbnail_url, category, 'video' as type
         FROM videos
         WHERE title LIKE ? OR description LIKE ?
         ORDER BY is_featured DESC, view_count DESC
         LIMIT ?`
      )
        .bind(searchPattern, searchPattern, type ? limit : 5)
        .all();
      results.videos = videos.results;
    }

    // If searching specific type, also return pagination
    if (type) {
      const typeKey = type;
      return c.json({
        success: true,
        data: results[typeKey] || [],
        pagination: {
          page,
          limit,
          total: (results[typeKey] || []).length,
          total_pages: 1,
        },
      });
    }

    return c.json({
      success: true,
      data: results,
      query,
    });
  }
);

// GET /search/suggestions - Get search suggestions (autocomplete)
searchRoutes.get(
  '/suggestions',
  describeRoute({
    tags: ['Search'],
    summary: '搜尋建議',
    description: '根據輸入的關鍵字提供自動完成建議，包含文章標題、岩場名稱、岩館名稱等。',
    responses: {
      200: { description: '成功回傳搜尋建議列表' },
    },
  }),
  validator('query', suggestionsQuerySchema),
  async (c) => {
    const { q: query } = c.req.valid('query');

    if (!query || query.length < 2) {
      return c.json({
        success: true,
        data: [],
      });
    }

    const searchPattern = `${query}%`;
    const suggestions: string[] = [];

    // Get post titles
    const posts = await c.env.DB.prepare(
      `SELECT title FROM posts
       WHERE status = 'published' AND title LIKE ?
       LIMIT 3`
    )
      .bind(searchPattern)
      .all<{ title: string }>();
    suggestions.push(...posts.results.map((p) => p.title));

    // Get crag names
    const crags = await c.env.DB.prepare(
      `SELECT name FROM crags WHERE name LIKE ? LIMIT 3`
    )
      .bind(searchPattern)
      .all<{ name: string }>();
    suggestions.push(...crags.results.map((cr) => cr.name));

    // Get gym names
    const gyms = await c.env.DB.prepare(
      `SELECT name FROM gyms WHERE name LIKE ? LIMIT 3`
    )
      .bind(searchPattern)
      .all<{ name: string }>();
    suggestions.push(...gyms.results.map((g) => g.name));

    return c.json({
      success: true,
      data: [...new Set(suggestions)].slice(0, 10),
    });
  }
);
