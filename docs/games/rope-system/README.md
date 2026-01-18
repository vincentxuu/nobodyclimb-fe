# 攀岩系統練習遊戲

> 透過互動式遊戲學習攀岩繩索系統操作，適用於自主學習與岩館教學認證。

## 專案目標

1. **教育目的**：讓攀岩者在遊戲中學會正確的繩索系統操作
2. **安全導向**：透過情境模擬，建立正確的安全觀念
3. **認證系統**：提供岩館教學考試使用，標準化能力認證

## 核心功能

### 前台（學員端）

| 功能 | 說明 |
|------|------|
| 學習模式 | 答錯顯示正確答案與詳細解釋 |
| 考試模式 | 計分認證，不顯示答案 |
| 限時挑戰 | 每題限時作答 |
| 進度追蹤 | 個人學習紀錄與成就 |

### 後台（岩館管理端）

| 功能 | 說明 |
|------|------|
| 題庫管理 | 新增、編輯、刪除題目 |
| 考卷編輯 | 從題庫選題組成考卷 |
| 學員管理 | 查看成績、發放認證 |
| 數據分析 | 答題正確率統計 |

## 題目分類

```
攀岩系統練習
│
├── 🏋️ 運動攀登 (Sport Climbing)
│   ├── 基礎確保
│   ├── 先鋒攀登
│   ├── 頂繩架設
│   └── 垂降系統
│
└── ⛰️ 傳統攀登 (Trad Climbing)
    ├── 固定點架設
    ├── 保護裝備放置
    ├── 多繩距系統
    └── 自我救援
```

## 遊戲特色

- **掉落動畫**：答錯時角色會像「小朋友下樓梯」遊戲一樣往下掉落
- **音效回饋**：正確/錯誤有不同音效，增加遊戲感
- **圖示輔助**：裝備圖示與操作動畫幫助理解
- **情境模擬**：真實攀岩情境，學以致用

## 文件導覽

### 規格文件

| 文件 | 說明 |
|------|------|
| [01-product-spec.md](./01-product-spec.md) | 產品規格、功能需求、認證等級 |
| [02-technical-architecture.md](./02-technical-architecture.md) | 技術架構、目錄結構、組件設計 |
| [03-database-schema.md](./03-database-schema.md) | 資料庫設計、欄位說明 |
| [04-ui-design.md](./04-ui-design.md) | UI 設計規範、動畫規格 |
| [references.md](./references.md) | 權威參考資料來源 |

### 題庫文件

| 文件 | 說明 |
|------|------|
| [questions/README.md](./questions/README.md) | 題目格式規範 |
| [questions/sport-01-belay.md](./questions/sport-01-belay.md) | 運動攀登 - 基礎確保 |
| [questions/sport-02-lead.md](./questions/sport-02-lead.md) | 運動攀登 - 先鋒攀登 |
| [questions/sport-03-toprope.md](./questions/sport-03-toprope.md) | 運動攀登 - 頂繩架設 |
| [questions/sport-04-rappel.md](./questions/sport-04-rappel.md) | 運動攀登 - 垂降系統 |
| [questions/trad-01-anchor.md](./questions/trad-01-anchor.md) | 傳統攀登 - 固定點架設 |
| [questions/trad-02-protection.md](./questions/trad-02-protection.md) | 傳統攀登 - 保護裝備 |
| [questions/trad-03-multipitch.md](./questions/trad-03-multipitch.md) | 傳統攀登 - 多繩距系統 |
| [questions/trad-04-rescue.md](./questions/trad-04-rescue.md) | 傳統攀登 - 自我救援 |

### 資源文件

| 文件 | 說明 |
|------|------|
| [assets/equipment-list.md](./assets/equipment-list.md) | 裝備圖示清單 |

## 開發階段

```
Phase 1 - 規格文件        [✅ 完成]
━━━━━━━━━━━━━━━━━━━━━━━━
- 產品規格、技術架構
- 資料庫設計、UI 設計
- 參考資料、裝備圖示清單

Phase 2 - 運動攀登題庫    [✅ 完成]
━━━━━━━━━━━━━━━━━━━━━━━━
- 基礎確保 15 題 ✓
- 先鋒攀登 20 題 ✓
- 頂繩架設 15 題 ✓
- 垂降系統 15 題 ✓
  小計：65 題

Phase 3 - 傳統攀登題庫    [✅ 完成]
━━━━━━━━━━━━━━━━━━━━━━━━
- 固定點架設 15 題 ✓
- 保護裝備 15 題 ✓
- 多繩距系統 15 題 ✓
- 自我救援 15 題 ✓
  小計：60 題

Phase 4 - 核心系統開發    [待開始]
━━━━━━━━━━━━━━━━━━━━━━━━
- 遊戲引擎與基礎 UI
- 選擇題、排序題邏輯
- 掉落動畫與音效

Phase 5 - 考試與後台      [待開始]
━━━━━━━━━━━━━━━━━━━━━━━━
- 考試模式
- 岩館後台管理
- 認證系統
```

**題庫總計：125 題**

## 相關連結

- 遊戲頁面：`/games/rope-system/`
- 後台管理：`/admin/games/`（規劃中）
