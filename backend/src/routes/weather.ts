import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { getWeatherByLocation, getWeatherByCoordinates } from '../services/weather';

// Query parameter schemas
const locationQuerySchema = z.object({
  location: z.string().min(1, '地點名稱為必填'),
});

const coordinatesQuerySchema = z.object({
  lat: z.string().min(1, '緯度為必填'),
  lon: z.string().min(1, '經度為必填'),
});

export const weatherRoutes = new Hono<{ Bindings: Env }>();

// 中介軟體：檢查 CWA API Key 是否設定
weatherRoutes.use('*', async (c, next) => {
  if (!c.env.CWA_API_KEY) {
    console.error('CWA_API_KEY is not configured');
    return c.json(
      {
        success: false,
        error: 'Service Unavailable',
        message: 'Weather service is not configured',
      },
      503
    );
  }
  await next();
});

// GET /weather - 根據地點名稱獲取天氣
weatherRoutes.get(
  '/',
  describeRoute({
    tags: ['Weather'],
    summary: '根據地點名稱獲取天氣',
    description: '根據台灣縣市或鄉鎮區名稱查詢當前天氣資訊，資料來源為中央氣象署。支援的地點包含台灣各縣市及其轄下鄉鎮區。',
    responses: {
      200: { description: '成功取得天氣資料' },
      400: { description: '缺少必要的地點參數' },
      404: { description: '找不到該地點的天氣資料' },
      503: { description: '天氣服務未設定或暫時無法使用' },
    },
  }),
  validator('query', locationQuerySchema),
  async (c) => {
    const { location } = c.req.valid('query');

    const weather = await getWeatherByLocation(c.env, location);

    if (!weather) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Weather data not available for this location',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: weather,
    });
  }
);

// GET /weather/coordinates - 根據經緯度獲取天氣
weatherRoutes.get(
  '/coordinates',
  describeRoute({
    tags: ['Weather'],
    summary: '根據經緯度獲取天氣',
    description: '根據經緯度座標查詢最近觀測站的天氣資訊。系統會自動找出距離給定座標最近的氣象觀測站，並回傳該站點的天氣資料。適用於岩場等需要精確位置天氣資訊的場景。',
    responses: {
      200: { description: '成功取得天氣資料' },
      400: { description: '缺少必要的經緯度參數或參數格式錯誤' },
      404: { description: '找不到該座標附近的天氣資料' },
      503: { description: '天氣服務未設定或暫時無法使用' },
    },
  }),
  validator('query', coordinatesQuerySchema),
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

    const weather = await getWeatherByCoordinates(c.env, latitude, longitude);

    if (!weather) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Weather data not available for these coordinates',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: weather,
    });
  }
);
