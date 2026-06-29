import type { Tool, ToolContext, ToolResult } from '../types'
import { isSmallModel } from '../types'

export const searchRoutesTool: Tool = {
  name: 'search_routes',
  tags: ['retrieval', 'routes'],
  alwaysLoad: true,
  concurrencySafe: true,
  maxResultChars: 3000,
  cacheTTL: 3600,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜尋攀岩路線的查詢文字（中文或英文）',
      },
      crag: {
        type: 'string',
        description: '（可選）限定搜尋的岩場名稱',
      },
    },
    required: ['query'],
  },

  prompt(ctx: ToolContext): string {
    let desc =
      '搜尋台灣攀岩路線資料庫。輸入自然語言描述想找的路線（例如「龍洞 5.10 運動攀」、「適合新手的路線」）。回傳相關路線的名稱、難度、岩場、類型等資訊。'

    // 小模型附加 few-shot
    if (isSmallModel(ctx.models.orchestrator)) {
      desc +=
        '\n\n使用範例：\n- 「龍洞 5.10 的裂隙路線」→ { "query": "裂隙", "crag": "龍洞" }\n- 「適合新手的 sport 路線」→ { "query": "新手 sport" }\n- 「大砲岩簡單的路線」→ { "query": "簡單", "crag": "大砲岩" }'
    }

    // 跨 tool 組合提示
    if (ctx.availableTools.includes('weather')) {
      desc += '\n\n提示：如果用戶問適不適合去某個岩場，建議先用 weather 確認天氣再搜路線。'
    }

    return desc
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    const { query, crag } = input as { query: string; crag?: string }

    // 如果指定岩場，先查 crag_id
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
      limit: 10,
      filters: cragId ? { crag_id: cragId } : undefined,
    })

    // 收集 sources 供 injectRouteLinks 使用
    for (const s of result.results) {
      if (!ctx.collectedSources.some((existing) => existing.id === s.id)) {
        ctx.collectedSources.push(s)
      }
    }

    return result
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      results: Array<{ title: string; excerpt?: string; url?: string }>
      count: number
    }
    if (!data.results?.length) {
      return { content: '未找到符合條件的路線。', metadata: { resultCount: 0 } }
    }
    const lines = data.results.map(
      (r, i) =>
        `${i + 1}. ${r.title}${r.excerpt ? `\n   ${r.excerpt}` : ''}${r.url ? `\n   路線連結：${r.url}` : ''}`
    )
    return {
      content: `找到 ${data.count} 條路線：\n\n${lines.join('\n\n')}`,
      metadata: { resultCount: data.count },
    }
  },
}
