import { SatelliteImageInfo, SatelliteImageType, SatelliteImageArea, RadarImageInfo, RadarImageType, RadarImageArea } from '../types';

// 中央氣象署衛星雲圖 URL 配置
// 圖片 URL 格式：https://www.cwa.gov.tw/Data/satellite/{folder}/{filename}-{timestamp}.jpg
// 時間戳格式：YYYYMMDDHHMM（向下取整到最近的 10 分鐘）

/**
 * 計算最近的衛星圖片時間戳
 * 衛星圖片每 10 分鐘更新一次，取 UTC+8 時間向下取整到最近的 10 分鐘
 * 由於圖片處理需要時間，減去 20 分鐘以確保圖片已發布
 */
function getLatestSatelliteTimestamp(): string {
  const now = new Date();
  // 計算台灣時間（UTC+8），減去 20 分鐘
  const taiwanMs = now.getTime() + (8 * 60 - 20) * 60 * 1000;
  const taiwanTime = new Date(taiwanMs);

  // 向下取整到最近的 10 分鐘
  const minutes = Math.floor(taiwanTime.getUTCMinutes() / 10) * 10;

  const year = taiwanTime.getUTCFullYear();
  const month = String(taiwanTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(taiwanTime.getUTCDate()).padStart(2, '0');
  const hour = String(taiwanTime.getUTCHours()).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');

  return `${year}${month}${day}${hour}${min}`;
}

/**
 * 計算最近的雷達圖片時間戳
 * 雷達圖片每 10 分鐘更新一次，取 UTC+8 時間向下取整到最近的 10 分鐘
 * 由於圖片處理需要時間，減去 10 分鐘以確保圖片已發布
 */
function getLatestRadarTimestamp(): string {
  const now = new Date();
  // 計算台灣時間（UTC+8），減去 10 分鐘
  const taiwanMs = now.getTime() + (8 * 60 - 10) * 60 * 1000;
  const taiwanTime = new Date(taiwanMs);

  // 向下取整到最近的 10 分鐘
  const minutes = Math.floor(taiwanTime.getUTCMinutes() / 10) * 10;

  const year = taiwanTime.getUTCFullYear();
  const month = String(taiwanTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(taiwanTime.getUTCDate()).padStart(2, '0');
  const hour = String(taiwanTime.getUTCHours()).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');

  return `${year}${month}${day}${hour}${min}`;
}

interface SatelliteUrlConfig {
  folder: string;
  filename: string;
  label: string;
}

// 衛星雲圖 URL 對應表
const SATELLITE_URL_CONFIG: Record<SatelliteImageArea, Record<SatelliteImageType, SatelliteUrlConfig>> = {
  taiwan: {
    visible: {
      folder: 'LCC_VIS_Gray_800',
      filename: 'LCC_VIS_Gray_800',
      label: '台灣可見光雲圖',
    },
    infrared: {
      folder: 'LCC_IR1_CR_800',
      filename: 'LCC_IR1_CR_800',
      label: '台灣紅外線雲圖',
    },
    trueColor: {
      folder: 'LCC_VIS_TRGB_800',
      filename: 'LCC_VIS_TRGB_800',
      label: '台灣真彩色雲圖',
    },
    enhanced: {
      folder: 'LCC_IR1_Enhanced_800',
      filename: 'LCC_IR1_Enhanced_800',
      label: '台灣色調強化雲圖',
    },
  },
  eastAsia: {
    visible: {
      folder: 'EA_VIS_Gray_1100',
      filename: 'EA_VIS_Gray_1100',
      label: '東亞可見光雲圖',
    },
    infrared: {
      folder: 'EA_IR1_CR_1100',
      filename: 'EA_IR1_CR_1100',
      label: '東亞紅外線雲圖',
    },
    trueColor: {
      folder: 'EA_VIS_TRGB_1100',
      filename: 'EA_VIS_TRGB_1100',
      label: '東亞真彩色雲圖',
    },
    enhanced: {
      folder: 'EA_IR1_Enhanced_1100',
      filename: 'EA_IR1_Enhanced_1100',
      label: '東亞色調強化雲圖',
    },
  },
  global: {
    visible: {
      folder: 'FD_VIS_Gray_2750',
      filename: 'FD_VIS_Gray_2750',
      label: '全球可見光雲圖',
    },
    infrared: {
      folder: 'FD_IR1_CR_2750',
      filename: 'FD_IR1_CR_2750',
      label: '全球紅外線雲圖',
    },
    trueColor: {
      folder: 'FD_VIS_TRGB_2750',
      filename: 'FD_VIS_TRGB_2750',
      label: '全球真彩色雲圖',
    },
    enhanced: {
      folder: 'FD_IR1_Enhanced_2750',
      filename: 'FD_IR1_Enhanced_2750',
      label: '全球色調強化雲圖',
    },
  },
};

const CWA_SATELLITE_BASE = 'https://www.cwa.gov.tw/Data/satellite';
const CWA_SATELLITE_SCRIPT_URL = 'https://www.cwa.gov.tw/Data/js/obs_img/Observe_sat.js';

const SATELLITE_TAB_MAP: Record<SatelliteImageType, string> = {
  visible: 'Tab0',
  infrared: 'Tab1',
  enhanced: 'Tab2',
  trueColor: 'Tab4',
};

const SATELLITE_AREA_MAP: Record<SatelliteImageArea, string> = {
  global: 'Area0',
  eastAsia: 'Area1',
  taiwan: 'Area2',
};

async function fetchSatelliteScript(): Promise<string | null> {
  try {
    const response = await fetch(CWA_SATELLITE_SCRIPT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/javascript,text/javascript,*/*;q=0.9',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.cwa.gov.tw/V8/C/W/OBS_Sat.html',
        'Origin': 'https://www.cwa.gov.tw',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch satellite script: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching satellite script:', error);
    return null;
  }
}

function extractLatestSatellitePath(
  script: string,
  tab: string,
  area: string
): { path: string; text: string } | null {
  const pattern = new RegExp(
    `'${tab}':\\{[\\s\\S]*?'${area}':\\{[\\s\\S]*?'size0':\\{[\\s\\S]*?'C':\\{[\\s\\S]*?0:\\{\"img\":'([^']+)',\\s*'text':'([^']+)'`,
    'm'
  );
  const match = script.match(pattern);

  if (!match) {
    return null;
  }

  return { path: match[1], text: match[2] };
}

/**
 * 取得衛星雲圖資訊列表
 */
export async function getSatelliteImages(
  type?: SatelliteImageType,
  area?: SatelliteImageArea
): Promise<SatelliteImageInfo[]> {
  const results: SatelliteImageInfo[] = [];
  const areas: SatelliteImageArea[] = area ? [area] : ['taiwan', 'eastAsia', 'global'];
  const types: SatelliteImageType[] = type ? [type] : ['visible', 'infrared', 'trueColor', 'enhanced'];
  const script = await fetchSatelliteScript();
  const timestamp = getLatestSatelliteTimestamp();

  for (const a of areas) {
    for (const t of types) {
      const config = SATELLITE_URL_CONFIG[a][t];
      const tab = SATELLITE_TAB_MAP[t];
      const areaKey = SATELLITE_AREA_MAP[a];
      const latest = script ? extractLatestSatellitePath(script, tab, areaKey) : null;
      // 使用腳本解析的路徑，或使用計算出的時間戳作為 fallback
      const url = latest
        ? `${CWA_SATELLITE_BASE}/${latest.path}`
        : `${CWA_SATELLITE_BASE}/${config.folder}/${config.filename}-${timestamp}.jpg`;

      results.push({
        type: t,
        area: a,
        url,
        label: config.label,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

/**
 * 代理獲取衛星雲圖圖片
 * 用於避免 CORS 問題
 */
export async function getSatelliteImageProxy(
  type: SatelliteImageType,
  area: SatelliteImageArea
): Promise<ArrayBuffer | null> {
  const config = SATELLITE_URL_CONFIG[area]?.[type];
  const tab = SATELLITE_TAB_MAP[type];
  const areaKey = SATELLITE_AREA_MAP[area];

  if (!config) {
    console.error(`Invalid satellite image config: type=${type}, area=${area}`);
    return null;
  }

  const script = await fetchSatelliteScript();
  const latest = script ? extractLatestSatellitePath(script, tab, areaKey) : null;
  const timestamp = getLatestSatelliteTimestamp();

  // 使用腳本解析的路徑，或使用計算出的時間戳作為 fallback
  const url = latest
    ? `${CWA_SATELLITE_BASE}/${latest.path}`
    : `${CWA_SATELLITE_BASE}/${config.folder}/${config.filename}-${timestamp}.jpg`;

  // 如果 URL 解析失敗，嘗試多個時間戳（往前最多 3 個時段）
  const urlsToTry = [url];
  if (!latest) {
    // 往前嘗試 10 分鐘和 20 分鐘的時間戳
    for (let i = 1; i <= 2; i++) {
      const now = new Date();
      // 計算台灣時間（UTC+8），減去 (20 + i * 10) 分鐘
      const taiwanMs = now.getTime() + (8 * 60 - 20 - i * 10) * 60 * 1000;
      const taiwanTime = new Date(taiwanMs);
      const minutes = Math.floor(taiwanTime.getUTCMinutes() / 10) * 10;
      const olderTimestamp = `${taiwanTime.getUTCFullYear()}${String(taiwanTime.getUTCMonth() + 1).padStart(2, '0')}${String(taiwanTime.getUTCDate()).padStart(2, '0')}${String(taiwanTime.getUTCHours()).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
      urlsToTry.push(`${CWA_SATELLITE_BASE}/${config.folder}/${config.filename}-${olderTimestamp}.jpg`);
    }
  }

  for (const tryUrl of urlsToTry) {
    try {
      console.log(`Fetching satellite image: ${tryUrl}`);

      const response = await fetch(tryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/jpeg,image/png,image/webp,image/*,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          'Referer': 'https://www.cwa.gov.tw/V8/C/W/OBS_Sat.html',
        },
      });

      if (response.ok) {
        return await response.arrayBuffer();
      }

      console.error(`Failed to fetch satellite image: ${response.status} ${response.statusText} (URL: ${tryUrl})`);
    } catch (error) {
      console.error(`Error fetching satellite image from ${tryUrl}:`, error);
    }
  }

  return null;
}

// ============================================
// 雷達回波功能
// ============================================

// 雷達回波 URL 配置
interface RadarUrlConfig {
  filename: string;
  label: string;
}

// 雷達回波 URL 對應表
const RADAR_URL_CONFIG: Record<RadarImageArea, Record<RadarImageType, RadarUrlConfig>> = {
  taiwan: {
    composite: {
      filename: 'CV1_TW_1000_forPreview',
      label: '台灣雷達回波',
    },
    rain: {
      filename: 'CV1_TW_3600',
      label: '台灣降雨雷達',
    },
  },
  north: {
    composite: {
      filename: 'CV1_NW_1000_forPreview',
      label: '北部雷達回波',
    },
    rain: {
      filename: 'CV1_NW_3600',
      label: '北部降雨雷達',
    },
  },
  south: {
    composite: {
      filename: 'CV1_SW_1000_forPreview',
      label: '南部雷達回波',
    },
    rain: {
      filename: 'CV1_SW_3600',
      label: '南部降雨雷達',
    },
  },
};

const CWA_RADAR_BASE = 'https://www.cwa.gov.tw/Data/radar';

/**
 * 取得雷達回波資訊列表
 */
export function getRadarImages(
  type?: RadarImageType,
  area?: RadarImageArea
): RadarImageInfo[] {
  const results: RadarImageInfo[] = [];
  const areas: RadarImageArea[] = area ? [area] : ['taiwan', 'north', 'south'];
  const types: RadarImageType[] = type ? [type] : ['composite', 'rain'];
  const timestamp = getLatestRadarTimestamp();

  for (const a of areas) {
    for (const t of types) {
      const config = RADAR_URL_CONFIG[a][t];
      // 雷達圖片 URL 格式：{filename}-{timestamp}.png
      results.push({
        type: t,
        area: a,
        url: `${CWA_RADAR_BASE}/${config.filename}-${timestamp}.png`,
        label: config.label,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

/**
 * 代理獲取雷達回波圖片
 * 用於避免 CORS 問題
 */
export async function getRadarImageProxy(
  type: RadarImageType,
  area: RadarImageArea
): Promise<ArrayBuffer | null> {
  const config = RADAR_URL_CONFIG[area]?.[type];

  if (!config) {
    console.error(`Invalid radar image config: type=${type}, area=${area}`);
    return null;
  }

  // 嘗試多個時間戳（往前最多 3 個時段）
  const urlsToTry: string[] = [];
  for (let i = 0; i <= 2; i++) {
    const now = new Date();
    // 計算台灣時間（UTC+8），減去 (10 + i * 10) 分鐘
    const taiwanMs = now.getTime() + (8 * 60 - 10 - i * 10) * 60 * 1000;
    const taiwanTime = new Date(taiwanMs);
    const minutes = Math.floor(taiwanTime.getUTCMinutes() / 10) * 10;
    const ts = `${taiwanTime.getUTCFullYear()}${String(taiwanTime.getUTCMonth() + 1).padStart(2, '0')}${String(taiwanTime.getUTCDate()).padStart(2, '0')}${String(taiwanTime.getUTCHours()).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
    urlsToTry.push(`${CWA_RADAR_BASE}/${config.filename}-${ts}.png`);
  }

  for (const tryUrl of urlsToTry) {
    try {
      console.log(`Fetching radar image: ${tryUrl}`);

      const response = await fetch(tryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/png,image/jpeg,image/webp,image/*,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          'Referer': 'https://www.cwa.gov.tw/V8/C/W/OBS_Radar.html',
        },
      });

      if (response.ok) {
        return await response.arrayBuffer();
      }

      console.error(`Failed to fetch radar image: ${response.status} ${response.statusText} (URL: ${tryUrl})`);
    } catch (error) {
      console.error(`Error fetching radar image from ${tryUrl}:`, error);
    }
  }

  return null;
}
