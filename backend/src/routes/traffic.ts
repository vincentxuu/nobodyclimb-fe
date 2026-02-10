import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import * as cheerio from 'cheerio';
import { Env, CameraData } from '../types';

// Query parameter schemas
const camerasQuerySchema = z.object({
  lat: z.string().min(1, '緯度為必填'),
  lon: z.string().min(1, '經度為必填'),
});

export const trafficRoutes = new Hono<{ Bindings: Env }>();

const TRAFFIC_API_BASE_URL = 'https://www.1968services.tw';

// 從 HTML 回應中解析攝影機資料（使用 cheerio 解析 HTML）
function parseCamerasFromHtml(html: string): CameraData[] {
  const $ = cheerio.load(html);
  const cameras: CameraData[] = [];

  // 選取所有攝影機連結
  $('a[href^="/cam/"]').each((_, el) => {
    const a = $(el);
    const href = a.attr('href');
    const camid = href?.split('/')[2];

    if (!camid) return;

    // 取得描述文字和圖片 URL
    const description = a.find('div').first().text().trim();
    const img = a.find('img');
    const cachedUri = img.attr('src');

    if (!description || !cachedUri) return;

    // 從描述中解析名稱和距離
    // 格式: "台2線  87K+543(順樁) 距離0.2公里 氣溫17.7度"
    const nameMatch = description.match(/^(.+?)\s+距離/);
    const distanceMatch = description.match(/距離([\d.]+)公里/);

    cameras.push({
      camid,
      camname: nameMatch ? nameMatch[1].trim() : description,
      camuri: cachedUri, // 使用快取圖片，較穩定
      location: description,
      latitude: null, // HTML 中沒有經緯度資訊
      longitude: null,
      direction: undefined,
      distance: distanceMatch ? parseFloat(distanceMatch[1]) : undefined,
    });
  });

  return cameras;
}

// GET /traffic/cameras - 根據經緯度獲取附近路況攝影機
trafficRoutes.get(
  '/cameras',
  describeRoute({
    tags: ['Traffic'],
    summary: '獲取附近路況攝影機',
    description:
      '根據經緯度座標查詢附近的路況攝影機列表，資料來源為高公局 1968 路況服務。可用於岩場周邊道路路況查詢。',
    responses: {
      200: { description: '成功取得附近路況攝影機列表' },
      400: { description: '缺少必要的經緯度參數或參數格式錯誤' },
      502: { description: '路況服務回傳格式錯誤' },
      503: { description: '路況服務暫時無法使用' },
    },
  }),
  validator('query', camerasQuerySchema),
  async (c) => {
    const { lat, lon } = c.req.valid('query');

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Invalid latitude or longitude values',
        },
        400
      );
    }

    try {
      // 代理請求到 1968 路況服務
      const apiUrl = `${TRAFFIC_API_BASE_URL}/query-cam-list-by-coordinate/${latitude}/${longitude}`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        console.error(`1968 API error: ${response.status} ${response.statusText}`);
        return c.json(
          {
            success: false,
            error: 'Service Unavailable',
            message: '路況服務暫時無法使用',
          },
          503
        );
      }

      const responseText = await response.text();
      const contentType = response.headers.get('content-type') || '';

      let cameraList: CameraData[];

      // 檢查回應是 JSON 還是 HTML
      if (contentType.includes('application/json')) {
        // JSON 回應（舊格式）
        try {
          cameraList = JSON.parse(responseText) as CameraData[];
        } catch (parseError) {
          console.error('Failed to parse 1968 API JSON response:', {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            responsePreview: responseText.substring(0, 200),
          });
          return c.json(
            {
              success: false,
              error: 'Service Error',
              message: 'API 回傳格式錯誤',
            },
            502
          );
        }
      } else {
        // HTML 回應（新格式）- 解析 HTML 提取攝影機資料
        cameraList = parseCamerasFromHtml(responseText);

        if (cameraList.length === 0) {
          console.warn('No cameras found in HTML response');
        }
      }

      // 驗證回傳的是陣列
      if (!Array.isArray(cameraList)) {
        console.error('1968 API response is not an array:', typeof cameraList);
        return c.json(
          {
            success: false,
            error: 'Service Error',
            message: 'API 回傳格式錯誤',
          },
          502
        );
      }

      return c.json({
        success: true,
        data: cameraList,
      });
    } catch (error) {
      console.error('Failed to fetch traffic cameras:', error);
      return c.json(
        {
          success: false,
          error: 'Service Unavailable',
          message: '無法連接路況服務',
        },
        503
      );
    }
  }
);