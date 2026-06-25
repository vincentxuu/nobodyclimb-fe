## 1. D1 Migration

- [x] 1.1 建立 `backend/migrations/XXXX_personality_evolution.sql`，包含：
  - `CREATE TABLE personality_evolution`（id TEXT PK, user_id TEXT NOT NULL, from_type TEXT, to_type TEXT NOT NULL, power_pct REAL NOT NULL, goal_pct REAL NOT NULL, bold_pct REAL NOT NULL, style_spectrum REAL, trigger TEXT NOT NULL, consecutive_count INTEGER DEFAULT 1, calculated_at TEXT NOT NULL DEFAULT (datetime('now'))）
  - `CREATE INDEX idx_evolution_user ON personality_evolution(user_id)`
  - `CREATE INDEX idx_evolution_date ON personality_evolution(calculated_at)`
  - `ALTER TABLE users ADD COLUMN style_spectrum REAL`
- [ ] 1.2 在 preview 環境執行 migration 驗證 ⚠️ 需部署環境驗證

## 2. 難度轉換工具（backend/src/utils/grade.ts）

- [x] 2.1 建立或擴充 `gradeToNumeric(grade: string): number`（5.6=1 ... 5.15d=30），無效格式回傳 0
- [x] 2.2 建立 `numericToGrade(num: number): string` 反向轉換
- [ ] 2.3 單元測試覆蓋邊界情況 ⚠️ 尚無測試檔案

## 3. 行為模式信號萃取（backend/src/services/evolution.ts）

- [x] 3.1 建立 `EvolutionService` class
- [x] 3.2 實作 `getAscentStats(userId, env)` — 查詢攀登紀錄統計：
  - 總筆數
  - 各路線類型的完攀率（不只是數量）
  - 各路線類型的平均嘗試次數
  - 高難度完攀集中在哪類路線（突破點分析）
  - onsight 成功率 vs 路線類型
  - 同路線嘗試 > 3 次的比例（project 傾向）
  - unique 路線數 / 總攀爬數
  - lead / top-rope 比例
  - 近 90 天新最高難度次數
  - 活躍月數
  - onsight 最高難度 / redpoint 最高難度
- [x] 3.3 實作 `calculateBehaviorSignals(stats)` 純函式：
  - `power_signal`：基於完攀率差異 + 突破點集中類型 + 嘗試次數差異（非路線標籤計數）
  - `goal_signal`：基於 project 比例 + unique 路線比
  - `bold_signal`：基於突破頻率 + lead 比例
  - 各 signal 輸出 0-1，clamp 邊界
- [x] 3.4 實作 `getQuizBaseline(userId, env)` — 查詢最近一次 quiz_results 的三軸百分比
- [x] 3.5 實作 `blendScores(quizPct, behaviorSignal, recordCount)` 純函式：
  - 20~50 筆：quiz 70% / behavior 30%
  - 51~100 筆：quiz 50% / behavior 50%
  - 100+ 筆：quiz 30% / behavior 70%
  - 無測驗結果：behavior 100%

## 4. 攀岩光譜計算（Style Spectrum）

- [x] 4.1 實作 `calculateStyleSpectrum(onsightMax, redpointMax)` 純函式：
  - gradeToNumeric 轉換後取差值
  - 任一為 null → 回傳 null
- [x] 4.2 實作 `getSpectrumPosition(spectrum)` 純函式：
  - `> 3` → `{ position: 'deep_sender', nameZh: '深耕者', name: 'Deep Sender', description: '...', growthDirection: '...' }`
  - `0-3` → `{ position: 'all_rounder', nameZh: '全能者', ... }`
  - `< 0` → `{ position: 'flash_reader', nameZh: '即興者', ... }`
- [ ] 4.3 單元測試覆蓋三種定位 + null 情況 ⚠️ 尚無測試檔案

## 5. 三重門檻慣性機制

- [x] 5.1 實作 `checkStabilityPeriod(userId, env)` — 查詢 users.personality_taken_at，計算距今週數
- [x] 5.2 實作 `getConsecutiveCount(userId, targetType, env)` — 查詢 personality_evolution 最近連續指向 targetType 的次數
- [x] 5.3 實作 `shouldEvolve(weeksSinceLast, consecutiveCount, newType, currentType)` 純函式：
  - currentType == newType → false（沒有變化）
  - weeksSinceLast < 8 → false（穩定期未滿）
  - consecutiveCount < 3 → false（連續確認不足）
  - 全部通過 → true
- [ ] 5.4 單元測試：正常進化、穩定期不足、連續中斷、無變化 ⚠️ 尚無測試檔案

## 6. 演化主方法

- [x] 6.1 實作 `evolve(userId, env)` 主方法：
  - 檢查紀錄筆數 < 20 → 早期返回
  - getAscentStats → calculateBehaviorSignals
  - getQuizBaseline（無結果時 behavior 100%）
  - blendScores 三軸
  - calculateStyleSpectrum
  - determinePersonalityType（三軸 >= 50 取左極字母）
  - 檢查三重門檻（checkStabilityPeriod + getConsecutiveCount + shouldEvolve）
  - INSERT personality_evolution（每次計算都記錄，含 consecutive_count）
  - 三重門檻通過：UPDATE users SET personality_type + style_spectrum + personality_taken_at，標記需通知
  - 未通過：僅 UPDATE users SET style_spectrum（如果變了）
  - 回傳 `{ changed, personality_type, power_pct, goal_pct, bold_pct, style_spectrum, consecutive_count, weeks_stable }`

## 7. Cron Job

- [x] 7.1 在 `backend/wrangler.toml` 新增 `[triggers] crons = ["0 0 * * 1"]`
- [x] 7.2 在 `backend/src/index.ts` 新增 `scheduled` handler：
  - 查詢符合條件用戶（personality_type NOT NULL + last_active_at 30 天內 + ascent count >= 20）
  - 每批 50 用戶
  - 對每用戶呼叫 evolve()
  - 記錄處理結果（成功/失敗/跳過/進化人數）

## 8. API 端點（backend/src/routes/quiz.ts）

- [x] 8.1 `POST /api/v1/quiz/evolution/calculate`（Auth: Required）：手動觸發，每日限 1 次，同樣受三重門檻限制
- [x] 8.2 `GET /api/v1/quiz/evolution/timeline`（Auth: Required）：回傳演化歷史記錄（只顯示 changed=true 的記錄）
- [x] 8.3 `GET /api/v1/quiz/evolution/style-spectrum`（Auth: Required）：回傳攀岩光譜 + 定位 + 描述 + 成長方向
- [x] 8.4 `GET /api/v1/quiz/evolution/notification`（Auth: Required）：查詢未讀進化通知
- [x] 8.5 `POST /api/v1/quiz/evolution/notification/read`（Auth: Required）：標記已讀
- [x] 8.6 所有端點加 hono-openapi route decorator

## 9. 測驗結果 API 擴充

- [x] 9.1 修改 `POST /api/v1/quiz/results`：已登入用戶重測時，若 personality_evolution 表已有記錄，額外 INSERT personality_evolution（trigger: 'quiz'），重置 consecutive_count

## 10. Web 時間軸頁面

- [x] 10.1 `apps/web/src/lib/api/evolution.ts`：封裝 API 呼叫
- [x] 10.2 `apps/web/src/lib/hooks/useEvolutionTimeline.ts` + `useStyleSpectrum.ts`：useQuery 包裝
- [x] 10.3 `apps/web/src/app/[locale]/profile/evolution/page.tsx`：時間軸頁面容器
- [x] 10.4 `EvolutionTimeline.tsx`：垂直時間軸，每節點含日期 + 型態圖示轉換 + 三軸柱狀圖
- [x] 10.5 `StyleSpectrumCard.tsx`：攀岩光譜卡片（深耕者/全能者/即興者 + 描述 + 成長方向）
- [x] 10.6 `EvolutionNotificationBanner.tsx`：進化通知 banner，點擊/關閉後標記已讀
- [x] 10.7 Profile 頁整合通知 banner

## 11. Mobile 時間軸頁面

- [x] 11.1 `apps/mobile/src/lib/api/evolution.ts`：封裝 API 呼叫
- [x] 11.2 `apps/mobile/app/profile/evolution/index.tsx`：時間軸路由
- [x] 11.3 `EvolutionTimeline.tsx`（React Native）：功能對齊 Web
- [x] 11.4 `StyleSpectrumCard.tsx`（React Native）
- [x] 11.5 `EvolutionNotificationBanner.tsx`（React Native）
- [x] 11.6 Mobile Profile 頁整合通知 banner

## 12. 整合驗證

- [ ] 12.1 行為信號正確性：模擬不同攀登分佈，驗證 power/goal/bold signal ⚠️ 需部署環境驗證
- [ ] 12.2 環境限制測試：只有 slab 的用戶，power 信號仍能正確判斷（靠嘗試次數差異） ⚠️ 需部署環境驗證
- [ ] 12.3 加權混合測試：20/50/100 筆門檻的權重切換 ⚠️ 需部署環境驗證
- [ ] 12.4 三重門檻測試：穩定期不足 → 不進化；連續中斷 → 重置；全部通過 → 進化 ⚠️ 需部署環境驗證
- [ ] 12.5 攀岩光譜測試：正/負/null 三種情況 → 深耕者/全能者/即興者 ⚠️ 需部署環境驗證
- [ ] 12.6 Cron 批次測試：多用戶批次處理正確 ⚠️ 需部署環境驗證
- [ ] 12.7 通知流程：進化 → banner 出現 → 標記已讀 → 不再顯示 ⚠️ 需部署環境驗證
- [ ] 12.8 重測驗測試：重新測驗 → personality_evolution trigger='quiz' + consecutive 重置 ⚠️ 需部署環境驗證
- [ ] 12.9 Web + Mobile 時間軸 UI 驗證 ⚠️ 需部署環境驗證
- [ ] 12.10 OpenAPI 文件驗證 ⚠️ 需部署環境驗證
