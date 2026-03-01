# NobodyClimb i18n 國際化實作規劃

## 目標

將 NobodyClimb 網站從純繁體中文改為支援多語言（繁中 / English / 日文），採用 URL 子路徑策略。

---

## 一、現狀分析

### 目前架構
- **框架**: Next.js 15.5 (App Router) + React 19
- **部署**: Cloudflare Workers via OpenNext
- **語言**: 100% 繁體中文，無任何 i18n 設定
- **路由**: 50+ 頁面，12 個 layout，無 `[locale]` 段

### 影響範圍

| 類別 | 檔案數 | 預估字串數 | 優先級 |
|------|--------|-----------|--------|
| UI 字串（頁面標題、按鈕、表單） | ~100 | ~2,000 | P0 |
| Constants 常數檔 | ~8 | ~500 | P0 |
| 元件內文字 | ~150 | ~3,000 | P1 |
| Metadata / SEO | ~15 | ~200 | P1 |
| 後端 API 錯誤訊息 | ~20 | ~300 | P2 |
| Mobile App | ~50 | ~500 | P3 |

---

## 二、技術選型

### 核心方案：`next-intl`

**選擇理由**：
1. 專為 Next.js App Router 設計，原生支援 Server Components
2. 支援子路徑路由 (`/en/about`) 開箱即用
3. 與 Cloudflare Workers 部署相容
4. 類型安全的翻譯 key
5. 支援 ICU MessageFormat（複數、性別、日期格式化）
6. 社群活躍，文件完善

**備選方案對比**：

| 方案 | App Router 支援 | Server Component | 子路徑路由 | Bundle 大小 |
|------|----------------|-----------------|-----------|------------|
| **next-intl** | 原生 | 完整支援 | 內建 | ~2KB |
| react-i18next | 需適配 | 部分 | 需自建 | ~10KB |
| lingui | 可用 | 部分 | 需自建 | ~5KB |

### 支援語言

| Locale | 語言 | 角色 | URL |
|--------|------|------|-----|
| `zh-TW` | 繁體中文 | 預設語言 | `/about`（無前綴） |
| `en` | English | 國際版 | `/en/about` |
| `ja` | 日本語 | 日本攀岩社群 | `/ja/about` |

### URL 策略

```
nobodyclimb.cc/              → 繁中（預設，不加前綴）
nobodyclimb.cc/about         → 繁中 About
nobodyclimb.cc/en/           → English
nobodyclimb.cc/en/about      → English About
nobodyclimb.cc/ja/           → 日本語
nobodyclimb.cc/ja/about      → 日本語 About
```

預設語言 `zh-TW` **不加前綴**，保持現有 URL 結構不變（SEO 友好）。

---

## 三、翻譯檔案結構

### 目錄設計

```
apps/web/
├── messages/                         # 翻譯檔案目錄
│   ├── zh-TW/                        # 繁體中文（預設）
│   │   ├── common.json               # 共用：導覽列、頁尾、按鈕
│   │   ├── home.json                 # 首頁
│   │   ├── about.json                # 關於頁
│   │   ├── auth.json                 # 登入/註冊/忘記密碼
│   │   ├── biography.json            # 人物誌
│   │   ├── blog.json                 # 部落格
│   │   ├── crag.json                 # 岩場
│   │   ├── gym.json                  # 岩館
│   │   ├── gallery.json              # 攝影集
│   │   ├── videos.json               # 影片
│   │   ├── profile.json              # 個人檔案
│   │   ├── search.json               # 搜尋
│   │   ├── games.json                # 遊戲
│   │   ├── admin.json                # 管理後台
│   │   └── metadata.json             # SEO metadata
│   ├── en/                           # English
│   │   └── (同上結構)
│   └── ja/                           # 日本語
│       └── (同上結構)
├── src/
│   ├── i18n/
│   │   ├── config.ts                 # i18n 設定（locales, defaultLocale）
│   │   ├── request.ts                # next-intl 的 getRequestConfig
│   │   └── navigation.ts             # 本地化的 Link, redirect, useRouter
│   └── middleware.ts                 # locale 偵測 & 路由中間件
```

### 翻譯檔範例

**`messages/zh-TW/common.json`**：
```json
{
  "nav": {
    "biography": "人物誌",
    "crag": "岩場",
    "gym": "岩館",
    "gallery": "攝影集",
    "videos": "影片",
    "blog": "部落格",
    "login": "登入",
    "register": "註冊",
    "profile": "個人檔案",
    "settings": "設定",
    "logout": "登出"
  },
  "footer": {
    "cta": "加入我們，寫下你的攀岩故事",
    "joinNow": "立即加入",
    "copyright": "© {year} NobodyClimb. All rights reserved."
  },
  "actions": {
    "submit": "送出",
    "cancel": "取消",
    "save": "儲存",
    "delete": "刪除",
    "edit": "編輯",
    "loading": "載入中...",
    "search": "搜尋",
    "back": "返回",
    "next": "下一步",
    "previous": "上一步",
    "confirm": "確認",
    "close": "關閉",
    "seeMore": "查看更多",
    "share": "分享"
  },
  "errors": {
    "general": "發生錯誤，請稍後再試",
    "notFound": "頁面不存在",
    "unauthorized": "請先登入"
  }
}
```

**`messages/en/common.json`**：
```json
{
  "nav": {
    "biography": "Biographies",
    "crag": "Crags",
    "gym": "Gyms",
    "gallery": "Gallery",
    "videos": "Videos",
    "blog": "Blog",
    "login": "Log in",
    "register": "Sign up",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Log out"
  },
  "footer": {
    "cta": "Join us and write your climbing story",
    "joinNow": "Join Now",
    "copyright": "© {year} NobodyClimb. All rights reserved."
  },
  "actions": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "search": "Search",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "confirm": "Confirm",
    "close": "Close",
    "seeMore": "See more",
    "share": "Share"
  },
  "errors": {
    "general": "Something went wrong. Please try again later.",
    "notFound": "Page not found",
    "unauthorized": "Please log in first"
  }
}
```

### Namespace 拆分規則

1. **common** — 跨頁面共用（nav, footer, actions, errors）
2. **每個功能模組一個 namespace** — biography, crag, gym, blog 等
3. **metadata** — 所有頁面的 SEO title/description
4. **admin** — 管理後台（可延後翻譯）

好處：按需載入，避免一次載入所有翻譯。

---

## 四、路由重構

### 現有結構 → 新結構

```
# 現有
apps/web/src/app/
├── layout.tsx
├── page.tsx
├── about/page.tsx
├── auth/login/page.tsx
├── biography/page.tsx
└── ...

# 重構後
apps/web/src/app/
├── [locale]/                        # ← 新增 locale 動態段
│   ├── layout.tsx                   # 帶 locale 的根 layout
│   ├── page.tsx
│   ├── about/page.tsx
│   ├── auth/login/page.tsx
│   ├── biography/page.tsx
│   └── ...
├── layout.tsx                       # 最外層 layout（僅 <html> 殼）
└── not-found.tsx                    # 全域 404
```

### Middleware 設定

```typescript
// apps/web/src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // 排除 API routes、靜態檔案、Next.js 內部路由
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
```

```typescript
// apps/web/src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh-TW', 'en', 'ja'],
  defaultLocale: 'zh-TW',
  localePrefix: 'as-needed'  // zh-TW 不加前綴
});
```

### 關鍵設定檔

```typescript
// apps/web/src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // 依 namespace 動態載入翻譯檔
  return {
    locale,
    messages: {
      ...(await import(`../../messages/${locale}/common.json`)).default,
      // 其他 namespace 在各頁面按需載入
    }
  };
});
```

```typescript
// apps/web/src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### `[locale]/layout.tsx` 範例

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {/* Navbar, main, Footer 等 */}
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## 五、元件改造模式

### Server Component

```tsx
// 改造前
export default function AboutPage() {
  return <h1>每個 Nobody 都有屬於自己的攀岩故事</h1>;
}

// 改造後
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export default function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = useTranslations('about');

  return <h1>{t('hero.title')}</h1>;
}
```

### Client Component

```tsx
// 改造前
'use client';
export function SearchBar() {
  return <input placeholder="搜尋岩場、岩館、攀岩者..." />;
}

// 改造後
'use client';
import { useTranslations } from 'next-intl';

export function SearchBar() {
  const t = useTranslations('search');
  return <input placeholder={t('placeholder')} />;
}
```

### Link 元件替換

```tsx
// 改造前
import Link from 'next/link';
<Link href="/about">關於我們</Link>

// 改造後
import { Link } from '@/i18n/navigation';
<Link href="/about">{t('nav.about')}</Link>
// Link 會自動加上 locale 前綴：/en/about, /ja/about
```

### Constants 抽取

```typescript
// 改造前 - lib/constants/index.ts
export const NAV_LINKS = [
  { href: '/biography', label: '人物誌' },
  { href: '/crag', label: '岩場' },
];

// 改造後 - lib/constants/index.ts
export const NAV_LINKS = [
  { href: '/biography', labelKey: 'nav.biography' },
  { href: '/crag', labelKey: 'nav.crag' },
] as const;

// 元件中使用
const t = useTranslations('common');
{NAV_LINKS.map(link => (
  <Link href={link.href}>{t(link.labelKey)}</Link>
))}
```

---

## 六、SEO 與 Metadata

### 動態 Metadata

```tsx
// apps/web/src/app/[locale]/about/page.tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('about.title'),
    description: t('about.description'),
    openGraph: {
      locale: locale === 'zh-TW' ? 'zh_TW' : locale === 'ja' ? 'ja_JP' : 'en_US',
    },
    alternates: {
      canonical: `https://nobodyclimb.cc/about`,
      languages: {
        'zh-TW': 'https://nobodyclimb.cc/about',
        'en': 'https://nobodyclimb.cc/en/about',
        'ja': 'https://nobodyclimb.cc/ja/about',
      },
    },
  };
}
```

### `hreflang` 標籤

`next-intl` 的 middleware 會自動處理 `alternates.languages`，產生正確的 `<link rel="alternate" hreflang="...">` 標籤。

### sitemap.ts 更新

```typescript
// apps/web/src/app/sitemap.ts
import { routing } from '@/i18n/routing';

export default function sitemap() {
  const baseUrl = 'https://nobodyclimb.cc';
  const pages = ['', '/about', '/biography', '/crag', '/gym', '/gallery', '/videos', '/blog'];

  return pages.flatMap(page =>
    routing.locales.map(locale => ({
      url: locale === 'zh-TW' ? `${baseUrl}${page}` : `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map(l => [
            l,
            l === 'zh-TW' ? `${baseUrl}${page}` : `${baseUrl}/${l}${page}`,
          ])
        ),
      },
    }))
  );
}
```

---

## 七、語言切換器 UI

### 元件設計

在 Navbar 中加入語言切換下拉選單：

```tsx
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LOCALE_LABELS: Record<string, { label: string; flag: string }> = {
  'zh-TW': { label: '繁體中文', flag: '🇹🇼' },
  'en': { label: 'English', flag: '🇺🇸' },
  'ja': { label: '日本語', flag: '🇯🇵' },
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {LOCALE_LABELS[locale].flag} {LOCALE_LABELS[locale].label}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {routing.locales.map(l => (
          <DropdownMenuItem key={l} onClick={() => handleChange(l)}>
            {LOCALE_LABELS[l].flag} {LOCALE_LABELS[l].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 八、Cloudflare Workers 注意事項

### Middleware 相容性

`next-intl` 的 middleware 依賴 Next.js Edge Middleware，需確認 OpenNext Cloudflare adapter 支援：

1. **驗證**: OpenNext 1.6.5 支援 Next.js middleware（在 Cloudflare Workers 上執行）
2. **測試**: 確保 `middleware.ts` 在 `pnpm build:cf` 後正常運作
3. **快取策略**: locale 路由不應被靜態快取（需加入 `Vary: Accept-Language` header）

### Bundle Size

翻譯檔按需載入（每個 namespace 約 1-5KB），不會顯著增加 Worker 的 bundle 大小。

---

## 九、分階段實施計畫

### Phase 0：基礎架構（2-3 天）
- [ ] 安裝 `next-intl`
- [ ] 建立 `i18n/` 設定檔（config, routing, request, navigation）
- [ ] 建立 `middleware.ts`
- [ ] 建立 `messages/` 目錄結構
- [ ] 將 `app/` 下所有內容移至 `app/[locale]/`
- [ ] 修改根 `layout.tsx` → `[locale]/layout.tsx`
- [ ] 確認 `pnpm dev` 和 `pnpm build:cf` 正常

### Phase 1：核心 UI 字串抽取（3-5 天）
- [ ] 抽取 `common.json`（nav, footer, actions, errors）
- [ ] 改造 Navbar 元件
- [ ] 改造 Footer 元件
- [ ] 改造首頁 (`page.tsx`)
- [ ] 改造 About 頁
- [ ] 加入 LanguageSwitcher 元件
- [ ] 替換所有 `next/link` → `@/i18n/navigation` 的 `Link`
- [ ] 替換所有 `next/navigation` 的 `useRouter`, `usePathname`, `redirect`

### Phase 2：功能模組頁面（5-7 天）
- [ ] Auth 頁面（login, register, forgot-password, profile-setup）
- [ ] Biography 頁面 + 元件（editor, display, community, explore）
- [ ] Blog 頁面（list, detail, create, edit）
- [ ] Crag 頁面 + 元件
- [ ] Gym 頁面 + 元件
- [ ] Gallery 頁面
- [ ] Videos 頁面
- [ ] Profile 頁面（settings, stats, photos, etc.）
- [ ] Search 頁面
- [ ] Games 頁面

### Phase 3：SEO & Metadata（1-2 天）
- [ ] 建立 `metadata.json` 翻譯檔
- [ ] 每個頁面加入 `generateMetadata` 多語系支援
- [ ] 更新 `sitemap.ts` 多語系 URL
- [ ] 更新 `robots.ts`
- [ ] 確認 `hreflang` 標籤正確
- [ ] 確認 OpenGraph locale 正確

### Phase 4：Constants & Shared（2-3 天）
- [ ] 重構 `lib/constants/index.ts` — 用 key 取代硬編碼中文
- [ ] 重構 `lib/constants/biography-stories.ts`
- [ ] 重構 `lib/constants/biography-questions.ts`
- [ ] 重構 `lib/constants/biography-tags.ts`
- [ ] 重構 `lib/constants/badges.ts`
- [ ] 更新 `packages/constants` 中的中文字串

### Phase 5：翻譯與潤稿（持續）
- [ ] 完成所有 `en/` 翻譯檔
- [ ] 完成所有 `ja/` 翻譯檔
- [ ] 人工審校英文翻譯
- [ ] 人工審校日文翻譯

### Phase 6：後端 & Mobile（視需求）
- [ ] 後端 API 錯誤訊息 i18n（透過 `Accept-Language` header）
- [ ] Mobile App i18n（使用 `react-i18next` 或 `expo-localization`）

---

## 十、翻譯工作流程

### 開發流程

1. 開發者在 `zh-TW/` 下新增翻譯 key
2. 在程式碼中使用 `t('key')`
3. 翻譯 `en/` 和 `ja/` 對應 key（可先用 placeholder）
4. PR review 時檢查是否有遺漏的 key

### 翻譯管理建議

| 方案 | 適合階段 | 說明 |
|------|---------|------|
| **手動 JSON 管理** | 初期 | 開發者直接編輯 JSON，適合字串量小時 |
| **Crowdin / Lokalise** | 中期 | 翻譯管理平台，支援 JSON 匯入匯出 |
| **AI 輔助翻譯** | 全程 | 用 Claude / ChatGPT 初步翻譯，人工審校 |

### 品質保證

1. **缺失 key 偵測**: `next-intl` 開發模式會在 console 警告缺失的翻譯 key
2. **CI 檢查**: 新增腳本比對各語言的 key 是否一致
3. **TypeScript**: 透過 `next-intl` 的類型安全功能，確保 key 存在

---

## 十一、日期、數字、貨幣格式化

### next-intl 內建支援

```tsx
import { useFormatter } from 'next-intl';

function DateDisplay({ date }: { date: Date }) {
  const format = useFormatter();
  // zh-TW: 2026年3月1日
  // en: March 1, 2026
  // ja: 2026年3月1日
  return <span>{format.dateTime(date, { dateStyle: 'long' })}</span>;
}

function NumberDisplay({ count }: { count: number }) {
  const format = useFormatter();
  // zh-TW: 1,234
  // en: 1,234
  // ja: 1,234
  return <span>{format.number(count)}</span>;
}
```

---

## 十二、風險與注意事項

### 已知風險

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| OpenNext middleware 相容性 | 可能影響 locale 偵測 | Phase 0 立即驗證 |
| 路由重構影響現有 URL | SEO 排名暫時下降 | 預設語言不加前綴 + 301 redirect |
| 翻譯品質（機翻） | 使用者體驗差 | AI 初譯 + 人工審校 |
| 大量元件改造 | 引入 bug | 分批改造 + 每批測試 |
| Bundle size 增加 | 效能下降 | 按需載入 namespace |

### 預設語言不加前綴的好處

- 現有的所有 URL（`/about`, `/crag` 等）保持不變
- Google 已收錄的頁面不受影響
- 不需要設定 301 redirect
- 使用者書籤繼續有效

---

## 十三、預估工時

| 階段 | 工時 | 說明 |
|------|------|------|
| Phase 0: 基礎架構 | 2-3 天 | 設定 + 路由重構 |
| Phase 1: 核心 UI | 3-5 天 | nav, footer, 首頁, about |
| Phase 2: 功能頁面 | 5-7 天 | 所有功能模組頁面 |
| Phase 3: SEO | 1-2 天 | metadata, sitemap, hreflang |
| Phase 4: Constants | 2-3 天 | 常數檔重構 |
| Phase 5: 翻譯 | 持續 | en + ja 翻譯與審校 |
| **總計** | **約 15-20 天** | 不含翻譯潤稿 |
