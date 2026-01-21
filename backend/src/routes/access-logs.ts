import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

export const accessLogsRoutes = new Hono<{ Bindings: Env }>();

/**
 * Analytics Engine SQL API 查詢
 * 文檔: https://developers.cloudflare.com/analytics/analytics-engine/sql-api/
 */
async function queryAnalyticsEngine(
  env: Env,
  sql: string,
  dataset: string = 'nobodyclimb_access_logs'
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
    const { limit = '100', offset = '0', path, method, status } = c.req.query();

    // 建立查詢條件
    const conditions: string[] = [];
    if (path) {
      conditions.push(`blob1 LIKE '%${path.replace(/'/g, "''")}%'`);
    }
    if (method) {
      conditions.push(`blob1 = '${method.replace(/'/g, "''").toUpperCase()}'`);
    }
    if (status) {
      conditions.push(`double2 = ${parseInt(status)}`);
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
      LIMIT ${parseInt(limit as string)}
      OFFSET ${parseInt(offset as string)}
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
    const { hours = '24' } = c.req.query();
    const hoursNum = parseInt(hours as string);

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
    const { hours = '24', limit = '50' } = c.req.query();
    const hoursNum = parseInt(hours as string);

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
      LIMIT ${parseInt(limit as string)}
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
    const { hours = '24', threshold = '1000', limit = '50' } = c.req.query();
    const hoursNum = parseInt(hours as string);
    const thresholdMs = parseInt(threshold as string);

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
      LIMIT ${parseInt(limit as string)}
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
