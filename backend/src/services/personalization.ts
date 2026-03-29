import { D1Database } from '@cloudflare/workers-types'
import { SYSTEM_PROMPT } from '../utils/ai-prompts'

interface AscentRow {
  route_name: string
  grade: string | null
  grade_numeric: number
  ascent_type: string
}

function gradeToNumeric(grade: string | null): number {
  if (!grade) return 0
  const match = grade.match(/5\.(\d+)([a-d])?/)
  if (!match) return 0
  const base = parseInt(match[1], 10) * 10
  const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0
  return base + suffix
}

// Task 3.1: 從 user_route_ascents JOIN routes 取最近 10 條完攀紀錄
export async function getRecentAscents(userId: string, db: D1Database): Promise<AscentRow[]> {
  const result = await db
    .prepare(
      `SELECT
         COALESCE(r.name, r.name_en, '未知路線') AS route_name,
         r.grade,
         a.ascent_type
       FROM user_route_ascents a
       JOIN routes r ON a.route_id = r.id
       WHERE a.user_id = ?
       ORDER BY a.ascent_date DESC, a.created_at DESC
       LIMIT 10`
    )
    .bind(userId)
    .all<{ route_name: string; grade: string | null; ascent_type: string }>()
  return result.results.map((row) => ({
    ...row,
    grade_numeric: gradeToNumeric(row.grade),
  }))
}

// Task 3.2: 組成完攀 context 文字
export function buildAscentContext(ascents: AscentRow[]): string | null {
  if (ascents.length === 0) return null
  const items = ascents.map((a) => `${a.route_name}${a.grade ? `（${a.grade}）` : ''}`).join('、')
  return `已完攀：${items}`
}

const SUCCESSFUL_ASCENT_TYPES = new Set([
  'redpoint',
  'flash',
  'onsight',
  'toprope',
  'lead',
  'repeat',
])

// Task 3.3: 從成功完攀的 grade_numeric 取 P75；少於 3 條返回 null
export function estimateAbilityLevel(ascents: AscentRow[]): number | null {
  const successful = ascents
    .filter((a) => SUCCESSFUL_ASCENT_TYPES.has(a.ascent_type) && a.grade_numeric > 0)
    .map((a) => a.grade_numeric)
    .sort((a, b) => a - b)

  if (successful.length < 3) return null

  const p75Index = Math.floor(successful.length * 0.75)
  return successful[Math.min(p75Index, successful.length - 1)]
}

// 將 grade_numeric 轉回 YDS 文字
function numericToGrade(numeric: number): string {
  const base = Math.floor(numeric / 10)
  const suffix = 'abcd'[numeric % 10] ?? ''
  return `5.${base}${suffix}`
}

// Task 3.4: 組成個人化 system prompt 前綴，拼接至 basePrompt（預設為 SYSTEM_PROMPT）
export function buildPersonalizedSystemPrompt(
  memorySummary: string | null,
  ascentContext: string | null,
  abilityLevel: number | null,
  basePrompt: string = SYSTEM_PROMPT
): string {
  const parts: string[] = []

  if (memorySummary) {
    parts.push(`【用戶個人資訊】\n${memorySummary}`)
  }
  if (ascentContext) {
    parts.push(`【最近完攀紀錄】\n${ascentContext}`)
  }
  if (abilityLevel !== null) {
    parts.push(`【估計攀岩程度】約 ${numericToGrade(abilityLevel)}（基於完攀紀錄 P75）`)
  }

  if (parts.length === 0) return basePrompt

  return `${parts.join('\n\n')}\n\n${basePrompt}`
}
