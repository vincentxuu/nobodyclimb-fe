'use client'

import React from 'react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight } from 'lucide-react'
import ProfileFormField from './ProfileFormField'
import ProfileTextDisplay from './ProfileTextDisplay'

interface ClimbingExperienceSectionProps {
  climbingReason: string
  climbingMeaning: string
  adviceForBeginners: string
  isEditing: boolean
  isMobile: boolean
  // eslint-disable-next-line no-unused-vars
  onChange: (_field: string, _value: string | boolean) => void
}

export default function ClimbingExperienceSection({
  climbingReason,
  climbingMeaning,
  adviceForBeginners,
  isEditing,
  isMobile,
  onChange,
}: ClimbingExperienceSectionProps) {
  return (
    <div className="space-y-4">
      <ProfileFormField
        label="你與攀岩的相遇"
        hint="描述第一次接觸攀岩的情景，是什麼讓你想繼續？"
        isMobile={isMobile}
      >
        {isEditing ? (
          <Textarea
            value={climbingReason}
            onChange={(e) => onChange('climbingReason', e.target.value)}
            placeholder="例如：2022 年的秋天，朋友帶我去岩館，第一次嘗試就愛上了那種專注在每一個動作的感覺..."
            className="min-h-[120px] resize-none border-[#B6B3B3] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={climbingReason} minHeight="min-h-[80px]" isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField
        label="攀岩對你來說是什麼"
        hint="攀岩在你生活中扮演什麼角色？帶給你什麼？"
        isMobile={isMobile}
      >
        {isEditing ? (
          <Textarea
            value={climbingMeaning}
            onChange={(e) => onChange('climbingMeaning', e.target.value)}
            placeholder="例如：攀岩是我最好的減壓方式，在牆上的時候可以完全忘記工作的煩惱..."
            className="min-h-[120px] resize-none border-[#B6B3B3] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={climbingMeaning} minHeight="min-h-[80px]" isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField
        label="給剛開始攀岩的自己"
        hint="如果能回到起點，你會對自己說什麼？"
        isMobile={isMobile}
      >
        {isEditing ? (
          <Textarea
            value={adviceForBeginners}
            onChange={(e) => onChange('adviceForBeginners', e.target.value)}
            placeholder="例如：不要急著提升難度，好好享受每一次攀爬的過程，受傷了就好好休息..."
            className="min-h-[120px] resize-none border-[#B6B3B3] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay
            text={adviceForBeginners}
            minHeight="min-h-[80px]"
            isMobile={isMobile}
          />
        )}
      </ProfileFormField>

      {/* 人生清單連結 - 改為結構化清單頁面 */}
      <div className="pt-2">
        <Link
          href="/profile/bucket-list"
          className="flex items-center justify-between rounded-lg border border-[#B6B3B3] p-4 transition-colors hover:bg-gray-50"
        >
          <div>
            <p className="font-medium text-gray-900">我的攀岩人生清單</p>
            <p className="mt-1 text-sm text-gray-500">設定目標、追蹤進度、記錄完成故事</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Link>
      </div>
    </div>
  )
}
