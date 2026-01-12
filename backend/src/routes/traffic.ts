import { Hono } from 'hono';
import { Env, CameraData } from '../types';

export const trafficRoutes = new Hono<{ Bindings: Env }>();

const TRAFFIC_API_BASE_URL = 'https://www.1968services.tw';

// 從 HTML 回應中解析攝影機資料
function parseCamerasFromHtml(html: string): CameraData[] {
  const cameras: CameraData[] = [];

  // 匹配攝影機區塊的正則表達式
  // 格式: <a href="/cam/{camid}">...<div>描述</div><img src="..." data-src="...">
  const cameraBlockRegex =
    /<a href="\/cam\/([^"]+)"[^>]*>[\s\S]*?<div[^>]*>([^<]+)<\/div>[\s\S]*?<img[^>]*data-src="([^"]+)"[^>]*src="([^"]+)"[^>]*>/g;

  let match;
  while ((match = cameraBlockRegex.exec(html)) !== null) {
    const camid = match[1];
    const description = match[2].trim();
    const liveUri = match[3]; // data-src 是即時影像
    const cachedUri = match[4]; // src 是快取影像

    // 從描述中解析名稱和距離
    // 格式: "台2線  87K+543(順樁) 距離0.2公里 氣溫17.7度"
    const nameMatch = description.match(/^(.+?)\s+距離/);
    const distanceMatch = description.match(/距離([\d.]+)公里/);

    cameras.push({
      camid,
      camname: nameMatch ? nameMatch[1].trim() : description,
      camuri: cachedUri, // 使用快取圖片，較穩定
      location: description,
      latitude: 0, // HTML 中沒有經緯度資訊
      longitude: 0,
      direction: undefined,
      distance: distanceMatch ? parseFloat(distanceMatch[1]) : undefined,
    });
  }

  return cameras;
}

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
        console.error('Failed to parse 1968 API JSON response:', parseError);
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
});
