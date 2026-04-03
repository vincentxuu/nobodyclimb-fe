import type { Tool, ToolContext, ToolResult } from '../types'
import { isSmallModel } from '../types'

export const weatherTool: Tool = {
  name: 'weather',
  tags: ['external', 'weather'],
  alwaysLoad: true,
  concurrencySafe: true,
  maxResultChars: 1000,
  cacheTTL: 1800,
  parameters: {
    type: 'object',
    properties: {
      crag: {
        type: 'string',
        description: '岩場名稱（如「龍洞」、「大砲岩」）',
      },
    },
    required: ['crag'],
  },

  prompt(ctx: ToolContext): string {
    let desc = '查詢指定岩場的天氣預報。回傳溫度、降雨機率、風速等資訊，幫助判斷是否適合攀岩。'

    // 小模型附加 few-shot
    if (isSmallModel(ctx.models.orchestrator)) {
      desc +=
        '\n\n使用範例：\n- 「龍洞天氣如何？」→ { "crag": "龍洞" }\n- 「大砲岩會下雨嗎？」→ { "crag": "大砲岩" }'
    }

    // 中文 locale 附加岩場名稱對應
    if (ctx.locale === 'zh-TW') {
      desc +=
        '\n\n常見岩場名稱對應：龍洞（Longdong）、大砲岩（Dapaoyan）、熱海（Rehai）、關子嶺（Guanziling）、壽山（Shoushan）。請使用中文名稱作為 crag 參數。'
    }

    return desc
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    const { crag } = input as { crag: string }

    // 查 DB 取得岩場的經緯度
    const cragRow = await ctx.env.DB.prepare(
      'SELECT id, name, latitude, longitude FROM crags WHERE name LIKE ? LIMIT 1'
    )
      .bind(`%${crag}%`)
      .first<{ id: string; name: string; latitude: number; longitude: number }>()

    if (!cragRow || !cragRow.latitude || !cragRow.longitude) {
      return { error: `找不到岩場「${crag}」的位置資料` }
    }

    // 呼叫中央氣象署 API
    const apiKey = ctx.env.CWA_API_KEY
    if (!apiKey) {
      return { error: '天氣 API 未設定' }
    }

    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=${apiKey}&format=JSON&locationName=${encodeURIComponent(cragRow.name)}`
    try {
      const res = await fetch(url)
      if (!res.ok) {
        return { cragName: cragRow.name, error: `天氣 API 回應 ${res.status}` }
      }
      const data = (await res.json()) as Record<string, unknown>
      return { cragName: cragRow.name, weather: data }
    } catch (err) {
      return {
        cragName: cragRow.name,
        error: `天氣查詢失敗: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as { cragName?: string; weather?: unknown; error?: string }
    if (data.error) {
      return {
        content: data.error,
        metadata: { cragName: data.cragName },
      }
    }

    // 嘗試從 CWA 回應中提取天氣資訊
    try {
      const records = data.weather as {
        records?: {
          locations?: Array<{
            location?: Array<{
              locationName: string
              weatherElement?: Array<{
                elementName: string
                time?: Array<{
                  startTime?: string
                  elementValue?: Array<{ value: string }>
                }>
              }>
            }>
          }>
        }
      }
      const location = records?.records?.locations?.[0]?.location?.[0]
      if (!location) {
        return { content: `${data.cragName}：無天氣資料`, metadata: { cragName: data.cragName } }
      }

      const elements = location.weatherElement ?? []
      const getElement = (name: string) =>
        elements.find((e) => e.elementName === name)?.time?.[0]?.elementValue?.[0]?.value

      const temp = getElement('T')
      const pop = getElement('PoP6h') ?? getElement('PoP12h')
      const wx = getElement('Wx')
      const ws = getElement('WS')

      const lines = [`${data.cragName} 天氣預報：`]
      if (wx) lines.push(`天氣：${wx}`)
      if (temp) lines.push(`溫度：${temp}°C`)
      if (pop) lines.push(`降雨機率：${pop}%`)
      if (ws) lines.push(`風速：${ws} m/s`)

      return { content: lines.join('\n'), metadata: { cragName: data.cragName } }
    } catch {
      return {
        content: `${data.cragName}：天氣資料解析失敗`,
        metadata: { cragName: data.cragName },
      }
    }
  },
}
