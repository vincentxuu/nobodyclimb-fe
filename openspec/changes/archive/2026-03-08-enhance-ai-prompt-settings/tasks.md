## 1. 後端 API 調整

- [x] 1.1 修改 `GET /admin/ai/prompts` 支援 `name` query parameter 篩選，回傳指定 name 的所有版本（按 version 降序）
- [x] 1.2 修改 `POST /admin/ai/prompts` 新建版本時自動將同名舊 active 版本更新為 archived（INSERT 前先 UPDATE）
- [x] 1.3 新增 `GET /admin/ai/prompts/defaults` 端點，回傳 10 個硬編碼預設 prompt 的 name、中文名稱、content、variables 列表（供前端編輯器 fallback 顯示）

## 2. 後端 Prompt Runtime

- [x] 2.1 在 `backend/src/services/query.ts` 新增 `loadPrompts(db)` 函數，查詢 `SELECT name, content FROM ai_prompts WHERE status = 'active'`，回傳 `Record<string, string>`
- [x] 2.2 修改 `processQuery()` 將 `loadPrompts(db)` 與 `loadPipelineConfig(db)` 透過 `Promise.all` 並行執行
- [x] 2.3 修改 `processStreamingQuery()` 同樣並行載入 prompts
- [x] 2.4 在 pipeline 各階段替換硬編碼 prompt 為 DB 優先 + fallback 邏輯：`prompts['system_prompt'] ?? SYSTEM_PROMPT`（10 個 prompt 全部替換）
- [x] 2.5 為 `loadPrompts` 加入 try-catch，失敗時回傳空物件（全部 fallback 到硬編碼）

## 3. 前端 API Client 擴充

- [x] 3.1 在 `apps/web/src/lib/api/admin-ai.ts` 新增 `getAIPromptDefaults()` 函數和 `useAIPromptDefaults()` hook
- [x] 3.2 新增 `getAIPromptsByName(name)` 函數和 `useAIPromptsByName(name)` hook（呼叫 `GET /admin/ai/prompts?name=...`）
- [x] 3.3 新增 `useCreateAIPrompt()` mutation hook（呼叫 `POST /admin/ai/prompts`）

## 4. Prompt 變數定義

- [x] 4.1 在前端建立 `PROMPT_VARIABLE_MAP` 常數，定義每個 prompt name 對應的變數列表和中文名稱（共 10 個 prompt）

## 5. Prompt 列表頁面

- [x] 5.1 建立 `apps/web/src/app/admin/ai/prompts/page.tsx` 列表頁面，以卡片顯示 10 個固定 prompt
- [x] 5.2 每個卡片顯示：中文名稱、prompt name（monospace）、active 版本號或「使用預設」、最後更新時間
- [x] 5.3 點擊卡片導航至 `/admin/ai/prompts/[name]`

## 6. Prompt 編輯器頁面

- [x] 6.1 建立 `apps/web/src/app/admin/ai/prompts/[name]/page.tsx` 編輯頁面
- [x] 6.2 實作 prompt 內容載入：有 active 版本顯示 DB 內容，無記錄則顯示硬編碼預設並標示「預設模板」
- [x] 6.3 實作全寬 monospace textarea 編輯區（可拖曳調整高度）
- [x] 6.4 實作變數提示面板：根據 PROMPT_VARIABLE_MAP 顯示可用變數按鈕，點擊插入到 textarea 游標位置
- [x] 6.5 實作儲存功能：呼叫 `POST /admin/ai/prompts` 建立新版本，顯示成功訊息並更新版本號
- [x] 6.6 實作儲存前變數驗證警告：檢查必要變數是否存在，缺少時顯示警告但不阻擋

## 7. Prompt 版本歷史與回滾

- [x] 7.1 在編輯頁面新增「版本歷史」分頁，呼叫 `useAIPromptsByName` 顯示所有版本（版本號、狀態、更新時間）
- [x] 7.2 實作版本內容預覽：點擊歷史版本顯示唯讀內容
- [x] 7.3 實作回滾功能：確認對話框 → 以歷史版本內容呼叫 `POST /admin/ai/prompts` 建立新 active 版本
- [x] 7.4 實作「重置為預設」按鈕：確認對話框 → 以硬編碼預設內容建立新版本

## 8. Settings 頁面分頁重構

- [x] 8.1 重構 `apps/web/src/app/admin/ai/settings/page.tsx`，將 CONFIG_FIELDS 按 6 個 tab 分組
- [x] 8.2 使用 Radix UI Tabs 元件實作分頁：模型設定(#models)、搜尋與排名(#search)、品質與 Token(#quality)、對話與快取(#chat)、Agentic 模式(#agentic)、防護設定(#guardrails)
- [x] 8.3 實作 URL hash 同步：切換 tab 更新 hash，頁面載入時從 hash 恢復 tab
- [x] 8.4 將每個分頁改為獨立 state + 獨立儲存按鈕，只送出該分頁的 config keys

## 9. Guardrail Tag Input 元件

- [x] 9.1 建立 `TagInput` 共用元件：顯示 chip/tag 列表 + 底部輸入框，支援 Enter 新增、× 刪除
- [x] 9.2 實作批次貼上功能：偵測換行符號自動分割為多個 tag
- [x] 9.3 在防護設定分頁中，將 4 個 guardrail textarea 替換為 TagInput 元件
- [x] 9.4 確保 TagInput 儲存時轉為 JSON array 字串格式（與現有 ai_config 格式相容）
