'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export function AboutSection() {
  const { status } = useAuthStore()
  const t = useTranslations('HomePage')

  return (
    <section className="relative h-[500px] overflow-hidden bg-white">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F5] to-white" />

      {/* 內容區域 */}
      <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
        <Image
          src="/logo/Nobodylimb-black.svg"
          alt={t('heroTitle')}
          width={320}
          height={90}
          className="mb-6"
        />

        <div className="my-2 h-1 w-10 bg-[#1B1A1A]" />

        <p className="mt-4 max-w-[582px] px-4 text-base text-[#1B1A1A]">{t('aboutDescription')}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href="/about" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              {t('aboutLearnMore')}
            </Button>
          </Link>
          {status !== 'signIn' && (
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full bg-brand-accent/70 text-[#1B1A1A] hover:bg-brand-accent sm:w-auto"
              >
                {t('aboutJoin')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
