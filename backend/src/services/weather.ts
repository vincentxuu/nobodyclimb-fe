import { Env, WeatherData, CwaLocationWeather, CwaWeatherElement } from '../types';

// 中央氣象署 API 端點
const CWA_API_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';

// 台灣各縣市代碼對應（用於查詢 1 週鄉鎮天氣預報）
const LOCATION_CODES: Record<string, string> = {
  // 北部
  台北市: 'F-D0047-063',
  臺北市: 'F-D0047-063',
  新北市: 'F-D0047-071',
  基隆市: 'F-D0047-051',
  桃園市: 'F-D0047-007',
  新竹市: 'F-D0047-055',
  新竹縣: 'F-D0047-011',
  // 中部
  苗栗縣: 'F-D0047-015',
  台中市: 'F-D0047-075',
  臺中市: 'F-D0047-075',
  彰化縣: 'F-D0047-019',
  南投縣: 'F-D0047-023',
  雲林縣: 'F-D0047-027',
  // 南部
  嘉義市: 'F-D0047-059',
  嘉義縣: 'F-D0047-031',
  台南市: 'F-D0047-079',
  臺南市: 'F-D0047-079',
  高雄市: 'F-D0047-067',
  屏東縣: 'F-D0047-035',
  // 東部
  宜蘭縣: 'F-D0047-003',
  花蓮縣: 'F-D0047-043',
  台東縣: 'F-D0047-039',
  臺東縣: 'F-D0047-039',
  // 離島
  澎湖縣: 'F-D0047-047',
  金門縣: 'F-D0047-087',
  連江縣: 'F-D0047-083',
};

// 全台灣 36 小時預報
const TAIWAN_FORECAST_CODE = 'F-C0032-001';

// 各縣市預設代表區域（用於座標查詢時的備援）
const DEFAULT_DISTRICTS: Record<string, string> = {
  台北市: '中正區',
  臺北市: '中正區',
  新北市: '板橋區',
  基隆市: '中正區',
  桃園市: '桃園區',
  新竹市: '東區',
  新竹縣: '竹北市',
  苗栗縣: '苗栗市',
  台中市: '西區',
  臺中市: '西區',
  彰化縣: '彰化市',
  南投縣: '南投市',
  雲林縣: '斗六市',
  嘉義市: '東區',
  嘉義縣: '太保市',
  台南市: '中西區',
  臺南市: '中西區',
  高雄市: '前鎮區',
  屏東縣: '屏東市',
  宜蘭縣: '宜蘭市',
  花蓮縣: '花蓮市',
  台東縣: '台東市',
  臺東縣: '臺東市',
  澎湖縣: '馬公市',
  金門縣: '金城鎮',
  連江縣: '南竿鄉',
};

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

function normalizeLocationName(value: string): string {
  return value.replace('臺', '台').replace(/\s+/g, '');
}

function findLocationByDistrict(
  locations: CwaLocationWeather[],
  district: string | null
): CwaLocationWeather | null {
  if (!district) return null;
  const normalizedDistrict = normalizeLocationName(district);
  const exactMatch = locations.find(
    location => {
      const name = (location as any).locationName || (location as any).LocationName || '';
      return normalizeLocationName(name) === normalizedDistrict;
    }
  );
  if (exactMatch) return exactMatch;

  const trimmedDistrict = normalizedDistrict.replace(/[區鄉鎮市]$/, '');
  return (
    locations.find(
      location => {
        const name = (location as any).locationName || (location as any).LocationName || '';
        return normalizeLocationName(name).replace(/[區鄉鎮市]$/, '') === trimmedDistrict;
      }
    ) || null
  );
}

function normalizeElementName(value: string): string {
  return normalizeLocationName(value).replace(/\s+/g, '');
}

function extractLocationsFromRecords(data: {
  records?: {
    locations?: Array<{ location?: CwaLocationWeather[] }>;
    location?: CwaLocationWeather[];
    Locations?: Array<{ Location?: CwaLocationWeather[] }>;
    Location?: CwaLocationWeather[];
  };
}): CwaLocationWeather[] {
  const records = data.records || {};
  const upperLocations = records.Locations?.[0]?.Location || [];
  const lowerLocations = records.locations?.[0]?.location || [];
  const upperLocation = records.Location || [];
  const lowerLocation = records.location || [];
  return upperLocations.length
    ? upperLocations
    : lowerLocations.length
      ? lowerLocations
      : upperLocation.length
        ? upperLocation
        : lowerLocation;
}

function extractElementValue(valueObj: Record<string, string>, key: string): string | null {
  if (key in valueObj) return valueObj[key] ?? null;
  const firstKey = Object.keys(valueObj)[0];
  return firstKey ? valueObj[firstKey] : null;
}

function buildLegacyElement(
  element: any,
  targetName: string,
  valueKey: string
): CwaWeatherElement | null {
  const timeList = element.Time || element.time || [];
  if (!Array.isArray(timeList) || timeList.length === 0) return null;

  const time = timeList.map((slot: any) => {
    const valueObj = (slot.ElementValue || slot.elementValue || [])[0] || {};
    const value = extractElementValue(valueObj, valueKey);
    return {
      startTime: slot.StartTime || slot.startTime,
      endTime: slot.EndTime || slot.endTime,
      parameter: {
        parameterName: value ?? '',
      },
    };
  });

  return {
    elementName: targetName,
    time,
  };
}

function normalizeLocationData(locationData: any): CwaLocationWeather {
  const locationName = locationData.locationName || locationData.LocationName || '';
  const weatherElement = locationData.weatherElement || locationData.WeatherElement || [];
  if (!Array.isArray(weatherElement) || weatherElement.length === 0) {
    return { locationName, weatherElement: [] };
  }

  const hasLegacyShape = typeof weatherElement[0]?.elementName === 'string';
  if (hasLegacyShape) {
    return { locationName, weatherElement };
  }

  const mapping = [
    { names: ['天氣現象', 'Weather'], target: 'Wx', key: 'Weather' },
    { names: ['天氣預報綜合描述', 'WeatherDescription'], target: 'WeatherDescription', key: 'WeatherDescription' },
    { names: ['平均溫度', 'Temperature'], target: 'T', key: 'Temperature' },
    { names: ['最高溫度', 'MaxTemperature'], target: 'MaxT', key: 'MaxTemperature' },
    { names: ['最低溫度', 'MinTemperature'], target: 'MinT', key: 'MinTemperature' },
    { names: ['12小時降雨機率', 'ProbabilityOfPrecipitation'], target: 'PoP12h', key: 'ProbabilityOfPrecipitation' },
    { names: ['最大舒適度指數', '最大舒適度指數描述', 'MaxComfortIndexDescription'], target: 'CI', key: 'MaxComfortIndexDescription' },
    { names: ['最小舒適度指數', '最小舒適度指數描述', 'MinComfortIndexDescription'], target: 'CI', key: 'MinComfortIndexDescription' },
  ];

  const normalizedElements: CwaWeatherElement[] = [];
  for (const map of mapping) {
    const element = weatherElement.find((entry: any) =>
      map.names.some(name => normalizeElementName(entry.ElementName || entry.elementName || '') === normalizeElementName(name))
    );
    if (!element) continue;
    const legacy = buildLegacyElement(element, map.target, map.key);
    if (legacy) {
      normalizedElements.push(legacy);
    }
  }

  return { locationName, weatherElement: normalizedElements };
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
  location: string,
  useDefaultDistrict: boolean = false
): Promise<WeatherData | null> {
  const city = extractCity(location);
  let district = extractDistrict(location);

  // 若使用預設區域且沒有提取到區域，則使用縣市的預設代表區域
  if (useDefaultDistrict && !district && city) {
    district = DEFAULT_DISTRICTS[city] || null;
    console.log(`Using default district for ${city}: ${district}`);
  }

  // 若無法識別縣市，使用全台灣預報；若有識別到縣市，使用縣市預報
  const datasetId = city ? LOCATION_CODES[city] : TAIWAN_FORECAST_CODE;
  const displayCity = city || '台灣';

  console.log(`Weather request: location="${location}", city="${city || 'null'}", district="${district || 'null'}", datasetId="${datasetId}", useDefaultDistrict=${useDefaultDistrict}`);

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
      url.searchParams.set('LocationName', district);
      url.searchParams.set('locationName', district);
    }

    console.log(`Fetching CWA API: ${datasetId}${district ? ` with locationName=${district}` : ''}`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`CWA API error: ${response.status} ${response.statusText}`);
      // 若縣市級 API 失敗，嘗試使用全台預報作為備援
      if (datasetId !== TAIWAN_FORECAST_CODE) {
        console.log('Falling back to Taiwan-wide forecast');
        const fallbackData = await fetchTaiwanForecast(env, city || '台灣', location);
        if (fallbackData) {
          try {
            // 將備援資料存入快取
            await env.CACHE.put(cacheKey, JSON.stringify(fallbackData), { expirationTtl: 1800 });
          } catch (cacheWriteError) {
            console.error('Weather cache write error on fallback:', cacheWriteError);
          }
        }
        return fallbackData;
      }
      return null;
    }

    const responseText = await response.text();
    let data: {
      success: string;
      records: {
        locations?: Array<{ location?: CwaLocationWeather[] }>;
        location?: CwaLocationWeather[];
        Locations?: Array<{ Location?: CwaLocationWeather[] }>;
        Location?: CwaLocationWeather[];
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
    const locations = extractLocationsFromRecords(data);

    // 加入除錯資訊
    console.log(`CWA API response: success=${data.success}, locations count=${locations.length}`);

    if (locations.length === 0) {
      console.warn(`No weather data found for: ${displayCity} ${district || ''}`);

      // 針對指定區域查不到資料時，改用縣市資料並自行匹配區域名稱
      if (city && district) {
        const fallbackData = await fetchCityForecast(env, datasetId, displayCity, district, location);
        if (fallbackData) {
          try {
            await env.CACHE.put(cacheKey, JSON.stringify(fallbackData), { expirationTtl: 1800 });
          } catch (cacheWriteError) {
            console.error('Weather cache write error on city fallback:', cacheWriteError);
          }
        }
        return fallbackData;
      }

      // 備援策略：
      // 1. 若查詢特定區域失敗，嘗試使用預設區域
      if (city && !useDefaultDistrict && !district) {
        console.log('Retrying with default district');
        return getWeatherByLocation(env, location, true);
      }

      // 2. 若縣市級查詢失敗，改用全台預報
      if (datasetId !== TAIWAN_FORECAST_CODE) {
        console.log('Falling back to Taiwan-wide forecast');
        const fallbackData = await fetchTaiwanForecast(env, city || '台灣', location);
        if (fallbackData) {
          try {
            // 將備援資料存入快取
            await env.CACHE.put(cacheKey, JSON.stringify(fallbackData), { expirationTtl: 1800 });
          } catch (cacheWriteError) {
            console.error('Weather cache write error on fallback:', cacheWriteError);
          }
        }
        return fallbackData;
      }

      return null;
    }

    let locationData = locations[0];
    if (district) {
      const matched = findLocationByDistrict(locations, district);
      if (matched) {
        locationData = matched;
      } else {
        console.warn(`No district match found in city data: city="${displayCity}", district="${district}"`);
      }
    }
    // 從 API 回傳的資料中取得實際的區域名稱
    const normalizedLocationData = normalizeLocationData(locationData);
    const actualDistrict = normalizedLocationData.locationName || district;
    // 傳入原始地址以保留完整的地點名稱
    const weatherData = parseWeatherData(normalizedLocationData, displayCity, actualDistrict, location);

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

// 獲取全台灣預報作為備援
async function fetchTaiwanForecast(
  env: Env,
  displayCity: string,
  originalLocation?: string
): Promise<WeatherData | null> {
  try {
    const url = new URL(`${CWA_API_BASE}/${TAIWAN_FORECAST_CODE}`);
    url.searchParams.set('Authorization', env.CWA_API_KEY);
    url.searchParams.set('format', 'JSON');
    // 嘗試使用縣市名稱過濾全台預報
    if (displayCity && displayCity !== '台灣') {
      // 全台預報使用標準縣市名稱（台 vs 臺）
      const normalizedCity = displayCity.replace('臺', '台');
      url.searchParams.set('locationName', normalizedCity);
    }

    console.log(`Fetching Taiwan forecast: ${TAIWAN_FORECAST_CODE} for ${displayCity}`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`Taiwan forecast API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as {
      success: string;
      records: {
        locations?: Array<{ location?: CwaLocationWeather[] }>;
        location?: CwaLocationWeather[];
        Locations?: Array<{ Location?: CwaLocationWeather[] }>;
        Location?: CwaLocationWeather[];
      };
    };

    if (data.success !== 'true') {
      console.error('Taiwan forecast API returned unsuccessful response');
      return null;
    }

    const locations = extractLocationsFromRecords(data);
    if (locations.length === 0) {
      console.warn('No Taiwan forecast data found');
      return null;
    }

    const locationData = normalizeLocationData(locations[0]);
    // 傳入原始地址以保留完整的地點名稱
    const weatherData = parseWeatherData(locationData, locationData.locationName || displayCity, null, originalLocation);

    return weatherData;
  } catch (error) {
    console.error('Failed to fetch Taiwan forecast:', error);
    return null;
  }
}

// 使用縣市資料並自行匹配區域名稱（避免 locationName 過濾失敗只回 36 小時預報）
async function fetchCityForecast(
  env: Env,
  datasetId: string,
  displayCity: string,
  district: string,
  originalLocation?: string
): Promise<WeatherData | null> {
  try {
    const url = new URL(`${CWA_API_BASE}/${datasetId}`);
    url.searchParams.set('Authorization', env.CWA_API_KEY);
    url.searchParams.set('format', 'JSON');

    console.log(`Fetching city forecast without locationName: ${datasetId}`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`City forecast API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as {
      success: string;
      records: {
        locations?: Array<{ location?: CwaLocationWeather[] }>;
        location?: CwaLocationWeather[];
        Locations?: Array<{ Location?: CwaLocationWeather[] }>;
        Location?: CwaLocationWeather[];
      };
    };

    if (data.success !== 'true') {
      console.error('City forecast API returned unsuccessful response');
      return null;
    }

    const locations = extractLocationsFromRecords(data);
    if (locations.length === 0) {
      console.warn('No city forecast data found');
      return null;
    }

    const matchedLocation = findLocationByDistrict(locations, district);
    if (!matchedLocation) {
      console.warn(`No district match found in city forecast: city="${displayCity}", district="${district}"`);
      return null;
    }
    const normalizedLocation = normalizeLocationData(matchedLocation);
    const actualDistrict = normalizedLocation.locationName || district;
    return parseWeatherData(normalizedLocation, displayCity, actualDistrict, originalLocation);
  } catch (error) {
    console.error('Failed to fetch city forecast:', error);
    return null;
  }
}

// 預報時段數常數（7天 × 2時段 = 14）
const FORECAST_PERIODS = 14;

// 解析 CWA API 回傳的天氣資料
function parseWeatherData(
  locationData: CwaLocationWeather,
  city: string,
  district: string | null,
  originalLocation?: string
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

  // 取得未來預報資料（跳過第一個時段，因為是目前天氣）
  for (let i = 1; i < Math.min(timeSlots.length, FORECAST_PERIODS + 1); i++) {
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

  // 優先使用原始地址，保留完整的地點名稱（如「新北市貢寮區龍洞灣」）
  // 若無原始地址，則使用縣市+區域的組合
  const displayLocation = originalLocation || (district ? `${city}${district}` : city);

  return {
    location: displayLocation,
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
  // 座標查詢時直接使用預設區域，避免因為沒有區域資訊導致查詢失敗
  return getWeatherByLocation(env, city, true);
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
