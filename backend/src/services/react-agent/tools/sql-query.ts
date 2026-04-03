import { TextToSqlService } from '../../text-to-sql'
import type { Tool, ToolContext, ToolResult } from '../types'
import { isSmallModel } from '../types'

export const sqlQueryTool: Tool = {
  name: 'sql_query',
  tags: ['data', 'statistics'],
  alwaysLoad: true,
  concurrencySafe: true,
  maxResultChars: 2000,
  cacheTTL: 300,
  parameters: {
    type: 'object',
    properties: {
      template: {
        type: 'string',
        description: 'SQL 查詢模板名稱',
        enum: [
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
        ],
      },
      params: {
        type: 'object',
        description: '查詢參數（如 crag_name, grade, route_type, user_id 等）',
        properties: {},
        additionalProperties: true,
      },
    },
    required: ['template'],
  },

  prompt(ctx: ToolContext): string {
    let desc = '查詢攀岩資料庫的結構化資料。支援：路線統計、難度分佈、岩場資訊、個人攀登記錄等。'
    if (ctx.userId) {
      desc += ` 用戶 ID: ${ctx.userId}（可查詢個人攀登記錄 MY_* 模板）`
    } else {
      desc += ' 注意：用戶未登入，無法使用 MY_* 系列個人查詢模板。'
    }

    // 小模型附加 few-shot
    if (isSmallModel(ctx.models.orchestrator)) {
      desc +=
        '\n\n使用範例：\n- 「龍洞有幾條路線？」→ { "template": "COUNT_ROUTES_AT_CRAG", "params": { "crag_name": "龍洞" } }\n- 「5.10 的路線有哪些？」→ { "template": "LIST_ROUTES_AT_GRADE", "params": { "grade": "5.10a" } }\n- 「我爬過幾條路線？」→ { "template": "MY_ASCENT_COUNT" }'
    }

    return desc
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    const { template, params = {} } = input as {
      template: string
      params?: Record<string, unknown>
    }

    // 個人查詢需要 userId，未登入時直接回錯誤
    if (template.startsWith('MY_') && !ctx.userId) {
      return { rows: [], template, error: '用戶未登入，無法使用個人查詢模板' }
    }

    const service = new TextToSqlService(ctx.env.DB)

    // 個人查詢自動注入 user_id
    const queryParams = { ...params }
    if (template.startsWith('MY_') && ctx.userId) {
      queryParams.user_id = ctx.userId
    }

    return service.execute(template, queryParams)
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as { rows: Record<string, unknown>[]; template: string }
    if (!data.rows?.length) {
      return {
        content: `查詢 ${data.template} 沒有結果。`,
        metadata: { resultCount: 0, template: data.template },
      }
    }
    // 將結果轉為表格文字
    const keys = Object.keys(data.rows[0])
    const header = keys.join(' | ')
    const rows = data.rows.map((row) => keys.map((k) => String(row[k] ?? '')).join(' | '))
    return {
      content: `${data.template} 查詢結果（${data.rows.length} 筆）：\n\n${header}\n${'-'.repeat(header.length)}\n${rows.join('\n')}`,
      metadata: { resultCount: data.rows.length, template: data.template },
    }
  },
}
