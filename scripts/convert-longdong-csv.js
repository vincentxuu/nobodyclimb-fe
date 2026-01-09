/**
 * 龍洞 CSV 到 JSON 轉換腳本
 * 將所有龍洞區域的 CSV 資料轉換為完整的 JSON 格式
 */

const fs = require('fs');
const path = require('path');

// CSV 檔案對應的區域資訊
const AREA_MAPPING = {
  '音樂廳': { id: 'music-hall', name: '音樂廳', name_en: 'Music Hall' },
  '校門口': { id: 'school-gate', name: '校門口', name_en: 'School Gate' },
  '大禮堂': { id: 'grand-auditorium', name: '大禮堂', name_en: 'Grand Auditorium' },
  '鐘塔': { id: 'clocktower', name: '鐘塔', name_en: 'Clocktower' },
  '第一洞': { id: 'first-cave', name: '第一洞', name_en: 'First Cave' },
  '第二洞': { id: 'second-cave', name: '第二洞', name_en: 'Second Cave' },
  '後門': { id: 'back-door', name: '後門', name_en: 'Back Door' },
  '長巷': { id: 'long-lane', name: '長巷', name_en: 'Long Lane' },
  '黃金谷': { id: 'golden-valley', name: '黃金谷', name_en: 'Golden Valley' }
};

// 路線類型映射
const TYPE_MAPPING = {
  '運攀 | Sport': { type: 'sport', type_en: 'Sport' },
  '傳攀 | Trad': { type: 'trad', type_en: 'Traditional' },
  '上方架繩 | Toprope': { type: 'toprope', type_en: 'Top Rope' },
  '抱石 | Boulder': { type: 'boulder', type_en: 'Boulder' },
  '混合 | Mixed': { type: 'mixed', type_en: 'Mixed' }
};

// 解析路線名稱（中英文分離）
function parseRouteName(nameField) {
  if (!nameField) return { name: '', name_en: '' };
  const parts = nameField.split('\n').map(s => s.trim()).filter(Boolean);
  const name = parts[0] || '';
  const name_en = parts[1] || '';
  return { name, name_en };
}

// 解析首攀者
function parseFirstAscent(faField) {
  if (!faField) return { first_ascent: '', first_ascent_en: '' };
  const parts = faField.split('\n').map(s => s.trim()).filter(Boolean);
  const first_ascent = parts[0] || '';
  const first_ascent_en = parts.length > 1 ? parts[1] : '';
  return { first_ascent, first_ascent_en };
}

// 解析路線類型
function parseRouteType(typeField) {
  if (!typeField) return { type: 'trad', type_en: 'Traditional' };

  for (const [key, value] of Object.entries(TYPE_MAPPING)) {
    if (typeField.includes(key.split(' ')[0])) {
      return value;
    }
  }
  return { type: 'trad', type_en: 'Traditional' };
}

// 解析高度
function parseHeight(heightField) {
  if (!heightField) return null;
  const match = heightField.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// 解析首攀日期
function parseFirstAscentDate(dateField) {
  if (!dateField) return null;
  // 格式可能是 "2016 / 04 / 26" 或 "1991 / 05" 或 "2004"
  const cleaned = dateField.replace(/\s+/g, '').replace(/\//g, '-');
  if (cleaned.match(/^\d{4}$/)) return `${cleaned}-01-01`;
  if (cleaned.match(/^\d{4}-\d{2}$/)) return `${cleaned}-01`;
  return cleaned;
}

// 生成路線 ID
function generateRouteId(routeNumber, areaId) {
  const num = routeNumber.replace(/[^0-9.]/g, '').trim();
  return `ld-${areaId}-${num}`;
}

// 格式化路線編號 (移除 # 前綴或保留純數字)
function formatRouteNumber(routeNumber) {
  if (routeNumber.includes('#')) {
    return routeNumber.replace('# ', '');
  }
  return routeNumber.trim();
}

// 計算保護點數量
function countBolts(row, startCol, endCol) {
  let count = 0;
  for (let i = startCol; i <= endCol; i++) {
    const val = row[i];
    if (val && val !== '共用' && !val.includes('Anchor') && val !== '天然固定點' && val !== '待查') {
      count++;
    }
  }
  return count;
}

// 解析完整 CSV 內容為行陣列 (處理多行引號欄位)
function parseCSVContent(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 轉義的引號
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // 跳過 \r\n 組合中的 \r
      if (char === '\r' && nextChar === '\n') {
        continue;
      }
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim())) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // 處理最後一個欄位和行
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim())) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// 讀取並解析 CSV 檔案
function parseCSVFile(filePath, areaKey) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSVContent(content);
  const routes = [];

  const areaInfo = AREA_MAPPING[areaKey];
  if (!areaInfo) {
    console.error(`Unknown area: ${areaKey}`);
    return routes;
  }

  let currentSubArea = '';
  let currentSubAreaEn = '';

  // 跳過前幾行標題 (從第3行開始是資料)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    // 檢查是否為子區域行
    if (row[0] && row[0].includes('\n')) {
      const subAreaParts = row[0].split('\n').map(s => s.trim());
      currentSubArea = subAreaParts[0];
      currentSubAreaEn = subAreaParts[1] || '';
    } else if (row[0] && !row[1]) {
      // 可能是子區域名稱
      currentSubArea = row[0];
      continue;
    }

    // 檢查是否有有效的路線編號
    const routeNumber = row[1];
    // 支援兩種格式: "# 1" 或純數字 "303" 或帶小數點 "314.1"
    const isValidRouteNumber = routeNumber &&
      (routeNumber.includes('#') || /^\d+(\.\d+)?$/.test(routeNumber.trim())) &&
      !routeNumber.includes('統計');
    if (!isValidRouteNumber) {
      continue;
    }

    // 跳過 EMS Project、私設路線、純 Anchor 點 (0.00)
    const trimmedNum = routeNumber.trim();
    if (routeNumber === '# 0' || trimmedNum === '0' || trimmedNum === '0.00' || (row[2] && row[2].includes('私設'))) {
      continue;
    }

    const { name, name_en } = parseRouteName(row[2]);
    const grade = row[3];
    const { type, type_en } = parseRouteType(row[4]);
    const height = parseHeight(row[5]);
    const { first_ascent, first_ascent_en } = parseFirstAscent(row[6]);
    const first_ascent_date = parseFirstAscentDate(row[7]);
    const description = row[8] ? row[8].split('–')[0].trim().replace(/\n/g, ' ') : '';
    const safety_rating = row[9];

    // 跳過空路線名稱
    if (!name) continue;

    // 計算 bolt 數量 (B01-B18 在欄位 10-27, A01-A03 在欄位 28-30)
    const boltCount = countBolts(row, 10, 30);

    const route = {
      id: generateRouteId(routeNumber, areaInfo.id),
      route_number: formatRouteNumber(routeNumber),
      name,
      name_en,
      grade: grade || '',
      type,
      type_en,
      height,
      first_ascent,
      first_ascent_en,
      first_ascent_date,
      description,
      description_en: '',
      protection: {
        bolt_count: boltCount,
        has_anchor: row[28] && row[28] !== '無 Anchor' && row[28] !== 'No Anchor',
        anchor_type: row[28] || '',
        notes: ''
      },
      safety_rating: safety_rating || '●●●',
      sub_area: currentSubArea || areaInfo.name,
      sub_area_en: currentSubAreaEn || areaInfo.name_en,
      area_id: areaInfo.id,
      status: 'published',
      popularity: 0,
      views: 0
    };

    routes.push(route);
  }

  return routes;
}

// 主函數
function main() {
  const csvDir = path.join(__dirname, '../docs/route-data-refactor/longdong');
  const outputPath = path.join(__dirname, '../src/data/crags/longdong.json');

  const csvFiles = {
    '音樂廳': '龍洞岩場攀登路線資料庫 - 音樂廳.csv',
    '校門口': '龍洞岩場攀登路線資料庫 - 校門口.csv',
    '大禮堂': '龍洞岩場攀登路線資料庫 - 大禮堂.csv',
    '鐘塔': '龍洞岩場攀登路線資料庫 - 鐘塔.csv',
    '第一洞': '龍洞岩場攀登路線資料庫 - 第一洞.csv',
    '第二洞': '龍洞岩場攀登路線資料庫 - 第二洞.csv',
    '後門': '龍洞岩場攀登路線資料庫 - 後門.csv',
    '長巷': '龍洞岩場攀登路線資料庫 - 長巷.csv',
    '黃金谷': '龍洞岩場攀登路線資料庫 - 黃金谷.csv'
  };

  const allRoutes = [];
  const areaStats = {};

  for (const [areaKey, fileName] of Object.entries(csvFiles)) {
    const filePath = path.join(csvDir, fileName);
    console.log(`Processing: ${fileName}`);

    try {
      const routes = parseCSVFile(filePath, areaKey);
      allRoutes.push(...routes);
      areaStats[areaKey] = routes.length;
      console.log(`  -> Found ${routes.length} routes`);
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error.message);
    }
  }

  // 建立完整的 JSON 結構
  const areas = Object.entries(AREA_MAPPING).map(([key, value]) => ({
    id: value.id,
    name: value.name,
    name_en: value.name_en,
    routes_count: areaStats[key] || 0
  }));

  // 計算統計資訊
  const gradeDistribution = {};
  const typeDistribution = { sport: 0, trad: 0, toprope: 0, boulder: 0, mixed: 0 };

  allRoutes.forEach(route => {
    if (route.grade) {
      gradeDistribution[route.grade] = (gradeDistribution[route.grade] || 0) + 1;
    }
    if (route.type && typeDistribution[route.type] !== undefined) {
      typeDistribution[route.type]++;
    }
  });

  const longdongData = {
    crag: {
      id: 'longdong',
      name: '龍洞',
      name_en: 'Long Dong',
      location: {
        country: 'Taiwan',
        region: '新北市',
        city: '貢寮區',
        coordinates: {
          lat: 25.1085,
          lng: 121.9215
        }
      },
      description: '龍洞是台灣最具代表性的戶外攀岩場地，位於新北市貢寮區，擁有壯觀的海岸岩壁和多樣化的攀登路線。',
      description_en: 'Long Dong is Taiwan\'s most iconic outdoor climbing destination, located in Gongliao District, New Taipei City, featuring spectacular coastal cliffs and diverse climbing routes.',
      rock_type: 'sandstone',
      access: {
        approach_time: '5-30 min',
        difficulty: 'easy to moderate',
        notes: '需注意潮汐和海浪狀況'
      }
    },
    areas,
    routes: allRoutes,
    statistics: {
      total_routes: allRoutes.length,
      total_areas: areas.length,
      difficulty_range: {
        min: '5.4',
        max: '5.14a'
      },
      type_distribution: typeDistribution,
      grade_distribution: gradeDistribution
    },
    metadata: {
      last_updated: new Date().toISOString().split('T')[0],
      version: '2.0.0',
      source: 'CSV data conversion',
      contributors: ['NobodyClimb Team', 'Taiwan Climbing Community']
    }
  };

  // 寫入 JSON 檔案
  fs.writeFileSync(outputPath, JSON.stringify(longdongData, null, 2), 'utf-8');

  console.log('\n=== Conversion Complete ===');
  console.log(`Total routes: ${allRoutes.length}`);
  console.log(`Areas: ${areas.length}`);
  console.log(`Output: ${outputPath}`);
  console.log('\nArea breakdown:');
  for (const [area, count] of Object.entries(areaStats)) {
    console.log(`  ${area}: ${count} routes`);
  }
}

main();
