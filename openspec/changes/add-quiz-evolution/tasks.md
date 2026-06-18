## 1. D1 Migration

- [ ] 1.1 建立 `backend/migrations/XXXX_personality_evolution.sql`（migration 編號依當時順序），包含：
  - `CREATE TABLE personality_evolution`（id TEXT PK, user_id TEXT NOT NULL, from_type TEXT, to_type TEXT NOT NULL, power_pct REAL NOT NULL, goal_pct REAL NOT NULL, bold_pct REAL NOT NULL, ego_grade REAL, trigger TEXT NOT NULL, calculated_at TEXT NOT NULL DEFAULT (datetime('now'))）
  - `CREATE INDEX idx_evolution_user ON personality_evolution(user_id)`
  - `CREATE INDEX idx_evolution_date ON personality_evolution(calculated_at)`
  - `ALTER TABLE users ADD COLUMN ego_grade REAL`
- [ ] 1.2 在 preview 環境執行 migration 驗證

## 2. 難度轉換工具（backend/src/utils/grade.ts）

- [ ] 2.1 建立或擴充 `backend/src/utils/grade.ts`，新增 `gradeToNumeric(grade: string): number` 函式，將 YDS 難度（5.6~5.15d）轉換為數字序列（1~30）
- [ ] 2.2 新增 `numericToGrade(num: number): string` 反向轉換函式
- [ ] 2.3 處理邊界情況：無效難度格式回傳 0，null/undefined 回傳 0

## 3. 演化演算法服務（backend/src/services/evolution.ts）

- [ ] 3.1 建立 `backend/src/services/evolution.ts`，定義 `EvolutionService` class
- [ ] 3.2 實作 `getAscentStats(userId, env)` 方法：查詢用戶攀登紀錄統計
  - 總筆數
  - 路線類型分佈（overhang/roof/slab/vertical/crack 各幾筆）
  - onsight 筆數 vs redpoint 筆數
  - onsight 最高難度 vs redpoint 最高難度
  - 近 90 天內「新最高難度」出現次數
  - 活躍月數
- [ ] 3.3 實作 `calculateBehaviorSignals(stats)` 純函式：
  - `power_signal`：overhang+roof 佔比（0~1）
  - `goal_signal`：redpoint 佔比（0~1）
  - `bold_signal`：breakthrough_count / months_active，clamp(0, 1)
- [ ] 3.4 實作 `getQuizBaseline(userId, env)` 方法：查詢用戶最近一次 quiz_results 的 power_pct、goal_pct、bold_pct
- [ ] 3.5 實作 `blendScores(quizPct, behaviorSignal, recordCount)` 純函式：
  - 20~50 筆：quiz 70% / behavior 30%
  - 51~100 筆：quiz 50% / behavior 50%
  - 100+ 筆：quiz 30% / behavior 70%
  - 回傳 final_pct（0~100）
- [ ] 3.6 實作 `calculateEgoGrade(onsightMax, redpointMax)` 純函式：
  - 將兩個難度轉換為數字（gradeToNumeric）
  - 回傳差值（redpoint - onsight），任一為 0 則回傳 null
- [ ] 3.7 實作 `determinePersonalityType(powerPct, goalPct, boldPct)` 純函式：
  - power_pct >= 50 → P，否則 T
  - goal_pct >= 50 → G，否則 F
  - bold_pct >= 50 → B，否則 S
  - 組合為 3 字母 PersonalityTypeCode
- [ ] 3.8 實作 `evolve(userId, env)` 主方法：
  - 查詢攀登紀錄筆數，< 20 則回傳 `{ changed: false, reason: 'insufficient_records' }`
  - getAscentStats → calculateBehaviorSignals
  - getQuizBaseline（無測驗結果則跳過，僅用行為訊號）
  - blendScores 三軸
  - calculateEgoGrade
  - determinePersonalityType
  - 比較新舊 personality_type
  - 若改變：INSERT personality_evolution，UPDATE users SET personality_type, ego_grade
  - 若未改變：僅 UPDATE users SET ego_grade（若變了）
  - 回傳 `{ changed, personality_type, power_pct, goal_pct, bold_pct, ego_grade, from_type?, to_type? }`

## 4. Cron Job（backend/src/index.ts）

- [ ] 4.1 在 `backend/wrangler.toml` 新增 cron trigger 設定：`[triggers] crons = ["0 0 * * 1"]`（每週一 UTC 00:00）
- [ ] 4.2 在 `backend/src/index.ts` 新增 `scheduled` event handler：
  - 查詢符合條件的用戶（personality_type IS NOT NULL, last_active_at 30 天內）
  - 批次處理：每批 50 用戶
  - 對每個用戶呼叫 `EvolutionService.evolve()`
  - 記錄處理結果（成功/失敗/跳過人數）

## 5. 演化 API 端點（backend/src/routes/quiz.ts）

- [ ] 5.1 在既有 `backend/src/routes/quiz.ts` 新增 `POST /api/v1/quiz/evolution/calculate` 端點：
  - Auth: Required
  - 速率限制：查詢用戶當日是否已手動觸發（查 personality_evolution WHERE trigger='manual' AND DATE(calculated_at)=DATE('now')），是則 429
  - 呼叫 `EvolutionService.evolve(userId, env)`
  - 回傳結果
  - hono-openapi route decorator
- [ ] 5.2 新增 `GET /api/v1/quiz/evolution/timeline` 端點：
  - Auth: Required
  - 查詢 personality_evolution WHERE user_id = ? ORDER BY calculated_at DESC
  - 回傳 `{ success: true, data: EvolutionRecord[] }`
  - hono-openapi route decorator
- [ ] 5.3 新增 `GET /api/v1/quiz/evolution/ego-grade` 端點：
  - Auth: Required
  - 查詢 users.ego_grade + 攀登紀錄最高 onsight/redpoint 難度
  - ego_grade 為 null 回傳 data: null
  - 有值回傳 `{ ego_grade, onsight_max, redpoint_max, interpretation }`
  - interpretation 邏輯：> 3 → "挑戰型"、0~3 → "平衡型"、< 0 → "保守型"
  - hono-openapi route decorator

## 6. 測驗結果 API 擴充

- [ ] 6.1 修改 `POST /api/v1/quiz/results` 端點邏輯：已登入用戶儲存結果時，若 personality_evolution 表已有記錄，額外 INSERT personality_evolution（from_type: 舊 personality_type, to_type: 新結果, trigger: 'quiz'）

## 7. 通知機制

- [ ] 7.1 在 `backend/src/services/evolution.ts` 的 evolve() 方法中，性格類型改變時在 personality_evolution 記錄中標記 `notified = false`（或另建通知記錄）
- [ ] 7.2 新增 `GET /api/v1/quiz/evolution/notification` 端點（Auth: Required）：查詢未讀的演化通知（最近一筆 notified = false 的 personality_evolution 記錄），回傳 from_type、to_type 中文名稱
- [ ] 7.3 新增 `POST /api/v1/quiz/evolution/notification/read` 端點（Auth: Required）：標記通知為已讀

## 8. Web 時間軸頁面

- [ ] 8.1 新增 `apps/web/src/lib/api/evolution.ts`：封裝 API 呼叫函式（fetchTimeline, fetchEgoGrade, calculateEvolution, fetchNotification, markNotificationRead）
- [ ] 8.2 新增 `apps/web/src/lib/hooks/useEvolutionTimeline.ts`：useQuery 包裝
- [ ] 8.3 新增 `apps/web/src/lib/hooks/useEgoGrade.ts`：useQuery 包裝
- [ ] 8.4 新增 `apps/web/src/app/[locale]/profile/evolution/page.tsx`：演化時間軸頁面容器，登入保護
- [ ] 8.5 新增 `apps/web/src/components/profile/EvolutionTimeline.tsx`：垂直時間軸元件
  - 每個節點：日期、from_type → to_type 型態圖示與名稱、三軸百分比柱狀圖、Ego Grade 標記
  - 最新在上
  - 無記錄時顯示引導文案
- [ ] 8.6 新增 `apps/web/src/components/profile/EgoGradeCard.tsx`：Ego Grade 顯示卡片，含 onsight/redpoint 最高難度、解讀文字、tooltip 說明
- [ ] 8.7 新增 `apps/web/src/components/profile/EvolutionNotificationBanner.tsx`：進化通知 banner，顯示「你從 X 進化為 Y！」，附「查看歷程」按鈕，點擊或關閉後標記已讀
- [ ] 8.8 在 profile 頁面整合 EvolutionNotificationBanner（偵測未讀通知時顯示）

## 9. Mobile 時間軸頁面

- [ ] 9.1 新增 `apps/mobile/src/lib/api/evolution.ts`：封裝 API 呼叫函式
- [ ] 9.2 新增 `apps/mobile/app/profile/evolution/index.tsx`：演化時間軸路由頁面
- [ ] 9.3 新增 `apps/mobile/src/components/profile/EvolutionTimeline.tsx`：React Native 垂直時間軸元件，功能與 Web 版對齊
- [ ] 9.4 新增 `apps/mobile/src/components/profile/EgoGradeCard.tsx`：Ego Grade 顯示卡片
- [ ] 9.5 新增 `apps/mobile/src/components/profile/EvolutionNotificationBanner.tsx`：進化通知 banner
- [ ] 9.6 在 Mobile profile 頁面整合通知 banner

## 10. 整合驗證

- [ ] 10.1 演算法正確性測試：模擬不同攀登紀錄分佈，驗證三軸百分比計算正確
- [ ] 10.2 加權混合測試：驗證 20/50/100 筆紀錄門檻的權重切換正確
- [ ] 10.3 Ego Grade 測試：驗證正/負/null 三種情況
- [ ] 10.4 Cron job 測試：模擬多用戶批次處理，驗證批次分割與錯誤處理
- [ ] 10.5 手動觸發測試：POST /evolution/calculate → 演化計算 → 回傳結果
- [ ] 10.6 速率限制測試：同一天第 2 次手動觸發 → 429
- [ ] 10.7 時間軸 API 測試：有/無記錄兩種情況
- [ ] 10.8 通知流程測試：性格改變 → 通知出現 → 標記已讀 → 不再顯示
- [ ] 10.9 測驗重設測試：重新測驗 → personality_evolution 記錄 trigger = 'quiz'
- [ ] 10.10 Web 時間軸 UI 驗證：有記錄時顯示節點、無記錄時顯示引導
- [ ] 10.11 Mobile 時間軸 UI 驗證：功能與 Web 版一致
- [ ] 10.12 OpenAPI 文件驗證：所有新端點在 `/api/v1/docs` 正確顯示
