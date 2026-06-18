## Context

NobodyClimb Web 前端使用 Next.js 15 App Router + React 19，部署在 Cloudflare Workers（via OpenNext adapter）。現有路由結構在 `apps/web/src/app/[locale]/` 下按 domain 分群組。狀態管理用 Zustand（authStore、uiStore 等），伺服器狀態用 TanStack Query。

本 change 實作 Quiz 的 Web 前端流程，消費 `packages/constants/src/quiz/` 的共用計分引擎和題庫，以及 `assets/personality/` 的視覺資產。Phase 1 為純前端 MVP，不需後端 API。

依賴的上游 change：
- `add-quiz-personality-model`：提供 `@nobodyclimb/constants` 的 quiz 模組（questions、types、scoring、colors）
- `add-quiz-visual-identity`：提供 Lottie JSON、SVG、預生成 OG PNG

## Goals / Non-Goals

**Goals:**
- 完整的 Web 測驗流程：Landing → 24 題 → 結果 → 分享
- SSG 預渲染 Landing、8 結果頁、Collection，確保 SEO 和首次載入速度
- 前端生成分享卡（Canvas → PNG），不依賴後端
- 個人化雷達圖透過 URL `?s` 參數 client-side 渲染
- 與主站視覺分離的 Quiz 專用 layout

**Non-Goals:**
- Phase 1 不做後端 API 整合（結果儲存、統計）
- 不做動態 OG 圖片（Phase 2 Satori）
- 不做 Mobile App 測驗流程
- 不做登入/註冊流程（僅 CTA 導流）
- 不做 A/B 測試或分析追蹤

## Decisions

### D1: Quiz 路由放在 `[locale]/quiz/` route group

**選擇**：在 `apps/web/src/app/[locale]/quiz/` 下建立路由群組，搭配獨立 `layout.tsx`。

**替代方案**：
- 放在 `[locale]` 外的獨立 route group — 會失去 locale 支援
- 放在 `[locale]/(quiz)/` 用 route group parentheses — 不影響 URL，但語義不如直接路由清楚

**理由**：遵循現有專案慣例（crag、profile、blog 等都在 `[locale]` 下）。Quiz layout 透過自己的 `layout.tsx` 覆蓋主站 layout，不影響其他路由。

### D2: 測驗頁 CSR，結果頁 SSG + client hydration

**選擇**：
- `/quiz/test` 用 `'use client'` CSR：測驗互動密集，需要 Zustand store
- `/quiz/result/[type]` 用 `generateStaticParams` SSG 8 頁，個人化部分 client-side hydration
- `/quiz` 和 `/quiz/collection` 用 SSG

**替代方案**：
- 全部 CSR — SEO 差，社群爬取無內容
- 全部 SSR — 增加 Worker 負擔，測驗頁不需要 server data

**理由**：SSG 結果頁確保搜尋引擎和社群平台能抓取完整內容（title、description、og:image）。`?s` 參數只在 client-side 解碼，不影響 SSG 輸出。測驗頁是純互動，CSR 最合適。

### D3: Zustand store + sessionStorage 雙層持久化

**選擇**：`quizStore.ts` 管理 answers（24 元素陣列）、currentIndex、isComplete。用 Zustand `persist` middleware 同步到 sessionStorage。

**Store 結構**：
```typescript
interface QuizStore {
  answers: (number | null)[]  // 24 slots, 1-5 or null
  currentIndex: number
  setAnswer: (index: number, value: number) => void
  goNext: () => void
  goPrev: () => void
  reset: () => void
}
```

**替代方案**：
- localStorage — 跨 session 持久，但測驗不應殘留未完成狀態
- URL params — 24 題太多，URL 過長
- React state — 頁面重整遺失

**理由**：Zustand 是專案標準方案。sessionStorage 確保同一 session 內頁面重整不遺失，但關閉瀏覽器後自動清除。

### D4: Canvas API 生成分享卡

**選擇**：使用原生 Canvas API（非 html2canvas）手動繪製分享卡。

**流程**：
1. 建立 OffscreenCanvas（或 HTMLCanvasElement）
2. 繪製背景（漸層 + 型態主色）
3. 繪製雷達圖（與結果頁共用繪製邏輯）
4. 繪製文字（型態代號、名稱、金句、指數）
5. 繪製 SVG 圖示（Image → drawImage）
6. 繪製 URL 文字（nobodyclimb.cc/quiz）
7. canvas.toBlob('image/png') → 下載或 Web Share API

**替代方案**：
- html2canvas — 依賴 DOM 渲染，字體和樣式一致性差
- 後端生成 — Phase 1 不需要後端
- 第三方圖片服務 — 增加依賴和延遲

**理由**：原生 Canvas 完全控制輸出，無外部依賴，生成速度快（< 500ms）。雷達圖繪製邏輯可與結果頁的 Canvas/SVG 共用。

### D5: URL `?s` 參數編碼格式

**選擇**：base64url 編碼 JSON 字串，內含 3 軸百分比和附加指數。

**格式**：
```typescript
// 編碼
const payload = { b: 73, m: 62, d: 85, g: 96 }  // body%, motive%, mind%, grit/flow%
const s = btoa(JSON.stringify(payload))

// 結果 URL
/quiz/result/PGB?s=eyJiIjo3MywibSI6NjIsImQiOjg1LCJnIjo5Nn0
```

**替代方案**：
- 純數字拼接（如 `73-62-85-96`）— 不可擴展
- 完整 answers 陣列 — URL 過長（24 個數字）
- 後端 short ID — 需要後端

**理由**：base64url 足夠短（~50 字元），可解碼還原個人化數據。只傳百分比和指數（4 個數字），不傳原始答案，保持 URL 精簡。

### D6: 結果頁訓練預覽設計

**選擇**：顯示 Week 1 標題 + Day 1 完整摘要，Week 2-4 以 CSS blur + overlay 模糊化，底部放「登入解鎖完整訓練計畫」CTA。

**實作**：
```tsx
<div className="space-y-4">
  {/* Week 1: 清楚可見 */}
  <TrainingWeekCard week={1} data={plan.weeks[0]} />
  {/* Week 2-4: 模糊 + overlay */}
  <div className="relative">
    <div className="blur-sm opacity-50 pointer-events-none">
      <TrainingWeekCard week={2} data={plan.weeks[1]} />
      <TrainingWeekCard week={3} data={plan.weeks[2]} />
      <TrainingWeekCard week={4} data={plan.weeks[3]} />
    </div>
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white/80">
      <LoginCTA text="登入解鎖完整 4 週訓練計畫" />
    </div>
  </div>
</div>
```

**理由**：給用戶足夠的內容預覽（Week 1 完整可見）來建立價值感，模糊化其餘內容製造「想要更多」的動機，CTA 導流至註冊。

## Risks / Trade-offs

- **[Lottie 檔案載入]** → 結果頁按需載入單一 Lottie（< 30KB）；Landing 頁用靜態 SVG 或簡化版 → 總量 < 100KB
- **[Canvas 分享卡跨瀏覽器]** → 原生 Canvas API 相容性佳（IE11+ 全支援）；字體需預載確保一致性
- **[SSG 8 頁 build 時間]** → 8 頁靜態生成對 build 時間影響極小
- **[?s 參數可被篡改]** → 人格測驗無防弊需求；篡改只影響雷達圖顯示，不影響型態描述
- **[Web Share API 支援度]** → 有 feature detection fallback，桌面環境顯示下載選項

## Open Questions

- Lottie 播放器選用 `lottie-react`（較成熟）或 `@lottiefiles/dotlottie-react`（較新、支援 dotLottie 格式）？建議 Phase 1 用 `lottie-react`。
