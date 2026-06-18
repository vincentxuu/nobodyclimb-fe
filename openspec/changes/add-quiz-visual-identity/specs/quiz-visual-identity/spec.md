## ADDED Requirements

### Requirement: 人格類型 SVG 靜態圖標
系統 SHALL 為每種攀岩人格類型提供 SVG 靜態圖標，採用三層設計（攀岩把手外框、抽象符號、隱藏動物圖騰），支援漸進式細節呈現。

#### Scenario: 大尺寸顯示三層完整圖標
- **WHEN** 圖標容器寬度 >= 96px
- **THEN** 顯示三層：L1 攀岩把手外框（`layer-hold`）、L2 抽象符號（`layer-symbol`）、L3 動物圖騰（`layer-animal`）

#### Scenario: 中尺寸顯示兩層圖標
- **WHEN** 圖標容器寬度 >= 48px 且 < 96px
- **THEN** 顯示兩層：L1 攀岩把手外框 + L2 抽象符號，隱藏 L3 動物圖騰

#### Scenario: 小尺寸顯示單層圖標
- **WHEN** 圖標容器寬度 < 48px
- **THEN** 僅顯示 L1 攀岩把手外框搭配類型主色，隱藏 L2 與 L3

#### Scenario: SVG 檔案格式一致性
- **WHEN** 載入任一類型的 SVG 圖標
- **THEN** viewBox SHALL 為 `0 0 200 200`，三層 SHALL 以 `<g id="layer-hold">` / `<g id="layer-symbol">` / `<g id="layer-animal">` 區分，檔案大小 SHALL < 10KB

### Requirement: 8 種人格類型視覺映射
系統 SHALL 為 8 種人格類型各定義唯一的把手形狀、抽象符號、動物圖騰與主色組合，確保視覺可區分性。

#### Scenario: PGB Crusher 視覺識別
- **WHEN** 使用者的人格類型為 PGB Crusher
- **THEN** 顯示 crimp 把手外框、碎裂岩石符號、大猩猩圖騰，主色為 #E84545

#### Scenario: PGS Forger 視覺識別
- **WHEN** 使用者的人格類型為 PGS Forger
- **THEN** 顯示 pinch 把手外框、鐵砧火花符號、公牛圖騰，主色為 #F4845F

#### Scenario: PFB Wildfire 視覺識別
- **WHEN** 使用者的人格類型為 PFB Wildfire
- **THEN** 顯示 volume 把手外框、蔓延火焰符號、赤狐圖騰，主色為 #F7B731

#### Scenario: PFS Anchor 視覺識別
- **WHEN** 使用者的人格類型為 PFS Anchor
- **THEN** 顯示 jug 把手外框、錨山形符號、山羊圖騰，主色為 #2C3E50

#### Scenario: TGB Sniper 視覺識別
- **WHEN** 使用者的人格類型為 TGB Sniper
- **THEN** 顯示 side-pull 把手外框、十字準星符號、獵隼圖騰，主色為 #27AE60

#### Scenario: TGS Cipher 視覺識別
- **WHEN** 使用者的人格類型為 TGS Cipher
- **THEN** 顯示 thin crimp 把手外框、齒輪鎖符號、章魚圖騰，主色為 #3742FA

#### Scenario: TFB Wanderer 視覺識別
- **WHEN** 使用者的人格類型為 TFB Wanderer
- **THEN** 顯示 sloper 把手外框、波浪風符號、信天翁圖騰，主色為 #0ABDE3

#### Scenario: TFS Zen 視覺識別
- **WHEN** 使用者的人格類型為 TFS Zen
- **THEN** 顯示 slab foothold 把手外框、圓相圓（Enso）符號、貓頭鷹圖騰，主色為 #6C5CE7

### Requirement: 人格類型 Lottie 動畫
系統 SHALL 為每種人格類型提供 Lottie JSON 動畫檔，遵循統一的五段敘事結構，適合 Web 嵌入播放。

#### Scenario: 動畫敘事結構
- **WHEN** 播放任一類型的 Lottie 動畫
- **THEN** 動畫 SHALL 依序呈現五段：把手形狀淡入（0-0.5s）、符號展開（0.5-1.2s）、類型專屬動態（1.2-2.0s）、動物剪影浮現（2.0-2.5s）、整體呼吸銜接循環（2.5-3.0s）

#### Scenario: 動畫技術規格
- **WHEN** 載入任一類型的 Lottie 動畫檔
- **THEN** 檔案大小 SHALL < 30KB，影格率 SHALL 為 60fps，動畫長度 SHALL 為 2.5-3.0 秒，SHALL 支援循環播放，SHALL 與 lottie-web 相容

#### Scenario: 動畫循環播放
- **WHEN** 動畫播放至最後一幀
- **THEN** SHALL 平滑銜接回第一幀，無明顯跳動或閃爍

### Requirement: OG 社群分享圖片
系統 SHALL 為測驗入口與每種人格類型結果頁提供符合 Open Graph 規格的分享圖片。

#### Scenario: 測驗入口通用 OG 圖
- **WHEN** 使用者分享測驗入口頁面連結
- **THEN** 社群平台 SHALL 顯示通用 OG 圖（`quiz-default.png`），包含 8 種類型圖標小尺寸排列與「發現你的攀岩人格」標題

#### Scenario: 類型結果 OG 圖
- **WHEN** 使用者分享其人格測驗結果頁面連結
- **THEN** 社群平台 SHALL 顯示該類型專屬 OG 圖，左側為類型圖標（三層全展開）置於主色背景圓形內，右側為類型名稱與中文副標題

#### Scenario: OG 圖片技術規格
- **WHEN** 社群平台抓取 OG 圖片
- **THEN** 圖片尺寸 SHALL 為 1200x628 像素，格式 SHALL 為 PNG，單張檔案大小 SHALL < 200KB

### Requirement: 視覺素材檔案結構與命名
系統 SHALL 以統一的檔案結構與命名慣例組織所有人格類型視覺素材。

#### Scenario: 檔案路徑正確
- **WHEN** 前端元件需要載入某類型的視覺素材
- **THEN** SVG 圖標位於 `assets/personality/svg/{type}.svg`，Lottie 動畫位於 `assets/personality/lottie/{type}.json`，OG 圖片位於 `apps/web/public/quiz/og/{type}.png`，其中 `{type}` 為小寫類型名稱（crusher/forger/wildfire/anchor/sniper/cipher/wanderer/zen）

#### Scenario: 命名與型別系統一致
- **WHEN** 新增或修改視覺素材檔案
- **THEN** 檔名 SHALL 與 `PersonalityType` enum 的 key 對應，確保程式碼可以 type key 動態組合路徑
