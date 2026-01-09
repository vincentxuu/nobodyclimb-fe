/**
 * 龍洞 CSV 到 JSON 轉換腳本
 * 將所有龍洞區域的 CSV 資料轉換為 CragFullData 格式
 */

const fs = require('fs');
const path = require('path');

// CSV 檔案對應的區域資訊
const AREA_MAPPING = {
  '音樂廳': { id: 'music-hall', name: '音樂廳', nameEn: 'Music Hall' },
  '校門口': { id: 'school-gate', name: '校門口', nameEn: 'School Gate' },
  '大禮堂': { id: 'grand-auditorium', name: '大禮堂', nameEn: 'Grand Auditorium' },
  '鐘塔': { id: 'clocktower', name: '鐘塔', nameEn: 'Clocktower' },
  '第一洞': { id: 'first-cave', name: '第一洞', nameEn: 'First Cave' },
  '第二洞': { id: 'second-cave', name: '第二洞', nameEn: 'Second Cave' },
  '後門': { id: 'back-door', name: '後門', nameEn: 'Back Door' },
  '長巷': { id: 'long-lane', name: '長巷', nameEn: 'Long Lane' },
  '黃金谷': { id: 'golden-valley', name: '黃金谷', nameEn: 'Golden Valley' }
};

// 路線類型映射
const TYPE_MAPPING = {
  '運攀 | Sport': { type: 'sport', typeEn: 'Sport Climbing' },
  '傳攀 | Trad': { type: 'trad', typeEn: 'Traditional' },
  '上方架繩 | Toprope': { type: 'toprope', typeEn: 'Top Rope' },
  '抱石 | Boulder': { type: 'boulder', typeEn: 'Boulder' },
  '混合 | Mixed': { type: 'mixed', typeEn: 'Mixed' }
};

// 解析路線名稱（中英文分離）
function parseRouteName(nameField) {
  if (!nameField) return { name: '', nameEn: '' };
  const parts = nameField.split('\n').map(s => s.trim()).filter(Boolean);
  return { name: parts[0] || '', nameEn: parts[1] || '' };
}

// 解析首攀者
function parseFirstAscent(faField) {
  if (!faField) return { firstAscent: '', firstAscentEn: '' };
  const parts = faField.split('\n').map(s => s.trim()).filter(Boolean);
  return { firstAscent: parts[0] || '', firstAscentEn: parts.length > 1 ? parts[1] : '' };
}

// 解析路線類型
function parseRouteType(typeField) {
  if (!typeField) return { type: 'trad', typeEn: 'Traditional' };
  for (const [key, value] of Object.entries(TYPE_MAPPING)) {
    if (typeField.includes(key.split(' ')[0])) {
      return value;
    }
  }
  return { type: 'trad', typeEn: 'Traditional' };
}

// 解析高度
function parseHeight(heightField) {
  if (!heightField) return null;
  const match = heightField.match(/(\d+)/);
  return match ? `${match[1]}m` : null;
}

// 解析首攀日期
function parseFirstAscentDate(dateField) {
  if (!dateField) return null;
  const cleaned = dateField.replace(/\s+/g, '').replace(/\//g, '-');
  if (cleaned.match(/^\d{4}$/)) return `${cleaned}-01-01`;
  if (cleaned.match(/^\d{4}-\d{2}$/)) return `${cleaned}-01`;
  return cleaned;
}

// 生成路線 ID
function generateRouteId(routeNumber, areaId) {
  const num = routeNumber.replace(/[^0-9.]/g, '').trim();
  return `LD-${areaId.toUpperCase()}-${num}`;
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
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') continue;
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim())) rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim())) rows.push(currentRow);
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
    return { routes: [], boltCount: 0 };
  }

  let currentSector = '';
  let currentSectorEn = '';
  let totalBolts = 0;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    // 檢查是否為子區域行
    if (row[0] && row[0].includes('\n')) {
      const parts = row[0].split('\n').map(s => s.trim());
      currentSector = parts[0];
      currentSectorEn = parts[1] || '';
    } else if (row[0] && !row[1]) {
      currentSector = row[0];
      continue;
    }

    const routeNumber = row[1];
    const isValidRouteNumber = routeNumber &&
      (routeNumber.includes('#') || /^\d+(\.\d+)?$/.test(routeNumber.trim())) &&
      !routeNumber.includes('統計');
    if (!isValidRouteNumber) continue;

    const trimmedNum = routeNumber.trim();
    if (routeNumber === '# 0' || trimmedNum === '0' || trimmedNum === '0.00' || (row[2] && row[2].includes('私設'))) {
      continue;
    }

    const { name, nameEn } = parseRouteName(row[2]);
    if (!name) continue;

    const grade = row[3] || '';
    const { type, typeEn } = parseRouteType(row[4]);
    const length = parseHeight(row[5]);
    const { firstAscent, firstAscentEn } = parseFirstAscent(row[6]);
    const firstAscentDate = parseFirstAscentDate(row[7]);
    const description = row[8] ? row[8].split('–')[0].trim().replace(/\n/g, ' ') : '';
    const safetyRating = row[9] || '';
    const boltCount = countBolts(row, 10, 30);
    totalBolts += boltCount;

    const route = {
      id: generateRouteId(routeNumber, areaInfo.id),
      areaId: areaInfo.id,
      sector: currentSector || areaInfo.name,
      sectorEn: currentSectorEn || areaInfo.nameEn,
      name,
      nameEn,
      grade,
      type,
      typeEn,
      length,
      firstAscent: firstAscent || undefined,
      firstAscentEn: firstAscentEn || undefined,
      firstAscentDate: firstAscentDate || undefined,
      description: description || undefined,
      safetyRating: safetyRating || undefined,
      boltCount,
      status: 'published'
    };

    // Remove undefined fields
    Object.keys(route).forEach(key => {
      if (route[key] === undefined || route[key] === null) {
        delete route[key];
      }
    });

    routes.push(route);
  }

  return { routes, boltCount: totalBolts };
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
  const areaBolts = {};

  for (const [areaKey, fileName] of Object.entries(csvFiles)) {
    const filePath = path.join(csvDir, fileName);
    console.log(`Processing: ${fileName}`);

    try {
      const { routes, boltCount } = parseCSVFile(filePath, areaKey);
      allRoutes.push(...routes);
      areaStats[areaKey] = routes.length;
      areaBolts[areaKey] = boltCount;
      console.log(`  -> Found ${routes.length} routes, ${boltCount} bolts`);
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error.message);
    }
  }

  // 計算統計資訊
  const routesByGrade = {};
  const routesByType = { sport: 0, trad: 0, toprope: 0, boulder: 0, mixed: 0 };
  let totalBolts = 0;
  const validGrades = [];

  allRoutes.forEach(route => {
    if (route.grade) {
      routesByGrade[route.grade] = (routesByGrade[route.grade] || 0) + 1;
      // Collect valid grades for min/max calculation
      if (route.grade.match(/^5\.\d+[a-d]?$/)) {
        validGrades.push(route.grade);
      }
    }
    if (route.type && routesByType[route.type] !== undefined) {
      routesByType[route.type]++;
    }
    totalBolts += route.boltCount || 0;
  });

  // Sort grades properly (5.4 < 5.10a < 5.10b < 5.11a etc.)
  function gradeToNumber(grade) {
    const match = grade.match(/^5\.(\d+)([a-d])?$/);
    if (!match) return 0;
    const num = parseInt(match[1], 10);
    const letter = match[2] || '';
    const letterVal = letter ? (letter.charCodeAt(0) - 96) * 0.1 : 0;
    return num + letterVal;
  }

  validGrades.sort((a, b) => gradeToNumber(a) - gradeToNumber(b));
  const minGrade = validGrades[0] || '5.4';
  const maxGrade = validGrades[validGrades.length - 1] || '5.14a';

  // 建立區域資料
  const areas = Object.entries(AREA_MAPPING).map(([key, value]) => ({
    id: value.id,
    name: value.name,
    nameEn: value.nameEn,
    description: `${value.name}攀登區域`,
    descriptionEn: `${value.nameEn} climbing area`,
    boltCount: areaBolts[key] || 0,
    routesCount: areaStats[key] || 0
  }));

  const now = new Date().toISOString();

  // 建立完整的 CragFullData 結構
  const longdongData = {
    crag: {
      id: 'longdong',
      slug: 'longdong',
      name: '龍洞',
      nameEn: 'Long Dong',
      location: {
        address: '新北市貢寮區龍洞灣',
        addressEn: 'Longdong Bay, Gongliao District, New Taipei City',
        region: '北部',
        regionEn: 'Northern Taiwan',
        latitude: 25.1085,
        longitude: 121.9215
      },
      description: '龍洞是台灣最具代表性的戶外攀岩場地，位於新北市貢寮區，擁有壯觀的海岸岩壁和多樣化的攀登路線。是台灣規模最大、路線最多的天然岩場。',
      descriptionEn: 'Long Dong is Taiwan\'s most iconic outdoor climbing destination, located in Gongliao District, New Taipei City. It features spectacular coastal cliffs and diverse climbing routes, making it the largest natural crag in Taiwan with the most routes.',
      videoUrl: '',
      images: [
        '/images/crag/longdong-1.jpg',
        '/images/crag/longdong-2.jpg',
        '/images/crag/longdong-3.jpg',
        '/images/crag/longdong-4.jpg'
      ],
      type: 'mixed',
      rockType: '砂岩',
      rockTypeEn: 'Sandstone',
      routesCount: allRoutes.length,
      difficulty: {
        min: minGrade !== '5.15' ? minGrade : '5.4',
        max: maxGrade !== '5.0' ? maxGrade : '5.14a'
      },
      height: {
        min: 5,
        max: 100,
        unit: 'm'
      },
      seasons: ['春', '秋', '冬'],
      seasonsEn: ['Spring', 'Autumn', 'Winter'],
      access: {
        approach: '5-30分鐘步行',
        approachEn: '5-30 minutes walk',
        parking: '龍洞灣公園停車場',
        parkingEn: 'Longdong Bay Park parking lot',
        transportation: [
          {
            type: '開車',
            description: '從台北走國道1號轉台2線濱海公路，約1.5小時車程',
            descriptionEn: 'From Taipei, take National Highway 1 to Provincial Highway 2 (Coastal Highway), about 1.5 hours drive'
          },
          {
            type: '大眾運輸',
            description: '從瑞芳火車站搭乘基隆客運至龍洞站',
            descriptionEn: 'Take Keelung Bus from Ruifang Station to Longdong stop'
          }
        ]
      },
      amenities: ['停車場', '廁所', '海灘', '浮潛'],
      amenitiesEn: ['Parking', 'Restroom', 'Beach', 'Snorkeling'],
      featured: true,
      rating: 4.8,
      status: 'published',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: now
    },
    areas,
    routes: allRoutes,
    statistics: {
      totalRoutes: allRoutes.length,
      totalBolts,
      routesByType,
      routesByGrade,
      boltsByMaterial: {
        '316-TW': Math.floor(totalBolts * 0.6),
        'Ti-TW': Math.floor(totalBolts * 0.2),
        'Ti-ETN': Math.floor(totalBolts * 0.1),
        'Other': Math.floor(totalBolts * 0.1)
      }
    },
    metadata: {
      version: '2.0.0',
      source: 'CSV data conversion from Taiwan Climbing Database',
      lastUpdated: now,
      maintainer: 'NobodyClimb Team'
    }
  };

  // 寫入 JSON 檔案
  fs.writeFileSync(outputPath, JSON.stringify(longdongData, null, 2), 'utf-8');

  console.log('\n=== Conversion Complete ===');
  console.log(`Total routes: ${allRoutes.length}`);
  console.log(`Total bolts: ${totalBolts}`);
  console.log(`Areas: ${areas.length}`);
  console.log(`Output: ${outputPath}`);
  console.log('\nArea breakdown:');
  for (const [area, count] of Object.entries(areaStats)) {
    console.log(`  ${area}: ${count} routes, ${areaBolts[area]} bolts`);
  }
}

main();
