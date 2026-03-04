## Context

用戶目前只能主動在 ChatWidget 提問才能獲得 AI 協助。Phase 7.1.2 要在「完攀後」自動觸發推薦，讓 AI 功能從被動問答進化為主動協助。

現有基礎：
- `QueryService.ask()` 是完整的 RAG pipeline（HyDE + RRF + Reranker + MMR），可直接複用
- `backend/src/routes/ascents.ts` 的 `POST /ascents` 已有完整的完攀記錄邏輯
- 配額機制在 `ai.ts` 路由層透過原子 SQL UPDATE 扣除
- Cloudflare Workers 支援 `ctx.waitUntil()` 執行背景任務（不阻塞回應）

## Goals / Non-Goals

**Goals:**
- 完攀後自動（系統）觸發 AI 路線推薦，不阻塞完攀 API 回應
- 系統觸發不消耗用戶配額；手動重新推薦消耗配額
- 推薦結果持久化，保留完整歷史（不覆蓋）
- 個人頁面「推薦」Tab 顯示歷史推薦
- 完攀確認頁 inline 顯示最新推薦卡片

**Non-Goals:**
- 不實作 streaming 推薦（本 phase 推薦為一次性生成）
- 不做推薦結果的再排序或 A/B testing
- 不依賴 Phase 5.2.1（用戶攀岩紀錄 context），先以 query 帶入近期完攀資訊
- 不提供推薦 feedback（不增加評分介面）

## Decisions

### 決策 1：完攀觸發用 `ctx.waitUntil()` 非同步執行

**選擇**：在 `POST /ascents` 成功寫入 DB 後，用 `c.executionCtx.waitUntil(generateRecommendation(...))` 非同步觸發推薦生成，不等待結果。

**理由**：推薦生成需呼叫 LLM（約 3-8 秒），不可阻塞完攀 API 回應（用戶體驗）。`waitUntil` 讓 Worker 在回應發送後繼續執行，是 Cloudflare 官方推薦的背景任務模式。

**替代方案**：使用 Cloudflare Queue 解耦 → 複雜度高，目前 scale 不需要。

---

### 決策 2：複用 `QueryService.ask()` 而非新建推薦 pipeline

**選擇**：`RecommendationService` 根據用戶近期 5 條完攀紀錄自動構建查詢字串，呼叫 `QueryService.ask()`。

**查詢構建規則**：
```
有紀錄時（取最近 5 條，以難度排序）：
  "我最近完攀了：{路線1名稱}（{難度}，{岩場}）、{路線2名稱}（{難度}）...
   請推薦 3 條適合我下一步挑戰的路線，難度可以稍高一級。"

無紀錄時（新用戶）：
  "我是攀岩新手，請推薦幾條適合初學者的路線。"
```

**理由**：現有 RAG pipeline 已包含 HyDE、Reranker、MMR 等高品質機制，重複實作是浪費。構建查詢的邏輯簡單，維護成本低。

**替代方案**：直接呼叫 `QueryService.search()` 跳過 LLM → 無法生成自然語言推薦理由，用戶體驗差。

---

### 決策 3：推薦端點整合至現有 `ai.ts`，複用配額中介層

**選擇**：不建立獨立的 `ai-recommendations.ts` 路由檔。在現有 `backend/src/routes/ai.ts` 中新增 `POST /recommendations` 與 `GET /recommendations` 子路由，直接複用同檔案已有的原子配額扣除邏輯。系統觸發則由 `RecommendationService` 直接呼叫 `QueryService.ask()`，不經路由層。

**理由**：避免重複實作配額扣除（原子 SQL UPDATE）；現有 `ai.ts` 的配額邏輯是局部函數，不是中介層，直接在同檔案複用比跨檔 import 更簡潔。路由掛載點 `/api/v1/ai/*` 維持一致。

**替代方案**：建立獨立 `ai-recommendations.ts` + 在 `index.ts` 掛載 → 需要跨檔複製配額邏輯，違反 DRY。

---

### 決策 4：推薦結果完整儲存為 JSON，統一 interface

**選擇**：`user_recommendations.recommendation` 欄位存完整 JSON，結構定義如下：

```typescript
interface RecommendationPayload {
  answer: string;           // LLM 生成的推薦文字
  sources: AISource[];      // RAG 取回的來源（路線/岩場），複用現有 AISource 型別
  query: string;            // 傳入 LLM 的原始查詢字串
  context_ascents: Array<{ // 產生推薦時使用的完攀紀錄 context
    route_name: string;
    grade: string;
    crag_name: string;
  }>;
}
```

前端讀取 `sources` 直接傳入 `SourceCard` 元件，`answer` 顯示為推薦說明文字，`context_ascents` 可顯示「根據你的 N 條完攀紀錄推薦」。

**理由**：統一 interface 確保前後端對接無歧義；`AISource` 複用現有型別，不增加新型別負擔。

---

### 決策 5：個人頁面 Tab 顯示最新一筆，歷史可捲動

**選擇**：`GET /api/v1/ai/recommendations?limit=10&offset=0` 分頁取得歷史，Tab 預設顯示最新一筆，底部有「載入更多」。

**理由**：用戶最關心最新推薦，歷史紀錄是次要功能。分頁比一次全載更節省流量。

## Risks / Trade-offs

- **`waitUntil` 失敗無通知** → 推薦生成失敗時用戶不會收到錯誤（靜默失敗）。緩解一：在 `user_recommendations` 插入 `status: 'failed'` 記錄供 Admin 監控。緩解二：最外層 catch 加 `console.error('[RecommendationService]', error)` 作為兜底（Cloudflare Workers 的 `wrangler tail` 可觀測），確保 DB 寫入失敗時至少有 log 可查。

- **LLM 生成品質不穩定** → 推薦可能不準確或無法解析。緩解：存原始 `answer` 字串，前端以 `SourceCard` 渲染 `sources`（結構化，不依賴 LLM 格式）。

- **新用戶（無完攀紀錄）** → 無可用 context，推薦退化為通用建議。接受：顯示「完成更多完攀後，推薦會更準確」提示。

- **前端 Tab 初次載入慢** → 系統剛觸發、推薦尚未生成時 Tab 為空。緩解：顯示骨架屏 + 「推薦生成中...」提示，前端 polling 3 次（間隔 2s）後放棄。

## Migration Plan

1. 執行 `0049_create_user_recommendations.sql` migration（新增 `user_recommendations` 表）
2. 部署後端（新路由掛載 + ascents hook）
3. 前端部署（個人頁面 Tab + 完攀確認頁）
4. 無需資料回填（歷史完攀不補推薦）

**Rollback**：刪除 `ascents.ts` 的 `waitUntil` 呼叫即可停用自動觸發，不影響其他功能。

## Open Questions

- **完攀確認頁 inline 顯示**：推薦是非同步生成的，確認頁應等待（polling）還是直接引導到 Tab？建議：確認頁不等待，顯示「推薦生成中，稍後至個人頁面查看」即可。
- **每次完攀都觸發**：用戶一天可能完攀多條，每條都觸發推薦會有重複感。建議：每用戶每日最多系統觸發 3 次（見決策 3 的風險緩解）。
