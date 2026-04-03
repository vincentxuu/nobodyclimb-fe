import type { Tool, ToolContext, ToolResult } from '../types'

export const searchCragsTool: Tool = {
  name: 'search_crags',
  tags: ['retrieval', 'crags'],
  alwaysLoad: true,
  concurrencySafe: true,
  maxResultChars: 2000,
  cacheTTL: 21600,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜尋岩場的查詢文字',
      },
    },
    required: ['query'],
  },

  prompt(_ctx: ToolContext): string {
    return '搜尋台灣攀岩岩場資料庫。回傳岩場的名稱、位置、路線數量、難度範圍、特色等。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    const { query } = input as { query: string }
    // 使用 QueryService 的 search，filter type=crag
    const result = await ctx.queryService.search({
      query,
      type: 'crag',
      limit: 5,
    })
    return result
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as { results: Array<{ title: string; excerpt?: string }>; count: number }
    if (!data.results?.length) {
      return { content: '未找到符合條件的岩場。', metadata: { resultCount: 0 } }
    }
    const lines = data.results.map(
      (r, i) => `${i + 1}. ${r.title}${r.excerpt ? `\n   ${r.excerpt}` : ''}`
    )
    return {
      content: `找到 ${data.count} 個岩場：\n\n${lines.join('\n\n')}`,
      metadata: { resultCount: data.count },
    }
  },
}
