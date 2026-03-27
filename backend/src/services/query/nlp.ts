// NLP 解析與難度轉換工具函式

// 從 query 中偵測岩場區域/岩場/地區，接受預載資料避免重複查詢 DB
// 優先序：area > crag（多個） > region
export function extractLocationFilter(
  query: string,
  crags: Array<{ id: string; name: string; region: string | null }>,
  areas: Array<{ id: string; name: string }>,
): { cragIds?: string[]; areaId?: string; region?: string } {
  // 1. 優先比對區域名稱（最精確，如「校門口」「鐘塔」）
  for (const area of areas) {
    if (query.includes(area.name)) {
      return { areaId: area.id };
    }
  }

  // 2. 比對岩場名稱（如「龍洞」「墾丁」），支援多岩場
  const matchedCragIds = crags.filter((c) => query.includes(c.name)).map((c) => c.id);
  if (matchedCragIds.length > 0) {
    return { cragIds: matchedCragIds };
  }

  // 3. 比對地區名稱（如「花蓮」「北部」）
  const regions = [...new Set(crags.map((c) => c.region).filter(Boolean))] as string[];
  for (const region of regions) {
    if (query.includes(region)) {
      return { region };
    }
  }

  return {};
}

// 從 query 文字中偵測 YDS 難度，回傳 Vectorize grade_numeric 範圍
// 支援完整格式（5.12a）與縮寫格式（12a、12）
export function extractGradeFilter(query: string): { $gte: number; $lte: number } | null {
  const fullMatches = [...query.matchAll(/5\.(\d+)([a-d])?/gi)];
  const shortMatches = [...query.matchAll(/\b(1[0-5])([a-d])?\b/gi)].filter(
    (m) => !query.slice(Math.max(0, m.index! - 2), m.index!).includes('5.')
  );
  const allMatches = fullMatches.length > 0 ? fullMatches : shortMatches;
  if (allMatches.length === 0) return null;

  const numerics = allMatches.map((m) => {
    const base = parseInt(m[1], 10) * 10;
    const suffix = m[2] ? 'abcd'.indexOf(m[2].toLowerCase()) : 0;
    return base + suffix;
  });

  const min = Math.min(...numerics);
  const maxMatch = allMatches.reduce((prev, curr) => {
    const prevNum = parseInt(prev[1], 10) * 10 + (prev[2] ? 'abcd'.indexOf(prev[2].toLowerCase()) : 0);
    const currNum = parseInt(curr[1], 10) * 10 + (curr[2] ? 'abcd'.indexOf(curr[2].toLowerCase()) : 0);
    return currNum > prevNum ? curr : prev;
  });
  // 若最大值的 grade 沒有 a-d 後綴，擴展到 +3（含 a/b/c/d 子等級）
  const maxBase = parseInt(maxMatch[1], 10) * 10 + (maxMatch[2] ? 'abcd'.indexOf(maxMatch[2].toLowerCase()) : 0);
  const max = maxMatch[2] ? maxBase : maxBase + 3;

  return { $gte: min, $lte: max };
}

// 從 query 文字偵測使用者意圖，回傳適合的文件類型過濾（'crag' | 'route' | null）
export function extractTypeFilter(query: string): 'crag' | 'route' | null {
  const cragKeywords = ['岩場', '攀岩場', '岩區', '岩壁', '介紹', '哪些岩場', '台灣岩場'];
  const routeKeywords = ['路線', '幾條', '多少條', '5.', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', '難度', '幾級', '幾b', '幾c'];

  const hasCragIntent = cragKeywords.some((k) => query.includes(k));
  const hasRouteIntent = routeKeywords.some((k) => query.includes(k));

  if (hasCragIntent && !hasRouteIntent) return 'crag';
  if (hasRouteIntent && !hasCragIntent) return 'route';
  return null;
}

// YDS 等級轉數值（5.12a → 120，與 IndexingService 一致）
export function gradeToNumeric(grade: string | null): number {
  if (!grade) return 0;
  const match = grade.match(/5\.(\d+)([a-d])?/);
  if (!match) return 0;
  const base = parseInt(match[1], 10) * 10;
  const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0;
  return base + suffix;
}

// grade_numeric ↔ 連續 position 互轉（消除大等級間的跳躍 gap）
// 5.10d(103)=43, 5.11a(110)=44，在 position 上相鄰
export function gradeToPosition(numeric: number): number {
  return Math.floor(numeric / 10) * 4 + (numeric % 10);
}

export function positionToGrade(position: number): number {
  const major = Math.floor(position / 4);
  const sub = position % 4;
  return major * 10 + sub;
}

// 取得「差不多難度」的 grade_numeric 範圍（連續序列中 ±steps）
export function similarGradeRange(gradeNumeric: number, steps = 2): { $gte: number; $lte: number } {
  const pos = gradeToPosition(gradeNumeric);
  return {
    $gte: positionToGrade(Math.max(0, pos - steps)),
    $lte: positionToGrade(pos + steps),
  };
}

// 偵測 query 是否有「推薦相似/類似路線」意圖
export function hasSimilarRouteIntent(query: string): boolean {
  return ['差不多', '類似', '相似', '爬完', '完攀', '爬過', '爬了', '攀了', '下一條', '下一個', 'rp', 'RP', 'redpoint', 'red point'].some((k) => query.includes(k));
}

// 偵測 query 是否含有指代前文的 context-dependent 詞（需從對話歷史補充位置）
export function isContextDependentQuery(query: string): boolean {
  return ['附近', '那裡', '那邊', '這裡', '這邊', '這個岩場', '該岩場', '同岩場', '繼續', '再推薦', '還有', '還有哪些', '更多'].some((k) => query.includes(k));
}

// 若 query 提到已知路線名稱，回傳該路線的難度數值、所屬岩場、路線 ID、名稱、難度字串
// 按名稱長度由長到短比對，優先匹配更精確的路線名
// 支援縮寫：若完整名稱比對失敗，嘗試路線名後綴部分匹配（如「天藍」→「天天天藍」）
export async function extractRouteReference(db: D1Database, query: string): Promise<{
  gradeNumeric: number;
  cragId: string | null;
  routeId: string;
  name: string;
  grade: string | null;
  routeType: string | null;
} | null> {
  const routes = await db.prepare(
    'SELECT id, name, grade, crag_id, route_type FROM routes WHERE name IS NOT NULL ORDER BY LENGTH(name) DESC'
  ).all<{ id: string; name: string; grade: string | null; crag_id: string | null; route_type: string | null }>();

  const toMatch = (route: { id: string; name: string; grade: string | null; crag_id: string | null; route_type: string | null }) => ({
    gradeNumeric: gradeToNumeric(route.grade),
    cragId: route.crag_id,
    routeId: route.id,
    name: route.name,
    grade: route.grade,
    routeType: route.route_type,
  });

  // 第一輪：完整路線名稱精確比對
  for (const route of routes.results) {
    if (route.name.length >= 2 && query.includes(route.name)) {
      return toMatch(route);
    }
  }

  // 第二輪：後綴縮寫比對（如使用者說「天藍」，路線名為「天天天藍」）
  for (const route of routes.results) {
    if (route.name.length < 3) continue;
    const minLen = Math.ceil(route.name.length / 2);
    for (let len = route.name.length - 1; len >= minLen; len--) {
      const suffix = route.name.slice(-len);
      if (query.includes(suffix)) {
        return toMatch(route);
      }
    }
  }

  return null;
}
