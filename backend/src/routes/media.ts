import { Hono } from 'hono';
import { Env } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

export const mediaRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════
// YouTube 影片關聯 API
// ═══════════════════════════════════════════════════════════

// YouTube 影片關聯類型
type VideoRelationType = 'own_content' | 'featured_in' | 'mentioned' | 'recommended' | 'completion_proof';

interface BiographyVideo {
  id: string;
  biography_id: string;
  video_id: string;
  relation_type: VideoRelationType;
  is_featured: number;
  display_order: number;
  created_at: string;
}

// GET /media/biographies/:id/videos - Get videos for a biography
mediaRoutes.get('/biographies/:id/videos', async (c) => {
  const biographyId = c.req.param('id');
  const featured = c.req.query('featured');

  let query = `
    SELECT * FROM biography_videos
    WHERE biography_id = ?
  `;
  const params: (string | number)[] = [biographyId];

  if (featured === 'true') {
    query += ' AND is_featured = 1';
  }

  query += ' ORDER BY display_order ASC, created_at DESC';

  const videos = await c.env.DB.prepare(query)
    .bind(...params)
    .all<BiographyVideo>();

  return c.json({
    success: true,
    data: videos.results,
  });
});

// POST /media/biographies/me/videos - Add video association
mediaRoutes.post('/biographies/me/videos', authMiddleware, async (c) => {
  const userId = c.get('userId');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found. Create a biography first.',
      },
      404
    );
  }

  const body = await c.req.json<{
    video_id: string;
    relation_type?: VideoRelationType;
    is_featured?: boolean;
    display_order?: number;
  }>();

  if (!body.video_id) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'video_id is required',
      },
      400
    );
  }

  // Check if video already exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM biography_videos WHERE biography_id = ? AND video_id = ?'
  )
    .bind(biography.id, body.video_id)
    .first<{ id: string }>();

  if (existing) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Video already associated with this biography',
      },
      409
    );
  }

  const id = generateId();
  const relationType = body.relation_type || 'own_content';
  const isFeatured = body.is_featured ? 1 : 0;
  const displayOrder = body.display_order || 0;

  await c.env.DB.prepare(
    `INSERT INTO biography_videos (id, biography_id, video_id, relation_type, is_featured, display_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, biography.id, body.video_id, relationType, isFeatured, displayOrder)
    .run();

  const video = await c.env.DB.prepare(
    'SELECT * FROM biography_videos WHERE id = ?'
  )
    .bind(id)
    .first<BiographyVideo>();

  return c.json(
    {
      success: true,
      data: video,
    },
    201
  );
});

// PUT /media/biographies/me/videos/:id - Update video association
mediaRoutes.put('/biographies/me/videos/:videoId', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const videoId = c.req.param('videoId');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Check if video exists and belongs to user's biography
  const existing = await c.env.DB.prepare(
    'SELECT id FROM biography_videos WHERE id = ? AND biography_id = ?'
  )
    .bind(videoId, biography.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Video association not found',
      },
      404
    );
  }

  const body = await c.req.json<{
    relation_type?: VideoRelationType;
    is_featured?: boolean;
    display_order?: number;
  }>();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (body.relation_type !== undefined) {
    updates.push('relation_type = ?');
    values.push(body.relation_type);
  }
  if (body.is_featured !== undefined) {
    updates.push('is_featured = ?');
    values.push(body.is_featured ? 1 : 0);
  }
  if (body.display_order !== undefined) {
    updates.push('display_order = ?');
    values.push(body.display_order);
  }

  if (updates.length > 0) {
    values.push(videoId);
    await c.env.DB.prepare(
      `UPDATE biography_videos SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  const video = await c.env.DB.prepare(
    'SELECT * FROM biography_videos WHERE id = ?'
  )
    .bind(videoId)
    .first<BiographyVideo>();

  return c.json({
    success: true,
    data: video,
  });
});

// DELETE /media/biographies/me/videos/:id - Remove video association
mediaRoutes.delete('/biographies/me/videos/:videoId', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const videoId = c.req.param('videoId');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Check if video exists and belongs to user's biography
  const existing = await c.env.DB.prepare(
    'SELECT id FROM biography_videos WHERE id = ? AND biography_id = ?'
  )
    .bind(videoId, biography.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Video association not found',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM biography_videos WHERE id = ?')
    .bind(videoId)
    .run();

  return c.json({
    success: true,
    message: 'Video association removed successfully',
  });
});

// ═══════════════════════════════════════════════════════════
// Instagram 貼文關聯 API
// ═══════════════════════════════════════════════════════════

// Instagram 關聯類型
type InstagramRelationType = 'own_post' | 'tagged' | 'mentioned' | 'completion_proof';
type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REEL';

interface BiographyInstagram {
  id: string;
  biography_id: string;
  instagram_url: string;
  instagram_shortcode: string;
  media_type: InstagramMediaType | null;
  thumbnail_url: string | null;
  caption: string | null;
  posted_at: string | null;
  relation_type: InstagramRelationType;
  is_featured: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// GET /media/biographies/:id/instagrams - Get Instagram posts for a biography
mediaRoutes.get('/biographies/:id/instagrams', async (c) => {
  const biographyId = c.req.param('id');
  const featured = c.req.query('featured');

  let query = `
    SELECT * FROM biography_instagrams
    WHERE biography_id = ?
  `;
  const params: (string | number)[] = [biographyId];

  if (featured === 'true') {
    query += ' AND is_featured = 1';
  }

  query += ' ORDER BY display_order ASC, created_at DESC';

  const posts = await c.env.DB.prepare(query)
    .bind(...params)
    .all<BiographyInstagram>();

  return c.json({
    success: true,
    data: posts.results,
  });
});

// POST /media/biographies/me/instagrams - Add Instagram post association
mediaRoutes.post('/biographies/me/instagrams', authMiddleware, async (c) => {
  const userId = c.get('userId');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found. Create a biography first.',
      },
      404
    );
  }

  const body = await c.req.json<{
    instagram_url: string;
    instagram_shortcode: string;
    media_type?: InstagramMediaType;
    thumbnail_url?: string;
    caption?: string;
    posted_at?: string;
    relation_type?: InstagramRelationType;
    is_featured?: boolean;
    display_order?: number;
  }>();

  if (!body.instagram_url || !body.instagram_shortcode) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'instagram_url and instagram_shortcode are required',
      },
      400
    );
  }

  // Check if post already exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM biography_instagrams WHERE biography_id = ? AND instagram_shortcode = ?'
  )
    .bind(biography.id, body.instagram_shortcode)
    .first<{ id: string }>();

  if (existing) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Instagram post already associated with this biography',
      },
      409
    );
  }

  const id = generateId();
  const relationType = body.relation_type || 'own_post';
  const isFeatured = body.is_featured ? 1 : 0;
  const displayOrder = body.display_order || 0;

  await c.env.DB.prepare(
    `INSERT INTO biography_instagrams (
      id, biography_id, instagram_url, instagram_shortcode, media_type,
      thumbnail_url, caption, posted_at, relation_type, is_featured, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      biography.id,
      body.instagram_url,
      body.instagram_shortcode,
      body.media_type || null,
      body.thumbnail_url || null,
      body.caption || null,
      body.posted_at || null,
      relationType,
      isFeatured,
      displayOrder
    )
    .run();

  const post = await c.env.DB.prepare(
    'SELECT * FROM biography_instagrams WHERE id = ?'
  )
    .bind(id)
    .first<BiographyInstagram>();

  return c.json(
    {
      success: true,
      data: post,
    },
    201
  );
});

// PUT /media/biographies/me/instagrams/:id - Update Instagram post association
mediaRoutes.put('/biographies/me/instagrams/:instagramId', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const instagramId = c.req.param('instagramId');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Check if post exists and belongs to user's biography
  const existing = await c.env.DB.prepare(
    'SELECT id FROM biography_instagrams WHERE id = ? AND biography_id = ?'
  )
    .bind(instagramId, biography.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Instagram post association not found',
      },
      404
    );
  }

  const body = await c.req.json<{
    media_type?: InstagramMediaType;
    thumbnail_url?: string;
    caption?: string;
    posted_at?: string;
    relation_type?: InstagramRelationType;
    is_featured?: boolean;
    display_order?: number;
  }>();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.media_type !== undefined) {
    updates.push('media_type = ?');
    values.push(body.media_type);
  }
  if (body.thumbnail_url !== undefined) {
    updates.push('thumbnail_url = ?');
    values.push(body.thumbnail_url);
  }
  if (body.caption !== undefined) {
    updates.push('caption = ?');
    values.push(body.caption);
  }
  if (body.posted_at !== undefined) {
    updates.push('posted_at = ?');
    values.push(body.posted_at);
  }
  if (body.relation_type !== undefined) {
    updates.push('relation_type = ?');
    values.push(body.relation_type);
  }
  if (body.is_featured !== undefined) {
    updates.push('is_featured = ?');
    values.push(body.is_featured ? 1 : 0);
  }
  if (body.display_order !== undefined) {
    updates.push('display_order = ?');
    values.push(body.display_order);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(instagramId);
    await c.env.DB.prepare(
      `UPDATE biography_instagrams SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  const post = await c.env.DB.prepare(
    'SELECT * FROM biography_instagrams WHERE id = ?'
  )
    .bind(instagramId)
    .first<BiographyInstagram>();

  return c.json({
    success: true,
    data: post,
  });
});

// DELETE /media/biographies/me/instagrams/:id - Remove Instagram post association
mediaRoutes.delete('/biographies/me/instagrams/:instagramId', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const instagramId = c.req.param('instagramId');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Check if post exists and belongs to user's biography
  const existing = await c.env.DB.prepare(
    'SELECT id FROM biography_instagrams WHERE id = ? AND biography_id = ?'
  )
    .bind(instagramId, biography.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Instagram post association not found',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM biography_instagrams WHERE id = ?')
    .bind(instagramId)
    .run();

  return c.json({
    success: true,
    message: 'Instagram post association removed successfully',
  });
});

// ═══════════════════════════════════════════════════════════
// 媒體資訊抓取 API
// ═══════════════════════════════════════════════════════════

// GET /media/utils/youtube-info - Fetch YouTube video info
mediaRoutes.get('/utils/youtube-info', async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'url parameter is required',
      },
      400
    );
  }

  // Extract video ID from URL
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Invalid YouTube URL',
      },
      400
    );
  }

  try {
    // Use oEmbed API to get video info (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Video not found or is private',
        },
        404
      );
    }

    const data = await response.json() as {
      title: string;
      author_name: string;
      author_url: string;
      thumbnail_url: string;
    };

    return c.json({
      success: true,
      data: {
        video_id: videoId,
        title: data.title,
        channel_name: data.author_name,
        channel_url: data.author_url,
        thumbnail_url: data.thumbnail_url,
        // Generate different quality thumbnails
        thumbnails: {
          default: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
          medium: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        },
        embed_url: `https://www.youtube.com/embed/${videoId}`,
        watch_url: `https://www.youtube.com/watch?v=${videoId}`,
      },
    });
  } catch {
    return c.json(
      {
        success: false,
        error: 'Service Unavailable',
        message: 'Failed to fetch video info',
      },
      503
    );
  }
});

// GET /media/utils/instagram-info - Fetch Instagram post info
mediaRoutes.get('/utils/instagram-info', async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'url parameter is required',
      },
      400
    );
  }

  // Extract shortcode from URL
  const shortcode = extractInstagramShortcode(url);
  if (!shortcode) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Invalid Instagram URL',
      },
      400
    );
  }

  // Note: Instagram's oEmbed API requires Facebook App credentials
  // For now, we return the basic info that can be derived from the URL
  // In production, you would integrate with Instagram Graph API

  return c.json({
    success: true,
    data: {
      shortcode,
      instagram_url: `https://www.instagram.com/p/${shortcode}/`,
      embed_url: `https://www.instagram.com/p/${shortcode}/embed/`,
      // Note: Actual thumbnail fetching requires Instagram API access
      // These are placeholder patterns
      media_type: null, // Would need API to determine
      thumbnail_url: null, // Would need API to fetch
      caption: null, // Would need API to fetch
      posted_at: null, // Would need API to fetch
    },
  });
});

// ═══════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════

function extractYoutubeVideoId(url: string): string | null {
  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function extractInstagramShortcode(url: string): string | null {
  // Match various Instagram URL formats
  const patterns = [
    /instagram\.com\/p\/([^/?]+)/,
    /instagram\.com\/reel\/([^/?]+)/,
    /instagram\.com\/tv\/([^/?]+)/,
    /^([a-zA-Z0-9_-]+)$/, // Direct shortcode
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
