import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: {
      // 全域只載入 common — 其他 namespace 在各頁面按需載入
      common: (await import(`../../messages/${locale}/common.json`)).default,
    },
  }
})
