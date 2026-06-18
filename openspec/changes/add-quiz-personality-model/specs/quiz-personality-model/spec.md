## ADDED Requirements

### Requirement: 3 軸性格模型定義

系統 SHALL 定義攀岩性格模型的三個軸向，每軸有左右兩個方向：

- **Body 軸**：Power (P) ◄► Technique (T)
- **Motive 軸**：Goal (G) ◄► Free (F)
- **Mind 軸**：Bold (B) ◄► Steady (S)

每個軸向 SHALL 具備 `id`（`body` | `motive` | `mind`）、`nameZh`（中文名）、`nameEn`（英文名）、`left`（左方向）、`right`（右方向）屬性。每個方向 SHALL 具備 `code`（單字母大寫）、`nameZh`、`nameEn` 屬性。

#### Scenario: 軸向定義完整性

- **WHEN** 消費端匯入軸向定義常數
- **THEN** 取得恰好 3 個軸向物件，每個軸向含 left 與 right 兩個方向，共 6 個方向定義

#### Scenario: 方向代碼唯一性

- **WHEN** 取出所有 6 個方向的 code
- **THEN** 代碼分別為 P、T、G、F、B、S，無重複

---

### Requirement: 8 型人格類型定義

系統 SHALL 定義 8 種攀岩人格類型，每型由三軸方向代碼組合而成。每個類型 SHALL 具備以下屬性：`code`（3 字母代碼）、`nameZh`（中文名）、`nameEn`（英文名）、`color`（HEX 色碼）、`description`（描述文案）、`keywords`（關鍵詞陣列）。

8 型定義：

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

#### Scenario: 類型定義完整性

- **WHEN** 消費端匯入人格類型定義常數
- **THEN** 取得恰好 8 個類型物件，每個類型的 code 為 3 字母大寫組合，且 color 為有效 HEX 色碼

#### Scenario: 類型代碼與軸向方向一致

- **WHEN** 檢查任一類型的 code（例如 TGB）
- **THEN** 第 1 碼對應 Body 軸方向（T=Technique）、第 2 碼對應 Motive 軸方向（G=Goal）、第 3 碼對應 Mind 軸方向（B=Bold）

#### Scenario: 透過代碼查找類型

- **WHEN** 以代碼 `"PFS"` 查找類型
- **THEN** 回傳 `{ code: "PFS", nameZh: "恆者", nameEn: "Anchor", color: "#2C3E50", ... }`

---

### Requirement: 24 題題庫

系統 SHALL 提供 24 題攀岩性格測驗題庫。每軸 8 題，分為左方向 4 題與右方向 4 題。每題 SHALL 具備以下屬性：`id`（唯一識別碼）、`axis`（所屬軸向）、`direction`（偏向方向，`left` | `right`）、`textZh`（中文題目文字）、`order`（題目排序）。

題目使用 5 點 Likert 量表作答（1=非常不同意、2=不同意、3=普通、4=同意、5=非常同意）。

#### Scenario: 題庫完整性

- **WHEN** 消費端匯入題庫常數
- **THEN** 取得恰好 24 題，Body 軸 8 題、Motive 軸 8 題、Mind 軸 8 題

#### Scenario: 每軸方向分配均衡

- **WHEN** 篩選 Body 軸的題目
- **THEN** 左方向（Power）4 題、右方向（Technique）4 題

#### Scenario: 題目 ID 唯一

- **WHEN** 取出所有 24 題的 id
- **THEN** 無重複值

#### Scenario: 題目順序定義

- **WHEN** 以 order 欄位排序所有題目
- **THEN** 取得 1~24 的連續序號，可用於決定呈現順序

---

### Requirement: 計分引擎

系統 SHALL 提供純函式 `calculateQuizResult(answers)`，接收 24 題作答結果，回傳完整計分結果。計分引擎 SHALL 為無副作用的純函式，不依賴外部狀態或 I/O。

計分規則：
1. 左方向題目：分數直接採用（1~5）
2. 右方向題目：分數反轉（6 - raw）
3. 每軸分數 = 該軸 8 題處理後加總，範圍 8~40
4. 軸分數 > 24：偏左方向；< 24：偏右方向；= 24：取左方向（P/G/B）
5. 三軸方向組合為 3 字母人格類型代碼

#### Scenario: 全選最高分

- **WHEN** 24 題全部作答 5 分
- **THEN** 左方向題得 5 分、右方向題反轉得 1 分（6-5），各軸分數 = 4×5 + 4×1 = 24，平手取左方向，結果為 PGB（碎岩者）

#### Scenario: 全選最低分

- **WHEN** 24 題全部作答 1 分
- **THEN** 左方向題得 1 分、右方向題反轉得 5 分（6-1），各軸分數 = 4×1 + 4×5 = 24，平手取左方向，結果為 PGB（碎岩者）

#### Scenario: 明確偏向右方向

- **WHEN** 所有左方向題作答 1 分、所有右方向題作答 5 分
- **THEN** 各軸分數 = 4×1 + 4×(6-5) = 8，偏右方向，結果為 TFS（禪者）

#### Scenario: 明確偏向左方向

- **WHEN** 所有左方向題作答 5 分、所有右方向題作答 1 分
- **THEN** 各軸分數 = 4×5 + 4×(6-1) = 40，偏左方向，結果為 PGB（碎岩者）

#### Scenario: 單軸翻轉

- **WHEN** Body 軸：左方向題 1 分、右方向題 5 分（偏 T）；Motive 軸和 Mind 軸：左方向題 5 分、右方向題 1 分（偏 G、B）
- **THEN** Body 軸 = 8（偏 T），Motive 軸 = 40（偏 G），Mind 軸 = 40（偏 B），結果為 TGB（狙擊手）

#### Scenario: 作答數量不足

- **WHEN** 傳入少於 24 題的作答陣列
- **THEN** 拋出錯誤，訊息包含「24」

#### Scenario: 計分結果包含軸向分數

- **WHEN** 計分完成
- **THEN** 結果物件包含 `axisScores` 陣列，每項含 `axis`（軸 ID）、`score`（原始分數 8~40）、`direction`（判定方向代碼）

---

### Requirement: Grit 指標與 Flow 指標

系統 SHALL 在計分結果中包含 Grit 指標和 Flow 指標。Grit 指標衡量目標驅動強度（適用於 Goal 型），Flow 指標衡量自由探索傾向（適用於 Free 型）。

計算方式：
- Grit 指標 = `(motiveAxisScore - 8) / 32 * 100`（正規化為 0~100，Motive 軸分數越高越偏 Goal）
- Flow 指標 = `(40 - motiveAxisScore) / 32 * 100`（正規化為 0~100，Motive 軸分數越低越偏 Free）

#### Scenario: Goal 型的 Grit 指標

- **WHEN** 計分結果的 Motive 軸偏 Goal（分數 > 24），例如分數 = 36
- **THEN** 結果包含 `gritIndex = (36-8)/32*100 = 87.5`，`flowIndex = (40-36)/32*100 = 12.5`

#### Scenario: Free 型的 Flow 指標

- **WHEN** 計分結果的 Motive 軸偏 Free（分數 < 24），例如分數 = 12
- **THEN** 結果包含 `gritIndex = (12-8)/32*100 = 12.5`，`flowIndex = (40-12)/32*100 = 87.5`

#### Scenario: 兩指標互補

- **WHEN** 任意計分結果
- **THEN** `gritIndex + flowIndex = 100`

---

### Requirement: 色彩常數

系統 SHALL 提供 8 型專屬色彩常數，以 HEX 格式定義，並提供查找輔助函式。

色彩定義：

| Code | 色彩 |
|------|------|
| PGB | #E84545 |
| PGS | #F4845F |
| PFB | #F7B731 |
| PFS | #2C3E50 |
| TGB | #27AE60 |
| TGS | #3742FA |
| TFB | #0ABDE3 |
| TFS | #6C5CE7 |

#### Scenario: 透過類型代碼取得色彩

- **WHEN** 以代碼 `"TFB"` 查找色彩
- **THEN** 回傳 `"#0ABDE3"`

#### Scenario: 所有色彩為有效 HEX

- **WHEN** 檢查所有 8 個色彩值
- **THEN** 每個值符合 `#[0-9A-Fa-f]{6}` 格式

---

### Requirement: 訓練計畫內容定義

系統 SHALL 定義 8 種人格類型各自的 4 週訓練計畫，每週包含 3 個訓練日。訓練計畫 SHALL 以 TypeScript 靜態物件定義於 `packages/constants`。

每個訓練日 SHALL 具備：`dayNumber`（1~3）、`title`（訓練標題）、`description`（訓練說明）、`duration`（建議時長，分鐘）、`exercises`（練習項目陣列，每項含 `name` 和 `description`）。

每週 SHALL 具備：`weekNumber`（1~4）、`theme`（本週主題）、`days`（3 個訓練日陣列）。

#### Scenario: 訓練計畫完整性

- **WHEN** 消費端匯入訓練計畫常數
- **THEN** 取得 8 個類型的訓練計畫，每個計畫含 4 週，每週含 3 天，共 8 × 4 × 3 = 96 個訓練日

#### Scenario: 透過類型代碼取得訓練計畫

- **WHEN** 以代碼 `"PGB"` 查找訓練計畫
- **THEN** 回傳碎岩者的 4 週訓練計畫，第 1 週的 theme 為該類型專屬主題

#### Scenario: 訓練日包含練習項目

- **WHEN** 檢查任一訓練日
- **THEN** 該訓練日至少有 2 個練習項目，每項含 name 和 description

#### Scenario: 訓練時長合理

- **WHEN** 檢查所有訓練日的 duration
- **THEN** 每個 duration 為正整數，範圍在 30~120 分鐘

---

### Requirement: TypeScript 型別定義

系統 SHALL 在 `@nobodyclimb/types` 套件中提供所有測驗相關的 TypeScript 型別定義，供 Web、Mobile、Backend 共用。

必須包含的型別：
- `QuizAxis`：軸向 ID 聯合型別（`'body' | 'motive' | 'mind'`）
- `QuizDirection`：方向（`'left' | 'right'`）
- `PersonalityTypeCode`：8 型代碼聯合型別（`'PGB' | 'PGS' | 'PFB' | 'PFS' | 'TGB' | 'TGS' | 'TFB' | 'TFS'`）
- `QuizQuestion`：題目結構（id, axis, direction, textZh, order）
- `QuizAnswer`：作答結構（questionId, value 1~5）
- `AxisScore`：軸向計分結果（axis, score, direction code）
- `QuizResult`：完整計分結果（typeCode, axisScores, gritIndex, flowIndex）
- `PersonalityType`：類型定義（code, nameZh, nameEn, color, description, keywords）
- `TrainingExercise`：練習項目（name, description）
- `TrainingDay`：訓練日（dayNumber, title, description, duration, exercises）
- `TrainingWeek`：訓練週（weekNumber, theme, days）
- `TrainingPlan`：訓練計畫（typeCode, weeks）

#### Scenario: 型別可被正確匯入

- **WHEN** 在任一 TypeScript 專案中 `import { QuizResult, PersonalityTypeCode } from '@nobodyclimb/types'`
- **THEN** 編譯通過，型別可用於變數宣告與函式簽章

#### Scenario: 型別與常數一致

- **WHEN** `packages/constants` 中的計分引擎回傳值
- **THEN** 回傳型別與 `packages/types` 中定義的 `QuizResult` 完全相符

---

### Requirement: 計分引擎單元測試

系統 SHALL 為計分引擎提供單元測試，覆蓋核心計分邏輯、邊界情境與附加指標。

#### Scenario: 測試覆蓋計分核心邏輯

- **WHEN** 執行計分引擎單元測試
- **THEN** 測試包含：全選最高分、全選最低分、明確偏左、明確偏右、單軸翻轉等情境，全部通過

#### Scenario: 測試覆蓋邊界情境

- **WHEN** 執行計分引擎單元測試
- **THEN** 測試包含：平手時取左方向、作答數量不足拋錯等邊界情境，全部通過

#### Scenario: 測試覆蓋附加指標

- **WHEN** 執行計分引擎單元測試
- **THEN** 測試包含：Grit 指標計算、Flow 指標計算、兩指標互補（和為 100）等情境，全部通過
