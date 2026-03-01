import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['zh-TW', 'en', 'ja'],
  defaultLocale: 'zh-TW',
  localePrefix: 'as-needed', // zh-TW 不加前綴，保持現有 URL
})
