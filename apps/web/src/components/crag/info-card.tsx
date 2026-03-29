'use client'

import { Info } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

interface CragInfoCardProps {
  // 可以根據需要添加參數
}

export const CragInfoCard: React.FC<CragInfoCardProps> = () => {
  const t = useTranslations('CragPage')

  // 實用資訊列表
  const infoLinks = [
    { emoji: '👨‍🏫', label: t('usefulInfoGuide'), href: '#' },
    { emoji: '📖', label: t('usefulInfoGuideBook'), href: '#' },
    { emoji: '⚠️', label: t('usefulInfoSafety'), href: '#' },
    { emoji: '🏨', label: t('usefulInfoAccommodation'), href: '#' },
    { emoji: '🍽️', label: t('usefulInfoRestaurant'), href: '#' },
    { emoji: '🧰', label: t('usefulInfoGearRental'), href: '#' },
  ]

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 flex items-center text-xl font-bold">
        <Info size={20} className="mr-2 text-[#1B1A1A]" />
        {t('usefulInfoTitle')}
      </h3>
      <ul className="space-y-3">
        {infoLinks.map((link, index) => (
          <li key={index}>
            <Link
              href={link.href}
              prefetch={false}
              className="flex items-center text-[#1B1A1A] hover:text-gray-800"
            >
              <span className="mr-2">{link.emoji}</span> {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
