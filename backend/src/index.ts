import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { openAPIRouteHandler } from 'hono-openapi';
import { Env } from './types';
import { accessLogMiddleware } from './middleware/accessLog';

// Import routes
import { authRoutes } from './routes/auth';
import { biographiesRoutes } from './routes/biographies';
import { cragsRoutes } from './routes/crags';
import { gymsRoutes } from './routes/gyms';
import { postsRoutes } from './routes/posts';
import { galleriesRoutes } from './routes/galleries';
import { videosRoutes } from './routes/videos';
import { searchRoutes } from './routes/search';
import { usersRoutes } from './routes/users';
import { weatherRoutes } from './routes/weather';
import { trafficRoutes } from './routes/traffic';
import { bucketListRoutes } from './routes/bucket-list';
import { notificationsRoutes } from './routes/notifications';
import { mediaRoutes } from './routes/media';
import { storyPromptsRoutes } from './routes/story-prompts';
import { climbingLocationsRoutes } from './routes/climbing-locations';
import { statsRoutes } from './routes/stats';
import { adminQuestionsRoutes } from './routes/admin-questions';
import { adminCragsRoutes } from './routes/admin-crags';
import { adminSectorsRoutes } from './routes/admin-areas';
import { biographyContentRoutes } from './routes/biography-content';
import { accessLogsRoutes } from './routes/access-logs';
import { guestRoutes } from './routes/guest';
import { ascentsRoutes } from './routes/ascents';
import { routeStoriesRoutes } from './routes/route-stories';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', accessLogMiddleware);

// CORS configuration
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      // 解析逗號分隔的 CORS_ORIGIN 環境變數
      const envOrigins = c.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || [];

      // 允許沒有 origin 的請求 (如 server-to-server 或同源請求)
      if (!origin) return null;

      const allowedOrigins = [
        ...envOrigins,
        // 支援 www 子網域
        ...envOrigins
          .filter((o) => o.startsWith('https://') && o.includes('nobodyclimb.cc'))
          .map((o) => o.replace('https://', 'https://www.')),
      ].filter(Boolean);

      // 允許所有 localhost 和 127.0.0.1 的請求（任何端口）
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return origin;
      }

      // 只有在允許列表中的 origin 才回傳，否則拒絕
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'NobodyClimb API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// API v1 routes
const v1 = new Hono<{ Bindings: Env }>();

v1.route('/auth', authRoutes);
v1.route('/biographies', biographiesRoutes);
v1.route('/crags', cragsRoutes);
v1.route('/gyms', gymsRoutes);
v1.route('/posts', postsRoutes);
v1.route('/galleries', galleriesRoutes);
v1.route('/videos', videosRoutes);
v1.route('/search', searchRoutes);
v1.route('/users', usersRoutes);
v1.route('/weather', weatherRoutes);
v1.route('/traffic', trafficRoutes);
v1.route('/bucket-list', bucketListRoutes);
v1.route('/notifications', notificationsRoutes);
v1.route('/media', mediaRoutes);
v1.route('/story-prompts', storyPromptsRoutes);
v1.route('/climbing-locations', climbingLocationsRoutes);
v1.route('/stats', statsRoutes);
v1.route('/admin/questions', adminQuestionsRoutes);
v1.route('/admin/crags', adminCragsRoutes);
v1.route('/admin/crags', adminSectorsRoutes);
v1.route('/content', biographyContentRoutes);
v1.route('/access-logs', accessLogsRoutes);
v1.route('/guest', guestRoutes);
v1.route('/ascents', ascentsRoutes);
v1.route('/route-stories', routeStoriesRoutes);

// OpenAPI JSON 端點 - 自動從路由生成 OpenAPI 規格
v1.get(
  '/openapi.json',
  openAPIRouteHandler(v1, {
    documentation: {
      info: {
        title: 'NobodyClimb API',
        version: '1.0.0',
        description: 'NobodyClimb 攀岩社群平台 API 文檔',
        contact: {
          name: 'NobodyClimb Team',
          url: 'https://nobodyclimb.cc',
        },
      },
      servers: [
        {
          url: 'https://api.nobodyclimb.cc/api/v1',
          description: 'Production',
        },
        {
          url: 'http://localhost:8787/api/v1',
          description: 'Local Development',
        },
      ],
      tags: [
        { name: 'Auth', description: '認證相關 API' },
        { name: 'Users', description: '用戶相關 API' },
        { name: 'Biographies', description: '攀岩人誌相關 API' },
        { name: 'Crags', description: '岩場相關 API' },
        { name: 'Gyms', description: '岩館相關 API' },
        { name: 'Routes', description: '路線相關 API' },
        { name: 'Posts', description: '文章相關 API' },
        { name: 'Videos', description: '影片相關 API' },
        { name: 'Weather', description: '天氣相關 API' },
        { name: 'Search', description: '搜尋相關 API' },
      ],
    },
  })
);

// Scalar API Reference UI - 現代化的 API 文檔介面
v1.get('/docs', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>NobodyClimb API Reference</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/api/v1/openapi.json"
          data-configuration='${JSON.stringify({
            theme: 'kepler',
            layout: 'modern',
            darkMode: true,
            hiddenClients: [],
          })}'
        ></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `);
});

app.route('/api/v1', v1);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Global error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

export default app;
