import { Hono } from 'hono';
import { Env } from '../types';
import { getWeatherByLocation, getWeatherByCoordinates } from '../services/weather';

export const weatherRoutes = new Hono<{ Bindings: Env }>();

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

  // 檢查 API Key 是否設定
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

  // 檢查 API Key 是否設定
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
