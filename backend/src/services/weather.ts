import { Env, WeatherData, CwaLocationWeather, CwaWeatherElement } from '../types';

// 中央氣象署 API 端點
const CWA_API_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';

// 台灣各縣市代碼對應（用於查詢天氣預報）
const LOCATION_CODES: Record<string, string> = {
  // 北部
  台北市: 'F-D0047-061',
  臺北市: 'F-D0047-061',
  新北市: 'F-D0047-069',
  基隆市: 'F-D0047-049',
  桃園市: 'F-D0047-005',
  新竹市: 'F-D0047-053',
  新竹縣: 'F-D0047-009',
  // 中部
  苗栗縣: 'F-D0047-013',
  台中市: 'F-D0047-073',
  臺中市: 'F-D0047-073',
  彰化縣: 'F-D0047-017',
  南投縣: 'F-D0047-021',
  雲林縣: 'F-D0047-025',
  // 南部
  嘉義市: 'F-D0047-057',
  嘉義縣: 'F-D0047-029',
  台南市: 'F-D0047-077',
  臺南市: 'F-D0047-077',
  高雄市: 'F-D0047-065',
  屏東縣: 'F-D0047-033',
  // 東部
  宜蘭縣: 'F-D0047-001',
  花蓮縣: 'F-D0047-041',
  台東縣: 'F-D0047-037',
  臺東縣: 'F-D0047-037',
  // 離島
  澎湖縣: 'F-D0047-045',
  金門縣: 'F-D0047-085',
  連江縣: 'F-D0047-081',
};

// 全台灣 36 小時預報
const TAIWAN_FORECAST_CODE = 'F-C0032-001';

// 從地址或區域名稱提取縣市名稱
function extractCity(location: string): string | null {
  // 嘗試匹配縣市名稱
  for (const city of Object.keys(LOCATION_CODES)) {
    if (location.includes(city)) {
      return city;
    }
  }
  // 找不到匹配的縣市則回傳 null
  return null;
}

// 從鄉鎮市區提取區域名稱
function extractDistrict(location: string): string | null {
  // 匹配「XX區」、「XX鄉」、「XX鎮」的模式
  // 注意：不匹配「XX市」，因為那是縣市名稱（如「新北市」），不是鄉鎮區
  // 縣轄市（如「板橋市」已改制為「板橋區」）也不需要匹配
  const patterns = [
    /([^\s縣市]+[區鄉鎮])/,
  ];

  for (const pattern of patterns) {
    const match = location.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// 安全地解析數值，無法解析時回傳 null
function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

// 獲取天氣預報資料
export async function getWeatherByLocation(
  env: Env,
  location: string
): Promise<WeatherData | null> {
  const city = extractCity(location);
  const district = extractDistrict(location);

  // 若無法識別縣市，使用全台灣預報；若有識別到縣市，使用縣市預報
  const datasetId = city ? LOCATION_CODES[city] : TAIWAN_FORECAST_CODE;
  const displayCity = city || '台灣';

  console.log(`Weather request: location="${location}", city="${city || 'null'}", district="${district || 'null'}", datasetId="${datasetId}"`);

  // 先檢查快取
  const cacheKey = `weather:${displayCity}:${district || 'all'}`;
  try {
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      try {
        console.log(`Weather cache hit: ${cacheKey}`);
        return JSON.parse(cached) as WeatherData;
      } catch {
        console.warn(`Weather cache parse error for key: ${cacheKey}`);
        // 快取資料無效，繼續獲取新資料
      }
    }
  } catch (cacheError) {
    console.error('Weather cache read error:', cacheError);
    // 快取讀取失敗，繼續獲取新資料
  }

  try {
    const url = new URL(`${CWA_API_BASE}/${datasetId}`);
    url.searchParams.set('Authorization', env.CWA_API_KEY);
    url.searchParams.set('format', 'JSON');
    if (district && city) {
      url.searchParams.set('locationName', district);
    }

    console.log(`Fetching CWA API: ${datasetId}`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`CWA API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const responseText = await response.text();
    let data: {
      success: string;
      records: {
        locations?: Array<{
          location: CwaLocationWeather[];
        }>;
        location?: CwaLocationWeather[];
      };
    };

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('CWA API response parse error:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        responsePreview: responseText.substring(0, 200),
      });
      return null;
    }

    if (data.success !== 'true') {
      console.error('CWA API returned unsuccessful response:', data.success);
      return null;
    }

    // 解析天氣資料
    const locations = data.records.locations?.[0]?.location || data.records.location || [];
    if (locations.length === 0) {
      console.warn(`No weather data found for: ${displayCity} ${district || ''}`);
      return null;
    }

    const locationData = locations[0];
    const weatherData = parseWeatherData(locationData, displayCity, district);

    // 快取 30 分鐘
    try {
      await env.CACHE.put(cacheKey, JSON.stringify(weatherData), {
        expirationTtl: 1800,
      });
    } catch (cacheWriteError) {
      console.error('Weather cache write error:', cacheWriteError);
      // 快取寫入失敗不影響回傳結果
    }

    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    return null;
  }
}

// 解析 CWA API 回傳的天氣資料
function parseWeatherData(
  locationData: CwaLocationWeather,
  city: string,
  district: string | null
): WeatherData {
  const elements: Record<string, CwaWeatherElement['time']> = {};

  for (const element of locationData.weatherElement) {
    elements[element.elementName] = element.time;
  }

  // 取得當前時段的資料（第一個時段）
  const currentTime = elements['Wx']?.[0] || elements['WeatherDescription']?.[0];
  const currentTemp = elements['T']?.[0] || elements['MinT']?.[0];
  const minTemp = elements['MinT']?.[0];
  const maxTemp = elements['MaxT']?.[0];
  const pop = elements['PoP']?.[0] || elements['PoP12h']?.[0];
  const comfort = elements['CI']?.[0];

  // 建立預報資料（接下來幾個時段）
  const forecast: WeatherData['forecast'] = [];
  const timeSlots = elements['Wx'] || elements['WeatherDescription'] || [];

  for (let i = 1; i < Math.min(timeSlots.length, 7); i++) {
    const slot = timeSlots[i];
    const minTempSlot = elements['MinT']?.[i];
    const maxTempSlot = elements['MaxT']?.[i];
    const popSlot = elements['PoP']?.[i] || elements['PoP12h']?.[i];

    forecast.push({
      date: slot.startTime,
      minTemp: parseNumber(minTempSlot?.parameter?.parameterName),
      maxTemp: parseNumber(maxTempSlot?.parameter?.parameterName),
      condition: slot.parameter?.parameterName || null,
      precipitation: parseNumber(popSlot?.parameter?.parameterName),
    });
  }

  return {
    location: district ? `${city}${district}` : city,
    temperature: parseNumber(currentTemp?.parameter?.parameterName),
    minTemp: parseNumber(minTemp?.parameter?.parameterName),
    maxTemp: parseNumber(maxTemp?.parameter?.parameterName),
    condition: currentTime?.parameter?.parameterName || null,
    precipitation: parseNumber(pop?.parameter?.parameterName),
    comfort: comfort?.parameter?.parameterName || null,
    updatedAt: new Date().toISOString(),
    forecast,
  };
}

// 根據經緯度獲取天氣（使用最近的氣象站）
export async function getWeatherByCoordinates(
  env: Env,
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  // 根據經緯度判斷大約在哪個縣市
  const city = getCityByCoordinates(latitude, longitude);
  console.log(`Coordinates (${latitude}, ${longitude}) mapped to city: ${city}`);
  return getWeatherByLocation(env, city);
}

// 簡易的經緯度對應縣市判斷
// 注意：這是一個簡化實作，在縣市交界處可能不夠準確
// 未來可考慮使用反向地理編碼 API 或本地 GeoJSON 資料來提高準確性
function getCityByCoordinates(latitude: number, longitude: number): string {
  // 台灣大致座標範圍
  // 北部: lat > 24.5
  // 中部: 23.5 < lat < 24.5
  // 南部: 22.5 < lat < 23.5
  // 東部: lon > 121.2

  // 北部（緯度 > 25）
  if (latitude > 25) {
    // 東北角海岸特殊處理（龍洞、貢寮、瑞芳等地）
    // 新北市與宜蘭縣的分界大約在緯度 25.0 附近（雪山隧道北口）
    // 龍洞 (25.1085, 121.9215) 屬於新北市貢寮區
    if (longitude > 121.5) {
      // 東北角：新北市貢寮、瑞芳、基隆一帶
      return longitude > 121.7 ? '新北市' : '基隆市';
    }
    // 其他北部區域
    return longitude < 121.5 ? '新北市' : '基隆市';
  }

  // 宜蘭縣：東部，緯度在 24-25 之間
  if (longitude > 121.2 && latitude >= 24) {
    return '宜蘭縣';
  }

  // 花蓮縣與台東縣
  if (longitude > 121.2 && latitude < 24) {
    return latitude > 23 ? '花蓮縣' : '台東縣';
  }

  // 中北部
  if (latitude > 24.5) {
    return longitude < 121 ? '桃園市' : '台北市';
  }
  if (latitude > 24) {
    return longitude < 120.8 ? '苗栗縣' : '新竹縣';
  }

  // 中部
  if (latitude > 23.5) {
    return longitude < 120.6 ? '彰化縣' : '台中市';
  }
  if (latitude > 23) {
    return longitude < 120.5 ? '嘉義縣' : '雲林縣';
  }

  // 南部
  if (latitude > 22.5) {
    return longitude < 120.3 ? '台南市' : '高雄市';
  }

  return '屏東縣';
}
