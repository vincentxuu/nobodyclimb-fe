import { createMiddleware } from 'hono/factory';
import { Env } from '../types';

// 常數定義
const MAX_BLOB_LENGTH = 256;

// 已知的安全錯誤類型（可以記錄）
const SAFE_ERROR_TYPES = ['Unauthorized', 'Forbidden', 'Not Found', 'Bad Request', 'Validation Error'];

/**
 * Access Log Middleware
 * 記錄所有 API 請求到 Cloudflare Analytics Engine
 *
 * Analytics Engine 數據格式：
 * - blobs[0]: method (GET, POST, etc.)
 * - blobs[1]: path (/api/v1/users, etc.)
 * - blobs[2]: userAgent
 * - blobs[3]: country (CF-IPCountry header)
 * - blobs[4]: userId (if authenticated, otherwise 'anonymous')
 * - blobs[5]: ip (client IP)
 * - blobs[6]: statusCode (as string)
 * - blobs[7]: errorMessage (if any)
 * - doubles[0]: responseTime (ms)
 * - doubles[1]: statusCode (as number for aggregation)
 * - indexes[0]: path (for fast lookups)
 */
export const accessLogMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const startTime = Date.now();

    // 執行下一個 middleware/handler
    await next();

    // 計算響應時間
    const responseTime = Date.now() - startTime;

    // 取得請求資訊
    const method = c.req.method;
    const path = new URL(c.req.url).pathname;
    const userAgent = c.req.header('User-Agent') || 'unknown';
    const country = c.req.header('CF-IPCountry') || 'unknown';
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const statusCode = c.res.status;

    // 嘗試取得已認證的用戶 ID
    let userId = 'anonymous';
    try {
      const user = c.get('user');
      if (user?.sub) {
        userId = user.sub;
      }
    } catch {
      // 用戶未認證，保持 anonymous
    }

    // 錯誤訊息（如果有）- 只記錄安全的錯誤類型
    let errorMessage = '';
    if (statusCode >= 400) {
      try {
        const clonedRes = c.res.clone();
        const body = await clonedRes.json() as { error?: string; message?: string };
        const rawError = body?.error || '';
        // 只記錄已知的安全錯誤類型，避免洩露敏感資訊
        if (SAFE_ERROR_TYPES.includes(rawError)) {
          errorMessage = rawError;
        } else if (statusCode >= 500) {
          errorMessage = 'Internal Server Error'; // 不記錄詳細的伺服器錯誤
        } else {
          errorMessage = body?.message || rawError || '';
        }
      } catch {
        // 無法解析錯誤訊息
      }
    }

    // 寫入 Analytics Engine
    // 使用 try-catch 避免日誌錯誤影響主請求
    try {
      if (c.env.ACCESS_LOGS) {
        c.env.ACCESS_LOGS.writeDataPoint({
          blobs: [
            method,
            path,
            userAgent.substring(0, MAX_BLOB_LENGTH),
            country,
            userId,
            ip,
            String(statusCode),
            errorMessage.substring(0, MAX_BLOB_LENGTH),
          ],
          doubles: [responseTime, statusCode],
          indexes: [path],
        });
      }
    } catch (error) {
      // 日誌寫入失敗不應影響主請求
      console.error('Access log write failed:', error);
    }
  }
);
