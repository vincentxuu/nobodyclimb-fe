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

## 三、對照參考資料的優化規劃

### Phase 0：地基修復（缺陷 1、2）

| 項目 | 檔案 | 備註 |
|------|------|------|
| 統一 `gradeToNumeric` | `utils/grade.ts` + 刪 6 份 inline | 純重構，無行為變更 |
| 難度數值支援 V-scale / French | `utils/grade.ts`、`indexing.ts` | **需重建 Vectorize 索引** |
| `grade_system` 寫入 metadata | `indexing.ts`、`query/filters.ts` | 過濾時依系統分流 |

**驗收**：抱石路線的 `grade_numeric` 不再是 0；同一難度字串在所有模組得到同一數值。

### Phase 1：安全硬約束（缺陷 3、4）

對應書中結論：**圖譜／規則負責可解釋與硬約束，嵌入負責行為訊號與長尾相似**。

推薦流程改成兩段：

```
1. 硬過濾（規則，不可放寬）
   route_type ∈ 使用者已具備能力的型式
   grade_numeric ≤ 使用者上限（依 grade_system 分流）
   safety_rating / protection 不在排除清單
        ↓
2. 相似度排序（向量）
```

實作要點：
- 難度過濾下推到 `queryService.search()` 的 `filters.grade_min/grade_max`
- 移除 `if (gradeFiltered.length >= 1)` 這類「結果太少就放寬」的邏輯 — 寧可零結果進到 Phase 2 的擴展，也不要放寬安全條件
- 「使用者具備哪些型式」的判定：從 `user_route_ascents.ascent_type` 推導（有 `lead` / `trad` 紀錄才推 trad）

**驗收**：測試案例 — 只有 sport toprope 紀錄的使用者，推薦結果不含 trad 與 `safety_rating` 為 R/X 的路線。

### Phase 2：查詢擴展與零結果處理（缺陷 5）

對應書中圖 6-32（烏龍麵 → 拉麵／日式料理／蕎麥麵）。

擴展順序（由近而遠，每層都重跑硬過濾）：

| 層級 | 擴展方式 | 現成工具 |
|------|---------|---------|
| 1 | 同岩區其他路線 | `sector_id` / `area_id` |
| 2 | 鄰近難度 | `similarGradeRange()` ✅ 已存在 |
| 3 | 同岩場其他岩區 | `crag_id` |
| 4 | 同地區其他岩場 | `region` |

回傳時要**標明擴展層級**，讓前端能顯示「你所在區域沒有符合的路線，以下是鄰近難度的推薦」。書中沒做這件事，但攀岩情境下使用者需要知道推薦為什麼偏離了原始條件。

**驗收**：查詢一個沒有對應路線的條件，回傳非空且標明擴展原因。

### Phase 3：多樣性與新路線曝光

對應書中「Skylar 愛吃拉麵也不能只推拉麵」與新餐廳 UCB 冷啟動。

1. **多樣性**：推薦清單中同一 `sector_id` 最多 N 條（建議 2），確保跨岩區
2. **探索位**：固定保留 1–2 個名額給 `ascent_count = 0` 或曝光數低的路線
3. **UCB**：等 Phase 4 有印象數之後再上；在那之前用簡化版（新路線固定加權）

書中的 UCB 分數隨印象數遞減、逐步把權重交還相關性 — 這個機制需要印象數，所以順序上必須在 Phase 4 之後。

### Phase 4：曝光與回饋紀錄（缺陷 6）

新增 migration（**下一個編號是 `0073`**；注意 0053 與 0071 歷史上有重複編號，新增前務必再確認一次）：

```
route_recommendation_events
  id, user_id, route_id, recommendation_id
  event_type: 'impression' | 'click' | 'ascent'
  expansion_level  -- Phase 2 的擴展層級，用於評估擴展品質
  created_at
```

同時修正 `user_recommendations.user_id` 的型別（TEXT）。

> 依不變量 4：`backend/src/db/schema.sql` 與 `backend/migrations/0073_*.sql` 必須同步修改。

**用途**：
- 計算路線印象數 → Phase 3 的 UCB
- 長期指標：對應書中「預測用戶下次是否還會下單」→ 攀岩版是「推薦後使用者是否真的留下 ascent 紀錄」

### Phase 5（後續）：路線知識圖譜

目前 `routes` 表有 `route_type`、`safety_rating`、`protection`、`anchor_type`、`tips`，`crags` 有 `rock_type`、`approach_time`、`best_seasons` — **但沒有攀登風格標註**（指力點／平衡／外傾／煙囪…）。

書中反覆強調「線下標註是關鍵，沒標到的線上就搜不到」。要做到「爬完這條想找類似的」，缺的就是這層 style 標註。

建議做法：先加 `route_styles` 關聯表 + 標註流程，不必一開始就上圖資料庫。等標註覆蓋率夠了再談 route2vec（用 `user_route_ascents` 同一天／同一趟的共現訓練嵌入，對應書中 query2vec 的 context 定義）。

---

## 四、建議執行順序

```
Phase 0（地基）──→ Phase 1（安全）──→ Phase 2（擴展）
                                          ↓
                       Phase 4（埋點）──→ Phase 3（多樣性/UCB）
                                          ↓
                                     Phase 5（圖譜/route2vec）
```

Phase 0 與 1 建議各自獨立 PR：Phase 0 是純重構、可獨立驗證；Phase 1 改的是安全相關行為，diff 要小到能逐行 review。

Phase 3 依賴 Phase 4 的印象數，所以埋點要先做。

---

## 五、待確認事項

1. **Phase 0 需要重建 Vectorize 索引** — 重建成本與時機需要確認（正式環境的索引重建流程目前沒有文件）
2. **「使用者具備哪些型式」的判定規則** — 用 `ascent_type` 推導是我的提案，實際門檻（幾次 lead 才算會 lead？）需要攀岩專業判斷
3. **兩條推薦路徑要不要合併** — 路徑 A（RAG 自然語言）與路徑 B（vector search）目前邏輯完全不共用；建議至少把「硬過濾」抽成共用函式，但完全合併的必要性待評估

---

## 六、相關文件

- `docs/research/uber-eats-food-knowledge-graph.md` — 本規劃的參考資料
- `docs/climbing-routes-database-plan.md` — 路線資料庫規劃
- `docs/ai-agent/recommendation-test-cases.md` — 既有推薦測試案例
- `docs/ai-agent/14-graph-rag-applications.md` — Graph RAG 應用
