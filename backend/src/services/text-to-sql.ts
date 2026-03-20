// TextToSqlService：SQL 模板執行引擎
// 只允許 SELECT，白名單資料表（routes、crags、route_videos、videos、user_route_ascents、areas）

export class SqlExecutionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'SqlExecutionError';
  }
}

// 攀登類型中文→英文對應
const ROUTE_TYPE_MAP: Record<string, string> = {
  '運攀': 'sport',
  '傳攀': 'trad',
  '抱石': 'boulder',
  '混合': 'mixed',
  '混合攀登': 'mixed',
  'sport': 'sport',
  'trad': 'trad',
  'boulder': 'boulder',
  'mixed': 'mixed',
};

// ascent_type 縮寫→enum 對應
const ASCENT_TYPE_MAP: Record<string, string> = {
  'rp': 'redpoint',
  '紅點': 'redpoint',
  'redpoint': 'redpoint',
  'os': 'onsight',
  '視攀': 'onsight',
  'onsight': 'onsight',
  'flash': 'flash',
  '閃攀': 'flash',
  'attempt': 'attempt',
  '嘗試': 'attempt',
  'toprope': 'toprope',
  '上方確保': 'toprope',
  'lead': 'lead',
  '先鋒': 'lead',
  'seconding': 'seconding',
  '跟攀': 'seconding',
  'repeat': 'repeat',
  '重複': 'repeat',
};

// 支援的模板清單
const SUPPORTED_TEMPLATES = [
  'COUNT_ROUTES_AT_CRAG',
  'LIST_ROUTES_BY_CRITERIA',
  'LIST_ROUTES_AT_GRADE',
  'ROUTE_INFO_LOOKUP',
  'CRAG_INFO_LOOKUP',
  'RANK_CRAGS_BY_ROUTES',
  'GRADE_DISTRIBUTION',
  'ROUTE_TYPE_DISTRIBUTION',
  'ROUTE_FIRST_ASCENT',
  'LIST_VIDEOS_FOR_ROUTE',
  'ROUTES_WITH_VIDEOS',
  'MY_ASCENT_COUNT',
  'MY_ASCENT_BY_TYPE',
  'MY_ASCENT_LIST',
  'MY_ASCENT_AT_CRAG',
  'MY_ASCENT_BY_DATE',
  'MY_HIGHEST_GRADE',
  'MY_RATED_ROUTES',
] as const;

export type SqlTemplate = (typeof SUPPORTED_TEMPLATES)[number];

export class TextToSqlService {
  constructor(private db: D1Database) {}

  // 驗證路線名稱是否存在（優先精確匹配，再 fallback 模糊搜尋）
  async validateRouteName(
    routeName: string,
    cragId?: string,
  ): Promise<{ id: string; name: string; crag_id: string } | null> {
    try {
      // 精確匹配優先
      const exactSql = cragId
        ? 'SELECT id, name, crag_id FROM routes WHERE name = ? AND crag_id = ? LIMIT 1'
        : 'SELECT id, name, crag_id FROM routes WHERE name = ? LIMIT 1';
      const exactParams = cragId ? [routeName, cragId] : [routeName];
      const exactResult = await this.db.prepare(exactSql).bind(...exactParams).all<{ id: string; name: string; crag_id: string }>();
      if (exactResult.results?.length) return exactResult.results[0];

      // Fallback：模糊搜尋
      const likeSql = cragId
        ? 'SELECT id, name, crag_id FROM routes WHERE name LIKE ? AND crag_id = ? LIMIT 5'
        : 'SELECT id, name, crag_id FROM routes WHERE name LIKE ? LIMIT 5';
      const escapedRouteName = routeName.replace(/[%_]/g, '\\$&');
      const likeParams = cragId ? [`%${escapedRouteName}%`, cragId] : [`%${escapedRouteName}%`];
      const likeResult = await this.db.prepare(likeSql).bind(...likeParams).all<{ id: string; name: string; crag_id: string }>();

      if (!likeResult.results || likeResult.results.length === 0) return null;
      return likeResult.results[0];
    } catch (err) {
      throw new SqlExecutionError('路線名稱驗證失敗', err);
    }
  }

  // 主執行方法：根據 template ID 分派至對應查詢方法
  async execute(
    template: string,
    params: Record<string, unknown>,
  ): Promise<{ rows: Record<string, unknown>[]; template: string }> {
    if (!SUPPORTED_TEMPLATES.includes(template as SqlTemplate)) {
      throw new SqlExecutionError(`不支援的 SQL 模板：${template}`);
    }

    try {
      switch (template) {
        case 'COUNT_ROUTES_AT_CRAG':
          return { rows: await this.countRoutesAtCrag(params), template };
        case 'LIST_ROUTES_BY_CRITERIA':
          return { rows: await this.listRoutesByCriteria(params), template };
        case 'LIST_ROUTES_AT_GRADE':
          return { rows: await this.listRoutesAtGrade(params), template };
        case 'ROUTE_INFO_LOOKUP':
          return { rows: await this.routeInfoLookup(params), template };
        case 'CRAG_INFO_LOOKUP':
          return { rows: await this.cragInfoLookup(params), template };
        case 'RANK_CRAGS_BY_ROUTES':
          return { rows: await this.rankCragsByRoutes(params), template };
        case 'GRADE_DISTRIBUTION':
          return { rows: await this.gradeDistribution(params), template };
        case 'ROUTE_TYPE_DISTRIBUTION':
          return { rows: await this.routeTypeDistribution(params), template };
        case 'ROUTE_FIRST_ASCENT':
          return { rows: await this.routeFirstAscent(params), template };
        case 'LIST_VIDEOS_FOR_ROUTE':
          return { rows: await this.listVideosForRoute(params), template };
        case 'ROUTES_WITH_VIDEOS':
          return { rows: await this.routesWithVideos(params), template };
        case 'MY_ASCENT_COUNT':
          return { rows: await this.myAscentCount(params), template };
        case 'MY_ASCENT_BY_TYPE':
          return { rows: await this.myAscentByType(params), template };
        case 'MY_ASCENT_LIST':
          return { rows: await this.myAscentList(params), template };
        case 'MY_ASCENT_AT_CRAG':
          return { rows: await this.myAscentAtCrag(params), template };
        case 'MY_ASCENT_BY_DATE':
          return { rows: await this.myAscentByDate(params), template };
        case 'MY_HIGHEST_GRADE':
          return { rows: await this.myHighestGrade(params), template };
        case 'MY_RATED_ROUTES':
          return { rows: await this.myRatedRoutes(params), template };
        default:
          throw new SqlExecutionError(`不支援的 SQL 模板：${template}`);
      }
    } catch (err) {
      if (err instanceof SqlExecutionError) throw err;
      throw new SqlExecutionError(`SQL 執行失敗：${template}`, err);
    }
  }

  // Hybrid 候選集查詢（最多 20 條）
  async queryCandidates(params: Record<string, unknown>, excluded_ids?: string[]): Promise<Record<string, unknown>[]> {
    try {
      const cragId = params.crag_id as string | undefined;
      const grade = params.grade as string | undefined;
      const gradeMin = params.grade_min as string | undefined;
      const gradeMax = params.grade_max as string | undefined;
      const routeType = this.normalizeRouteType(params.route_type as string | undefined);

      let sql = 'SELECT r.id, r.name, r.grade, r.route_type, r.description, r.bolt_count, r.height, c.name as crag_name FROM routes r JOIN crags c ON r.crag_id = c.id WHERE 1=1';
      const binds: unknown[] = [];

      if (cragId) {
        sql += ' AND r.crag_id = ?';
        binds.push(cragId);
      }
      if (grade && grade.includes('-')) {
        const [min, max] = grade.split('-');
        sql += ' AND r.grade >= ? AND r.grade <= ?';
        binds.push(min.trim(), max.trim());
      } else if (grade && this.isBaseGrade(grade)) {
        sql += ' AND r.grade LIKE ?';
        binds.push(`${grade}%`);
      } else if (grade) {
        sql += ' AND r.grade = ?';
        binds.push(grade);
      } else {
        if (gradeMin) {
          sql += ' AND r.grade >= ?';
          binds.push(gradeMin);
        }
        if (gradeMax) {
          sql += ' AND r.grade <= ?';
          binds.push(gradeMax);
        }
      }
      if (routeType) {
        sql += ' AND r.route_type = ?';
        binds.push(routeType);
      }
      // 排除已完攀路線（推薦情境）
      if (excluded_ids && excluded_ids.length > 0) {
        const placeholders = excluded_ids.map(() => '?').join(', ');
        sql += ` AND r.id NOT IN (${placeholders})`;
        binds.push(...excluded_ids);
      }

      sql += ' ORDER BY r.grade ASC LIMIT 20';

      const result = await this.db.prepare(sql).bind(...binds).all<Record<string, unknown>>();
      return result.results || [];
    } catch (err) {
      throw new SqlExecutionError('候選集查詢失敗', err);
    }
  }

  // 必要參數驗證
  private requireParam(params: Record<string, unknown>, key: string): string {
    const val = params[key];
    if (typeof val !== 'string' || val.trim() === '') {
      throw new SqlExecutionError(`必要參數缺少或無效：${key}`);
    }
    return val;
  }

  // 安全數值參數（含上限）
  private safeLimit(params: Record<string, unknown>, key: string, fallback: number, max: number): number {
    const raw = params[key];
    if (raw === undefined || raw === null) return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(Math.round(n), 1), max);
  }

  // 判斷是否為基礎難度（如 "5.10"，無 a-d 後綴）→ 需要 LIKE 前綴匹配
  private isBaseGrade(grade: string): boolean {
    return /^5\.\d+$/.test(grade);
  }

  // 參數正規化（未知類型回傳 undefined，不傳入 SQL）
  normalizeRouteType(input: string | undefined): string | undefined {
    if (!input) return undefined;
    return ROUTE_TYPE_MAP[input.toLowerCase()];
  }

  normalizeAscentType(input: string | undefined): string | undefined {
    if (!input) return undefined;
    return ASCENT_TYPE_MAP[input.toLowerCase()];
  }

  // 日期格式驗證（ISO 8601: YYYY-MM-DD）
  private validateDate(val: string | undefined): string | undefined {
    if (!val) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      throw new SqlExecutionError(`無效的日期格式：${val}`);
    }
    return val;
  }

  // 確保個人模板有 user_id
  private ensureUserId(params: Record<string, unknown>): string {
    const userId = params.user_id as string | undefined;
    if (!userId) throw new Error('LOGIN_REQUIRED');
    return userId;
  }

  // ========================================
  // 路線查詢模板
  // ========================================

  private async countRoutesAtCrag(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const cragId = this.requireParam(params, 'crag_id');
    const result = await this.db.prepare(
      'SELECT COUNT(*) as count FROM routes WHERE crag_id = ?'
    ).bind(cragId).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async listRoutesByCriteria(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const cragId = this.requireParam(params, 'crag_id');
    const gradeMin = params.grade_min as string | undefined;
    const gradeMax = params.grade_max as string | undefined;
    const grade = params.grade as string | undefined;
    const routeType = this.normalizeRouteType(params.route_type as string | undefined);
    const limit = this.safeLimit(params, 'limit', 50, 50);

    let sql = 'SELECT r.name, r.grade, r.route_type, r.description, r.bolt_count, r.height FROM routes r WHERE r.crag_id = ?';
    const binds: unknown[] = [cragId];

    // 處理 grade 篩選
    if (grade && grade.includes('-')) {
      // 範圍（如 "5.10-5.12"）
      const [min, max] = grade.split('-');
      sql += ' AND r.grade >= ? AND r.grade <= ?';
      binds.push(min.trim(), max.trim());
    } else if (grade && this.isBaseGrade(grade)) {
      // 基礎難度（如 "5.10"）→ LIKE 前綴匹配 5.10/5.10a/5.10b/...
      sql += ' AND r.grade LIKE ?';
      binds.push(`${grade}%`);
    } else if (grade) {
      // 精確難度（如 "5.10a"）
      sql += ' AND r.grade = ?';
      binds.push(grade);
    } else {
      if (gradeMin) {
        sql += ' AND r.grade >= ?';
        binds.push(gradeMin);
      }
      if (gradeMax) {
        sql += ' AND r.grade <= ?';
        binds.push(gradeMax);
      }
    }
    if (routeType) {
      sql += ' AND r.route_type = ?';
      binds.push(routeType);
    }

    sql += ' ORDER BY r.grade ASC LIMIT ?';
    binds.push(limit);
    const result = await this.db.prepare(sql).bind(...binds).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async listRoutesAtGrade(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const cragId = this.requireParam(params, 'crag_id');
    const grade = this.requireParam(params, 'grade');
    const limit = this.safeLimit(params, 'limit', 50, 50);
    // 基礎難度（如 "5.10"）→ LIKE 前綴匹配；精確難度（如 "5.10a"）→ 完全匹配
    const gradeCondition = this.isBaseGrade(grade) ? 'grade LIKE ?' : 'grade = ?';
    const gradeParam = this.isBaseGrade(grade) ? `${grade}%` : grade;
    const result = await this.db.prepare(
      `SELECT name, grade, route_type, description, bolt_count, height FROM routes WHERE crag_id = ? AND ${gradeCondition} ORDER BY grade ASC, name ASC LIMIT ?`
    ).bind(cragId, gradeParam, limit).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async routeInfoLookup(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const routeId = this.requireParam(params, 'route_id');
    const result = await this.db.prepare(
      'SELECT r.name, r.grade, r.bolt_count, r.height, r.route_type, r.description, r.first_ascent, c.name as crag_name FROM routes r JOIN crags c ON r.crag_id = c.id WHERE r.id = ?'
    ).bind(routeId).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async cragInfoLookup(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const cragId = this.requireParam(params, 'crag_id');

    // 同時查岩場資訊和區域數量
    const [cragResult, areaResult] = await Promise.all([
      this.db.prepare(
        'SELECT name, region, description, climbing_types, difficulty_range, route_count, bolt_count, rock_type, best_seasons, access_info FROM crags WHERE id = ?'
      ).bind(cragId).all<Record<string, unknown>>(),
      this.db.prepare(
        'SELECT COUNT(*) as area_count FROM areas WHERE crag_id = ?'
      ).bind(cragId).all<Record<string, unknown>>(),
    ]);

    const crag = cragResult.results?.[0];
    if (!crag) return [];
    const areaCount = (areaResult.results?.[0] as { area_count: number })?.area_count ?? 0;

    return [{ ...crag, area_count: areaCount }];
  }

  private async rankCragsByRoutes(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const limit = this.safeLimit(params, 'limit', 5, 20);
    const result = await this.db.prepare(
      'SELECT c.name, c.region, COUNT(r.id) as route_count FROM crags c LEFT JOIN routes r ON c.id = r.crag_id GROUP BY c.id ORDER BY route_count DESC LIMIT ?'
    ).bind(limit).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async gradeDistribution(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const cragId = this.requireParam(params, 'crag_id');
    const [totalResult, gradeResult] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as total FROM routes WHERE crag_id = ?').bind(cragId).all<{ total: number }>(),
      this.db.prepare('SELECT grade, COUNT(*) as count FROM routes WHERE crag_id = ? AND grade IS NOT NULL GROUP BY grade ORDER BY grade ASC').bind(cragId).all<Record<string, unknown>>(),
    ]);
    const total = totalResult.results?.[0]?.total ?? 0;
    const graded = gradeResult.results || [];
    const gradedCount = graded.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    const ungraded = total - gradedCount;
    const meta: Record<string, unknown> = { _summary: `共 ${total} 條路線` };
    if (ungraded > 0) meta._ungraded = `${ungraded} 條未標記難度`;
    return [meta, ...graded];
  }

  private async routeTypeDistribution(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const cragId = this.requireParam(params, 'crag_id');
    const result = await this.db.prepare(
      'SELECT route_type, COUNT(*) as count FROM routes WHERE crag_id = ? AND route_type IS NOT NULL GROUP BY route_type ORDER BY count DESC'
    ).bind(cragId).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async routeFirstAscent(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const routeId = this.requireParam(params, 'route_id');
    const result = await this.db.prepare(
      'SELECT name, grade, first_ascent FROM routes WHERE id = ?'
    ).bind(routeId).all<Record<string, unknown>>();
    return result.results || [];
  }

  // ========================================
  // 影片查詢模板
  // ========================================

  private async listVideosForRoute(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const routeId = this.requireParam(params, 'route_id');
    const result = await this.db.prepare(
      'SELECT v.title, v.youtube_id, v.thumbnail_url FROM videos v JOIN route_videos rv ON v.id = rv.video_id JOIN routes r ON rv.route_id = r.id WHERE r.id = ? ORDER BY rv.sort_order ASC'
    ).bind(routeId).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async routesWithVideos(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const cragId = this.requireParam(params, 'crag_id');
    const limit = this.safeLimit(params, 'limit', 50, 50);
    const result = await this.db.prepare(
      'SELECT DISTINCT r.name, r.grade, r.route_type, COUNT(rv.id) as video_count FROM routes r JOIN route_videos rv ON r.id = rv.route_id WHERE r.crag_id = ? GROUP BY r.id ORDER BY r.grade ASC LIMIT ?'
    ).bind(cragId, limit).all<Record<string, unknown>>();
    return result.results || [];
  }

  // ========================================
  // 個人完攀模板
  // ========================================

  private async myAscentCount(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const userId = this.ensureUserId(params);
    const result = await this.db.prepare(
      'SELECT COUNT(*) as count FROM user_route_ascents WHERE user_id = ?'
    ).bind(userId).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async myAscentByType(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const userId = this.ensureUserId(params);
    const ascentType = this.normalizeAscentType(params.ascent_type as string | undefined);
    if (!ascentType) {
      // 若未指定類型，回傳各類型統計
      const result = await this.db.prepare(
        'SELECT ascent_type, COUNT(*) as count FROM user_route_ascents WHERE user_id = ? GROUP BY ascent_type ORDER BY count DESC'
      ).bind(userId).all<Record<string, unknown>>();
      return result.results || [];
    }
    const result = await this.db.prepare(
      'SELECT COUNT(*) as count FROM user_route_ascents WHERE user_id = ? AND ascent_type = ?'
    ).bind(userId, ascentType).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async myAscentList(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const userId = this.ensureUserId(params);
    const limit = this.safeLimit(params, 'limit', 20, 50);
    const result = await this.db.prepare(
      'SELECT r.name, r.grade, r.route_type, ura.ascent_type, ura.ascent_date, ura.rating, c.name as crag_name FROM user_route_ascents ura JOIN routes r ON ura.route_id = r.id JOIN crags c ON r.crag_id = c.id WHERE ura.user_id = ? ORDER BY ura.ascent_date DESC LIMIT ?'
    ).bind(userId, limit).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async myAscentAtCrag(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const userId = this.ensureUserId(params);
    const cragId = this.requireParam(params, 'crag_id');
    const result = await this.db.prepare(
      'SELECT r.name, r.grade, r.route_type, ura.ascent_type, ura.ascent_date, ura.rating FROM user_route_ascents ura JOIN routes r ON ura.route_id = r.id WHERE ura.user_id = ? AND r.crag_id = ? ORDER BY ura.ascent_date DESC'
    ).bind(userId, cragId).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async myAscentByDate(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const userId = this.ensureUserId(params);
    const dateFrom = this.validateDate(params.date_from as string | undefined);
    const dateTo = this.validateDate(params.date_to as string | undefined);

    let sql = 'SELECT r.name, r.grade, r.route_type, ura.ascent_type, ura.ascent_date, c.name as crag_name FROM user_route_ascents ura JOIN routes r ON ura.route_id = r.id JOIN crags c ON r.crag_id = c.id WHERE ura.user_id = ?';
    const binds: unknown[] = [userId];

    if (dateFrom) {
      sql += ' AND ura.ascent_date >= ?';
      binds.push(dateFrom);
    }
    if (dateTo) {
      sql += ' AND ura.ascent_date <= ?';
      binds.push(dateTo);
    }

    sql += ' ORDER BY ura.ascent_date DESC LIMIT 50';
    const result = await this.db.prepare(sql).bind(...binds).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async myHighestGrade(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const userId = this.ensureUserId(params);
    const result = await this.db.prepare(
      'SELECT r.name, r.grade, r.route_type, ura.ascent_type, ura.ascent_date, c.name as crag_name FROM user_route_ascents ura JOIN routes r ON ura.route_id = r.id JOIN crags c ON r.crag_id = c.id WHERE ura.user_id = ? AND r.grade IS NOT NULL ORDER BY r.grade DESC LIMIT 1'
    ).bind(userId).all<Record<string, unknown>>();
    return result.results || [];
  }

  private async myRatedRoutes(params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const userId = this.ensureUserId(params);
    const rawRating = params.rating;
    const rating = rawRating !== undefined && rawRating !== null ? Number(rawRating) : undefined;

    let sql = 'SELECT r.name, r.grade, r.route_type, ura.rating, ura.ascent_date, c.name as crag_name FROM user_route_ascents ura JOIN routes r ON ura.route_id = r.id JOIN crags c ON r.crag_id = c.id WHERE ura.user_id = ? AND ura.rating IS NOT NULL';
    const binds: unknown[] = [userId];

    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new SqlExecutionError(`無效的評分值：${rating}`);
      }
      sql += ' AND ura.rating = ?';
      binds.push(rating);
    }

    sql += ' ORDER BY ura.rating DESC, ura.ascent_date DESC LIMIT 20';
    const result = await this.db.prepare(sql).bind(...binds).all<Record<string, unknown>>();
    return result.results || [];
  }

  // 檢查模板是否支援
  static isSupported(template: string): boolean {
    return SUPPORTED_TEMPLATES.includes(template as SqlTemplate);
  }

  // 檢查是否為個人完攀模板
  static isPersonalTemplate(template: string): boolean {
    return template.startsWith('MY_');
  }

  // 需要路線名稱驗證的模板
  static requiresRouteValidation(template: string): boolean {
    return ['ROUTE_INFO_LOOKUP', 'LIST_VIDEOS_FOR_ROUTE', 'ROUTE_FIRST_ASCENT'].includes(template);
  }
}
