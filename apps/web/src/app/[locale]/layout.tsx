import React from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { Providers } from '@/components/layout/providers'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { ProgressBar } from '@/components/shared/progress-bar'
import { AuthInitializer } from '@/components/shared/auth-initializer'
import { StoryPromptWrapper } from '@/components/shared/story-prompt-wrapper'
import { ShareInvitation } from '@/components/shared/share-invitation'
import { ClaimContentProvider } from '@/components/shared/claim-content-modal'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { ChatWidget } from '@/components/ai'
import { Analytics } from '@/components/shared/analytics'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_LOGO } from '@/lib/constants'

// JSON-LD 結構化數據 - 幫助搜尋引擎理解網站內容
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: ['NobodyClimb 台灣攀岩', '台灣攀岩社群'],
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  inLanguage: ['zh-TW', 'en', 'ja'],
  keywords: '攀岩,龍洞,墾丁,關子嶺,德芙蘭,台灣攀岩,戶外攀岩,攀岩路線,岩場',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${SITE_LOGO}`,
    },
    sameAs: [],
  },
}

// locale → html lang 屬性對應
const localeLangMap: Record<string, string> = {
  zh: 'zh-TW',
  en: 'en',
  ja: 'ja',
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // 驗證 locale 是否有效
  if (!routing.locales.includes(locale as 'zh' | 'en' | 'ja')) {
    notFound()
  }

  const messages = await getMessages()
  const htmlLang = localeLangMap[locale] ?? 'zh-TW'

  return (
    <html suppressHydrationWarning lang={htmlLang}>
      <head>
        {/* esbuild __name polyfill - 修復 Cloudflare Workers 部署問題 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `typeof __name === "undefined" && (window.__name = function(fn) { return fn; });`,
          }}
        />
        {/* Google Fonts - 透過 CDN 載入 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Allerta+Stencil&family=Noto+Sans+TC:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* Quill Editor CSS - 透過 CDN 載入避免 SSR 問題 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css"
        />
        {/* JSON-LD 結構化數據 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans">
        <Analytics />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ErrorBoundary>
              <ClaimContentProvider>
                <AuthInitializer />
                <StoryPromptWrapper />
                <ProgressBar />
                <Navbar />
                <main className="min-h-[calc(100vh-14rem)] pt-14 md:pt-[70px]">{children}</main>
                <ShareInvitation />
                <Footer />
                {process.env.NEXT_PUBLIC_ENABLE_AI_CHAT === 'true' && <ChatWidget />}
              </ClaimContentProvider>
            </ErrorBoundary>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
