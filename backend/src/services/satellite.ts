import { SatelliteImageInfo, SatelliteImageType, SatelliteImageArea } from '../types';

// 中央氣象署衛星雲圖 URL 配置
// 圖片 URL 格式：https://www.cwa.gov.tw/Data/satellite/{folder}/{filename}.jpg
// 備註：這些 URL 會定期更新，每 10 分鐘一次

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

/**
 * 取得衛星雲圖資訊列表
 */
export function getSatelliteImages(
  type?: SatelliteImageType,
  area?: SatelliteImageArea
): SatelliteImageInfo[] {
  const results: SatelliteImageInfo[] = [];
  const areas: SatelliteImageArea[] = area ? [area] : ['taiwan', 'eastAsia', 'global'];
  const types: SatelliteImageType[] = type ? [type] : ['visible', 'infrared', 'trueColor', 'enhanced'];

  for (const a of areas) {
    for (const t of types) {
      const config = SATELLITE_URL_CONFIG[a][t];
      results.push({
        type: t,
        area: a,
        url: `${CWA_SATELLITE_BASE}/${config.folder}/${config.filename}.jpg`,
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

  if (!config) {
    console.error(`Invalid satellite image config: type=${type}, area=${area}`);
    return null;
  }

  const url = `${CWA_SATELLITE_BASE}/${config.folder}/${config.filename}.jpg`;

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
