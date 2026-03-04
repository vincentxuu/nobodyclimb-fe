## Context

NobodyClimb 是基於 Cloudflare Workers 的攀岩社群平台，後端使用 Hono 框架 + D1 資料庫，前端使用 Next.js 15。現有資料包含 946 條路線、5 個岩場、9,582 支影片。

本設計需要在現有架構上新增 RAG 問答系統，使用 Cloudflare 原生 AI 服務（Workers AI、Vectorize），避免引入外部依賴。

**現有技術棧**：
- Backend: Hono + Cloudflare Workers + D1 + KV + R2
- Frontend: Next.js 15 + React 19 + TanStack Query + Radix UI
- Auth: JWT (jose library)

**約束條件**：
- 必須使用 Cloudflare 服務（成本控制、架構統一）
- 需支援繁體中文語義搜尋
- 免費額度內運行（MVP 階段）

## Goals / Non-Goals

**Goals:**
- 提供自然語言路線搜尋能力
- 實現 RAG 問答系統，回答有來源依據
- 建立可擴展的 AI 服務架構
- 提供 Admin 管理介面監控 AI 使用

**Non-Goals:**
- 多輪對話記憶（MVP 不實作）
- 用戶攀爬歷史分析（需用戶資料累積）
- 語音介面
- Fine-tuning 自有模型
- 即時資料同步（採用批次索引）

## Decisions

### D1: Embedding 模型選擇

**決策**：使用 `@cf/baai/bge-m3`（1024 維）

**替代方案**：
| 模型 | 維度 | 語言支援 | 評估 |
|------|------|---------|------|
| bge-base-en-v1.5 | 768 | 英文為主 | ❌ 中文效果差 |
| bge-m3 | 1024 | 多語言 | ✅ 繁中效果佳 |
| bge-large-en-v1.5 | 1024 | 英文為主 | ❌ 中文效果差 |

**理由**：
- 路線名稱多為中文（黃色乖乖、烏龜石等）
- BGE-M3 專為多語言設計，繁中 embedding 品質優於英文模型
- 1024 維提供足夠的語義區分度

### D2: LLM 模型選擇

**決策**：使用 `@cf/google/gemma-3-12b-it`

**替代方案**：
| 模型 | 參數 | 速度 | 品質 |
|------|------|------|------|
| llama-3.2-3b-instruct | 3B | 快 | 中 |
| llama-3.1-8b-instruct | 8B | 中 | 佳 |
| gemma-3-12b-it | 12B | 中 | 優 |
| llama-3.1-70b-instruct | 70B | 慢 | 最優 |

**理由**：
- Gemma 3 12B 在繁體中文理解與指令遵循上優於 Llama 8B
- Google 訓練，instruction-tuned 版本（`-it`），回答格式更穩定
- Neurons 消耗略高於 8B，仍在免費額度內可運行

### D3: 向量儲存架構

**決策**：Vectorize（向量）+ D1（原文）雙儲存

```
文件 → Embedding → Vectorize (向量 + metadata)
     ↘
       D1 ai_documents (完整原文)
```

**替代方案**：
1. 純 Vectorize（向量 + 原文都存 metadata）
   - ❌ Metadata 大小限制 10KB/向量
   - ❌ 長文件會被截斷

2. 純 D1（不用向量庫）
   - ❌ 無法做語義搜尋
   - ❌ 只能關鍵字匹配

**理由**：
- Vectorize 存向量 + 輕量 metadata（用於過濾）
- D1 存完整原文（用於 LLM context）
- 查詢流程：向量搜尋 → 取得 ID → 查 D1 取原文

### D4: 文件切分策略

**決策**：一筆路線/岩場 = 一個文件（不切分）

**替代方案**：
1. 固定長度切分（如 500 tokens）
   - ❌ 可能切斷重要資訊
   - ❌ 增加索引複雜度

2. 不切分（每筆資料一個文件）
   - ✅ 路線描述通常 < 500 tokens
   - ✅ 保持資訊完整性
   - ✅ 簡化實作

**理由**：
- 現有路線資料結構良好，每筆描述約 100-300 字
- 不需要複雜的 chunking 邏輯
- 未來如需處理長文（如文章），再引入切分策略

### D5: 難度數值化對照

**決策**：YDS 等級轉數值，用於範圍過濾

```typescript
// 5.10a → 100, 5.10b → 101, ..., 5.14d → 143
function gradeToNumeric(grade: string): number {
  const match = grade.match(/5\.(\d+)([a-d])?/);
  if (!match) return 0;
  const base = parseInt(match[1], 10) * 10;
  const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0;
  return base + suffix;
}
```

**理由**：
- Vectorize metadata 支援數值範圍查詢
- 可實現「5.10 到 5.11 之間的路線」過濾
- 保留原始等級字串供顯示

### D6: 快取策略

**決策**：使用 KV 快取查詢結果，TTL 1 小時

```typescript
const cacheKey = `ai:ask:${hash(query)}`;
const cached = await env.CACHE.get(cacheKey);
if (cached) return JSON.parse(cached);

// 執行查詢...
await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 3600 });
```

**理由**：
- 相同問題不需重複呼叫 LLM
- 減少 Neurons 消耗
- 1 小時 TTL 平衡新鮮度與效能

### D7: API 認證策略

**決策**：
- `/ask`、`/search`、`/feedback`：公開（無需登入）
- `/index`：需 Admin 權限
- `/health`：公開

**理由**：
- 降低使用門檻，讓未登入用戶也能體驗 AI 功能
- 索引操作需保護，避免濫用
- 透過 Rate Limiting 防止 DoS

### D8: 前端元件架構

**決策**：獨立 ChatWidget 元件，透過 AdminChatWidget 包裝後掛載於 RootLayout；以環境變數 `NEXT_PUBLIC_ENABLE_AI_CHAT` 控制整體開關

```
RootLayout
├── {children}
└── <AdminChatWidget />  ← 固定右下角（需 NEXT_PUBLIC_ENABLE_AI_CHAT=true）
      └── 檢查 user.role === 'admin'
            └── <ChatWidget />  ← 實際浮動元件
```

**替代方案**：
1. 獨立頁面 `/ai-chat`
   - ❌ 打斷用戶瀏覽流程
   - ❌ 無法在瀏覽路線時即時提問

2. 嵌入式元件
   - ❌ 需要各頁面手動放置
   - ❌ 狀態管理複雜

3. 直接掛載 ChatWidget 給所有用戶
   - ❌ MVP 階段尚未驗證回答品質，公開前需管理員內測

**理由**：
- 浮動式設計（createPortal 掛載至 document.body），不影響現有頁面佈局
- AdminChatWidget 薄包裝：等待 auth 初始化完成後，僅 admin 可見
- 使用 CSS transition（`transition-all`）提供流暢動畫，無需額外依賴
- `NEXT_PUBLIC_ENABLE_AI_CHAT` 環境變數作為上層開關，MVP 測試完成後轉為公開

**實作細節**：
- `ChatWidget.tsx`：使用 `textarea`（支援多行、IME 防抖）取代單行 input
- 桌面版視窗：400px 寬 × 600px 高（行動版全螢幕）
- 建議按鈕點擊：直接送出（不僅填入輸入欄）

### D9: RAG 查詢流程

**決策**：標準 RAG Pipeline

```
1. 使用者輸入 query
2. NLP 自動過濾偵測（extractGradeFilter、extractLocationFilter、extractTypeFilter）
3. Query → Embedding（BGE-M3）
4. Vectorize 向量搜尋（Top-5 + 偵測到的 metadata 過濾）
5. 過濾低分結果（score < 0.5）
6. 取得 document IDs → 從 D1 取得完整原文
7. 組合 System Prompt + Context + Query
8. LLM 生成回答（Gemma 3 12B）
9. 回傳 answer + sources
10. 記錄查詢日誌
11. 快取結果（KV，TTL 1 小時）
```

**理由**：
- 業界標準做法，成熟可靠
- 分離檢索與生成，便於調優
- 來源可追溯，提高回答可信度

### D10: Admin Dashboard 實作順序

**決策**：分 Phase 實作

| Phase | 功能 | 優先級 |
|-------|------|--------|
| 1 | Dashboard KPIs + 查詢日誌 | MVP |
| 2 | 知識庫管理 + 索引觸發 | 必要 |
| 3 | Prompt 版本管理 | 進階 |
| 4 | 工具管理 + A/B 測試 | 未來 |

**理由**：
- MVP 聚焦核心功能
- 可觀測性優先（需要知道系統運作狀況）
- 進階功能待驗證需求後實作

## Risks / Trade-offs

### R1: LLM 回答品質不穩定

**風險**：Gemma 3 12B 可能生成不準確或幻覺內容

**緩解措施**：
- System Prompt 明確要求「只根據提供資料回答」
- 回傳來源連結讓用戶驗證
- 收集回饋評分，低分查詢人工審查
- 提示「如資料不足請告知」

### R2: 向量搜尋結果不相關

**風險**：語義搜尋可能回傳不相關結果

**緩解措施**：
- 設定最低相似度門檻（score > 0.5）
- 結合 metadata 過濾（難度、岩場）
- 使用者回饋持續改善

### R3: 索引資料過時

**風險**：新增/修改路線未及時更新向量索引

**緩解措施**：
- 提供手動重建索引功能
- Admin Dashboard 顯示最後索引時間
- 未來可加入自動增量索引

### R4: 免費額度超出

**風險**：使用量超過 Cloudflare 免費額度

**緩解措施**：
- Dashboard 顯示 Neurons 使用量
- 設定 Rate Limiting（100 req/min）
- KV 快取減少重複請求
- 監控告警機制

### R5: 繁中分詞效果

**風險**：BGE-M3 對特定攀岩術語（如路線名）理解不佳

**緩解措施**：
- 文件模板包含多個欄位（名稱、等級、描述）
- 不完全依賴單一欄位搜尋
- 收集 case 持續優化模板

## Migration Plan

### 部署步驟

1. **基礎設施準備**（可回滾）
   - 在 Cloudflare Dashboard 建立 Vectorize 索引
   - 建立 AI Gateway（可選）
   - 更新 wrangler.toml

2. **資料庫 Migration**（可回滾）
   - 部署 `0046_create_ai_tables.sql`
   - 新增表格不影響現有功能

3. **後端部署**（可回滾）
   - 部署 AI 相關路由
   - 新路由不影響現有 API

4. **資料索引**（可重複執行）
   - 執行路線/岩場索引
   - 驗證向量數量

5. **前端部署**
   - 部署 AdminChatWidget（管理員限定）
   - 透過 `NEXT_PUBLIC_ENABLE_AI_CHAT=true` 開啟，預設關閉

### 回滾策略

- **後端**：移除 AI 路由，保留資料表
- **前端**：Feature flag 關閉 ChatWidget
- **Vectorize**：可保留索引，不影響其他功能

## Open Questions

1. **影片資料是否納入 MVP？**
   - 影片有 9,582 筆，索引量大
   - 建議 MVP 先做路線/岩場，影片後續加入

2. **Rate Limiting 具體數值？**
   - 建議：100 req/min/IP（公開端點）
   - 需觀察實際使用模式調整

3. **ChatWidget 何時啟用？** ✅ 已決定
   - MVP 階段以 AdminChatWidget 限定管理員使用（`NEXT_PUBLIC_ENABLE_AI_CHAT=true`）
   - 內部測試通過後，改為開放所有用戶（移除 AdminChatWidget 包裝）
