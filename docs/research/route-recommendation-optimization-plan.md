# 路線推薦優化規劃

> 日期：2026-08-05
> 參考資料：`docs/research/uber-eats-food-knowledge-graph.md`（Uber Eats 食物知識圖譜 / 查詢擴展 / 三邊市場）
> 範圍：`backend/src/services/recommendation.ts`、`backend/src/services/react-agent/tools/recommend.ts`

---

## 一、現況盤點

目前站上有**兩條**互不共用邏輯的推薦路徑：

| 路徑 | 檔案 | 觸發 | 做法 |
|------|------|------|------|
| A. 系統推薦 | `services/recommendation.ts` | 新增完攀紀錄（每日上限 3 次）或手動 | 取近 5 條完攀 → 算最高難度 → 組自然語言 query → 丟 RAG `QueryService.ask()` → 存 JSON 到 `user_recommendations` |
| B. Chat 工具 | `services/react-agent/tools/recommend.ts` | AI 對話中 LLM 選用 | 取近 10 條完攀 → vector search（limit 20）→ post-filter → 取 10 條 |

已具備的基礎建設（比預期完整）：

- Vectorize metadata 過濾：`grade_numeric`、`route_type`、`crag_id`、`area_id`、`region`（`query/filters.ts`）
- 難度鄰域擴展：`similarGradeRange()`、`gradeToPosition()`（`query/nlp.ts`）— 已消除大等級間的跳號
- 相似路線意圖偵測：`hasSimilarRouteIntent()`
- 完攀路線排除：`climbed_route_ids`

**關鍵落差：上述 `similarGradeRange` / metadata filter 只用在 search / tool-selection 路徑，兩條推薦路徑都沒用到。**

---

## 二、先修的既有缺陷（優先於任何新功能）

以下是盤點過程中查證到的實際問題，**不修這些的話，後面的優化都建在壞掉的地基上**。

### 缺陷 1：`gradeToNumeric` 有 7 份實作、兩套不相容的數值標度 🔴

| 檔案 | 標度 | V-grade |
|------|------|---------|
| `utils/grade.ts` | ordinal：5.6=1 … 5.15d=28 | V0=1 … V16=17 |
| `services/indexing.ts` | 113-scale：5.11d=113 | → 0 |
| `services/query/nlp.ts` | 113-scale（註解已標明「與 IndexingService 一致」） | → 0 |
| `services/recommendation.ts` | 113-scale | → 0 |
| `services/personalization.ts` | 113-scale | → 0 |
| `react-agent/tools/recommend.ts` | 113-scale | → 0 |
| `react-agent/tools/user-profile.ts` | 113-scale | → 0 |

兩個問題：

1. `utils/grade.ts` 的 ordinal 標度**讓 YDS 與 V-grade 撞號**（5.10a=5，V4=5）。`evolution.ts`、`routes/quiz.ts` 用的是這一版，`indexing` / 推薦用的是另一版 — 同一個「難度數值」在不同模組意義不同。
2. 六份 inline 複製品完全相同，改一份不會同步其他份。

**處理**：統一到 `utils/grade.ts`，但需要**兩個具名函式**而非一個：
- `gradeToVectorNumeric()` — 113-scale，供 indexing 與 Vectorize filter 使用（**改動需重建索引**）
- `gradeToOrdinal()` — 排序/統計用，且必須把 YDS 與 V-grade 分開命名空間

刪掉六份 inline 複製。這是純重構，可獨立成一個 PR 先做。

### 缺陷 2：抱石路線的 `grade_numeric` 恆為 0 🔴

`indexing.ts:32` 的 `gradeToNumeric` 只認 `5.x`，V-scale 與 French grade 都回傳 0，而這個值直接寫進 Vectorize metadata（`indexing.ts:157`）。

後果：**任何 `grade_numeric: { $gte: N }` 的 metadata 過濾都會把全部抱石路線排除**（0 < N）。目前 recommend tool 是在 post-filter 階段 `if (gradeNum === 0) return true` 放行，才沒有炸開 — 但這也代表難度過濾對抱石根本沒生效。

**處理**：`grade_system` 一併寫入 metadata，過濾時依系統分流；抱石用 V-scale 自己的數值區間（例如偏移 1000 起跳避免與 YDS 撞號）。這件事必須在「把難度過濾下推到 metadata filter」之前做，否則會從「過濾無效」變成「抱石全部消失」。

### 缺陷 3：難度過濾用 regex 解 `excerpt` 文字 🟠

`recommend.ts:109,123` 從 `excerpt` 字串 regex 撈 `5.\d+[a-d]?` 來過濾，但 Vectorize metadata 已有結構化的 `grade_numeric`，`buildFilter()` 也已支援 `grade_min` / `grade_max` — 該下推卻沒下推。

後果：
- 撈 20 條再砍到 10 條，向量檢索的召回本來就受限，過濾後常常剩很少
- 解析失敗一律放行（`gradeNum === 0 → return true`），過濾形同虛設

**處理**：改傳 `filters.grade_min` / `grade_max` 給 `queryService.search()`，走 metadata 過濾。（依賴缺陷 2 先修好。）

### 缺陷 4：`route_type` 完全沒有過濾 🔴（安全性）

recommend tool 只在有指定 crag 時傳 `crag_id`，從不傳 `route_type`。使用者完攀紀錄全是 sport，仍可能被推 trad 或需要自行架設保護的路線。

這正是參考資料中「清真飲食被誤配到中東料理」的攀岩版 — 但在攀岩情境**後果是安全性而非體驗**。書中的結論（嵌入知道相似、不知道為何相似）在這裡格外重要。

**處理**：型式、`safety_rating`、`protection`、難度上限走**規則硬過濾**，排在任何相似度排序之前，且不得因「過濾後結果太少」而放寬（現在的 `if (gradeFiltered.length >= 1)` 就是這種放寬邏輯）。

### 缺陷 5：零結果沒有 fallback 🟠

`recommend.ts:133` 的 `filtered.slice(0, 10)` 可能是空陣列，`formatResult` 直接回「目前沒有推薦路線。」

這正是書中查詢擴展要解的問題。

### 缺陷 6：沒有曝光與回饋紀錄 🟠

`user_recommendations`（migration 0053）只有 `status`（success/failed），沒有「使用者看了沒 / 點了沒 / 後來爬了沒」。

後果：無法評估推薦品質，也無法實作 UCB（UCB 需要印象數）。

> 附帶記錄：`user_recommendations.user_id` 宣告為 `INTEGER`，但 `users.id` 是 TEXT（違反不變量 9）。修的時候一併處理。

---

## 三、v2 架構與 feature flag 切換

### 3.1 既有 feature flag 機制（沿用，不另造輪子）

專案已有成熟的執行期開關機制，v2 直接沿用：

| 元件 | 位置 | 說明 |
|------|------|------|
| 設定表 | `ai_config`（key/value） | migration 0046 建立 |
| 載入 | `query/config.ts` 的 `loadPipelineConfig()` | 附 `num()` 夾值與預設值 |
| 管理 API | `routes/admin-ai.ts` 的 `GET/PUT /config` | 免部署即可切換 |

既有的三種 flag 寫法，v2 照抄：

```ts
// 布林（預設關）
semantic_cache_enabled: cfg['semantic_cache_enabled'] === '1'
// 布林（預設開）
adaptive_plan_enabled: cfg['adaptive_plan_enabled'] !== '0'
// 列舉白名單
rag_strategy: ['baseline','agentic','plan-execute','react','auto'].includes(v) ? v : 'baseline'
// 整組引擎切換（最接近我們要的）
use_langgraph_engine: cfg['use_langgraph_engine'] === '1'
```

`use_langgraph_engine` 是最好的前例 —— 一整套替代引擎掛在單一開關後面，舊路徑原封不動。v2 推薦用同樣的形狀。

> ⚠️ **前置阻塞**：`ai_config` 只存在於 migrations，**沒有寫進 `schema.sql`**（違反不變量 4），
> 且 `0070_personality_rerank_config.sql` 寫入了 `description` 欄位，但 `ai_config` 的 DDL 沒有這個欄位
> —— 這支 migration 在任何尚未跑過它的環境都會失敗。因為 `config.ts` 對每個 key 都有 fallback 預設值，
> 失敗是靜默的（personality 參數一直在吃 hardcode 預設）。
> **v2 的 flag 也要寫進 `ai_config`，所以這件事必須先修**，否則同一個地雷會再踩一次。

### 3.2 模組結構

兩條推薦路徑（`RecommendationService` 與 react-agent 的 `recommend` tool）改為共用同一個入口，
由 flag 決定走 legacy 還是 v2：

```
backend/src/services/recommendation/
  index.ts        # 入口：依 recommendation_strategy 分流
  config.ts       # loadRecommendationConfig()，讀同一張 ai_config
  legacy.ts       # 現行 recommendation.ts 原樣搬入，行為不改
  types.ts
  v2/
    ability.ts    # 能力估計（onsight / redpoint 分離）
    candidates.ts # 多路召回
    filter.ts     # 硬過濾
    score.ts      # 打分（單峰難度適配 + 加權）
    expand.ts     # 零結果查詢擴展
    rerank.ts     # 多樣性 + 探索位
    index.ts
```

原則：**legacy 一行不改**。v2 全新寫，flag 關著就完全不執行。等 v2 穩定再刪 legacy。

### 3.3 Flag 清單

主開關：

| key | 型別 | 預設 | 說明 |
|-----|------|------|------|
| `recommendation_strategy` | `'legacy' \| 'v2'` | `legacy` | 主切換 |

v2 內部的分項開關（讓每個能力可以單獨開關、單獨評估）：

| key | 型別 | 預設 | 說明 |
|-----|------|------|------|
| `reco_ability_model` | `'max_grade' \| 'onsight_redpoint'` | `max_grade` | 能力估計方式 |
| `reco_grade_fit` | `'range' \| 'peak'` | `range` | 難度適配：區間過濾 vs 單峰分數 |
| `reco_type_mismatch_policy` | `'off' \| 'demote' \| 'exclude'` | `demote` | 型式/safety 不符時的處理 |
| `reco_expansion_enabled` | `'1' \| '0'` | `0` | 零結果查詢擴展 |
| `reco_diversity_enabled` | `'1' \| '0'` | `0` | 多樣性重排 |
| `reco_max_per_sector` | number 1–5 | `2` | 同岩區上限 |
| `reco_exploration_slots` | number 0–3 | `0` | 探索位數量 |

排序權重（照 `reranker_weight` / `popularity_weight` 的正規化寫法，總和歸一）：

| key | 預設 |
|-----|------|
| `reco_w_grade_fit` | `0.40` |
| `reco_w_style` | `0.25` |
| `reco_w_quality` | `0.15` |
| `reco_w_access` | `0.10` |
| `reco_w_exposure` | `0.10` |

`reco_type_mismatch_policy` 特別做成三值而非布林，是因為第 5 節那個「該硬排除還是降權標註」的問題目前沒有共識 ——
做成 flag 就能直接用資料回答，不必先吵出結論。

### 3.4 觀測必須先於切換

用 flag 做 A/B 的前提是**看得到結果**。這改變了原本的階段順序：埋點從最後一階提到第二階。

新增 migration（下一個編號是 `0073`；0053 與 0071 歷史上有重複編號，新增前務必再確認一次）：

```
route_recommendation_events
  id, user_id, route_id, recommendation_id
  strategy          -- 'legacy' | 'v2'，用於分組比較
  event_type        -- 'impression' | 'click' | 'ascent'
  expansion_level   -- 擴展層級（0 = 未擴展），評估擴展品質用
  position          -- 在清單中的排名，評估排序用
  created_at
```

同時：
- `user_recommendations` 加 `strategy` 欄位（記錄由哪一版產生）
- 修正 `user_recommendations.user_id` 型別（現為 `INTEGER`，但 `users.id` 是 TEXT，違反不變量 9）
- 依不變量 4，`backend/src/db/schema.sql` 與 `backend/migrations/0073_*.sql` **同步修改**
- 順帶把漏掉的 `ai_config` 補進 `schema.sql`、補上 `description` 欄位

評估指標（對應書中「預測用戶下次是否還會下單」的長期訊號）：

| 指標 | 定義 |
|------|------|
| CTR | click / impression |
| 完攀轉換 | 推薦後 N 天內出現該路線的 ascent 紀錄 |
| 覆蓋率 | 被推薦過的相異路線數 / 總路線數 |
| 擴展命中率 | `expansion_level > 0` 的推薦的 CTR |

> 但要先看清楚一件事：攀岩的完攀轉換週期以「週」為單位，訊號極度稀疏。
> 完攀轉換這個指標可能要累積很久才有統計意義，短期只能看 CTR。
> 這也是第 5 節第 1 點要先確認資料量級的原因。

### 3.5 分階段推進（每階段皆可獨立上線、獨立回退）

| 階段 | 內容 | Flag 狀態 | 可回退 |
|------|------|-----------|--------|
| **S0** 前置 | 修 `ai_config` schema 缺口；統一 `gradeToNumeric`（缺陷 1）；抱石難度數值（缺陷 2） | 無 flag，純重構 | git revert |
| **S1** 埋點 | migration 0073；legacy 路徑先接上埋點，取得基準線 | 無 flag | — |
| **S2** v2 骨架 | 新模組 + `recommendation_strategy`，v2 先做到與 legacy 等價 | `legacy`（暗渡） | 切回 flag |
| **S3** 能力估計 | onsight / redpoint 分離，用 `attempts_count`、`perceived_grade` | `reco_ability_model=onsight_redpoint` | 切回 flag |
| **S4** 難度適配 | 單峰分數取代區間過濾 | `reco_grade_fit=peak` | 切回 flag |
| **S5** 過濾政策 | 型式/safety 的 demote vs exclude 實測 | `reco_type_mismatch_policy` | 切回 flag |
| **S6** 查詢擴展 | 零結果沿 sector → 難度 → crag → region 擴展 | `reco_expansion_enabled=1` | 切回 flag |
| **S7** 多樣性/探索 | 同 sector 上限、探索位 | `reco_diversity_enabled=1` | 切回 flag |

S0 是唯一沒有 flag 保護的階段（純重構 + schema 修復），所以要獨立 PR、獨立驗證。
S2 之後每一階段都是「寫好 → flag 關著上線 → 開 flag 觀察 → 不對就關掉」。

### 3.6 這樣做的代價

誠實說一下 flag 化的成本：

- **兩套邏輯並存**期間，`recommendation/` 底下的程式碼量大約翻倍，且 legacy 不能動
- **分項 flag 有組合爆炸**：7 個分項 flag 理論上 2⁷ 種組合，實務上不可能每種都測。建議只保證「全關 = legacy 等價」與「全開 = v2 完整」兩條路徑有測試，中間狀態當作臨時實驗用
- **flag 要有退場計畫**：v2 定案後應該刪掉 legacy 與對應 flag，否則 `ai_config` 會像現在一樣越積越多（目前已有 50+ 個 key）

## 四、待確認事項

1. **ascent 紀錄的實際量級** —— 決定 S1 的評估指標多久才有意義，也決定要不要把重心從行為訊號移回內容/圖譜
2. **`reco_type_mismatch_policy` 的預設值** —— 我傾向 `demote`（照樣顯示但排後面並標註「傳攀路線，需自行架設保護」），而非 `exclude`。理由是 NobodyClimb 是資訊平台不是確保者，藏起路線既家長式也傷害探索。但這是產品判斷
3. **「會不會 lead」的判定門檻** —— 用 `ascent_type` 推導是我的提案，幾次 `lead` 紀錄才算會 lead 需要攀岩專業判斷
4. **Vectorize 索引是否真的要重建** —— 替代方案：抱石用 `route_type='boulder'` 分流，難度過濾只套用在非抱石，`grade_numeric` 維持 0 也無妨，可免重建。代價是邏輯多一個分支
5. **admin UI 要不要一併加表單** —— `GET/PUT /config` 已經能改，但目前是否有對應的管理介面欄位需要確認

## 五、相關文件

- `docs/research/uber-eats-food-knowledge-graph.md` — 本規劃的參考資料
- `docs/climbing-routes-database-plan.md` — 路線資料庫規劃
- `docs/ai-agent/recommendation-test-cases.md` — 既有推薦測試案例
- `docs/ai-agent/14-graph-rag-applications.md` — Graph RAG 應用
