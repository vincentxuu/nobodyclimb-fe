/**
 * 規則式查詢分類器
 * 在 ReAct loop 前分類查詢，閒聊和通用知識問題跳過 orchestrator LLM call
 */

export type QueryCategory = 'greeting' | 'system' | 'general_knowledge' | 'needs_tool'

// ---------------------------------------------------------------------------
// Pattern 定義
// ---------------------------------------------------------------------------

const GREETING_PATTERNS = [
  /^(你好|嗨|哈囉|hello|hi|hey|早安|午安|晚安|安安)\s*[!！。.？?]*$/i,
  /^(嗨嗨|哈囉哈囉|嘿嘿)\s*[!！。.]*$/i,
]

const SYSTEM_PATTERNS = [
  /你是(誰|什麼|啥)/,
  /你(會|能|可以)(做?什麼|幹(什麼|嘛)|幫我(什麼|啥))/,
  /功能(介紹|有哪些|是什麼)/,
  /怎麼(用|使用|操作)/,
  /^(help|幫助)\s*$/i,
]

const GENERAL_KNOWLEDGE_PATTERNS = [
  /什麼是\s*(flash|onsight|redpoint|toprope|lead|boulder|抱石|先鋒|上攀|top\s*rope)/i,
  /(RP|OS|FL)\s*是什麼/i,
  /難度(分級|等級|系統)(有哪些|怎麼分|是什麼)/,
  /(YDS|V\s*scale|Font|法國等級)\s*(是什麼|怎麼看)/i,
  /攀岩(種類|類型|分類)(有哪些|是什麼)/,
  /什麼是\s*(運動攀|傳統攀|抱石|速度攀|多繩距)/,
  /(怎麼|如何)\s*(開始|入門)\s*攀岩/,
  /攀岩(裝備|器材|工具)(有哪些|需要什麼|要準備什麼)/,
  /什麼是\s*(快扣|岩楔|cam|nut|chalk|粉袋|安全吊帶|harness)/i,
]

// 包含這些關鍵字 → 需要 tool（不歸為通用知識）
const NEEDS_TOOL_KEYWORDS = [
  '龍洞',
  '大砲岩',
  '熱海',
  '關子嶺',
  '壽山',
  '北投',
  '南雅',
  '天氣',
  '下雨',
  '溫度',
  '推薦',
  '建議',
  '適合我',
  '我的',
  '我爬',
  '我完攀',
  '紀錄',
  '幾條',
  '多少',
  '統計',
  '排名',
  '路線',
  '岩場',
  '岩館',
]

// ---------------------------------------------------------------------------
// 分類器
// ---------------------------------------------------------------------------

export function classifyQuery(query: string): QueryCategory {
  const trimmed = query.trim()

  // 1. 打招呼
  if (GREETING_PATTERNS.some((p) => p.test(trimmed))) {
    return 'greeting'
  }

  // 2. 系統問題
  if (SYSTEM_PATTERNS.some((p) => p.test(trimmed))) {
    return 'system'
  }

  // 3. 檢查是否需要 tool（優先於通用知識）
  if (NEEDS_TOOL_KEYWORDS.some((kw) => trimmed.includes(kw))) {
    return 'needs_tool'
  }

  // 4. 通用攀岩知識
  if (GENERAL_KNOWLEDGE_PATTERNS.some((p) => p.test(trimmed))) {
    return 'general_knowledge'
  }

  // 5. 預設進 ReAct loop（寧可多花一次 orchestrator call，不可漏回答）
  return 'needs_tool'
}

// ---------------------------------------------------------------------------
// 固定回覆
// ---------------------------------------------------------------------------

export const GREETING_RESPONSE =
  '你好！👋 我是 NobodyClimb 的攀岩 AI 助手，可以幫你查路線、看天氣、找推薦。有什麼想問的嗎？'

export const SYSTEM_RESPONSE = `我是 NobodyClimb 攀岩 AI 助手，可以幫你：

• 搜尋攀岩路線（依難度、類型、岩場篩選）
• 查詢岩場天氣預報
• 查看個人攀登記錄與統計
• 個人化路線推薦
• 回答攀岩相關知識

直接用自然語言問我就好！`
