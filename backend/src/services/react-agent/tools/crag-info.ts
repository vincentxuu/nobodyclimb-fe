import type { Tool, ToolContext, ToolResult } from '../types'

export const cragInfoTool: Tool = {
  name: 'crag_info',
  tags: ['data', 'crags'],
  alwaysLoad: true,
  concurrencySafe: true,
  maxResultChars: 2000,
  cacheTTL: 21600,
  parameters: {
    type: 'object',
    properties: {
      crag: {
        type: 'string',
        description: '岩場名稱（如「龍洞」、「大砲岩」、「熱海」）',
      },
    },
    required: ['crag'],
  },

  prompt(_ctx: ToolContext): string {
    return '查詢指定岩場的詳細資訊：交通方式、停車、設施、規則、營業時間、路線數量等。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    const { crag } = input as { crag: string }
    const db = ctx.env.DB

    const cragRow = await db
      .prepare(
        `SELECT c.*, COUNT(r.id) as route_count,
                MIN(r.grade) as min_grade, MAX(r.grade) as max_grade
         FROM crags c
         LEFT JOIN routes r ON r.crag_id = c.id
         WHERE c.name LIKE ?
         GROUP BY c.id
         LIMIT 1`
      )
      .bind(`%${crag}%`)
      .first<Record<string, unknown>>()

    if (!cragRow) {
      return { error: `找不到岩場「${crag}」` }
    }

    // 取得岩場的 sectors
    const sectors = await db
      .prepare('SELECT name, description FROM crag_sectors WHERE crag_id = ?')
      .bind(cragRow.id)
      .all<{ name: string; description: string | null }>()

    return { crag: cragRow, sectors: sectors.results ?? [] }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      error?: string
      crag?: Record<string, unknown>
      sectors?: Array<{ name: string; description: string | null }>
    }

    if (data.error) {
      return { content: data.error }
    }

    const c = data.crag!
    const lines: string[] = [`岩場：${c.name}`]
    if (c.name_en) lines.push(`英文名：${c.name_en}`)
    if (c.region) lines.push(`地區：${c.region}`)
    if (c.address) lines.push(`地址：${c.address}`)
    if (c.description) lines.push(`簡介：${c.description}`)
    if (c.route_count) lines.push(`路線數：${c.route_count} 條`)
    if (c.min_grade && c.max_grade) lines.push(`難度範圍：${c.min_grade} ~ ${c.max_grade}`)
    if (c.climbing_types) lines.push(`攀登類型：${c.climbing_types}`)
    if (c.access_info) lines.push(`交通：${c.access_info}`)
    if (c.parking_info) lines.push(`停車：${c.parking_info}`)
    if (c.facilities) lines.push(`設施：${c.facilities}`)
    if (c.rules) lines.push(`規則：${c.rules}`)
    if (c.opening_hours) lines.push(`營業時間：${c.opening_hours}`)

    if (data.sectors?.length) {
      lines.push(`\n區域（${data.sectors.length} 個）：`)
      for (const s of data.sectors) {
        lines.push(`- ${s.name}${s.description ? `：${s.description}` : ''}`)
      }
    }

    return {
      content: lines.join('\n'),
      metadata: { cragName: c.name },
    }
  },
}
