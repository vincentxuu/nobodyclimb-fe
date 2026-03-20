import { SITE_URL } from '@/lib/constants'

const locales = ['zh', 'en', 'ja'] as const
type Locale = (typeof locales)[number]

// locale → hreflang 標準代碼
const hreflangMap: Record<Locale, string> = {
  zh: 'zh-TW',
  en: 'en',
  ja: 'ja',
}

// locale → OG locale 代碼
const ogLocaleMap: Record<Locale, string> = {
  zh: 'zh_TW',
  en: 'en_US',
  ja: 'ja_JP',
}

/**
 * 為給定路徑產生 hreflang alternates 物件
 * 用於 generateMetadata 的 alternates.languages 欄位
 *
 * @param pathname - 不含 locale prefix 的路徑（e.g., '/crag/12'）
 * @returns alternates.languages 物件
 */
export function buildHreflangAlternates(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {}

  for (const locale of locales) {
    const hreflang = hreflangMap[locale]
    // zh 為預設語言，不加 prefix
    const url = locale === 'zh'
      ? `${SITE_URL}${pathname}`
      : `${SITE_URL}/${locale}${pathname}`
    languages[hreflang] = url
  }

  // x-default 指向繁中（預設語言）
  languages['x-default'] = `${SITE_URL}${pathname}`

  return languages
}

/**
 * 取得 OG locale 與 alternateLocale
 * 接受 string（來自 params）並 fallback 至預設語言
 */
export function buildOgLocale(locale: string): { locale: string; alternateLocale: string[] } {
  const safeLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : 'zh'
  return {
    locale: ogLocaleMap[safeLocale],
    alternateLocale: locales.filter((l) => l !== safeLocale).map((l) => ogLocaleMap[l]),
  }
}
