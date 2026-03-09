# Multi-Agent RAG 架構規劃

> 建立日期：2026-03-08
> 依據：`11-rag-improvement-tasks.md`、`12-rag-gap-analysis.md`、`2026-interview.md`、業界 2026 Multi-Agent 實務
> 目的：規劃 NobodyClimb AI 系統從 Modular Pipeline 演進至 Multi-Agent 架構的策略、角色設計與實作路線

---

## 一、現狀分析與演進動機

### 1.1 現有架構定位

本專案已建構 **Gen 2 完整 + Gen 3 完整 + Gen 4 初期** 的 RAG 系統：

```
用戶查詢 → Guardrails → Quota → PipelineEngine（14 步驟）→ 回應
                                        ↓
                              tool-selection → 5 種工具路由
                              hybrid-search → Vector + BM25 + RRF
                              text-to-sql → 17 SQL 模板
                              judge + self-reflection → 品質迴圈
                              agenticRetrieve → ReAct 多步決策
```

**已有的「類 Agent」能力**：

| Pipeline 步驟 | 等效 Agent 角色 | 自主性 |
|--------------|----------------|--------|
| `tool-selection` | Router Agent | LLM 分類 5 種工具 |
| `hybrid-search` + `agenticRetrieve` | Retrieval Agent | ReAct 迴圈（ANSWER/RETRIEVE/BROADEN） |
| `text-to-sql` | SQL Agent | 17 SQL 模板 + 澄清流程 |
| `judge` + `self-reflection` | Critic Agent | 品質評估 + loopBack 重新檢索 |
| `memory-extractor` + `personalization` | Memory Agent | 用戶記憶 + 個人化 |
| `llm-generation` | Writer Agent | 上下文組裝 + 回答生成 |

### 1.2 為什麼要演進至 Multi-Agent

差距分析（`12-rag-gap-analysis.md`）指出現有 Pipeline 模組化已覆蓋多數 Multi-Agent 價值，**不建議為了 Multi-Agent 而 Multi-Agent**。但以下場景是 Pipeline 架構的結構性瓶頸：

| 瓶頸 | Pipeline 限制 | Multi-Agent 優勢 |
|------|--------------|-----------------|
| **跨工具協作** | 一次查詢只選一個工具，`hybrid` 是硬編碼組合 | 多 Agent 並行查詢 + 結果融合 |
| **Plan-and-Execute** | ReAct 循序決策，無法先規劃再並行執行 | Planning Agent 分解 → Worker Agents 並行 |
| **長對話狀態** | Pipeline 無狀態，每次從頭跑 | Durable Objects 持久化 Agent 狀態 |
| **動態能力擴展** | 新工具需改 Pipeline 程式碼 + prompt | 新 Agent 獨立部署，Router 自動發現 |
| **對抗式驗證** | Judge 是單一評估，無交叉驗證 | 多 Critic Agent 互相挑戰 |
| **複雜多步推理** | Pipeline 是線性/單迴圈，無法巢狀推理 | Agent 可遞迴呼叫其他 Agent |

### 1.3 演進策略：增量式，非重寫

```
Phase 0（現狀）: Modular Pipeline + Single-Agent ReAct
    ↓ 保留現有 Pipeline 作為快速路徑
Phase 1: Pipeline + Supervisor Agent（智慧路由增強）
    ↓ 複雜查詢升級為 Multi-Agent
Phase 2: Multi-Agent Orchestration（Plan-and-Execute）
    ↓ 長對話 + 持久化狀態
Phase 3: Persistent Multi-Agent（Durable Objects）
```

**核心原則**：Pipeline 不廢棄，Multi-Agent 是 Pipeline 的上層調度。簡單查詢走 Pipeline 快速路徑（< 2s），複雜查詢升級為 Multi-Agent（3-5s 但更準確）。

---

## 二、業界 Multi-Agent RAG 模式（2026）

### 2.1 架構模式光譜

| 模式 | 複雜度 | 適用場景 | 延遲 |
|------|--------|---------|------|
| **Single-Agent ReAct** | 低 | 探索性查詢，2-3 步 | 低 |
| **Supervisor + Workers** | 中 | 多來源查詢，需協調 | 中 |
| **Hierarchical Multi-Agent** | 高 | 跨領域複雜推理 | 高 |
| **Mesh / Swarm** | 最高 | 大規模對抗式驗證 | 最高 |

業界 2026 趨勢（[Multi-Agent AI Orchestration: Enterprise Strategy](https://www.onabout.ai/p/mastering-multi-agent-orchestration-architectures-patterns-roi-benchmarks-for-2025-2026)）：
- 72% 企業 AI 專案採用 Multi-Agent 架構（2024 年僅 23%）
- 四大通訊協議：MCP、ACP、A2A、ANP
- Hub-and-Spoke（Supervisor）仍是最常見生產模式

### 2.2 本專案適用模式：Supervisor + Specialist Workers

```
┌─────────────────────────────────────────────────────────┐
│                   Supervisor Agent                       │
│  意圖分析 → 複雜度判斷 → 策略選擇 → 任務分解 → 結果合併  │
├─────────────────────────────────────────────────────────┤
│                   Worker Agents                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ RAG      │ │ SQL      │ │ Knowledge│ │ Validation │ │
│  │ Agent    │ │ Agent    │ │ Agent    │ │ Agent      │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────┤
│                Infrastructure Layer                      │
│  Workers AI │ Vectorize │ D1 │ KV Cache │ Durable Objects│
└─────────────────────────────────────────────────────────┘
```

選擇理由：
- **Hub-and-Spoke** 可預測，除錯容易，符合 Cloudflare Workers 單一入口模型
- 避免 Mesh 的上下文汙染風險（差距分析提到的顧慮）
- Supervisor 可直接嵌入現有 `tool-selection` 步驟，漸進式升級

---

## 三、Agent 角色定義

### 3.1 Supervisor Agent（監督者）

**職責**：接收用戶查詢 → 分析意圖與複雜度 → 選擇執行策略 → 調度 Worker Agents → 合併結果

```typescript
interface SupervisorDecision {
  strategy: 'pipeline' | 'single-agent' | 'multi-agent' | 'plan-execute';
  complexity: 'simple' | 'moderate' | 'complex' | 'multi-entity';
  plan?: ExecutionPlan;       // plan-execute 策略時
  agents?: AgentTask[];       // multi-agent 策略時
  confidence: number;         // 0-1 策略選擇信心
}

interface ExecutionPlan {
  steps: PlanStep[];
  execution: 'parallel' | 'sequential' | 'dag';  // 步驟間的執行模式
}

interface PlanStep {
  id: number;
  query: string;              // 子查詢
  agent: AgentType;           // 指定 Worker Agent
  dependsOn?: number[];       // 依賴的前序步驟
  priority: 'required' | 'optional';  // 失敗是否阻塞
}
```

**策略選擇邏輯**：

| 查詢特徵 | 策略 | 範例 |
|---------|------|------|
| 單一事實 | `pipeline` | 「龍洞怎麼去？」 |
| 統計/列表 | `pipeline`（SQL 路徑） | 「龍洞有幾條 5.12？」 |
| 探索性單主題 | `single-agent`（ReAct） | 「推薦適合新手的龍洞路線」 |
| 多來源綜合 | `multi-agent` | 「比較龍洞和關子嶺的 5.10 路線」 |
| 可分解多步 | `plan-execute` | 「列出北部所有岩場的 5.12 路線，按評價排序，附交通資訊」 |
| 個人化推薦 | `multi-agent` | 「根據我的攀登紀錄，推薦下一個目標」 |

**與現有 tool-selection 的關係**：Supervisor Agent 是 `tool-selection` 步驟的升級版，增加了：
1. 策略選擇（不僅選工具，還選執行模式）
2. 任務分解能力（將查詢拆為子任務）
3. 信心分數（對應 `11-rag-improvement-tasks.md` E6 任務）

### 3.2 RAG Agent（語意檢索專家）

**職責**：負責向量搜尋 + BM25 混合檢索，封裝現有 Pipeline 的 embedding → hybrid-search → cross-encoder → mmr → popularity-rerank 路徑。

```typescript
interface RAGAgentInput {
  query: string;
  filters?: VectorFilter;        // 難度、岩場、類型過濾
  strategy: 'baseline' | 'agentic';
  maxResults: number;
  hydeEnabled: boolean;
  multiQueryEnabled: boolean;
}

interface RAGAgentOutput {
  documents: ScoredDocument[];
  sources: Source[];
  context: string;               // 組裝好的 context 文本
  retrievalScore: number;        // 檢索品質自評
  trace: RetrievalTrace;
}
```

**內部流程**（即現有 Pipeline retrieval 路徑）：
```
query → [HyDE] → [Multi-Query] → Embedding → Vector + BM25
  → RRF 融合 → Cross-Encoder → MMR → Popularity Rerank
  → [Agentic ReAct Loop（如啟用）]
```

**獨立價值**：可被 Supervisor 多次調用（不同子查詢），或與 SQL Agent 並行。

### 3.3 SQL Agent（結構化查詢專家）

**職責**：負責 D1 結構化資料查詢，封裝現有 `TextToSqlService` 的 17 個 SQL 模板。

```typescript
interface SQLAgentInput {
  query: string;
  intent: SQLIntent;             // count | list | info | distribution | personal
  template?: string;             // 指定 SQL 模板（可選）
  userId?: string;               // 個人查詢需要
  cragName?: string;
  grade?: string;
}

interface SQLAgentOutput {
  data: Record<string, unknown>[];  // SQL 查詢結果
  template: string;                  // 使用的模板
  rowCount: number;
  formattedAnswer?: string;          // LLM 組裝的自然語言回答
  needsClarification?: boolean;      // 是否需要用戶澄清
  clarificationOptions?: string[];   // 澄清選項
}
```

**增強能力**（超越現有 text-to-sql 步驟）：
- 多模板鏈式執行（先查統計再查明細）
- 動態 SQL 生成（突破固定模板限制，安全沙箱內）
- 結果後處理（排序、分組、格式化）

### 3.4 Knowledge Agent（通識知識專家）

**職責**：回答不需要檢索的攀岩通識問題，封裝現有 `general_knowledge` 路徑。

```typescript
interface KnowledgeAgentInput {
  query: string;
  topic: 'technique' | 'gear' | 'safety' | 'grading' | 'general';
  personalContext?: PersonalContext;  // 用戶等級、偏好
}

interface KnowledgeAgentOutput {
  answer: string;
  confidence: number;
  suggestedQuestions: string[];
}
```

**增強能力**：
- 主題專家化（裝備 vs 技巧 vs 安全的專屬知識）
- 用戶等級感知（新手 vs 進階者的回答深度不同）
- 引用外部攀岩資源（IFSC 官方資料、The Climbing Bible 等）

### 3.5 Validation Agent（驗證專家）

**職責**：驗證其他 Agent 的輸出品質，封裝現有 Judge + Self-Reflection 機制。

```typescript
interface ValidationAgentInput {
  query: string;
  answer: string;
  context: string;               // 回答基於的上下文
  sources: Source[];
  agentOrigin: AgentType;        // 哪個 Agent 生成的
}

interface ValidationAgentOutput {
  groundedness: number;          // 0-1 接地性
  quality: number;               // 1-4 品質
  factualErrors: string[];       // 發現的事實錯誤
  suggestions: string[];         // 改善建議
  verdict: 'pass' | 'regen' | 'reject';
  disclaimer?: string;           // 需附加的免責聲明
}
```

**增強能力**（超越現有 Judge）：
- **交叉驗證**：當有多 Agent 結果時，比對一致性
- **事實核查**：特定聲明（難度、首攀者、位置）可回查 D1 資料庫驗證
- **逐句歸因**（對應 `11-rag-improvement-tasks.md` D4）：標記每句的來源依據

### 3.6 Synthesis Agent（合成專家）

**職責**：合併多 Agent 結果為連貫回應，僅在 `multi-agent` 或 `plan-execute` 策略時啟用。

```typescript
interface SynthesisAgentInput {
  query: string;
  results: AgentResult[];        // 多個 Agent 的輸出
  plan?: ExecutionPlan;          // 原始計畫（plan-execute 時）
  personalContext?: PersonalContext;
}

interface SynthesisAgentOutput {
  answer: string;
  sources: Source[];             // 合併去重的來源
  suggestedQuestions: string[];
  conflictResolution?: string[];  // 矛盾資訊的處理說明
}
```

**核心能力**：
- 多來源結果去重與融合
- 矛盾資訊偵測與處理（不同 Agent 回傳衝突數據）
- 結構化回答組裝（統計數據 + 語意描述 + 個人化建議）
- 來源歸因合併

### 3.7 Memory Agent（記憶專家）

**職責**：管理用戶長期記憶與對話歷史，封裝現有 `memory-extractor` + `personalization`。

```typescript
interface MemoryAgentCapabilities {
  // 讀取
  getUserMemory(userId: string): Promise<MemorySummary>;
  getConversationContext(sessionId: string): Promise<Message[]>;
  getClimbingProfile(userId: string): Promise<ClimbingProfile>;

  // 寫入（異步）
  extractAndStoreMemory(query: string, answer: string): Promise<void>;
  updateClimbingPreferences(interaction: Interaction): Promise<void>;
}
```

**增強能力**（Durable Objects 持久化）：
- 跨對話記憶保持（不需每次從 DB 載入）
- 對話摘要壓縮（長對話自動摘要）
- 偏好趨勢追蹤（用戶長期興趣變化）

---

## 四、執行流程設計

### 4.1 Pipeline 快速路徑（保留現有）

適用：simple、sql、general-knowledge 查詢（佔比約 70%）

```
用戶查詢 → Supervisor（< 200ms）→ 判定 strategy='pipeline'
  → 現有 PipelineEngine.run()（14 步驟）
  → 回應（目標 < 2s）
```

**無額外延遲**，Supervisor 僅增加一次輕量 LLM 分類。

### 4.2 Single-Agent 路徑（現有 Agentic）

適用：complex 探索性查詢（佔比約 15%）

```
用戶查詢 → Supervisor → 判定 strategy='single-agent'
  → RAG Agent（Agentic ReAct Loop）
  → Validation Agent
  → 回應（目標 < 4s）
```

等同現有 `rag_strategy='agentic'`，但 Supervisor 增加了信心分數和 fallback 邏輯。

### 4.3 Multi-Agent 並行路徑

適用：多來源綜合查詢（佔比約 10%）

```
用戶查詢 → Supervisor → 判定 strategy='multi-agent'
  → 同時啟動：
    ├─ RAG Agent（語意搜尋）
    ├─ SQL Agent（結構化數據）
    └─ Memory Agent（個人化上下文）
  → 等待所有結果（Promise.all，各有 timeout）
  → Synthesis Agent（合併結果）
  → Validation Agent（品質檢查）
  → 回應（目標 < 5s）
```

**範例**：「比較龍洞和關子嶺的 5.10 路線」

```json
{
  "strategy": "multi-agent",
  "agents": [
    { "agent": "sql", "query": "龍洞的 5.10 路線數量和難度分佈", "priority": "required" },
    { "agent": "sql", "query": "關子嶺的 5.10 路線數量和難度分佈", "priority": "required" },
    { "agent": "rag", "query": "龍洞 5.10 路線推薦和特色", "priority": "required" },
    { "agent": "rag", "query": "關子嶺 5.10 路線推薦和特色", "priority": "required" },
    { "agent": "memory", "query": "用戶在這兩個岩場的攀登經驗", "priority": "optional" }
  ],
  "execution": "parallel"
}
```

### 4.4 Plan-and-Execute 路徑

適用：結構明確的多步查詢（佔比約 5%）

```
用戶查詢 → Supervisor → 判定 strategy='plan-execute'
  → Planning Phase（Gemma 12B，強模型）：
    ├─ 分析查詢維度
    ├─ 分解為 N 個子問題
    └─ 產生 ExecutionPlan（含依賴關係）
  → Execution Phase：
    ├─ 無依賴步驟 → Promise.all 並行
    └─ 有依賴步驟 → 等待前序完成
  → Synthesis Phase（Gemma 12B）：
    ├─ 合併所有子結果
    └─ 組裝連貫回答
  → Validation Agent
  → 回應（目標 < 6s）
```

**範例**：「列出北部所有岩場的 5.12 路線，按評價排序，附交通資訊」

```json
{
  "strategy": "plan-execute",
  "plan": {
    "steps": [
      { "id": 1, "query": "北部有哪些岩場", "agent": "sql", "template": "LIST_CRAGS_BY_REGION" },
      { "id": 2, "query": "各岩場的 5.12 路線", "agent": "sql", "dependsOn": [1], "template": "LIST_ROUTES_BY_CRITERIA" },
      { "id": 3, "query": "5.12 路線的評價和心得", "agent": "rag", "dependsOn": [2] },
      { "id": 4, "query": "各岩場的交通方式", "agent": "rag", "dependsOn": [1] }
    ],
    "execution": "dag"
  }
}
```

```
Step 1 ──→ Step 2 ──→ Step 3
    └──────────────→ Step 4 （與 Step 2/3 並行）
```

### 4.5 流程選擇決策樹

```
                        用戶查詢
                           │
                    Supervisor 分析
                           │
              ┌────────────┼────────────────┐
              │            │                │
         簡單/SQL      探索性 complex     多實體/多步
              │            │                │
         pipeline     single-agent    ┌─────┴─────┐
         （< 2s）      ReAct          │           │
                       （< 4s）    multi-agent  plan-execute
                                   （< 5s）     （< 6s）
```

---

## 五、Cloudflare 平台整合

### 5.1 技術選型

| 組件 | Cloudflare 服務 | 用途 |
|------|----------------|------|
| Agent 執行 | Workers | 無狀態 Agent（RAG、SQL、Knowledge、Validation、Synthesis） |
| 持久狀態 | Durable Objects | Supervisor Agent + Memory Agent（跨請求狀態） |
| Agent 通訊 | Service Bindings | Worker → Worker 直接呼叫（零網路延遲） |
| 多步工作流 | Workflows | Plan-and-Execute 的持久化步驟執行 |
| 向量搜尋 | Vectorize | RAG Agent 使用 |
| 結構化資料 | D1 | SQL Agent 使用 |
| 快取 | KV | 語意快取、Agent 結果快取 |
| AI 推理 | Workers AI | 所有 Agent 的 LLM 呼叫 |
| 檔案儲存 | R2 | 長期 Agent trace 和評估資料 |

### 5.2 Service Bindings 架構

```
┌─────────────────────────────────────────────────────────┐
│  API Worker（現有 backend/）                              │
│    POST /api/v1/ai/ask                                   │
│      ↓                                                   │
│  SupervisorAgent（Durable Object）                       │
│      ↓ Service Binding                                   │
│  ┌────────┐  ┌────────┐  ┌───────────┐  ┌────────────┐ │
│  │RAG     │  │SQL     │  │Knowledge  │  │Validation  │ │
│  │Worker  │  │Worker  │  │Worker     │  │Worker      │ │
│  └───┬────┘  └───┬────┘  └─────┬─────┘  └─────┬──────┘ │
│      │           │             │               │         │
│  Vectorize      D1           Workers AI     Workers AI   │
│  Workers AI                                              │
└─────────────────────────────────────────────────────────┘
```

**Service Bindings 優勢**：
- Agent 間呼叫**零網路延遲**（同一 Cloudflare 邊緣節點內部通訊）
- 無需序列化/反序列化 HTTP 請求
- 符合 Cloudflare Workers 架構模型

### 5.3 Durable Objects 用途

| Durable Object | 用途 | 狀態內容 |
|----------------|------|---------|
| `SupervisorDO` | 複雜查詢的 Supervisor 狀態 | 執行計畫、子任務進度、超時管理 |
| `ConversationDO` | 對話歷史持久化 | 訊息歷史、摘要、用戶偏好快照 |
| `MemoryDO` | 用戶記憶持久化 | 長期記憶、攀登偏好趨勢 |

**不使用 Durable Objects 的 Agent**：RAG、SQL、Knowledge、Validation、Synthesis — 這些是無狀態的，每次呼叫獨立，用普通 Workers 即可。

### 5.4 Workflows 整合（Plan-and-Execute）

Cloudflare Workflows 提供持久化步驟執行（[Durable AI Agent Guide](https://developers.cloudflare.com/workflows/get-started/durable-agents/)），適合 Plan-and-Execute 的多步工作流：

```typescript
// 概念範例
export class PlanExecuteWorkflow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent, step: WorkflowStep) {
    // Step 1: Planning
    const plan = await step.do('plan', async () => {
      return await this.env.SUPERVISOR.planQuery(event.payload.query);
    });

    // Step 2: Execute independent steps in parallel
    const independentSteps = plan.steps.filter(s => !s.dependsOn?.length);
    const results = await Promise.all(
      independentSteps.map(s =>
        step.do(`execute-${s.id}`, () => this.executeStep(s))
      )
    );

    // Step 3: Execute dependent steps
    const dependentSteps = plan.steps.filter(s => s.dependsOn?.length);
    for (const s of dependentSteps) {
      const depResults = s.dependsOn!.map(id => results.find(r => r.stepId === id));
      await step.do(`execute-${s.id}`, () => this.executeStep(s, depResults));
    }

    // Step 4: Synthesize
    const answer = await step.do('synthesize', async () => {
      return await this.env.SYNTHESIS_WORKER.synthesize(event.payload.query, results);
    });

    return answer;
  }
}
```

**Workflow 優勢**：自動重試、持久化中間結果、可從失敗步驟恢復。

---

## 六、與現有系統的整合策略

### 6.1 漸進式整合路線

**原則**：現有 PipelineEngine 不重寫，Multi-Agent 層包裹在外部。

```
現有：
  POST /ask → QueryService.ask() → PipelineEngine.run()

Phase 1（Supervisor 增強）：
  POST /ask → SupervisorAgent.route() →
    ├─ strategy='pipeline' → QueryService.ask()（不變）
    └─ strategy='single-agent' → QueryService.ask({ agentic: true })（不變）

Phase 2（Multi-Agent）：
  POST /ask → SupervisorAgent.route() →
    ├─ strategy='pipeline' → QueryService.ask()
    ├─ strategy='single-agent' → QueryService.ask({ agentic: true })
    └─ strategy='multi-agent' → MultiAgentOrchestrator.execute()
         ├─ RAG Worker（封裝 Pipeline 的 retrieval 路徑）
         ├─ SQL Worker（封裝 TextToSqlService）
         └─ Synthesis Worker（新）

Phase 3（Plan-and-Execute + Persistent）：
  POST /ask → SupervisorAgent.route() →
    ├─ ... 同上 ...
    └─ strategy='plan-execute' → PlanExecuteWorkflow.run()
```

### 6.2 現有程式碼復用

| 現有模組 | Multi-Agent 角色 | 復用方式 |
|---------|-----------------|---------|
| `PipelineEngine` + 14 步驟 | RAG Agent 內部 | 直接呼叫，作為 RAG Agent 的實作 |
| `TextToSqlService` | SQL Agent 內部 | 直接呼叫，新增多模板鏈式執行 |
| `parseQueryWithLLM()` | Supervisor Agent | 升級為策略選擇（加信心分數 + 任務分解） |
| `agenticRetrieve()` | RAG Agent 的 agentic 模式 | 不變 |
| `runJudge()` | Validation Agent | 升級為交叉驗證 + 事實核查 |
| `memory-extractor` | Memory Agent | 遷移至 Durable Object |
| `buildPersonalizedSystemPrompt()` | Memory Agent 輸出 | 不變 |
| Guardrails | 所有 Agent 的前後置檢查 | 不變，作為共享 middleware |
| Quota 系統 | Supervisor Agent 統一管理 | 不變，Multi-Agent 查詢扣 1 次配額 |

### 6.3 API 相容性

**完全向後相容**：

```typescript
// 現有 API 不變
POST /api/v1/ai/ask
{
  "question": "...",
  "stream": true
}

// 回應增加 agent 資訊（可選）
{
  "answer": "...",
  "sources": [...],
  "suggestedQuestions": [...],
  "agentTrace": {              // 新增，僅 multi-agent 時
    "strategy": "multi-agent",
    "agents": [
      { "type": "rag", "latency_ms": 1200, "tokens": 500 },
      { "type": "sql", "latency_ms": 300, "tokens": 100 }
    ],
    "synthesis_latency_ms": 800
  }
}
```

### 6.4 SSE 串流整合

Multi-Agent 路徑的串流策略：

| 策略 | 串流方式 |
|------|---------|
| `pipeline` | 現有 SSE 不變 |
| `single-agent` | 現有 SSE 不變 |
| `multi-agent` | Synthesis Agent 輸出串流；等待並行 Agent 完成期間發送 `thinking` 事件 |
| `plan-execute` | 每個步驟完成時發送 `step_complete` 事件；最終合成串流 |

```
// multi-agent SSE 事件流
event: thinking
data: {"message": "正在搜尋龍洞路線資料..."}

event: thinking
data: {"message": "正在查詢結構化數據..."}

event: step_complete
data: {"agent": "sql", "summary": "找到 12 條 5.10 路線"}

event: token
data: {"token": "根據"}

event: token
data: {"token": "搜尋"}
...

event: done
data: {"sources": [...], "agentTrace": {...}}
```

---

## 七、Prompt 設計

### 7.1 Supervisor Prompt

```
你是 NobodyClimb 攀岩助手的 Supervisor Agent。分析用戶查詢，決定最佳執行策略。

## 策略選擇

1. **pipeline**：單一事實查詢、簡單統計、通識問題
2. **single-agent**：需要探索性搜尋的 complex 查詢
3. **multi-agent**：需要多個來源的綜合查詢（比較、多維度分析）
4. **plan-execute**：可分解為有依賴關係的多步子任務

## 可用 Agent

- **rag**：語意搜尋（路線推薦、心得、特色描述）
- **sql**：結構化查詢（統計、列表、難度分佈、個人紀錄）
- **knowledge**：通識知識（裝備、技巧、安全、分級系統）
- **memory**：個人化上下文（用戶偏好、攀登歷史）

## 輸出格式

```json
{
  "strategy": "multi-agent",
  "confidence": 0.85,
  "reasoning": "用戶要比較兩個岩場，需要同時查詢結構化數據和語意描述",
  "tasks": [
    { "agent": "sql", "query": "...", "priority": "required" },
    { "agent": "rag", "query": "...", "priority": "required" }
  ]
}
```
```

### 7.2 Synthesis Prompt

```
你是結果合成專家。將多個 Agent 的查詢結果合併為連貫、完整的繁體中文回答。

## 規則

1. 統計數據優先使用 SQL Agent 的精確結果
2. 描述性內容使用 RAG Agent 的語意搜尋結果
3. 個人化建議基於 Memory Agent 的用戶上下文
4. 遇到矛盾資訊，明確標注差異並說明原因
5. 保留所有來源引用，合併去重
6. 回答使用繁體中文，使用 Markdown 格式
7. 在回答結尾附上建議追問問題

## Agent 結果

{agent_results}

## 用戶原始問題

{original_query}
```

---

## 八、Token 與成本分析

### 8.1 各策略 Token 消耗預估

| 策略 | LLM 呼叫次數 | 預估 Token | 相對成本 |
|------|-------------|-----------|---------|
| `pipeline`（simple） | 1-2（tool-selection + generation） | 800-1,500 | 1x |
| `pipeline`（complex） | 3-5（+ HyDE + Multi-Query + Judge） | 2,000-4,000 | 2-3x |
| `single-agent`（ReAct） | 4-7（+ agentic decisions） | 3,000-5,000 | 3-4x |
| `multi-agent` | 5-8（supervisor + 2-3 agents + synthesis + validation） | 4,000-7,000 | 4-6x |
| `plan-execute` | 6-10（planning + N steps + synthesis + validation） | 5,000-10,000 | 5-8x |

### 8.2 Cloudflare Workers AI 成本模型

Workers AI 採用 **Neurons 計費**（非 per-token），Workers Paid Plan 包含 10,000 neurons/day：

| 模型 | 每 1K token 約 Neurons |
|------|----------------------|
| Gemma 3 12B（主模型） | ~40 neurons |
| Llama 3.1 8B（輕量模型） | ~25 neurons |
| BGE-M3（embedding） | ~5 neurons |
| BGE-Reranker（reranking） | ~10 neurons |

**Multi-Agent 額外成本**：Supervisor 分類（~25 neurons）+ Synthesis 合併（~40 neurons）≈ 每次 multi-agent 查詢多 65 neurons。

**關鍵優勢**：Workers AI 沒有 per-token 計費上限，固定月費（$5/月起），Multi-Agent 的多次 LLM 呼叫成本增幅遠低於使用 OpenAI/Anthropic API 的系統。

### 8.3 配額影響

Multi-Agent 查詢消耗更多 token，需調整配額策略：

| 策略 | 配額扣除 | Token 預估 |
|------|---------|-----------|
| `pipeline` | 1 次 | 原有邏輯 |
| `single-agent` | 1 次 | 原有邏輯 |
| `multi-agent` | 1 次（對用戶） | token 上限提高至 2x |
| `plan-execute` | 2 次（對用戶） | token 上限提高至 3x |

---

## 九、可觀測性與追蹤

### 9.1 Agent Trace 結構

```typescript
interface MultiAgentTrace {
  requestId: string;
  strategy: Strategy;
  supervisorDecision: {
    confidence: number;
    reasoning: string;
    latency_ms: number;
    tokens: StageTokenUsage;
  };
  agentExecutions: AgentExecution[];
  synthesis?: {
    latency_ms: number;
    tokens: StageTokenUsage;
    conflictsDetected: number;
  };
  validation?: {
    groundedness: number;
    quality: number;
    verdict: string;
  };
  totalLatency_ms: number;
  totalTokens: number;
  pipelineFallback: boolean;    // 是否降級回 pipeline
}

interface AgentExecution {
  agent: AgentType;
  query: string;
  latency_ms: number;
  tokens: StageTokenUsage;
  status: 'success' | 'timeout' | 'error';
  resultSummary: string;        // 結果摘要（用於 debug）
}
```

### 9.2 Admin Dashboard 擴充

| 指標 | 說明 |
|------|------|
| 策略分佈 | pipeline / single-agent / multi-agent / plan-execute 佔比 |
| 策略成功率 | 各策略的 groundedness 和 quality 平均值 |
| Agent 延遲分佈 | 各 Agent 的 P50/P95/P99 |
| Fallback 率 | Multi-Agent 降級回 Pipeline 的比例 |
| Token 效率 | 各策略的 tokens-per-quality-point 比值 |

---

## 十、容錯與降級策略

### 10.1 超時機制

| 層級 | 超時 | 降級行為 |
|------|------|---------|
| 整體請求 | 25s（Workers 硬限 30s） | 回傳已完成 Agent 的部分結果 |
| Supervisor 決策 | 3s | 降級為 `pipeline` 策略 |
| 單一 Agent | 8s | 跳過該 Agent，使用其他結果 |
| Synthesis | 5s | 直接拼接各 Agent 結果（不合併） |
| Validation | 3s | 跳過驗證，加上「未驗證」標記 |

### 10.2 降級策略

```
Multi-Agent 失敗 → 降級為 Single-Agent ReAct
  → 仍失敗 → 降級為 Pipeline Baseline
    → 仍失敗 → 回傳「系統忙碌」+ 退還配額
```

**每層降級都記錄到 trace**，用於後續分析瓶頸。

### 10.3 Circuit Breaker 整合

配合 `11-rag-improvement-tasks.md` C4（熔斷器）：

```
Workers AI 連續 5 次失敗 → Circuit Breaker Open
  → Supervisor 自動路由所有查詢到 pipeline（sql 優先）
  → 每 30s 探測一次 Workers AI
  → 恢復後自動切回正常路由
```

---

## 十一、實作路線圖

### Phase 1：Supervisor Agent 增強（2-3 天）

**目標**：在現有 `tool-selection` 基礎上增加策略選擇和信心分數。

**涵蓋改善任務**：
- E6：Tool Selection 信心分數
- D2：檢索必要性預判
- E8：工具選錯自動修正（基礎版）

**實作**：
1. 修改 `TOOL_SELECTION_PROMPT` → 輸出 `strategy` + `confidence`
2. `parseQueryWithLLM()` 回傳 `SupervisorDecision`
3. 低信心（< 0.5）→ fallback 到 general_knowledge
4. 中信心（0.5-0.8）→ 使用選中工具 + 啟用 fallback 監控
5. 高信心（>= 0.8）→ 直接使用
6. 記錄 confidence 到 `pipelineTrace`

**交付物**：
- 更新 `tool-selection.ts`
- 更新 `TOOL_SELECTION_PROMPT`
- 更新 `pipelineTrace` 結構
- Admin Dashboard 新增策略分佈圖表

### Phase 2：Multi-Agent 並行執行（3-5 天）

**目標**：實作 `multi-agent` 策略，支援多 Agent 並行查詢 + 結果合併。

**涵蓋改善任務**：
- E7：多工具組合選擇
- F3：Synthesis 合併（部分）

**實作**：
1. 新建 `backend/src/services/agents/` 目錄
2. 建立 Agent 介面和 Registry
3. 封裝 RAG Agent（呼叫現有 Pipeline retrieval 路徑）
4. 封裝 SQL Agent（呼叫現有 TextToSqlService）
5. 新建 Synthesis Agent
6. Supervisor 增加 `multi-agent` 策略路由
7. `Promise.all` + 個別 timeout 並行執行
8. SSE 串流 `thinking` 事件

**交付物**：
- `backend/src/services/agents/types.ts`（Agent 介面）
- `backend/src/services/agents/rag-agent.ts`
- `backend/src/services/agents/sql-agent.ts`
- `backend/src/services/agents/synthesis-agent.ts`
- `backend/src/services/agents/orchestrator.ts`
- 更新 `query.ts` 增加 multi-agent 路徑
- 更新 SSE 事件格式

### Phase 3：Plan-and-Execute（3-5 天）

**目標**：實作 `plan-execute` 策略，支援複雜查詢的任務分解和 DAG 執行。

**涵蓋改善任務**：
- F1：Planning 階段實作
- F2：Execution 階段實作
- F3：Synthesis 合併

**前置條件**：Phase 2 完成

**實作**：
1. Supervisor 增加 Planning 能力（任務分解 + 依賴分析）
2. DAG 執行引擎（拓撲排序 + 並行/循序混合）
3. 步驟結果暫存 + 跨步驟引用
4. 整合 Synthesis Agent
5. 超時降級（部分步驟失敗不阻塞）

**交付物**：
- `backend/src/services/agents/planner.ts`
- `backend/src/services/agents/dag-executor.ts`
- 更新 Supervisor prompt（Planning 指令）

### Phase 4：Validation Agent 增強（2-3 天）

**目標**：升級現有 Judge 為完整的 Validation Agent，支援交叉驗證和事實核查。

**涵蓋改善任務**：
- D4：逐句 Grounding 歸因（基礎版）
- E8：工具選錯自動修正（完整版）

**實作**：
1. 多 Agent 結果交叉比對
2. 事實聲明回查 D1 驗證（難度、首攀、位置等結構化事實）
3. 逐句來源標記（supported / inferred / unsupported）
4. 工具選錯偵測（結果品質低 → 建議 Supervisor 切換策略）

### Phase 5：Persistent Agent State（3-5 天）

**目標**：利用 Durable Objects 實現持久化 Agent 狀態。

**前置條件**：Phase 2-3 完成，驗證 Multi-Agent 的價值

**實作**：
1. `SupervisorDO`：複雜查詢的執行狀態持久化
2. `ConversationDO`：對話歷史管理（替代 KV 方案）
3. `MemoryDO`：用戶記憶持久化（替代每次 DB 查詢）
4. Service Bindings 配置
5. Workflow 整合（Plan-and-Execute 持久化）

---

## 十二、與改善任務的映射

`11-rag-improvement-tasks.md` 中的任務如何由 Multi-Agent 架構涵蓋：

| 任務 | Multi-Agent 涵蓋方式 | 建議處理 |
|------|---------------------|---------|
| **E6** Tool Selection 信心分數 | Phase 1 Supervisor 直接實作 | 合併 |
| **D2** 檢索必要性預判 | Phase 1 Supervisor confidence 涵蓋 | 合併 |
| **E7** 多工具組合選擇 | Phase 2 Multi-Agent 並行取代 | 合併 |
| **E8** 工具選錯自動修正 | Phase 1（基礎）+ Phase 4（完整） | 合併 |
| **F1** Planning 階段 | Phase 3 Plan-and-Execute | 合併 |
| **F2** Execution 階段 | Phase 3 DAG Executor | 合併 |
| **F3** Synthesis 合併 | Phase 2 Synthesis Agent | 合併 |
| **D4** 逐句歸因 | Phase 4 Validation Agent | 合併 |
| **E1** 工具註冊機制 | Phase 2 Agent Registry | 合併 |
| **E3** 動態 Prompt 生成 | Phase 2 Agent 自帶 prompt | 合併 |
| **E4** Agentic 動作擴充 | Phase 2 multi-agent 策略取代 SWITCH_TOOL 需求 | 合併 |
| **C1-C4** 超時/熔斷 | 全 Phase 超時降級 + Circuit Breaker | 獨立實作，Multi-Agent 整合 |
| **A1-A7** 語意快取 | 不變，Pipeline 快速路徑使用 | 獨立實作 |
| **B1-B5** 黃金測試集 | 不變，測試各策略品質 | 獨立實作（高優先度） |

---

## 十三、風險與緩解

| 風險 | 影響 | 緩解策略 |
|------|------|---------|
| **延遲增加** | Multi-Agent 比 Pipeline 慢 2-3 倍 | 70% 查詢走 Pipeline 快速路徑；`thinking` 事件改善感知延遲 |
| **Token 消耗增加** | 多次 LLM 呼叫 | Workers AI 固定費用模型；輕量模型用於 Supervisor/決策 |
| **上下文汙染** | Agent 間傳遞錯誤資訊 | Supervisor 統一管理上下文；Validation Agent 交叉驗證 |
| **除錯複雜度** | 多 Agent 追蹤困難 | 結構化 Agent Trace；每次呼叫有 requestId 串聯 |
| **Workers 記憶體限制** | 128MB per Worker | 各 Agent 獨立 Worker，分散記憶體壓力 |
| **Cloudflare 並行限制** | Workers 有並行子請求上限（50） | Multi-Agent 最多 5-6 並行，遠低於上限 |
| **過度工程** | 攀岩領域查詢多為簡單/中等 | Phase 1 先驗證 Supervisor 價值；查詢複雜度統計先行 |

### 前置驗證（在 Phase 1 前執行）

**必須先回答的問題**：
1. `ai_query_logs` 中 `queryType='complex'` 的佔比是多少？
2. 需要多來源的查詢（比較、多維度）實際佔比？
3. 現有 Pipeline 對 complex 查詢的 groundedness 和 quality 分佈？

**如果 complex 查詢佔比 < 15%**，Multi-Agent 的 ROI 可能不足，建議先專注 Phase 1（Supervisor 增強）和獨立改善任務（A、B、C 系列）。

---

## 十四、參考資源

- [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare Workflows - Durable Agents](https://developers.cloudflare.com/workflows/get-started/durable-agents/)
- [Multi-Agent Supervisor Architecture - Databricks](https://www.databricks.com/blog/multi-agent-supervisor-architecture-orchestrating-enterprise-ai-scale)
- [Multi-Agent AI Orchestration: Enterprise Strategy 2025-2026](https://www.onabout.ai/p/mastering-multi-agent-orchestration-architectures-patterns-roi-benchmarks-for-2025-2026)
- [Agentic AI Design Patterns 2026 Edition](https://medium.com/@dewasheesh.rana/agentic-ai-design-patterns-2026-ed-e3a5125162c5)
- [Build Scalable Multi Agent RAG with A2A Protocol](https://blogs.oracle.com/developers/build-a-scalable-multi-agent-rag-system-with-a2a-protocol-and-langchain)
- [Building Production RAG Systems in 2026](https://brlikhon.engineer/blog/building-production-rag-systems-in-2026-complete-architecture-guide)
- [The Ultimate RAG Blueprint 2025/2026](https://langwatch.ai/blog/the-ultimate-rag-blueprint-everything-you-need-to-know-about-rag-in-2025-2026)
- [Architecting Agentic Systems at the Edge - Cloudflare Analysis](https://dev.to/onepoint/architecting-agentic-systems-at-the-edge-a-technical-strategic-analysis-of-the-cloudflare-3761)
- [AI Agent Architecture: Build Systems That Work in 2026 - Redis](https://redis.io/blog/ai-agent-architecture/)
