import type { AISearchRequest, ParsedQuery } from '../../types'
import { extractGradeFilter } from './nlp'

// 建立 Vectorize metadata 過濾條件（search API 用）
export function buildFilter(request: AISearchRequest): Record<string, unknown> {
  const filter: Record<string, unknown> = {}

  if (request.type) {
    filter['type'] = { $eq: request.type }
  }
  if (request.filters?.crag_id) {
    filter['crag_id'] = { $eq: request.filters.crag_id }
  }
  if (request.filters?.route_type) {
    filter['route_type'] = { $eq: request.filters.route_type }
  }
  if (request.filters?.grade_min !== undefined || request.filters?.grade_max !== undefined) {
    const gradeFilter: Record<string, number> = {}
    if (request.filters?.grade_min !== undefined) {
      gradeFilter['$gte'] = request.filters.grade_min
    }
    if (request.filters?.grade_max !== undefined) {
      gradeFilter['$lte'] = request.filters.grade_max
    }
    filter['grade_numeric'] = gradeFilter
  }

  return filter
}

// 將 ParsedQuery.params 轉換成 Vectorize metadata filter
// 需要 DB 查詢將名稱解析為 ID
export async function buildFiltersFromParsed(
  db: D1Database,
  parsed: ParsedQuery
): Promise<Record<string, unknown>> {
  const filter: Record<string, unknown> = {}
  const { params, tool } = parsed

  // 根據工具類型設定 type 過濾
  if (tool === 'search_routes') {
    filter['type'] = { $eq: 'route' }
  } else if (tool === 'search_crags') {
    filter['type'] = { $eq: 'crag' }
  }

  // 解析 area_name → area_id
  if (params.area_name) {
    const area = await db
      .prepare('SELECT id FROM areas WHERE name = ? LIMIT 1')
      .bind(params.area_name)
      .first<{ id: string }>()
    if (area) {
      filter['area_id'] = { $eq: area.id }
    }
  }

  // 解析 crag_name → crag_id（area_id 優先，有 area_id 就不需要 crag_id）
  if (params.crag_name && !filter['area_id']) {
    const crag = await db
      .prepare('SELECT id FROM crags WHERE name = ? LIMIT 1')
      .bind(params.crag_name)
      .first<{ id: string }>()
    if (crag) {
      filter['crag_id'] = { $eq: crag.id }
    }
  }

  // 解析地區
  if (params.region && !filter['area_id'] && !filter['crag_id']) {
    filter['region'] = { $eq: params.region }
  }

  // 解析 grade（支援 "5.11b" 或 "5.10-5.12" 格式）
  if (params.grade) {
    const rangeMatch = params.grade.match(/5\.(\d+)([a-d])?[-~]5\.(\d+)([a-d])?/i)
    if (rangeMatch) {
      const minNumeric =
        parseInt(rangeMatch[1], 10) * 10 +
        (rangeMatch[2] ? 'abcd'.indexOf(rangeMatch[2].toLowerCase()) : 0)
      const maxNumeric =
        parseInt(rangeMatch[3], 10) * 10 +
        (rangeMatch[4] ? 'abcd'.indexOf(rangeMatch[4].toLowerCase()) : 3)
      filter['grade_numeric'] = { $gte: minNumeric, $lte: maxNumeric }
    } else {
      const gradeFilter = extractGradeFilter(params.grade)
      if (gradeFilter) {
        filter['grade_numeric'] = gradeFilter
      }
    }
  }

  return filter
}
