## 1. 安裝與基礎設定

- [x] 1.1 安裝 `next-intl` 套件（`pnpm add next-intl` in `apps/web`）
- [x] 1.2 建立 `apps/web/src/i18n/routing.ts`：定義 `locales = ['zh', 'en', 'ja']`、`defaultLocale = 'zh'`、`localePrefix: 'as-needed'`
- [x] 1.3 建立 `apps/web/src/i18n/request.ts`：設定 `getRequestConfig`，載入對應語言的 messages JSON
- [x] 1.4 建立 `apps/web/src/middleware.ts`：以 `createNavigation` routing config 建立 next-intl middleware，匹配所有非 `_next`、`api`、靜態資源路徑
- [x] 1.5 建立型別設定 `apps/web/src/i18n/types.d.ts`（或 global.d.ts），將 `Messages` 型別指向 `zh.json`，啟用型別安全 key

## 2. 翻譯訊息檔

- [x] 2.1 建立 `apps/web/messages/zh.json`：涵蓋 Navbar、Footer 所有現有文字
- [x] 2.2 建立 `apps/web/messages/zh.json` 繼續：涵蓋首頁、岩場、攀岩館、影片、個人頁等主要頁面的 UI 文字
- [x] 2.3 建立 `apps/web/messages/en.json`：對應所有 zh.json key，填入英文翻譯
- [x] 2.4 建立 `apps/web/messages/ja.json`：對應所有 zh.json key，填入日文翻譯

## 3. App Router 目錄遷移

- [x] 3.1 建立 `apps/web/src/app/[locale]/` 目錄
- [x] 3.2 建立 `apps/web/src/app/[locale]/layout.tsx`：設定 `<html lang={locale}>`、套用 `NextIntlClientProvider`，保留現有 Providers、Navbar、Footer 結構
- [x] 3.3 將現有 `apps/web/src/app/page.tsx`（首頁）移入 `app/[locale]/page.tsx`
- [x] 3.4 將 `app/about/`、`app/auth/`、`app/biography/` 移入 `app/[locale]/`
- [x] 3.5 將 `app/blog/`、`app/bucket-list/`、`app/crag/` 移入 `app/[locale]/`
- [x] 3.6 將 `app/gallery/`、`app/games/`、`app/gym/` 移入 `app/[locale]/`
- [x] 3.7 將 `app/profile/`、`app/search/`、`app/share/`、`app/story/`、`app/videos/` 移入 `app/[locale]/`
- [x] 3.8 確認 `app/admin/`、`app/api/`、`app/upload/` 是否需移入 locale 層（`admin` 建議移入，`api` route handlers 不需移入）
- [x] 3.9 更新 root `app/layout.tsx`：移除原本完整 layout，改為最簡 HTML shell（`<html><body>`），locale layout 接管所有邏輯
- [x] 3.10 確認所有頁面 import 路徑無誤（`@/` alias 不受影響）

## 4. 元件翻譯整合

- [x] 4.1 更新 `Navbar`：將硬編碼中文文字改為 `useTranslations('Navbar')` 取用
- [x] 4.2 更新 `Footer`：將硬編碼文字改為 `getTranslations('Footer')` 取用（Server Component）
- [x] 4.3 新增 `apps/web/src/components/layout/locale-switcher.tsx`：語言切換 UI，切換時保留當前路徑 segment
- [x] 4.4 將 LocaleSwitcher 加入 Navbar

## 5. SEO 更新

- [x] 5.1 建立共用 helper `apps/web/src/lib/i18n-metadata.ts`：產生 hreflang `alternates.languages` 物件（接受路徑，輸出三語言 URL map）
- [x] 5.2 更新首頁 `generateMetadata`：接受 `params.locale`，回傳對應語言 title/description 及 hreflang
- [x] 5.3 更新 `/crag`、`/crag/[id]` 頁面的 `generateMetadata`
- [x] 5.4 更新 `/gym`、`/gym/[id]` 頁面的 `generateMetadata`
- [x] 5.5 更新 `/blog`、`/profile` 等其餘有 `generateMetadata` 的頁面
- [x] 5.6 更新 `apps/web/src/app/sitemap.ts`：輸出三語言 URL（`/path`、`/en/path`、`/ja/path`）
- [x] 5.7 更新 `generateStaticParams` 加入 `locale` 維度（靜態生成頁面需涵蓋三語言）

## 6. 驗證

- [x] 6.1 本地執行 `pnpm typecheck`：確認無 i18n key 型別錯誤（pre-existing 錯誤不計）
- [ ] 6.2 本地執行 `pnpm build:web`：確認 build 成功無 edge runtime 錯誤
- [ ] 6.3 訪問 `/`、`/en/`、`/ja/` 確認語言正確切換
- [ ] 6.4 確認 `/crag` 可訪問（middleware 不影響現有路徑）
- [ ] 6.5 檢查 `/en/crag` 的 `<head>` 包含三個 hreflang alternate link
- [ ] 6.6 確認 `/sitemap.xml` 包含三語言 URL
