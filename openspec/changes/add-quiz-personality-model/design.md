## Context

NobodyClimb 規劃攀岩性格測驗功能，需要一套跨平台共用的性格模型。後續的 Web 測驗流程（`add-quiz-web-flow`）、視覺設計（`add-quiz-visual-identity`）、後端 API（`add-quiz-backend`）、Mobile App（`add-quiz-mobile`）、AI 推薦整合（`add-quiz-ai-recommend`）等變更都將依賴此模型。

現有 `packages/constants` 和 `packages/types` 已建立跨端共用的慣例（climbing.ts、theme.ts、rank.ts 等），本變更沿用相同模式。

---

## Goals / Non-Goals

**Goals:**

- 定義 3 軸 8 型攀岩性格模型的完整 TypeScript 型別與常數
- 提供 24 題題庫（每軸 8 題，左右方向各 4 題），使用 5 點 Likert 量表
- 實作純函式計分引擎，無外部依賴，可在任何 JS 環境執行
- 定義 8 型 × 4 週 × 3 天的訓練計畫內容物件
- 定義 8 型專屬色彩常數
- 提供計分引擎的單元測試

**Non-Goals:**

- 不實作 API 端點（由 `add-quiz-backend` 負責）
- 不實作 UI 元件或頁面（由 `add-quiz-web-flow`、`add-quiz-mobile` 負責）
- 不處理資料持久化或資料庫結構
- 不產生視覺素材（由 `add-quiz-visual-identity` 負責）
- 不實作 AI 推薦邏輯（由 `add-quiz-ai-recommend` 負責）

---

## Decisions

### D1：模組位置——packages/constants 與 packages/types

**決定**：型別定義放 `packages/types/src/quiz.ts`，常數與邏輯放 `packages/constants/src/quiz/` 子目錄。

**理由**：沿用現有慣例（`rank.ts` 在 types、`climbing.ts` 在 constants）。quiz 模組較大，使用子目錄而非單檔，提升可維護性。

**替代方案**：
- 新建 `packages/quiz` 獨立套件 → 過度拆分，增加 monorepo 管理成本，且無獨立版本需求
- 全部放 `packages/constants` → 型別混在常數套件中違反現有分離慣例

### D2：計分引擎——純函式，無狀態

**決定**：計分引擎 `calculateQuizResult(answers: QuizAnswer[])` 為純函式，接收 24 題作答陣列，回傳完整計分結果。不依賴外部狀態、不做 I/O。

**理由**：
- 純函式可在 Web（瀏覽器端即時計分）、Mobile、Backend（儲存前驗證）、Workers（邊緣運算）等任何環境執行
- 容易測試——給定輸入，斷言輸出
- 後端只需 `import { calculateQuizResult } from '@nobodyclimb/constants'`，不需重新實作

**替代方案**：
- 計分邏輯放後端 API → 前端無法即時顯示結果，增加延遲
- 使用 class-based 架構 → 不必要的複雜度，此場景無需實例狀態

### D3：3 軸定義與計分方式

**決定**：

| 軸 | 左方向 | 右方向 | 說明 |
|----|--------|--------|------|
| Body | Power (P) | Technique (T) | 身體偏好：力量型 vs 技巧型 |
| Motive | Goal (G) | Free (F) | 動機偏好：目標導向 vs 自由探索 |
| Mind | Bold (B) | Steady (S) | 心態偏好：大膽突破 vs 穩健漸進 |

每軸 8 題：4 題偏左方向（高分=左）、4 題偏右方向（高分=右）。5 點 Likert 量表（1=非常不同意 ~ 5=非常同意）。

計分流程：
1. 左方向題：分數直接加總（1~5）
2. 右方向題：反轉（6 - raw）後加總
3. 軸分數 = 8 題加總，範圍 8~40
4. 中點 = 24：>24 偏左方向，<24 偏右方向，=24 取左方向（P/G/B）
5. 三軸各取方向，組合為 3 字母代碼（如 PGB、TFS）

### D4：8 型定義

**決定**：每型包含 code、中文名、英文名、色彩、描述文案、關鍵詞陣列。

| Code | 中文名 | 英文名 | 色彩 |
|------|--------|--------|------|
| PGB | 碎岩者 | Crusher | #E84545 |
| PGS | 鍛造者 | Forger | #F4845F |
| PFB | 野火 | Wildfire | #F7B731 |
| PFS | 恆者 | Anchor | #2C3E50 |
| TGB | 狙擊手 | Sniper | #27AE60 |
| TGS | 解碼者 | Cipher | #3742FA |
| TFB | 浪人 | Wanderer | #0ABDE3 |
| TFS | 禪者 | Zen | #6C5CE7 |

### D5：Grit 指標與 Flow 指標

**決定**：根據 Motive 軸結果，計算附加指標：

- **Grit 指標**（Goal 型適用，G 系列）：衡量目標驅動強度。計算方式 = Motive 軸分數（越高越偏 Goal）正規化為 0~100。
- **Flow 指標**（Free 型適用，F 系列）：衡量自由探索傾向。計算方式 = (40 - Motive 軸分數) 正規化為 0~100。

兩者互補，只在對應類型的結果中強調顯示。

### D6：訓練計畫內容結構

**決定**：訓練計畫定義為靜態 TypeScript 物件，結構為 `Record<PersonalityTypeCode, TrainingPlan>`。

每個 TrainingPlan 包含：
- `typeCode`：對應人格類型
- `weeks`：4 週陣列，每週包含：
  - `weekNumber`：週次（1~4）
  - `theme`：本週主題
  - `days`：3 天陣列，每天包含：
    - `dayNumber`：天次（1~3）
    - `title`：訓練標題
    - `description`：訓練說明
    - `duration`：建議時長（分鐘）
    - `exercises`：練習項目陣列

**理由**：靜態物件不需資料庫，可直接 tree-shake，符合 content-as-code 模式。後續若需動態化可遷移至 CMS。

### D7：測試策略

**決定**：僅對計分引擎寫單元測試（`scoring.test.ts`），使用 Vitest（或專案既有的 Jest）。

測試案例：
- 全選最左 → 各軸最高分 → PGB
- 全選最右 → 各軸最低分 → TFS
- 全選中間（3）→ 各軸 = 24 → 平手取 PGB
- 單軸翻轉驗證（Body 偏 T，其他偏 P/G）→ TGB
- Grit 指標計算正確性
- Flow 指標計算正確性
- 題目數量不足 24 時拋出錯誤

---

## Risks / Trade-offs

**[24 題內容品質]**
→ 題目由領域專家撰寫，此階段先以佔位文案實作，後續可替換。程式結構（型別、計分邏輯）不受題目內容影響。

**[訓練計畫內容量大——8 × 4 × 3 = 96 個訓練日]**
→ 初始版本提供精簡描述，每日 2~3 個練習項目。Bundle size 可透過 dynamic import 控制（訓練計畫僅在結果頁載入）。

**[5 點 Likert vs 7 點 Likert]**
→ 選擇 5 點：對行動端友善（按鈕更大）、決策疲勞更低。若日後需要更細的區分度，可擴展為 7 點，計分公式只需調整常數。

**[平手時取左方向的設計偏差]**
→ 可接受。平手代表用戶無明顯傾向，任選一側差異極小。選擇左方向（P/G/B）為確定性規則，避免隨機性導致重測結果不一致。

---

## Open Questions

- 訓練計畫是否需要支援多語言（i18n）？→ 暫定僅繁體中文，與專案現有慣例一致
- 是否需要為每題設定不同權重？→ 暫定均等權重，模型驗證後再考慮差異化
