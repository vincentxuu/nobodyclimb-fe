import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

export const accessLogsRoutes = new Hono<{ Bindings: Env }>();

// 常數定義
const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;
const DEFAULT_HOURS = 24;

/**
 * 安全的 parseInt，返回有效數字或預設值
 */
function safeParseInt(value: string | undefined, defaultValue: number, max?: number): number {
  const parsed = parseInt(value || '', 10);
  if (isNaN(parsed) || parsed < 1) return defaultValue;
  if (max && parsed > max) return max;
  return parsed;
}

/**
 * 驗證並清理路徑輸入（防止 SQL injection）
 */
function sanitizePath(path: string): string | null {
  // 只允許常見的 URL 路徑字元
  if (!/^[a-zA-Z0-9\/_\-.:?&=%]{1,200}$/.test(path)) {
    return null;
  }
  return path.replace(/'/g, "''");
}

/**
 * Analytics Engine SQL API 查詢
 * 文檔: https://developers.cloudflare.com/analytics/analytics-engine/sql-api/
 */
async function queryAnalyticsEngine(
  env: Env,
  sql: string
): Promise<{ data: unknown[]; meta: unknown }> {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Analytics Engine 查詢需要設定 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'text/plain',
      },
      body: sql,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analytics Engine 查詢失敗: ${error}`);
  }

  return response.json();
}

/**
 * GET /access-logs
 * 取得訪問日誌列表（最近的請求）
 */
accessLogsRoutes.get('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const env = c.env as Env;
    const { limit, offset, path, method, status } = c.req.query();

    // 安全解析數字參數
    const limitNum = safeParseInt(limit, DEFAULT_LIMIT, MAX_LIMIT);
    const offsetNum = safeParseInt(offset, 0);

    // 建立查詢條件
    const conditions: string[] = [];

    // path 過濾 (blob2)
    if (path) {
      const sanitizedPath = sanitizePath(path);
      if (sanitizedPath) {
        conditions.push(`blob2 LIKE '%${sanitizedPath}%'`);
      }
    }

    // method 過濾 (blob1)
    if (method && /^[A-Z]{3,7}$/.test(method.toUpperCase())) {
      conditions.push(`blob1 = '${method.toUpperCase()}'`);
    }

    // status 過濾
    if (status) {
      const statusNum = safeParseInt(status, 0);
      if (statusNum >= 100 && statusNum < 600) {
        conditions.push(`double2 = ${statusNum}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        timestamp,
        blob1 AS method,
        blob2 AS path,
        blob3 AS userAgent,
        blob4 AS country,
        blob5 AS userId,
        blob6 AS ip,
        blob7 AS statusCode,
        blob8 AS errorMessage,
        double1 AS responseTime,
        double2 AS statusCodeNum
      FROM nobodyclimb_access_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limitNum}
      OFFSET ${offsetNum}
    `;

    const result = await queryAnalyticsEngine(env, sql);

    return c.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json(
      {
        success: false,
        error: 'Failed to fetch access logs',
        message,
      },
      500
    );
  }
});

/**
 * GET /access-logs/summary
 * 取得訪問日誌摘要統計
 */
accessLogsRoutes.get('/summary', authMiddleware, adminMiddleware, async (c) => {
  try {
    const env = c.env as Env;
    const { hours } = c.req.query();
    const hoursNum = safeParseInt(hours, DEFAULT_HOURS, 168); // 最多 7 天

    // 總請求數和平均響應時間
    const summarySQL = `
      SELECT
        COUNT(*) AS totalRequests,
        AVG(double1) AS avgResponseTime,
        SUM(CASE WHEN double2 >= 200 AND double2 < 300 THEN 1 ELSE 0 END) AS successCount,
        SUM(CASE WHEN double2 >= 400 AND double2 < 500 THEN 1 ELSE 0 END) AS clientErrorCount,
        SUM(CASE WHEN double2 >= 500 THEN 1 ELSE 0 END) AS serverErrorCount
      FROM nobodyclimb_access_logs
      WHERE timestamp >= NOW() - INTERVAL '${hoursNum}' HOUR
    `;

    // 熱門路徑
    const topPathsSQL = `
      SELECT
        blob2 AS path,
        COUNT(*) AS count,
        AVG(double1) AS avgResponseTime
      FROM nobodyclimb_access_logs
      WHERE timestamp >= NOW() - INTERVAL '${hoursNum}' HOUR
      GROUP BY blob2
      ORDER BY count DESC
      LIMIT 10
    `;

    // 每小時請求數
    const hourlySQL = `
      SELECT
        toStartOfHour(timestamp) AS hour,
        COUNT(*) AS count
      FROM nobodyclimb_access_logs
      WHERE timestamp >= NOW() - INTERVAL '${hoursNum}' HOUR
      GROUP BY hour
      ORDER BY hour ASC
    `;

    // 國家分布
    const countrySQL = `
      SELECT
        blob4 AS country,
        COUNT(*) AS count
      FROM nobodyclimb_access_logs
      WHERE timestamp >= NOW() - INTERVAL '${hoursNum}' HOUR
      GROUP BY blob4
      ORDER BY count DESC
      LIMIT 10
    `;

    // HTTP 方法分布
    const methodSQL = `
      SELECT
        blob1 AS method,
        COUNT(*) AS count
      FROM nobodyclimb_access_logs
      WHERE timestamp >= NOW() - INTERVAL '${hoursNum}' HOUR
      GROUP BY blob1
      ORDER BY count DESC
    `;

    // 並行查詢
    const [summary, topPaths, hourly, countries, methods] = await Promise.all([
      queryAnalyticsEngine(env, summarySQL),
      queryAnalyticsEngine(env, topPathsSQL),
      queryAnalyticsEngine(env, hourlySQL),
      queryAnalyticsEngine(env, countrySQL),
      queryAnalyticsEngine(env, methodSQL),
    ]);

    return c.json({
      success: true,
      data: {
        summary: summary.data[0] || {},
        topPaths: topPaths.data,
        hourlyRequests: hourly.data,
        countryDistribution: countries.data,
        methodDistribution: methods.data,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json(
      {
        success: false,
        error: 'Failed to fetch access logs summary',
        message,
      },
      500
    );
  }
});

/**
 * GET /access-logs/errors
 * 取得錯誤日誌
 */
accessLogsRoutes.get('/errors', authMiddleware, adminMiddleware, async (c) => {
  try {
    const env = c.env as Env;
    const { hours, limit } = c.req.query();
    const hoursNum = safeParseInt(hours, DEFAULT_HOURS, 168);
    const limitNum = safeParseInt(limit, 50, MAX_LIMIT);

    const sql = `
      SELECT
        timestamp,
        blob1 AS method,
        blob2 AS path,
        blob5 AS userId,
        blob6 AS ip,
        blob7 AS statusCode,
        blob8 AS errorMessage,
        double1 AS responseTime
      FROM nobodyclimb_access_logs
      WHERE double2 >= 400
        AND timestamp >= NOW() - INTERVAL '${hoursNum}' HOUR
      ORDER BY timestamp DESC
      LIMIT ${limitNum}
    `;

    const result = await queryAnalyticsEngine(env, sql);

    return c.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json(
      {
        success: false,
        error: 'Failed to fetch error logs',
        message,
      },
      500
    );
  }
});

/**
 * GET /access-logs/slow
 * 取得慢請求日誌
 */
accessLogsRoutes.get('/slow', authMiddleware, adminMiddleware, async (c) => {
  try {
    const env = c.env as Env;
    const { hours, threshold, limit } = c.req.query();
    const hoursNum = safeParseInt(hours, DEFAULT_HOURS, 168);
    const thresholdMs = safeParseInt(threshold, 1000, 60000); // 預設 1 秒，最多 60 秒
    const limitNum = safeParseInt(limit, 50, MAX_LIMIT);

    const sql = `
      SELECT
        timestamp,
        blob1 AS method,
        blob2 AS path,
        blob5 AS userId,
        blob7 AS statusCode,
        double1 AS responseTime
      FROM nobodyclimb_access_logs
      WHERE double1 >= ${thresholdMs}
        AND timestamp >= NOW() - INTERVAL '${hoursNum}' HOUR
      ORDER BY double1 DESC
      LIMIT ${limitNum}
    `;

    const result = await queryAnalyticsEngine(env, sql);

    return c.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json(
      {
        success: false,
        error: 'Failed to fetch slow request logs',
        message,
      },
      500
    );
  }
});
