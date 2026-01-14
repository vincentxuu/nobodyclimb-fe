import '@/styles/globals.css'
import React from 'react'
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

export function generateMetadata() {
  return {
    title: {
      default: 'NobodyClimb - 攀岩社群平台',
      template: '%s | NobodyClimb',
    },
    description: '專注於攀岩社群的網站，提供攀岩愛好者分享經驗、尋找攀岩地點及交流的平台',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${notoSansTC.variable} ${allertaStencil.variable}`}>
      <head>
        {/* Quill Editor CSS - 透過 CDN 載入避免 SSR 問題 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css"
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
