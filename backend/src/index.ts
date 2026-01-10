import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { Env } from './types';

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

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());

// CORS configuration
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      // 允許沒有 origin 的請求 (如 server-to-server 或同源請求)
      if (!origin) return c.env.CORS_ORIGIN;

      const allowedOrigins = [
        c.env.CORS_ORIGIN,
        // 支援 www 子網域
        c.env.CORS_ORIGIN?.replace('https://', 'https://www.'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ].filter(Boolean);

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
