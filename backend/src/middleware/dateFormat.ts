import { MiddlewareHandler } from 'hono';

/**
 * 將 JSON response 中的 SQLite datetime 格式轉為 ISO 8601 + Z
 * SQLite datetime('now') 回傳 "YYYY-MM-DD HH:MM:SS"（UTC 但無 Z 後綴）
 * 前端 new Date() 會將無 Z 的字串當成本地時間解析，導致時區偏差
 * 此 middleware 統一將其轉為 "YYYY-MM-DDTHH:MM:SSZ" 格式
 */

// 匹配 JSON 值中的 SQLite datetime 格式："2026-03-07 16:39:20"
const SQLITE_DATETIME_RE = /"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}"/g;

export const dateFormatMiddleware: MiddlewareHandler = async (c, next) => {
  await next();

  const contentType = c.res.headers.get('content-type');
  if (!contentType?.includes('application/json')) return;

  const body = await c.res.text();
  const fixed = body.replace(SQLITE_DATETIME_RE, (match) => {
    // "2026-03-07 16:39:20" → "2026-03-07T16:39:20Z"
    return match.replace(' ', 'T').slice(0, -1) + 'Z"';
  });

  c.res = new Response(fixed, {
    status: c.res.status,
    headers: c.res.headers,
  });
};
