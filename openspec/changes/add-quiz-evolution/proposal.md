## Why

攀岩性格測驗的結果在完成當下就定型了——但攀岩者的風格會隨著訓練、經驗累積而演變。一個一開始偏 Power 的攀岩者，可能在大量 slab 練習後逐漸轉向 Technique；一個 Steady 型的人可能在連續突破難度後展現出 Bold 特質。靜態性格無法反映這些真實變化，錯失了「你進化了！」這種高度引人入勝的再參與時刻。透過分析攀登紀錄自動調整性格軸向，讓測驗結果成為動態的、會成長的個人識別，同時引入攀岩光譜 Style Spectrum（受 Casey Elliott Ego Grade 研究啟發，但以三種正面定位取代負面標籤）。

## What Changes

- 新增 `backend/src/services/evolution.ts`：性格演化演算法，分析攀登紀錄調整三軸比例
- 新增 evolution cron job（Cloudflare Workers Cron Trigger）：每週一凌晨執行全站用戶演化計算
- 新增 `POST /api/v1/quiz/evolution/calculate` 端點：手動觸發單一用戶演化計算（上傳大量紀錄後）
- 新增 `GET /api/v1/quiz/evolution/timeline` 端點：查詢用戶性格演化歷史
- 新增 `GET /api/v1/quiz/evolution/style-spectrum` 端點：查詢用戶攀岩光譜（取代 Ego Grade 命名，三種正面定位：深耕者/全能者/即興者）
- 新增 D1 migration：`personality_evolution` 資料表（演化歷史，含慣性機制欄位）、`users` 表新增 `style_spectrum REAL` 欄位
- 新增推播通知：性格類型改變時發送「你從 X 進化為 Y！」通知
- 新增 Web 時間軸 UI：`/profile/evolution` 頁面，視覺化性格演化歷史
- 新增 Mobile 時間軸：`profile/evolution` 路由，與 Web 功能對齊

## Capabilities

### New Capabilities

- `quiz-evolution`：性格演化系統——分析攀登紀錄的「表現模式」（非路線標籤）自動調整性格軸向。三軸行為信號：高難度完攀集中點+完攀率差異 → Power/Technique、同路線嘗試比例+unique路線比 → Goal/Free、難度突破頻率+lead比例 → Bold/Steady。含攀岩光譜 Style Spectrum（取代 Ego Grade，三種正面定位）、三重門檻慣性機制（20筆+穩定8週+連續3次確認）、演化歷史時間軸、進化通知。

### Modified Capabilities

- `quiz-results-api`：用戶性格類型更新邏輯擴充——演化計算結果寫入 `users.personality_type`、`users.personality_taken_at`，與原測驗結果儲存共用相同欄位。

## Impact

**資料庫**：

- 新增 migration：`personality_evolution` 表（id, user_id, from_type, to_type, power_pct, goal_pct, bold_pct, style_spectrum, trigger, consecutive_count, calculated_at）、`users` 表新增 `style_spectrum REAL`

**後端**：

- `backend/src/services/evolution.ts`：新增演化演算法服務
- `backend/src/routes/quiz.ts`：新增 3 個演化相關端點
- `backend/src/index.ts`：註冊 cron trigger handler
- `backend/wrangler.toml`：新增 `[triggers] crons` 設定

**Web 前端**：

- `apps/web/src/app/[locale]/profile/evolution/page.tsx`：演化時間軸頁面
- `apps/web/src/components/profile/EvolutionTimeline.tsx`：時間軸元件

**Mobile App**：

- `apps/mobile/app/profile/evolution/index.tsx`：演化時間軸頁面
- `apps/mobile/src/components/profile/EvolutionTimeline.tsx`：時間軸元件

**依賴**：

- 依賴 `add-quiz-backend`（quiz_results 資料表、users.personality_type 欄位、quiz router）
- 依賴 `add-quiz-mobile`（mobile profile 路由結構）
