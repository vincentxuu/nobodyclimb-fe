## ADDED Requirements

### Requirement: 三層視覺設計

每個型態 SHALL 擁有三層視覺設計：
- **Layer 1 — 岩點外框**：以攀岩岩點類型（Crimp, Pinch, Volume, Jug, Side-pull, Thin Crimp, Sloper, Slab foothold）作為圖示的整體輪廓
- **Layer 2 — 抽象符號**：岩點內部的核心圖形，傳達性格本質（碎裂岩石、鐵砧火花、火焰、錨、十字準星、齒輪、波浪、禪圓）
- **Layer 3 — 動物圖騰**：隱藏在 Layer 2 線條中的動物輪廓（猩猩、公牛、赤狐、山羊、獵鷹、章魚、信天翁、貓頭鷹），作為彩蛋

#### Scenario: 大尺寸顯示三層

- **WHEN** 在結果頁以 200×200 以上尺寸顯示型態圖示
- **THEN** 三層皆可見：岩點外框 + 抽象符號 + 動物隱藏細節

#### Scenario: 小尺寸只顯示外框

- **WHEN** 在排名列表以 16-24px 顯示型態圖示
- **THEN** 僅顯示岩點外框 + 型態主色，省略 Layer 2 和 Layer 3

### Requirement: Lottie 動畫

每型態 SHALL 提供一個 Lottie JSON 動畫檔案，2-3 秒 loop，敘事結構：
1. 岩點形狀淡入（0-0.5s）
2. 抽象符號從中心展開（0.5-1.2s）
3. 型態特有動態（1.2-2.0s）
4. 動物輪廓隱現（2.0-2.5s）
5. 回到岩點形狀（loop）

每個 Lottie 檔案 SHALL < 30KB。

#### Scenario: 結果頁載入動畫

- **WHEN** 使用者進入碎岩者結果頁
- **THEN** 載入 `crusher.json` Lottie 並自動 loop 播放

#### Scenario: 首頁 8 圖示

- **WHEN** Landing Page 顯示 8 個型態預覽
- **THEN** 使用簡化版 Lottie 或靜態 SVG，總載入量 < 100KB

### Requirement: SVG 靜態圖示

每型態 SHALL 提供 SVG 靜態版本，用於：Profile Badge、排名列表、分享卡內嵌。SVG SHALL 支援多種尺寸渲染（16px - 200px）。

#### Scenario: Profile Badge 渲染

- **WHEN** Profile 頁顯示用戶人格徽章
- **THEN** 使用 SVG 靜態圖示，尺寸 40×40px

### Requirement: 配色系統

系統 SHALL 為 8 型態各定義一個主色，用於圖示、背景、分享卡：

PGB #E84545、PGS #F4845F、PFB #F7B731、PFS #2C3E50、TGB #27AE60、TGS #3742FA、TFB #0ABDE3、TFS #6C5CE7

#### Scenario: 分享卡背景色

- **WHEN** 生成碎岩者分享卡
- **THEN** 背景使用 #E84545 為基礎的深色調

### Requirement: 資產檔案結構

視覺資產 SHALL 放置於以下結構：

```
assets/personality/
├── lottie/     (8 個 .json)
├── svg/        (8 個 .svg)
└── og/         (8 個預生成 .png)
```

#### Scenario: Web 引用 Lottie

- **WHEN** Web 結果頁需要碎岩者動畫
- **THEN** 從 `assets/personality/lottie/crusher.json` 載入
