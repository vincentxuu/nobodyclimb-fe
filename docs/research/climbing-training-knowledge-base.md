# 攀岩訓練知識庫架構

> 日期：2026-06-24
> 關聯 Changes：⑤ add-quiz-training-ui, ⑨ add-quiz-ai-training

---

## 三層架構

### Layer 1: 訓練資料庫（已建立）

檔案：`packages/constants/src/training-programs.ts`（1204 行）

| 匯出 | 數量 | 內容 |
|------|------|------|
| `PERIODIZATION_MODELS` | 4 模型 | 線性、共軛、並行、肌力連續體 |
| `HORST_4_3_2_1_CYCLE` | 1 | Horst 10 週中週期 |
| `TAPER_GUIDELINES` | 1 | Mujika/Bosquet 減量研究 |
| `EXERCISE_PROTOCOLS` | 27 練習 | 7 分類（hangboard, campus, pull-ups, core, endurance, technique, mental） |
| `TRAINING_BY_LEVEL` | 3 等級 | beginner / intermediate / advanced |
| `ANTI_STYLE_PROTOCOLS` | 6 模板 | 反風格訓練方案 |

資料來源：Horst, Maisch, Rucci, Consuegra, Climbing Doctor, PMC study (2021)

### Layer 2: 人格 × 學派對照（待建構）

檔案：`packages/constants/src/quiz/training.ts`

每個人格型態對應：
- 主要參考學派
- 4 週 × 3 天訓練計畫（引用 Layer 1 的 exercise ID）
- 畢業測試

| 人格 | 主要學派 | Anti-style Protocol | 訓練重點 |
|------|---------|-------------------|---------|
| 🌋 碎岩者 PGB | MacLeod + Climbing Bible 技巧篇 | strong_climber_weak_technique | silent feet, hover hand, down-climbing |
| 🔨 鍛造者 PGS | Anderson 嚴格週期化 | power_needs_endurance + mental | onsight 練習、即興應變 |
| 🔥 野火 PFB | Bechtel 非線性週期化 | power_climber_needs_endurance | 4x4, ARC, route intervals |
| ⚓ 恆者 PFS | Horst 工具箱 + 目標設定 | mental（重新定義為缺乏目標） | visualization, self-assessment, 目標路線 |
| 🎯 狙擊手 TGB | Beastmaking + 力量補強 | endurance_climber_needs_power | max hangs, campus, power pull-ups |
| 🔐 解碼者 TGS | Climbing Bible + Strong Mind | mental（重新定義為缺乏行動） | progressive relax, 墜落練習, onsight |
| 🌊 浪人 TFB | 日本學派（チバトレ） | boulder_to_sport 反轉 → 結構化 | 指力板, 固定課表, 攀爬日誌 |
| 🧘 禪者 TFS | Anderson（用結構打破舒適圈） | endurance_climber_needs_power | 強度刺激, 不舒適容忍 |

### Layer 3: AI 微調層（⑨ change）

檔案：`backend/src/services/ai-training.ts`

AI 角色：**個人化調整器**，不是教練。

可調整：
- 組數和強度（根據完成率和回饋）
- 替換等價練習（根據可用設備）
- 難度描述（配合用戶等級）
- 個人化鼓勵文字
- 根據上週表現調整本週重點

不可調整：
- 訓練階段順序（週期化結構）
- 核心練習類型（安全基線）
- 休息日安排（避免過度訓練）

---

## 訓練學派 × 人格型態設計依據

資料來源：`docs/research/climbing-personality-quiz-research.md` + 用戶文章 `climbing-books-knowledge-map.md`

### 六大訓練學派

| 學派 | 代表人物/書 | 核心哲學 | 適合的人格 |
|------|-----------|---------|-----------|
| Horst 工具箱派 | Training for Climbing | 給你所有選項，自己組合 | 恆者、野火 |
| Anderson 嚴格週期化 | Rock Climber's Training Manual | 照表操課，線性進步 | 鍛造者、解碼者、禪者 |
| MacLeod 反教條 | 9 Out of 10 Climbers | 瓶頸不是力量，是技術/心態/生活 | 碎岩者（解藥） |
| Bechtel 肌力優先 | Logical Progression | 非線性週期化，每次練不一樣 | 野火 |
| 北歐派 | The Climbing Bible | 一站式最完整方案 | 解碼者、全型態基礎 |
| 日本學派 | チバトレ、東秀磯 | 身體感覺、不要用力 | 浪人、禪者 |

### 五大心理流派

| 流派 | 代表 | 核心方法 | 適合的軸向 |
|------|------|---------|-----------|
| 戰士哲學 | Ilgner / Rock Warrior's Way | 正念、感知風險 vs 真實風險 | Steady 型突破 |
| 認知行為 | McGrath / Vertical Mind | CBT、神經科學 | Bold 型平衡 |
| 精英經驗 | Moffatt / Mastermind | 第一手「對我有效」 | 碎岩者、狙擊手 |
| ACT 教練 | Findlay / Strong Mind | 接納恐懼，不消除恐懼 | 全型態，特別 Steady |
| 日本體感 | チバトレ | 四足二軸、身體感覺培養 | 浪人、禪者 |
