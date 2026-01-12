import { SatelliteImageInfo, SatelliteImageType, SatelliteImageArea, RadarImageInfo, RadarImageType, RadarImageArea } from '../types';

// 中央氣象署衛星雲圖 URL 配置
// 圖片 URL 格式：https://www.cwa.gov.tw/Data/satellite/{folder}/{filename}.jpg
// 目前圖片檔名包含時間戳，需先讀取 Observe_sat.js 才能取得最新檔案

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
        'User-Agent': 'NobodyClimb/1.0 (Weather Service)',
        'Accept': 'application/javascript,text/plain,*/*',
        'Referer': 'https://www.cwa.gov.tw/',
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

  for (const a of areas) {
    for (const t of types) {
      const config = SATELLITE_URL_CONFIG[a][t];
      const tab = SATELLITE_TAB_MAP[t];
      const areaKey = SATELLITE_AREA_MAP[a];
      const latest = script ? extractLatestSatellitePath(script, tab, areaKey) : null;
      const url = latest
        ? `${CWA_SATELLITE_BASE}/${latest.path}`
        : `${CWA_SATELLITE_BASE}/${config.folder}/${config.filename}.jpg`;

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
  const url = latest
    ? `${CWA_SATELLITE_BASE}/${latest.path}`
    : `${CWA_SATELLITE_BASE}/${config.folder}/${config.filename}.jpg`;

  try {
    console.log(`Fetching satellite image: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NobodyClimb/1.0 (Weather Service)',
        'Accept': 'image/jpeg,image/png,image/*',
        'Referer': 'https://www.cwa.gov.tw/',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch satellite image: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error fetching satellite image:', error);
    return null;
  }
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

  for (const a of areas) {
    for (const t of types) {
      const config = RADAR_URL_CONFIG[a][t];
      results.push({
        type: t,
        area: a,
        url: `${CWA_RADAR_BASE}/${config.filename}.png`,
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

  const url = `${CWA_RADAR_BASE}/${config.filename}.png`;

  try {
    console.log(`Fetching radar image: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NobodyClimb/1.0 (Weather Service)',
        'Accept': 'image/png,image/jpeg,image/*',
        'Referer': 'https://www.cwa.gov.tw/',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch radar image: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error fetching radar image:', error);
    return null;
  }
}
