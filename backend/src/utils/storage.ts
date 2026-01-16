import type { R2Bucket } from '@cloudflare/workers-types';

/**
 * 從 R2 刪除圖片
 * @param storage R2 bucket
 * @param url 圖片 URL 或 URL 陣列
 */
export async function deleteR2Images(
  storage: R2Bucket,
  url: string | (string | null | undefined)[] | null | undefined
): Promise<void> {
  if (!url) return;

  const urls = Array.isArray(url) ? url : [url];

  await Promise.all(
    urls.map(async (u) => {
      if (!u) return;
      try {
        const key = new URL(u).pathname.substring(1);
        await storage.delete(key);
      } catch {
        // Ignore errors (invalid URL, already deleted, etc.)
      }
    })
  );
}

/**
 * 從 HTML 內容中提取 R2 圖片 URL
 * @param content HTML 內容
 * @param r2PublicUrl R2 公開 URL 前綴
 */
export function extractR2ImagesFromContent(
  content: string | null | undefined,
  r2PublicUrl: string
): string[] {
  if (!content) return [];

  const urls: string[] = [];
  // 匹配 img src 和 markdown 圖片語法
  const imgRegex = new RegExp(
    `(?:src=["']|!\\[.*?\\]\\()([^"')]+${r2PublicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"')]+)`,
    'gi'
  );

  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1]) urls.push(match[1]);
  }

  // 也匹配直接的 URL
  const urlRegex = new RegExp(
    `${r2PublicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^\\s"'<>]+`,
    'gi'
  );
  while ((match = urlRegex.exec(content)) !== null) {
    if (!urls.includes(match[0])) urls.push(match[0]);
  }

  return urls;
}
