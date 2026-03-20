## Context

NobodyClimb web frontend 使用 Next.js 15 App Router，部署於 Cloudflare Workers（via OpenNext.js）。目前所有頁面文字硬編碼為繁體中文，無 middleware.ts，App Router 目錄為 `apps/web/src/app/`。需加入三語系支援（zh 預設、en、ja）並維持 SEO（metadata、hreflang、sitemap）。

## Goals / Non-Goals

**Goals:**
- 繁體中文為預設語言，URL 不帶 `/zh` prefix（`localePrefix: 'as-needed'`）
- 英文、日文使用 `/en/...`、`/ja/...` prefix
- Server Components 可直接取用翻譯（無 client hydration 開銷）
- `generateMetadata` 輸出各語言 title/description 及 hreflang alternate links
- sitemap.ts 輸出三語言完整 URL 集合
- Navbar 新增語言切換 UI

**Non-Goals:**
- 後端 API 多語言化（API 回傳資料不翻譯）
- 動態內容（用戶發文、岩場名稱）的翻譯
- 自動機器翻譯
- Mobile app 多語言化

## Decisions

### 1. 套件選擇：next-intl ^3.x

**選擇 next-intl，不用 next-i18next 或原生 next.js i18n**

- next-intl 是 App Router 的一流公民，支援 Server Components async/await 取用翻譯
- next-i18next 設計給 Pages Router，App Router 支援有限
- Next.js 內建 i18n routing 不支援 App Router（已移除）
- next-intl 不使用 `fs`，相容 Cloudflare edge runtime

### 2. locale prefix 策略：`as-needed`

```
/ → 繁中（無 prefix）
/en/... → 英文
/ja/... → 日文
```

**選擇 `as-needed` 不用 `always`（`/zh/...`）**

- 現有使用者連結（`/crag`、`/gym` 等）不會壞掉
- SEO 主要語言保持最短路徑
- 中文使用者體驗無縫接軌
- hreflang 仍正確聲明 `zh` 語言給搜尋引擎

### 3. App Router 目錄結構

```
apps/web/src/app/
├── [locale]/           ← 新增 locale 層
│   ├── layout.tsx      ← 設定 <html lang={locale}>、NextIntlClientProvider
│   ├── page.tsx
│   ├── crag/
│   ├── gym/
│   └── ...（所有現有頁面移入）
├── layout.tsx          ← 保留 root layout（極簡，僅處理 redirect）
└── ...（sitemap、robots 留在 root）
```

**選擇 App Router 原生 `[locale]` 層，不用 i18n 子路由 workaround**

- next-intl 官方推薦方式
- Server Components 直接 `await getTranslations()` 無需 context provider 傳遞

### 4. 翻譯訊息檔位置

```
apps/web/messages/
├── zh.json
├── en.json
└── ja.json
```

JSON 扁平或巢狀結構均可；建議以頁面/元件為 namespace：

```json
{
  "Navbar": { "home": "首頁", "crag": "岩場" },
  "HomePage": { "hero": "台灣攀岩社群" }
}
```

### 5. middleware.ts 整合

next-intl middleware 以 `createMiddleware` 建立，若未來有 auth middleware 需以 `chain` 模式合併。

## Risks / Trade-offs

- **目錄大搬遷**：所有 `app/` 下頁面需移入 `app/[locale]/`，PR diff 大但邏輯不變 → 建議一次性 migration commit
- **現有 URL redirect**：`/crag` 等無 locale prefix 的路徑，middleware 須設定 default redirect 至 `/crag`（zh）→ next-intl `localePrefix: 'as-needed'` 自動處理
- **Cloudflare OpenNext 相容性**：next-intl 已有官方 Cloudflare 相容文件，edge runtime 下不使用 fs → 低風險
- **翻譯維護成本**：en/ja 翻譯為手動，初期可以 key = 中文原意的英文 fallback → 確保 build 不爆，後續補齊翻譯

## Migration Plan

1. 安裝 `next-intl`
2. 新增 `apps/web/messages/zh.json`（含現有所有 UI 文字）
3. 新增 `apps/web/src/middleware.ts`（next-intl createMiddleware）
4. 將 `apps/web/src/app/` 所有頁面移入 `app/[locale]/`
5. 更新 root layout 及 locale layout（NextIntlClientProvider）
6. 逐頁更新 `generateMetadata` 加入 hreflang
7. 更新 sitemap.ts 輸出三語言 URL
8. 新增 Navbar 語言切換元件
9. 新增 `en.json`、`ja.json`（初期 key 可 fallback 至英文原文）

**Rollback**：next-intl middleware 移除後回復原目錄結構即可，無資料庫變更。

## Open Questions

- 語言切換後是否維持當前頁面路徑？（e.g., `/en/crag/12` → `/ja/crag/12`）→ 建議是，切換時替換 locale segment
- 繁中以外頁面的 OG image 是否需要語言版本？→ 初期共用同一張，後續可擴充
