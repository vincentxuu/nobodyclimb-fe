## Context
攀岩人格測驗共 8 種類型，每種需要完整視覺識別素材（靜態圖標、動態動畫、社群分享圖）。視覺系統需跨 Web 測驗結果頁、Profile 人格展示、社群 OG 分享三種場景使用，且需支援不同尺寸下的漸進式細節呈現。

## Goals / Non-Goals
- Goals:
  - 建立 8 種人格類型的視覺品牌識別，每種有獨特的把手、符號、動物、色彩組合
  - SVG 圖標支援三層漸進式細節（large/medium/small）
  - Lottie 動畫保持 <30KB、2-3 秒循環，適合 Web 嵌入
  - OG 圖片符合社群平台規格（1200x628 PNG）
- Non-Goals:
  - 不在本變更實作前端元件（由 `add-quiz-web-flow` 負責）
  - 不在本變更處理動畫播放邏輯或 React 整合
  - 不製作影片格式素材

## Decisions

### Decision: 三層圖標設計系統
每個人格類型的 SVG 圖標分為三層，各層以 CSS class 或 SVG group id 區分，前端可依容器尺寸選擇性顯示：

| 層級 | 說明 | SVG group id | 顯示條件 |
|------|------|-------------|---------|
| L1 | 攀岩把手外框 | `layer-hold` | 所有尺寸（>= 24px） |
| L2 | 抽象符號 | `layer-symbol` | 中/大尺寸（>= 48px） |
| L3 | 隱藏動物圖騰 | `layer-animal` | 僅大尺寸（>= 96px） |

- Alternatives considered: 單層圖標（較簡單但無法漸進），三個獨立檔案（增加 HTTP 請求）
- Rationale: 單檔三層讓前端以 CSS `display` 切換即可，無需多次載入

### Decision: 8 種類型視覺映射表

| 類型代碼 | 名稱 | L1 把手 | L2 符號 | L3 動物 | 主色 |
|---------|------|---------|---------|---------|------|
| PGB | Crusher | Crimp（摳點） | 碎裂岩石 | 大猩猩 | #E84545 |
| PGS | Forger | Pinch（捏點） | 鐵砧+火花 | 公牛 | #F4845F |
| PFB | Wildfire | Volume（大體積） | 蔓延火焰 | 赤狐 | #F7B731 |
| PFS | Anchor | Jug（大把手） | 錨/山形 | 山羊 | #2C3E50 |
| TGB | Sniper | Side-pull（側拉） | 十字準星 | 獵隼 | #27AE60 |
| TGS | Cipher | Thin crimp（薄摳點） | 齒輪/鎖 | 章魚 | #3742FA |
| TFB | Wanderer | Sloper（斜面） | 波浪/風 | 信天翁 | #0ABDE3 |
| TFS | Zen | Slab foothold（板面腳點） | 圓相圓（Enso） | 貓頭鷹 | #6C5CE7 |

### Decision: Lottie 動畫敘事流程
每個動畫遵循統一的五段敘事結構，確保視覺一致性：

```
0.0s - 0.5s  把手形狀淡入（L1 fade-in + scale 0.8 -> 1.0）
0.5s - 1.2s  符號展開（L2 從中心向外展開，帶類型色彩）
1.2s - 2.0s  類型專屬動態（各類型不同，見下方）
2.0s - 2.5s  動物剪影浮現（L3 opacity 0 -> 0.3，若有）
2.5s - 3.0s  整體微微呼吸（scale 1.0 -> 1.02 -> 1.0），銜接循環
```

類型專屬動態（1.2s - 2.0s）：
- Crusher: 岩石碎裂粒子效果
- Forger: 火花飛濺
- Wildfire: 火焰蔓延脈動
- Anchor: 穩定錨定下沉
- Sniper: 準星鎖定聚焦
- Cipher: 齒輪旋轉
- Wanderer: 波浪飄動
- Zen: 圓相筆觸繪製

### Decision: 檔案結構與命名慣例
```
assets/personality/
├── svg/
│   ├── crusher.svg          # PGB
│   ├── forger.svg           # PGS
│   ├── wildfire.svg         # PFB
│   ├── anchor.svg           # PFS
│   ├── sniper.svg           # TGB
│   ├── cipher.svg           # TGS
│   ├── wanderer.svg         # TFB
│   └── zen.svg              # TFS
└── lottie/
    ├── crusher.json         # PGB
    ├── forger.json          # PGS
    ├── wildfire.json        # PFB
    ├── anchor.json          # PFS
    ├── sniper.json          # TGB
    ├── cipher.json          # TGS
    ├── wanderer.json        # TFB
    └── zen.json             # TFS

apps/web/public/quiz/og/
├── quiz-default.png         # 測驗入口通用 OG 圖
├── crusher.png              # PGB 結果分享圖
├── forger.png               # PGS 結果分享圖
├── wildfire.png             # PFB 結果分享圖
├── anchor.png               # PFS 結果分享圖
├── sniper.png               # TGB 結果分享圖
├── cipher.png               # TGS 結果分享圖
├── wanderer.png             # TFB 結果分享圖
└── zen.png                  # TFS 結果分享圖
```

- 命名一律使用小寫類型名稱（不含前綴代碼），與程式碼中 `PersonalityType` enum 的 key 一致
- SVG viewBox 統一 `0 0 200 200`（正方形）
- OG 圖片統一 `1200 x 628`（符合 Open Graph 規格）

### Decision: OG 圖片設計規範
每張 OG 圖包含：
- 左側 40%：該類型 SVG 圖標（三層全展開）置於主色背景圓形內
- 右側 60%：類型名稱（英文大字）、中文副標題、NobodyClimb logo
- 底部：漸層色帶（主色 -> 深色）
- 通用入口圖：8 種圖標小尺寸排列 + 「發現你的攀岩人格」標題

## Risks / Trade-offs
- 風險：Lottie JSON 超過 30KB 限制
  - 緩解：限制路徑節點數，使用簡單形狀而非複雜曲線；必要時移除 L3 動物層動畫
- 風險：SVG 三層在小螢幕渲染效能
  - 緩解：前端以 CSS `display:none` 隱藏不需要的層，而非移除 DOM 節點
- 風險：OG 圖片檔案過大影響載入
  - 緩解：PNG 壓縮至 <200KB/張，考慮後續轉 WebP

## Open Questions
- Lottie 動畫是否需要支援 dark mode 變體？目前規劃僅單色版。
- OG 圖片是否需要多語言版本？目前規劃中英雙語混排。
