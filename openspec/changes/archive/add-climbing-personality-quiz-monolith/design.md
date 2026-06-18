## Context

NobodyClimb 是一個 pnpm + Turborepo monorepo，前端 Next.js 15 + Cloudflare Workers、後端 Hono + D1、Mobile 為 Expo + React Native。現有系統已有用戶認證（JWT）、Climber Rank 積分、AI 推薦、Biography 等功能。

本次新增攀岩人格測驗，採三階段交付（Phase 1 純前端 MVP → Phase 2 後端整合 → Phase 3 AI 整合）。設計需考慮 Web/Mobile 共用邏輯、Cloudflare 生態（D1/KV/R2/Workers）、以及與現有系統的整合點。

研究文件：`docs/research/climbing-personality-quiz-research.md`（學術研究）、`docs/research/climbing-personality-types-v2.md`（8 型文案 v2）。

## Goals / Non-Goals

**Goals:**
- Phase 1 可在 2-3 週內上線的純前端測驗，零後端依賴
- Web 和 Mobile 共用計分引擎和題目定義
- 分享卡在前端生成，不需後端支援
- 結果頁 SEO 友善，OG 預覽正確
- Phase 2 無縫銜接：加入後端不需重構前端

**Non-Goals:**
- Phase 1 不做登入/註冊流程（結果頁 CTA 導流）
- Phase 1 不做動態 OG 圖片（用預生成靜態圖）
- Phase 1 不做 Mobile App 測驗（先做 Web）
- 不做 AI 動態生成訓練計畫（Phase 3）
- 不做多語言（Phase 1 僅繁體中文）
- 不做 A/B 測試框架

## Decisions

### D1: 計分引擎放 packages/constants 而非後端

**選擇**：計分邏輯放在 `packages/constants/src/quiz/scoring.ts`，純函數、零依賴。

**替代方案**：
- 後端計分 API — 可防止前端篡改，但增加延遲和後端依賴
- 前端獨立實作 — Web/Mobile 各寫一份，會 diverge

**理由**：Phase 1 不需要後端，前端計分即時（0ms 延遲）。放 packages 確保 Web/Mobile 結果一致。Phase 2 後端可以用同一份邏輯做驗證。人格測驗沒有防弊需求（不像考試），前端計分完全合理。

### D2: Zustand + sessionStorage 管理測驗狀態

**選擇**：用 Zustand store 管理 24 題答案和進度，同步備份到 sessionStorage。

**替代方案**：
- URL query params — 每題答案寫入 URL，但 24 題會讓 URL 過長
- localStorage — 跨 session 持久，但測驗結果不應該長期存在未完成狀態
- React state — 頁面重整會遺失

**理由**：Zustand 是專案已有的 state 管理方案，sessionStorage 確保同一 session 不遺失但不會跨 session 留存。

### D3: 結果頁用 SSG + client-side 個人化

**選擇**：`/quiz/result/[type]` 以 SSG 預渲染 8 個靜態頁面，個人化數據（雷達圖百分比、指數）透過 URL query `?s=xxx`（base64 編碼）在 client-side 解碼繪製。

**替代方案**：
- 全 CSR — SEO 差，社群平台無法抓取內容
- SSR — 需要 Cloudflare Worker 跑 server-side rendering，增加複雜度
- 每個結果一個唯一 URL（如 `/quiz/result/PGB/abc123`）— 需要後端儲存

**理由**：SSG + client hydration 是最佳平衡。8 個靜態頁面 SEO 完美，OG 圖片預生成。個人化雷達圖用 client-side Canvas 繪製，`?s` 參數只影響客戶端渲染。分享連結帶 `?s` 時朋友看到個人化結果，不帶時看到型態預設值 + 「測測自己」CTA。

### D4: Canvas 前端生成分享卡，Phase 2 加 Satori OG

**選擇**：Phase 1 分享卡用 `html2canvas` 或原生 Canvas API 前端生成。OG 圖片用 8 張預生成靜態 PNG。Phase 2 用 Satori 在 Cloudflare Worker 動態生成帶個人化雷達圖的 OG 圖片。

**替代方案**：
- 全部 Satori — Phase 1 就需要後端
- Puppeteer/Playwright — 太重，不適合 Cloudflare Workers
- 第三方服務（如 Cloudinary）— 增加依賴和成本

**理由**：分離「使用者主動下載的分享卡」（前端 Canvas）和「社群平台自動抓取的 OG 圖片」（靜態/後端）。Phase 1 的 OG 圖片不需要個人化（每型一張固定圖就夠）。

### D5: 三層視覺設計的技術實現

**選擇**：
- Lottie JSON（結果頁大動畫）：用 `lottie-react`（Web）、`lottie-react-native`（Mobile）
- SVG（Badge、排名）：直接 inline SVG component
- 分享卡內嵌：將 SVG 繪製到 Canvas

**替代方案**：
- 全部用 SVG + CSS animation — 不夠靈活，三層效果難做
- GIF — 品質差、檔案大
- Video — 過度設計

**理由**：Lottie 是動畫最佳方案（小檔案、向量、跨平台），SVG 是靜態最佳方案。兩者共用同一設計源檔（After Effects / Figma → Lottie + SVG export）。

### D6: Phase 2 DB schema 設計

**選擇**：`quiz_results` 獨立表 + `users` 表加 2 個欄位（`personality_type`, `personality_taken_at`）。

**替代方案**：
- 只在 users 表加欄位 — 無法保留測驗歷史和原始答案
- 只用獨立表 — 每次查 Profile 都要 JOIN

**理由**：雙寫策略：`users` 表的欄位是快照（查 Profile 不需 JOIN），`quiz_results` 表保留完整歷史（支援重測、人格演化）。

### D7: 訓練計畫內容存放位置

**選擇**：訓練計畫內容放在 `packages/constants/src/quiz/training.ts`，以 TypeScript 物件定義。Phase 2 才存入 D1。

**替代方案**：
- Markdown 檔案 — 需要額外的解析邏輯
- 後端 API — Phase 1 不需要
- CMS — 過度設計

**理由**：與題目定義、型態定義同層級，Web/Mobile 共用。TypeScript 物件有型別檢查。內容量固定（8 型 × 4 週 × 3 天 = 96 個訓練單元），不需要動態 CMS。

## Risks / Trade-offs

- **[前端計分可被篡改]** → Phase 2 後端 API 做二次驗證；人格測驗無防弊需求
- **[Lottie 檔案大小]** → 每檔 < 30KB 限制；Landing 頁用簡化版；結果頁按需載入
- **[8 張靜態 OG 圖片無個人化]** → Phase 1 接受此限制；Phase 2 加 Satori 動態生成
- **[sessionStorage 跨裝置不同步]** → 測驗只有 24 題（3-5 分鐘），重做成本低
- **[Mobile App Phase 2 才做]** → Phase 1 Mobile 用戶可用 Web 版測驗（分享連結導入）
- **[訓練計畫內容品質]** → 模板化內容需要攀岩教練 review；Phase 1 先上線收回饋再迭代
