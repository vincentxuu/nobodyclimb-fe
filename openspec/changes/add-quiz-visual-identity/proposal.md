# Change: 新增攀岩人格測驗視覺識別系統

## Why
攀岩人格測驗定義了 8 種人格類型（PGB Crusher、PGS Forger、PFB Wildfire、PFS Anchor、TGB Sniper、TGS Cipher、TFB Wanderer、TFS Zen），每種類型需要獨立的視覺品牌識別，用於測驗結果頁、個人檔案展示、社群分享 OG 圖。目前缺少對應的靜態圖標、動態動畫與社群分享圖片，無法在 Web 測驗流程與 Profile 頁面中呈現人格類型的視覺差異。

## What Changes
- 新增 8 組 SVG 靜態圖標，每組採用三層設計：L1 攀岩把手外框（crimp/pinch/volume/jug/side-pull/thin-crimp/sloper/slab-foothold）、L2 抽象符號、L3 隱藏動物圖騰
- 新增 8 組 Lottie JSON 動畫檔（2-3 秒循環，每檔 <30KB），敘事流程：把手漸入 -> 符號展開 -> 類型動態 -> 動物剪影浮現 -> 循環
- 新增 8+1 張 OG 靜態圖片（1200x628 PNG）：8 張各類型結果分享圖 + 1 張測驗入口通用圖
- 所有素材置於 `apps/web/public/quiz/` 與 `assets/personality/` 目錄
- 支援漸進式細節（progressive detail）：大尺寸顯示三層、中尺寸兩層（把手+符號）、小尺寸僅把手+色彩

## Impact
- Affected specs: 新增 `quiz-visual-identity` capability
- Affected code:
  - `assets/personality/svg/` — 8 個 SVG 檔案（新目錄）
  - `assets/personality/lottie/` — 8 個 Lottie JSON 檔案（新目錄）
  - `apps/web/public/quiz/og/` — 9 張 OG PNG 圖片（新目錄）
- Dependencies: 依賴 change `add-quiz-personality-model`（8 種人格類型定義與編碼系統）
