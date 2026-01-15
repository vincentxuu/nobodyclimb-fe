import { Env } from '../types';

interface RateLimitConfig {
  windowMs: number;    // 時間窗口（毫秒）
  maxRequests: number; // 最大請求次數
  keyPrefix: string;   // KV key 前綴
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

export interface PasswordResetRateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  message?: string;
}

/**
 * 檢查 rate limit
 */
export async function checkRateLimit(
  cache: KVNamespace,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // 從 KV 獲取請求記錄
  const recordJson = await cache.get(key);
  const requests: number[] = recordJson ? JSON.parse(recordJson) : [];

  // 移除過期的請求記錄
  const validRequests = requests.filter((timestamp) => timestamp > windowStart);

  if (validRequests.length >= config.maxRequests) {
    const oldestRequest = Math.min(...validRequests);
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  // 記錄新請求
  validRequests.push(now);
  await cache.put(key, JSON.stringify(validRequests), {
    expirationTtl: Math.ceil(config.windowMs / 1000) + 60, // 加 60 秒緩衝
  });

  return {
    allowed: true,
    remaining: config.maxRequests - validRequests.length,
  };
}

/**
 * 密碼重設 Rate Limit 檢查
 * - 每個 Email: 每小時最多 3 次
 * - 每個 IP: 每小時最多 10 次
 */
export async function checkPasswordResetRateLimit(
  cache: KVNamespace,
  ip: string,
  email: string
): Promise<PasswordResetRateLimitResult> {
  // IP 限制：每小時最多 10 次請求
  const ipLimit = await checkRateLimit(cache, ip, {
    windowMs: 60 * 60 * 1000, // 1 小時
    maxRequests: 10,
    keyPrefix: 'ratelimit:pwd-reset:ip',
  });

  if (!ipLimit.allowed) {
    return {
      allowed: false,
      retryAfter: ipLimit.retryAfter,
      message: `請求過於頻繁，請在 ${ipLimit.retryAfter} 秒後再試`,
    };
  }

  // Email 限制：每小時最多 3 次請求
  const emailLimit = await checkRateLimit(cache, email.toLowerCase(), {
    windowMs: 60 * 60 * 1000, // 1 小時
    maxRequests: 3,
    keyPrefix: 'ratelimit:pwd-reset:email',
  });

  if (!emailLimit.allowed) {
    return {
      allowed: false,
      retryAfter: emailLimit.retryAfter,
      message: `此電子郵件請求過於頻繁，請在 ${emailLimit.retryAfter} 秒後再試`,
    };
  }

  return { allowed: true };
}
