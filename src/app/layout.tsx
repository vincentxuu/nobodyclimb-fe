import '@/styles/globals.css'
import React from 'react'
import type { Metadata } from 'next'
import { Noto_Sans_TC, Allerta_Stencil } from 'next/font/google'
import { Providers } from '@/components/layout/providers'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { ProgressBar } from '@/components/shared/progress-bar'
import { AuthInitializer } from '@/components/shared/auth-initializer'
import { StoryPromptWrapper } from '@/components/shared/story-prompt-wrapper'

const notoSansTC = Noto_Sans_TC({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans-tc',
})

const allertaStencil = Allerta_Stencil({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-allerta-stencil',
})

const SITE_URL = 'https://nobodyclimb.cc'
const SITE_NAME = 'NobodyClimb'
const SITE_DESCRIPTION = '台灣攀岩社群平台，提供攀岩愛好者分享經驗、探索岩場岩館、觀看攀岩影片及交流的園地。無論你是初學者還是高手，都能在這裡找到志同道合的攀岩夥伴。'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - 台灣攀岩社群平台`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    '攀岩',
    '抱石',
    '攀岩館',
    '岩場',
    '攀岩社群',
    '台灣攀岩',
    '室內攀岩',
    '戶外攀岩',
    '運動攀登',
    'rock climbing',
    'bouldering',
    'climbing gym',
    'NobodyClimb',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - 台灣攀岩社群平台`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - 台灣攀岩社群平台`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - 台灣攀岩社群平台`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // 可以在這裡添加 Google Search Console 驗證碼
    // google: 'your-google-verification-code',
  },
  alternates: {
    canonical: SITE_URL,
  },
}

// JSON-LD 結構化數據 - 幫助搜尋引擎理解網站內容
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
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
      url: `${SITE_URL}/logo.png`,
    },
    sameAs: [
      // 可以添加社群媒體連結
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${notoSansTC.variable} ${allertaStencil.variable}`} lang="zh-TW">
      <head>
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
      <body suppressHydrationWarning className={notoSansTC.className}>
        <Providers>
          <AuthInitializer />
          <StoryPromptWrapper />
          <ProgressBar />
          <Navbar />
          <main className="min-h-[calc(100vh-14rem)] pt-[70px]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
