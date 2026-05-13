## 1. Implementation
- [ ] 1.1 新增 `user_ai_provider_keys` 資料表與 repository（user_id、provider、encrypted_api_key、masked_key、status、priority、usage_mode、last_tested_at、deleted_at）。
- [ ] 1.2 新增 `ai_provider_policies` 管理員設定資料表與 API：平台 baseline quota、預設 provider、fallback 策略。
- [ ] 1.3 新增 Harness 管理 API：建立/更新 key、列出可用供應商、刪除 key、測試連線。
- [ ] 1.4 擴充 ask/stream 流程，支援依使用者設定選擇供應商與模型，並區分 platform quota 與 user quota 消耗來源。
- [ ] 1.5 加入 fallback 策略（使用者 key 失效時退回平台預設或回傳可理解錯誤）。
- [ ] 1.6 實作前端設定介面：貼上 key、選供應商、測試連線、查看遮罩狀態與額度來源。
- [ ] 1.7 補齊驗證與安全控制：白名單、加密、遮罩、審計紀錄。
- [ ] 1.8 新增/更新單元與整合測試，涵蓋 ask 與 stream 兩種路徑及雙層額度計算。
- [ ] 1.9 新增 policy 讀取端點與管理員策略異動審計紀錄。
- [ ] 1.10 實作 key rotation / soft delete lifecycle，確保舊 key 與進行中請求相容。

## 2. Validation
- [ ] 2.1 `pnpm run lint`
- [ ] 2.2 `pnpm run typecheck`
- [ ] 2.3 `pnpm run format`
