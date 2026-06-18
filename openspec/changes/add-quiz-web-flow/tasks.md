## 1. Quiz Layout 與路由結構

- [ ] 1.1 建立 `apps/web/src/app/[locale]/quiz/layout.tsx`：Quiz 專用 layout（無主站 nav/footer，僅 NobodyClimb logo 可點擊回首頁）
- [ ] 1.2 確認 `[locale]/quiz/` 路由群組不受主站 layout 的 header/footer 影響

## 2. Landing Page

- [ ] 2.1 實作 `apps/web/src/app/[locale]/quiz/page.tsx`：SSG Landing Page
- [ ] 2.2 實作 `apps/web/src/components/quiz/QuizLanding.tsx`：Hero 區塊（標題「你是哪種攀岩者？」、副標、8 型態 SVG 圖示預覽、「開始測驗」CTA 按鈕）
- [ ] 2.3 設定 Landing Page 的 SEO metadata（title、description、og:image 指向 `public/quiz/og/default.png`）

## 3. Zustand Store

- [ ] 3.1 建立 `apps/web/src/store/quizStore.ts`：answers（24 slots）、currentIndex、setAnswer、goNext、goPrev、reset
- [ ] 3.2 整合 Zustand `persist` middleware，storage 指定為 sessionStorage
- [ ] 3.3 實作 reset 邏輯：完成測驗跳轉結果頁後清除 store

## 4. 測驗頁

- [ ] 4.1 實作 `apps/web/src/app/[locale]/quiz/test/page.tsx`：CSR 測驗頁容器，組合 QuizQuestion + QuizProgress + 導航邏輯
- [ ] 4.2 實作 `apps/web/src/components/quiz/QuizQuestion.tsx`：單題卡片 + 5 級 Likert 按鈕（非常不同意 → 非常同意），選答後 auto-advance
- [ ] 4.3 實作 `apps/web/src/components/quiz/QuizProgress.tsx`：進度條 + 題號顯示（如「3 / 24」）
- [ ] 4.4 實作 `apps/web/src/components/quiz/QuizTransition.tsx`：題目切換動畫（Framer Motion slide/fade）
- [ ] 4.5 實作上一題功能：回到前一題時顯示先前選擇的答案，可重新選擇
- [ ] 4.6 實作完成邏輯：24 題全部作答後呼叫 `calculateResult(answers)`，編碼 `?s` 參數，跳轉 `/quiz/result/[type]?s=...`

## 5. 結果頁

- [ ] 5.1 實作 `apps/web/src/app/[locale]/quiz/result/[type]/page.tsx`：SSG 預渲染 8 頁（`generateStaticParams`），設定各型 metadata（title、description、og:image）
- [ ] 5.2 實作 `apps/web/src/components/quiz/ResultHero.tsx`：Lottie 三層動畫 + 型態代號 + 中英文名稱 + 金句
- [ ] 5.3 實作 `apps/web/src/components/quiz/ResultRadar.tsx`：3 軸雷達圖（Canvas 或 SVG），支援 `?s` 參數個人化百分比，無 `?s` 時用型態預設值
- [ ] 5.4 實作 `apps/web/src/components/quiz/ResultProfile.tsx`：恆毅力/心流指數 + 人格描述（2-3 段）+ Flow/Clutch 最佳狀態
- [ ] 5.5 實作 `apps/web/src/components/quiz/ResultStrengths.tsx`：優勢 x3 + 盲點 x3
- [ ] 5.6 實作 `apps/web/src/components/quiz/ResultTraining.tsx`：Week 1 標題 + Day 1 摘要清楚顯示，Week 2-4 blur + overlay 模糊化，底部「登入解鎖完整訓練計畫」CTA
- [ ] 5.7 實作 `apps/web/src/components/quiz/ResultCompat.tsx`：最佳拍檔 + 最大剋星（含圖示和連結至對方結果頁）
- [ ] 5.8 實作 URL `?s` 參數解碼邏輯：base64url → JSON → 3 軸百分比 + 指數，用於個人化 ResultRadar 和 ResultProfile
- [ ] 5.9 結果頁底部整合：分享按鈕 + 「重新測驗」按鈕 + 「加入 NobodyClimb」CTA

## 6. 分享卡生成

- [ ] 6.1 實作 `apps/web/src/components/quiz/ShareCard.tsx`：Canvas API 手動繪製 PNG，包含背景漸層（型態主色）、雷達圖、型態資訊（代號 + 名稱 + 金句）、指數、URL 文字
- [ ] 6.2 支援 3 種尺寸生成：1080x1080（IG/FB Post）、1080x1920（IG Story）、1200x628（OG/Twitter）
- [ ] 6.3 實作字體預載邏輯：確保 Canvas 繪製時字體已載入

## 7. 分享 Modal

- [ ] 7.1 實作 `apps/web/src/components/quiz/ShareModal.tsx`：分享方式選擇（IG Story 下載 / IG Post 下載 / 複製連結 / 下載圖片）
- [ ] 7.2 整合 Web Share API：手機環境偵測到 `navigator.share` 時優先使用系統分享面板
- [ ] 7.3 實作複製連結功能：複製帶 `?s` 參數的結果頁 URL

## 8. Collection 總覽頁

- [ ] 8.1 實作 `apps/web/src/app/[locale]/quiz/collection/page.tsx`：SSG 預渲染
- [ ] 8.2 實作 `apps/web/src/components/quiz/CollectionCard.tsx`：每型態卡片（SVG 圖示 + 名稱 + 金句 + 簡短描述），點擊連結至結果頁

## 9. OG 圖片與 SEO

- [ ] 9.1 放置 8 張預生成 OG 圖片至 `apps/web/public/quiz/og/`（命名：`pgb.png`...`tfs.png`，各 1200x628）
- [ ] 9.2 放置 Landing 通用 OG 圖片 `apps/web/public/quiz/og/default.png`
- [ ] 9.3 驗證 8 個結果頁的 og:title、og:description、og:image 正確設定
- [ ] 9.4 驗證 Collection 頁的 metadata 設定

## 10. 整合驗證

- [ ] 10.1 端對端測試：Landing → 24 題作答 → 計分跳轉 → 結果頁顯示個人化雷達圖
- [ ] 10.2 驗證 sessionStorage 持久化：中途關閉 → 重新開啟 `/quiz/test` → 從中斷處繼續
- [ ] 10.3 驗證分享卡生成：3 種尺寸 PNG 正確輸出，型態資訊和雷達圖正確
- [ ] 10.4 驗證 OG 預覽：LINE、Facebook、Twitter 分享連結顯示正確預覽
- [ ] 10.5 行動裝置 RWD 測試：測驗頁、結果頁、分享卡在手機上正常顯示
- [ ] 10.6 部署 preview 環境驗證 Cloudflare Workers SSG 正常運作
