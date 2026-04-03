import type { Tool, ToolContext, ToolResult } from '../types'

/** YDS grade → sortable numeric（5.10a=100, 5.12d=123） */
function gradeToNumeric(grade: string | null): number {
  if (!grade) return 0
  const match = grade.match(/5\.(\d+)([a-d])?/)
  if (!match) return 0
  return parseInt(match[1], 10) * 10 + (match[2] ? 'abcd'.indexOf(match[2]) : 0)
}

export const userProfileTool: Tool = {
  name: 'user_profile',
  tags: ['user', 'personal'],
  alwaysLoad: true,
  concurrencySafe: true,
  maxResultChars: 2000,
  cacheTTL: 600,
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },

  prompt(ctx: ToolContext): string {
    if (!ctx.userId) {
      return '查詢用戶的攀岩歷史、能力等級與偏好。（目前用戶未登入，無法使用此工具）'
    }
    return '查詢當前用戶的攀岩歷史、能力等級、近期完攀記錄與偏好路線類型。用於個人化推薦和建議。'
  },

  async execute(_input: unknown, ctx: ToolContext): Promise<unknown> {
    if (!ctx.userId) {
      return { error: '用戶未登入，無法查詢個人資料' }
    }

    const db = ctx.env.DB

    // 查詢用戶基本資料 + rank
    const [user, recentAscents, stats] = await Promise.all([
      db
        .prepare(
          `SELECT u.id, COALESCE(u.display_name, u.username) AS name, ur.rank_id, ur.score, ur.daily_ai_limit
           FROM users u LEFT JOIN user_ranks ur ON u.id = ur.user_id
           WHERE u.id = ?`
        )
        .bind(ctx.userId)
        .first<{
          id: string
          name: string
          rank_id: string | null
          score: number | null
          daily_ai_limit: number | null
        }>(),
      db
        .prepare(
          `SELECT r.name AS route_name, r.grade, ra.ascent_type AS style, ra.rating, ra.ascent_date AS climbed_at, c.name AS crag_name
           FROM user_route_ascents ra
           LEFT JOIN routes r ON ra.route_id = r.id
           LEFT JOIN crags c ON r.crag_id = c.id
           WHERE ra.user_id = ?
           ORDER BY ra.ascent_date DESC
           LIMIT 10`
        )
        .bind(ctx.userId)
        .all<{
          route_name: string
          grade: string
          style: string
          rating: number | null
          climbed_at: string
          crag_name: string | null
        }>(),
      db
        .prepare(
          `SELECT COUNT(*) as total_ascents,
                  COUNT(DISTINCT c.id) as unique_crags
           FROM user_route_ascents ra
           LEFT JOIN routes r ON ra.route_id = r.id
           LEFT JOIN crags c ON r.crag_id = c.id
           WHERE ra.user_id = ?`
        )
        .bind(ctx.userId)
        .first<{ total_ascents: number; unique_crags: number }>(),
    ])

    // 從完攀記錄中用 numeric 排序找最高難度（避免 SQL MAX 的 lexicographic 問題）
    const allGrades = (recentAscents.results ?? []).map((a) => a.grade).filter(Boolean)
    const highestGrade =
      allGrades.length > 0
        ? allGrades.reduce((best, g) => (gradeToNumeric(g) > gradeToNumeric(best) ? g : best))
        : null

    return {
      user,
      recentAscents: recentAscents.results ?? [],
      stats: { ...stats, highest_grade: highestGrade },
    }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      error?: string
      user?: { name: string; rank_id: string | null; score: number | null }
      recentAscents?: Array<{
        route_name: string
        grade: string
        style: string
        climbed_at: string
        crag_name: string | null
      }>
      stats?: { total_ascents: number; highest_grade: string; unique_crags: number }
    }

    if (data.error) {
      return { content: data.error }
    }

    const lines: string[] = []
    if (data.user) {
      lines.push(`用戶：${data.user.name}`)
      if (data.user.rank_id) lines.push(`等級：${data.user.rank_id}`)
    }
    if (data.stats) {
      lines.push(`總完攀：${data.stats.total_ascents} 條`)
      if (data.stats.highest_grade) lines.push(`最高難度：${data.stats.highest_grade}`)
      lines.push(`去過 ${data.stats.unique_crags} 個岩場`)
    }
    if (data.recentAscents?.length) {
      lines.push('\n近期完攀：')
      for (const a of data.recentAscents) {
        lines.push(
          `- ${a.route_name} (${a.grade}, ${a.style}) @ ${a.crag_name ?? '未知'} [${a.climbed_at}]`
        )
      }
    }

    return {
      content: lines.join('\n'),
      metadata: {
        totalAscents: data.stats?.total_ascents,
        recentCount: data.recentAscents?.length,
      },
    }
  },
}
