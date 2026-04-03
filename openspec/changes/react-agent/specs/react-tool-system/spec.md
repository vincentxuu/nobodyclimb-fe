## ADDED Requirements

### Requirement: Tool interface 定義
系統 SHALL 定義統一的 Tool interface，每個 tool 實作此 interface。

#### Scenario: Tool 具備完整 interface
- **WHEN** 開發者建立新的 Tool
- **THEN** Tool MUST 實作以下欄位與方法：
  - `name`: string — tool 唯一識別名
  - `tags`: string[] — 分類標籤（如 ['location', 'weather']）
  - `alwaysLoad`: boolean — 是否永遠載入（預留未來分類載入）
  - `concurrencySafe`: boolean — 是否可並行執行
  - `maxResultChars`: number — 結果最大字元數
  - `cacheTTL`: number — tool result cache 的 TTL 秒數（0 表示不快取）
  - `parameters`: JSONSchema — tool_use input schema
  - `prompt(ctx: ToolContext)`: string — 動態生成給 LLM 的 tool 描述
  - `execute(input: unknown, ctx: ToolContext)`: Promise\<unknown\> — 執行邏輯
  - `formatResult(raw: unknown)`: ToolResult — 將執行結果格式化為 LLM 可讀文字

### Requirement: ToolContext 定義
系統 SHALL 定義 ToolContext 型別，提供 tool 執行所需的共享資源。

#### Scenario: Tool 存取共享資源
- **WHEN** tool 的 execute() 或 prompt() 被呼叫
- **THEN** ctx 參數 SHALL 包含：
  - `env`: Env — Cloudflare Workers bindings（DB、KV、R2、AI）
  - `userId`: string — 當前用戶 ID（需登入）
  - `locale`: string — 'zh-TW' | 'en' | 'ja'
  - `models`: ModelMap — per-觸點的 provider + model 配置
  - `queryService`: QueryService — 複用現有 query service
  - `langfuseTrace?`: LangfuseTraceClient — 可選的 tracing
  - `tracker`: TokenTracker — token 追蹤
  - `cache`: AgentCache — 多層 cache 介面（embedding、tool result、entity）
  - `availableTools`: string[] — 當前已註冊的 tool 名稱列表

### Requirement: AgentCache 介面定義
系統 SHALL 定義 AgentCache 介面，提供 namespace 隔離的 key-value cache，底層使用 Cloudflare KV 並支援 TTL 自動過期。

#### Scenario: Cache 基本操作
- **WHEN** tool 呼叫 `ctx.cache.get('tool:weather', 'crag_123:2026-04-03')`
- **THEN** 若 cache 命中且未過期，回傳快取資料
- **THEN** 若 cache miss 或已過期，回傳 null

#### Scenario: Cache 寫入與 TTL
- **WHEN** tool 呼叫 `ctx.cache.set('tool:weather', key, data, 1800)`
- **THEN** 資料寫入 Cloudflare KV，TTL 為 1800 秒（30 分鐘）
- **THEN** TTL 到期後，該 key 自動失效

#### Scenario: Cache 清除
- **WHEN** 系統呼叫 `ctx.cache.invalidate('tool:weather')`
- **THEN** 清除該 namespace 下所有快取
- **WHEN** 系統呼叫 `ctx.cache.invalidate('tool:weather', specificKey)`
- **THEN** 僅清除該 namespace 下的指定 key

#### Scenario: Namespace 命名慣例
- **WHEN** 使用 AgentCache
- **THEN** namespace SHALL 遵循以下命名：
  - `embedding` — 文字向量快取
  - `tool:{tool_name}` — 各 tool 的執行結果快取
  - `entity:{type}` — 靜態實體資料快取

### Requirement: ToolResult 定義
系統 SHALL 定義 ToolResult 型別。

#### Scenario: formatResult 回傳值
- **WHEN** tool.formatResult(raw) 被呼叫
- **THEN** 回傳 `{ content: string, metadata?: Record<string, unknown> }`
- **THEN** `content` 為給 LLM 看的格式化文字
- **THEN** `metadata` 為給 trace/log 用的資訊（如 resultCount、latencyMs）

### Requirement: Tool prompt 動態生成
每個 Tool 的 prompt() SHALL 根據 context 動態生成描述文字，至少支援以下四個維度的適配。

#### Scenario: 根據 locale 生成描述
- **WHEN** 系統呼叫 tool.prompt(ctx) 且 ctx.locale = 'zh-TW'
- **THEN** 回傳中文描述文字
- **WHEN** ctx.locale = 'en'
- **THEN** 回傳英文描述文字

#### Scenario: 根據 orchestrator 模型能力生成 few-shot
- **WHEN** ctx.models.orchestrator 為小模型（如 Workers AI llama-3.1-8b、llama-4-scout）
- **THEN** prompt 末尾 SHALL 附加 few-shot 使用範例，引導正確的參數格式
- **WHEN** ctx.models.orchestrator 為大模型（如 Anthropic Claude、OpenAI GPT-4o）
- **THEN** prompt 不附加 few-shot，避免浪費 token

#### Scenario: 根據可用 tools 調整引導
- **WHEN** ctx.availableTools 包含互補的 tool（如 search_routes 存在時 weather 的 prompt）
- **THEN** prompt MAY 附加組合使用提示（如「建議先用 weather 確認天氣再搜尋路線」）

#### Scenario: prompt 包含使用指引
- **WHEN** 系統呼叫 tool.prompt(ctx)
- **THEN** 回傳的描述 SHALL 包含：tool 用途、適用場景、input 參數說明

### Requirement: isSmallModel helper
系統 SHALL 提供 `isSmallModel(config: ModelConfig): boolean` 工具函式，供 tool prompt() 判斷是否需要 few-shot。

#### Scenario: 小模型判斷
- **WHEN** config.model 包含 '8b'、'scout'、'mini'、'flash' 等關鍵字
- **THEN** 回傳 true
- **WHEN** config.provider 為 'anthropic' 或 config.model 包含 'gpt-4o'、'claude'、'gemini-pro'
- **THEN** 回傳 false

### Requirement: Tool result 截斷（engine 負責）
engine SHALL 統一負責 tool result 的截斷，tool 的 formatResult() 只負責格式化。

#### Scenario: 結果在限制內
- **WHEN** tool.formatResult() 的輸出字元數 <= tool.maxResultChars
- **THEN** engine 完整送出格式化結果

#### Scenario: 結果超過限制
- **WHEN** tool.formatResult() 的輸出字元數 > tool.maxResultChars
- **THEN** engine 截斷至 maxResultChars 並附加「[結果已截斷，共 N 筆，顯示前 M 筆]」摘要

### Requirement: Tool Registry 管理
系統 SHALL 提供 Registry 管理 tool 集合。

#### Scenario: 註冊與取得 tool
- **WHEN** 系統啟動時註冊所有 tool
- **THEN** Registry 可透過 `getTools()` 回傳所有 tool
- **THEN** Registry 可透過 `getTools(tags)` 回傳符合標籤的 tool 子集

#### Scenario: 轉換為 API schema
- **WHEN** 系統需要將 tool 傳給 LLM API
- **THEN** Registry 的 `toAPISchema(ctx)` 將每個 tool 轉換為 LLM tool_use 格式（name + description from prompt(ctx) + input_schema from parameters）
