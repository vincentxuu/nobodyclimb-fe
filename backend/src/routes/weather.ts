import { Hono } from 'hono';
import { Env, SatelliteImageType, SatelliteImageArea, RadarImageType, RadarImageArea } from '../types';
import { getWeatherByLocation, getWeatherByCoordinates } from '../services/weather';
import { getSatelliteImages, getSatelliteImageProxy, getRadarImages, getRadarImageProxy } from '../services/satellite';

export const weatherRoutes = new Hono<{ Bindings: Env }>();

// 中介軟體：檢查 CWA API Key 是否設定
weatherRoutes.use('*', async (c, next) => {
  const path = c.req.path;
  const isPublicImageRoute =
    path.endsWith('/weather/satellite') ||
    path.endsWith('/weather/satellite/image') ||
    path.endsWith('/weather/radar') ||
    path.endsWith('/weather/radar/image');

  if (isPublicImageRoute) {
    await next();
    return;
  }

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
weatherRoutes.get('/', async (c) => {
  const location = c.req.query('location');

  if (!location) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Location parameter is required',
      },
      400
    );
  }

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
});

// GET /weather/coordinates - 根據經緯度獲取天氣
weatherRoutes.get('/coordinates', async (c) => {
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
});

// GET /weather/satellite - 取得衛星雲圖資訊
weatherRoutes.get('/satellite', async (c) => {
  const type = c.req.query('type') as SatelliteImageType | undefined;
  const area = c.req.query('area') as SatelliteImageArea | undefined;

  const images = getSatelliteImages(type, area);

  return c.json({
    success: true,
    data: images,
  });
});

// GET /weather/satellite/image - 代理衛星雲圖圖片（避免 CORS 問題）
weatherRoutes.get('/satellite/image', async (c) => {
  const type = c.req.query('type') as SatelliteImageType;
  const area = c.req.query('area') as SatelliteImageArea;

  if (!type || !area) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Type and area parameters are required',
      },
      400
    );
  }

  const imageData = await getSatelliteImageProxy(type, area);

  if (!imageData) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Satellite image not available',
      },
      404
    );
  }

  // 設定適當的 headers
  c.header('Cross-Origin-Resource-Policy', 'cross-origin');
  c.header('Content-Type', 'image/jpeg');
  c.header('Cache-Control', 'public, max-age=600'); // 快取 10 分鐘

  return c.body(imageData);
});

// GET /weather/radar - 取得雷達回波資訊
weatherRoutes.get('/radar', async (c) => {
  const type = c.req.query('type') as RadarImageType | undefined;
  const area = c.req.query('area') as RadarImageArea | undefined;

  const images = getRadarImages(type, area);

  return c.json({
    success: true,
    data: images,
  });
});

// GET /weather/radar/image - 代理雷達回波圖片（避免 CORS 問題）
weatherRoutes.get('/radar/image', async (c) => {
  const type = c.req.query('type') as RadarImageType;
  const area = c.req.query('area') as RadarImageArea;

  if (!type || !area) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Type and area parameters are required',
      },
      400
    );
  }

  const imageData = await getRadarImageProxy(type, area);

  if (!imageData) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Radar image not available',
      },
      404
    );
  }

  // 設定適當的 headers
  c.header('Cross-Origin-Resource-Policy', 'cross-origin');
  c.header('Content-Type', 'image/png');
  c.header('Cache-Control', 'public, max-age=300'); // 快取 5 分鐘（雷達更新較頻繁）

  return c.body(imageData);
});
