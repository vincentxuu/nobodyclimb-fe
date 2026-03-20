## Why

NobodyClimb 目前介面全為繁體中文硬編碼，無法服務日文使用者及英語圈攀岩者，限制了社群的國際成長潛力。加入多語言支援（繁中預設、英文、日文）並搭配 URL prefix routing，可提升 SEO 可索引性並降低國際用戶的進入門檻。

## What Changes

- 安裝並整合 `next-intl`，採用 App Router 原生支援模式
- 新增 middleware，依 URL prefix（`/zh`、`/en`、`/ja`）自動路由語言，預設語言 `/zh` 可不帶 prefix（`localePrefix: 'as-needed'`）
- App Router 目錄結構調整為 `app/[locale]/`，所有頁面套用語言 context
- 建立翻譯訊息檔：`messages/zh.json`、`messages/en.json`、`messages/ja.json`
- 更新 `generateMetadata` 回傳各語言 `title`、`description`、`hreflang` alternate links
- 更新 `sitemap.ts` 輸出三語言版本 URL
- 語言切換 UI 元件加入 Navbar
- **BREAKING**：所有頁面路由加上 `[locale]` 前綴，現有無前綴 URL 需 redirect 至 `/zh/...`

## Capabilities

### New Capabilities
- `i18n-routing`: next-intl middleware 設定、locale 偵測與 URL prefix 路由規則
- `i18n-translations`: 翻譯訊息檔架構、Server/Client Component 取用方式、型別安全 key
- `i18n-seo`: generateMetadata 多語言化、hreflang alternate、sitemap 多語言 URL

### Modified Capabilities
（無需修改現有 spec 的需求層，i18n 為新增能力）

## Impact

- **前端目錄結構**：`apps/web/src/app/` → 加入 `[locale]/` 層
- **Navbar**：新增語言切換元件
- **所有 `generateMetadata`**：改為接受 locale 參數
- **`sitemap.ts` / `robots.ts`**：更新輸出三語言 URL
- **`middleware.ts`**：新增（或合併至現有）next-intl createMiddleware
- **Cloudflare Workers**：edge runtime 相容，next-intl 不使用 `fs`，無需額外設定
- **依賴新增**：`next-intl` ^3.x
