import { D1Database } from '@cloudflare/workers-types'
import { upsertMemory } from '../repositories/memory'
import { AI } from '../types'
import { toTraditionalChinese } from '../utils/opencc'
import { extractResponseText } from './query/types'

const LIGHTWEIGHT_MODEL = '@cf/meta/llama-3.1-8b-instruct'

// Task 4.2: 記憶提取 prompt
// 只從用戶問題本身識別用戶資訊，不推斷 AI 回答的內容
const MEMORY_EXTRACTION_PROMPT = `你是一個記憶提取助手。請從以下用戶的問題中，識別出關於這位用戶自身的資訊。

重要規則：
- 只提取用戶明確表達的自身資訊（例如「我是5.11a的程度」、「我住台中」）
- 不要推斷或猜測用戶的資訊
- 不要從問題語氣或問法推斷（例如「初學者會問的問題」不算）
- 只使用以下 memory_key（不能使用其他 key）：
  - climbing_level：攀岩程度（如 5.11a、V4 等）
  - preferred_region：偏好地區（如台北、台中等）
  - preferred_style：偏好攀登類型（如運攀、抱石、傳攀）
  - preferred_crag：偏好岩場（如龍洞、小烏來等）
  - goals：攀岩目標（如「想挑戰 5.12a」等）
- memory_type 只能是：preference、behavior、fact
- 最多輸出 3 條記憶
- 若沒有符合的資訊，輸出空陣列 []

請輸出 JSON 陣列格式，每項包含：memory_key、memory_type、content
例：[{"memory_key":"climbing_level","memory_type":"fact","content":"5.11a"}]

用戶問題：{query}

輸出（只輸出 JSON，不要其他文字）：`

interface MemoryItem {
  memory_key: string
  memory_type: string
  content: string
}

const VALID_MEMORY_KEYS = new Set([
  'climbing_level',
  'preferred_region',
  'preferred_style',
  'preferred_crag',
  'goals',
])
const VALID_MEMORY_TYPES = new Set(['preference', 'behavior', 'fact'])

// Task 4.1: 從用戶問題提取記憶並寫入 DB
export async function extractMemoriesFromQuery(
  query: string,
  userId: string,
  db: D1Database,
  ai: AI,
  gatewayOptions?: { gateway?: { id: string } }
): Promise<void> {
  try {
    // Task 4.1: 只傳入用戶問題，呼叫 llama-3.1-8b 提取結構化記憶
    const prompt = MEMORY_EXTRACTION_PROMPT.replace('{query}', query)
    const result = (await ai.run(
      LIGHTWEIGHT_MODEL,
      { messages: [{ role: 'user', content: prompt }], max_tokens: 300 },
      gatewayOptions
    )) as { response?: string }

    const raw = extractResponseText(result)
    if (!raw) return

    // Task 4.3: 解析 LLM 回傳 JSON，跳過解析失敗或 content 為空的項目
    let items: MemoryItem[] = []
    try {
      // 嘗試從回應中抽取 JSON 陣列（模型可能在前後加文字）
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return
      items = JSON.parse(jsonMatch[0]) as MemoryItem[]
    } catch {
      return
    }

    if (!Array.isArray(items)) return

    for (const item of items.slice(0, 3)) {
      if (!item.memory_key || !item.memory_type || !item.content) continue
      if (!VALID_MEMORY_KEYS.has(item.memory_key)) continue
      if (!VALID_MEMORY_TYPES.has(item.memory_type)) continue
      if (item.content.trim() === '') continue

      await upsertMemory(
        userId,
        item.memory_key,
        item.memory_type as 'preference' | 'behavior' | 'fact',
        toTraditionalChinese(item.content.trim()),
        db
      )
    }
  } catch {
    // Task 4.4: 提取失敗不影響主查詢（靜默忽略錯誤）
  }
}
