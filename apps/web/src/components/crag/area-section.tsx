'use client'

import React from 'react'
import Link from 'next/link'
import PlaceholderImage from '@/components/ui/placeholder-image'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface CragAreaSectionProps {
  cragId: string
  areas: Array<{
    id: string
    name: string
    description: string
    difficulty: string
    routes: number
    image?: string
  }>
}

export const CragAreaSection: React.FC<CragAreaSectionProps> = ({ cragId, areas }) => {
  const t = useTranslations('CragPage')

  return (
    <div>
      <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">{t('areaSectionTitle')}</h2>
      <p className="mb-6 text-sm text-gray-500">{t('areaSectionHint')}</p>
      <div className="space-y-10">
        {areas.map((area, index) => (
          <Link
            key={area.id || index}
            href={`/crag/${cragId}/area/${area.id}`}
            prefetch={false}
            className="group grid cursor-pointer grid-cols-1 gap-6 rounded-lg border border-transparent p-4 transition-all hover:border-[#FFE70C] hover:bg-yellow-50 md:grid-cols-3"
            aria-label={t('viewAreaAriaLabel', { name: area.name })}
          >
            <div className="relative h-60 overflow-hidden rounded-lg">
              <PlaceholderImage text={t('areaPlaceholderText', { name: area.name })} bgColor="#E0F2FE" />
            </div>
            <div className="md:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold group-hover:text-[#1B1A1A]">{area.name}</h3>
                <span className="flex items-center text-sm text-gray-400 transition-colors group-hover:text-[#FFE70C]">
                  {t('viewDetails')}
                  <ChevronRight size={16} className="ml-1" />
                </span>
              </div>
              <p className="mb-4 text-gray-700">{area.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3 transition-colors group-hover:bg-white">
                  <p className="mb-1 text-sm text-gray-500">{t('areaDifficultyLabel')}</p>
                  <p className="font-semibold">{area.difficulty}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 transition-colors group-hover:bg-white">
                  <p className="mb-1 text-sm text-gray-500">{t('areaRouteCountLabel')}</p>
                  <p className="font-semibold">{area.routes}+</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
