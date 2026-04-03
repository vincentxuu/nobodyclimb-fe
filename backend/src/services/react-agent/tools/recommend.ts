import type { Tool, ToolContext, ToolResult } from '../types'

export const recommendTool: Tool = {
  name: 'recommend',
  tags: ['recommendation', 'personal'],
  alwaysLoad: false,
  concurrencySafe: false,
  maxResultChars: 3000,
  cacheTTL: 300,
  parameters: {
    type: 'object',
    properties: {
      crag: {
        type: 'string',
        description: '（可選）限定推薦的岩場',
      },
    },
    required: [],
  },

  prompt(ctx: ToolContext): string {
    if (!ctx.userId) {
      return '為用戶推薦個人化攀岩路線。（目前用戶未登入，無法使用此工具）'
    }
    return '根據用戶的攀登歷史和能力，推薦適合的攀岩路線。會排除已完攀的路線。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    if (!ctx.userId) {
      return { error: '用戶未登入，無法產生個人化推薦' }
    }

    const { crag } = input as { crag?: string }
    const db = ctx.env.DB

    // 取得用戶近期攀登記錄
    const ascents = await db
      .prepare(
        `SELECT r.name AS route_name, r.grade, ra.ascent_type AS style, c.name AS crag_name
         FROM user_route_ascents ra
         LEFT JOIN routes r ON ra.route_id = r.id
         LEFT JOIN crags c ON r.crag_id = c.id
         WHERE ra.user_id = ?
         ORDER BY ra.ascent_date DESC
         LIMIT 10`
      )
      .bind(ctx.userId)
      .all<{ route_name: string; grade: string; style: string; crag_name: string | null }>()

    // 取得已攀登路線 ID
    const climbedRoutes = await db
      .prepare('SELECT DISTINCT route_id FROM user_route_ascents WHERE user_id = ?')
      .bind(ctx.userId)
      .all<{ route_id: string }>()
    const climbedRouteIds = new Set((climbedRoutes.results ?? []).map((r) => r.route_id))

    // 用 QueryService 搜尋推薦路線
    const query = crag ? `推薦適合我的 ${crag} 攀岩路線` : '推薦適合我的攀岩路線'

    // 查 crag_id
    let cragId: string | undefined
    if (crag) {
      const cragRow = await ctx.env.DB.prepare('SELECT id FROM crags WHERE name LIKE ? LIMIT 1')
        .bind(`%${crag}%`)
        .first<{ id: string }>()
      cragId = cragRow?.id
    }

    const result = await ctx.queryService.search({
      query,
      type: 'route',
      limit: 20, // 多撈一些，post-filter 後取 10
      filters: cragId ? { crag_id: cragId } : undefined,
    })

    // 排除已攀登路線
    const filtered = (result.results ?? [])
      .filter((r: { id?: string }) => !r.id || !climbedRouteIds.has(r.id))
      .slice(0, 10)

    return {
      recentAscents: ascents.results ?? [],
      recommendations: filtered,
      count: filtered.length,
    }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      error?: string
      recentAscents?: Array<{ route_name: string; grade: string }>
      recommendations?: Array<{ title: string; excerpt?: string }>
      count?: number
    }

    if (data.error) {
      return { content: data.error }
    }

    const lines: string[] = []
    if (data.recommendations?.length) {
      lines.push(`推薦路線（${data.count} 條）：`)
      for (const [i, r] of data.recommendations.entries()) {
        lines.push(`${i + 1}. ${r.title}${r.excerpt ? `\n   ${r.excerpt}` : ''}`)
      }
    } else {
      lines.push('目前沒有推薦路線。')
    }

    return {
      content: lines.join('\n'),
      metadata: { resultCount: data.count ?? 0 },
    }
  },
}
