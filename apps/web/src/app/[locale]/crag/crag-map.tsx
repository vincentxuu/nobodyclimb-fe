'use client'

import { useTranslations } from 'next-intl'
import { TaiwanMap } from '@/components/home'
import type { getAllCrags } from '@/lib/crag-data'

interface CragMapProps {
  crags: ReturnType<typeof getAllCrags>
}

export function CragMap({ crags }: CragMapProps) {
  const t = useTranslations('CragPage')

  return (
    <div className="order-first col-span-full mb-6 lg:order-none lg:col-span-1 lg:mb-0">
      <div className="rounded-xl bg-white p-4 pb-12 shadow-sm lg:sticky lg:top-24 lg:p-6 lg:pb-14">
        <p className="mb-3 text-center text-sm text-[#6D6C6C] lg:hidden">
          {t('mapClickToVisit')}
        </p>
        <h3 className="mb-4 hidden text-center font-medium text-[#1B1A1A] lg:block">
          {t('mapClickToVisitDesktop')}
        </h3>
        <div className="flex justify-center [&>div]:max-w-[320px]">
          <TaiwanMap crags={crags} clickable />
        </div>
      </div>
    </div>
  )
}
