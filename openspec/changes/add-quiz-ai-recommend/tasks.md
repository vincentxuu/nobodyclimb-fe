## 1. ai_config 新增參數

- [ ] 1.1 修改 `backend/src/services/query/config.ts`，新增 4 個參數定義：`personality_weight` (0.15)、`personality_mode` ('balanced')、`personality_anti_ratio` (0.4)、`personality_anti_retrieve_count` (10)
- [ ] 1.2 建立 D1 migration 插入預設值到 `ai_config` 表
- [ ] 1.3 確認 config 讀取邏輯能正確載入新參數

## 2. 反風格補充檢索

- [ ] 2.1 在 `@nobodyclimb/constants` 的型態定義中新增 `antiStyleKeywords` 欄位（Power 型對應 slab/vertical/technique/balance，Technique 型對應 overhang/roof/dynamic/power）
- [ ] 2.2 修改 `backend/src/services/query/retrieval.ts`：在主檢索後，若用戶有 personality_type，額外執行一次反風格關鍵字檢索
- [ ] 2.3 反風格檢索保留原始查詢的岩場/地區限制，僅擴展風格關鍵字
- [ ] 2.4 合併主檢索 + 反風格檢索結果，去重（同一 route_id 取較高分），傳入後續 pipeline
- [ ] 2.5 無 personality_type 時跳過補充檢索，無額外開銷

## 3. Personality Rerank Pipeline 階段

- [ ] 3.1 建立 `backend/src/services/pipeline/steps/personality-rerank.ts`，結構對齊 `popularity-rerank.ts`
- [ ] 3.2 實作路線風格判斷邏輯：根據路線的 description/tags 中的關鍵字計算 style_signal (0-1)
- [ ] 3.3 實作 style_match 計算：比對路線 style_signal 與用戶人格 Body 軸方向
- [ ] 3.4 實作 personality_score 計算：根據 personality_mode (balanced/anti_style) 和 personality_anti_ratio
- [ ] 3.5 實作分數混合：`finalScore = prevScore × (1 - weight) + pScore × weight`
- [ ] 3.6 無 personality_type 時直接 passthrough，不影響分數
- [ ] 3.7 在路線結果的 metadata 中標記 `styleTag: '順風格' | '反風格' | '中性'`
- [ ] 3.8 註冊到 pipeline 中（在 popularity-rerank 之後、personalization 之前）

## 4. user_profile Tool 修改

- [ ] 4.1 修改 `backend/src/services/react-agent/tools/user-profile.ts` 的 SQL：加入 `u.personality_type`
- [ ] 4.2 從 `@nobodyclimb/constants` import 型態定義，根據代號查表取得中文名稱和風格描述
- [ ] 4.3 修改 formatResult：有性格類型時輸出「攀岩性格：{nameZh}（{code}）— {description}」
- [ ] 4.4 personality_type 為 NULL 時不輸出性格欄位

## 5. System Prompt 調整

- [ ] 5.1 修改 `backend/src/utils/ai-prompts.ts`：新增 < 100 tokens 的性格推薦指引段落
- [ ] 5.2 指引內容：推薦結果中標記 `[反風格]` 的路線用正面語氣介紹，不用「弱點」等負面詞

## 6. 驗證

- [ ] 6.1 有性格用戶推薦測試：確認結果中包含反風格路線，標記正確
- [ ] 6.2 無性格用戶測試：確認行為與修改前完全一致
- [ ] 6.3 ai_config 權重調整測試：修改 personality_weight 後立即生效
- [ ] 6.4 personality_weight = 0 測試：確認等同關閉
- [ ] 6.5 補充檢索無結果測試：確認 pipeline 正常繼續
- [ ] 6.6 `pnpm typecheck` 和 `pnpm lint` 通過
