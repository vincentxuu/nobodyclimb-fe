import { Hono } from 'hono';
import { Env, CameraData } from '../types';

export const trafficRoutes = new Hono<{ Bindings: Env }>();

const TRAFFIC_API_BASE_URL = 'https://www.1968services.tw';

// GET /traffic/cameras - 根據經緯度獲取附近路況攝影機
trafficRoutes.get('/cameras', async (c) => {
  const lat = c.req.query('lat');
  const lon = c.req.query('lon');

  if (!lat || !lon) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Latitude and longitude parameters are required',
      },
      400
    );
  }

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
        'User-Agent': 'NobodyClimb/1.0',
        Accept: 'application/json',
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

    // 嘗試解析 JSON（1968 API 的 content-type 可能是 text/html 但實際內容是 JSON）
    let cameraList: CameraData[];
    try {
      cameraList = (await response.json()) as CameraData[];
    } catch {
      console.error('Failed to parse 1968 API response as JSON');
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
});
