## ADDED Requirements

### Requirement: 三軸人格模型定義

系統 SHALL 定義三個獨立的人格維度軸，每軸兩極：

- **Body（身體風格）**：Power (P) ◄──► Technique (T)
- **Motive（攀爬動機）**：Goal (G) ◄──► Free (F)
- **Mind（心理模式）**：Bold (B) ◄──► Steady (S)

三軸組合產生 8 個主要人格型態，每型以 3 字母代號表示。

#### Scenario: 型態代號對應

- **WHEN** 系統需要表示一個人格型態
- **THEN** 使用以下 8 個代號之一：PGB、PGS、PFB、PFS、TGB、TGS、TFB、TFS

### Requirement: 八型態定義

系統 SHALL 為每個型態定義以下屬性：

| 代號 | 中文名 | 英文名 | 主色 |
|------|--------|--------|------|
| PGB | 碎岩者 | Crusher | #E84545 |
| PGS | 鍛造者 | Forger | #F4845F |
| PFB | 野火 | Wildfire | #F7B731 |
| PFS | 恆者 | Anchor | #2C3E50 |
| TGB | 狙擊手 | Sniper | #27AE60 |
| TGS | 解碼者 | Cipher | #3742FA |
| TFB | 浪人 | Wanderer | #0ABDE3 |
| TFS | 禪者 | Zen | #6C5CE7 |

每型態 SHALL 包含：名稱、金句、描述（2-3 段）、最佳狀態（Flow/Clutch 變體）、優勢×3、盲點×3、訓練處方摘要、最佳拍檔、最大剋星。

#### Scenario: 查詢型態完整資料

- **WHEN** 前端請求型態 PGB 的資料
- **THEN** 回傳碎岩者的完整定義，包含名稱、金句、描述、優勢、盲點、訓練處方、配色等所有屬性

### Requirement: 題庫定義

系統 SHALL 定義 24 題，每軸 8 題（正向 4 題 + 反向 4 題）。每題 SHALL 包含：

- `id`: 唯一識別碼（如 'F1', 'P3', 'B7'）
- `text`: 題目文字（繁體中文）
- `axis`: 所屬軸（'body' | 'motive' | 'mind'）
- `direction`: 同意時偏向的極（'left' | 'right'），left = Power/Goal/Bold，right = Technique/Free/Steady

題目 SHALL 使用攀岩場景陳述，不存在「正確答案」，兩極的回答都應讓使用者感到認同。

#### Scenario: 題目均勻分佈

- **WHEN** 載入題庫
- **THEN** body 軸 8 題、motive 軸 8 題、mind 軸 8 題，每軸正向反向各 4 題

#### Scenario: 題目隨機排序

- **WHEN** 使用者開始測驗
- **THEN** 24 題以預定義的打散順序呈現，同軸題目至少間隔 2 題

### Requirement: 計分引擎

系統 SHALL 提供純函數計分引擎，接受 24 個答案（1-5 分），回傳人格結果。

計分邏輯：
1. 每軸分別累計 left 方向和 right 方向的原始分數
2. left 方向題：直接計分（同意=5, 不同意=1）
3. right 方向題：反轉計分（同意=1, 不同意=5）→ 加入 left 累計
4. 每軸百分比 = leftScore / (leftScore + rightScore) × 100
5. 百分比 > 50% → 取 left 極字母（P/G/B），否則取 right 極字母（T/F/S）
6. 三軸字母組合 = 型態代號

#### Scenario: 全部選非常同意

- **WHEN** 24 題全選「非常同意」（5 分）
- **THEN** 每軸 left 方向得 20 分，right 方向反轉後得 4 分（每題 6-5=1），百分比 = 20/24 ≈ 83%，結果為 PGB

#### Scenario: 全部選中立

- **WHEN** 24 題全選「中立」（3 分）
- **THEN** 每軸百分比接近 50%，結果取決於微小差異，系統 SHALL 在完全 50% 時預設取 left 極

### Requirement: 附加指數計算

系統 SHALL 根據型態的 Motive 軸方向計算附加指數：

- Goal 端型態（PGB、PGS、TGB、TGS）：計算**恆毅力指數**（0-100%），基於 P1、P3、P5、P7 題加權分數
- Free 端型態（PFB、PFS、TFB、TFS）：計算**心流指數**（0-100%），基於 P2、P4、P6、P8 + B2、B4、B6 題加權分數

#### Scenario: 碎岩者恆毅力指數

- **WHEN** 用戶結果為 PGB，P1=5, P3=4, P5=5, P7=4
- **THEN** 恆毅力指數 = (5×1.5 + 4×1.0 + 5×1.5 + 4×1.0) / 23 × 100 ≈ 96%

#### Scenario: 禪者心流指數

- **WHEN** 用戶結果為 TFS
- **THEN** 系統計算心流指數，不計算恆毅力指數

### Requirement: 共用套件位置

計分引擎、題庫定義、型態定義 SHALL 放置於 `packages/constants/src/quiz/`，供 Web 和 Mobile 共用。型別定義 SHALL 放置於 `packages/types/src/quiz.ts`。

#### Scenario: Web 和 Mobile 引用同一份計分邏輯

- **WHEN** Web 呼叫 `calculateResult(answers)` 和 Mobile 呼叫同一函數
- **THEN** 相同的 answers 輸入 SHALL 產生完全相同的結果
