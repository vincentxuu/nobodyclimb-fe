'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProfileFormField from './ProfileFormField'
import ProfileTextDisplay from './ProfileTextDisplay'

// 產生年份選項
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

interface ClimbingInfoSectionProps {
  startYear: string
  frequentGyms: string
  favoriteRouteType: string
  isEditing: boolean
  isMobile: boolean
  // eslint-disable-next-line no-unused-vars
  onChange: (_field: string, _value: string | boolean) => void
}

export default function ClimbingInfoSection({
  startYear,
  frequentGyms,
  favoriteRouteType,
  isEditing,
  isMobile,
  onChange,
}: ClimbingInfoSectionProps) {
  return (
    <div className="space-y-4">
      <ProfileFormField label="哪一年開始攀岩" isMobile={isMobile}>
        {isEditing ? (
          <Select value={startYear} onValueChange={(value) => onChange('startYear', value)}>
            <SelectTrigger className="h-10 border-[#B6B3B3] text-sm md:text-base">
              <SelectValue placeholder="請選擇年份" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <ProfileTextDisplay text={startYear} isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField label="平常出沒岩場" isMobile={isMobile}>
        {isEditing ? (
          <Input
            value={frequentGyms}
            onChange={(e) => onChange('frequentGyms', e.target.value)}
            className="border-[#B6B3B3] text-sm md:text-base"
            placeholder="ex. 小岩攀岩館"
          />
        ) : (
          <ProfileTextDisplay text={frequentGyms} isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField label="喜歡的路線型態" isMobile={isMobile}>
        {isEditing ? (
          <Input
            value={favoriteRouteType}
            onChange={(e) => onChange('favoriteRouteType', e.target.value)}
            className="border-[#B6B3B3] text-sm md:text-base"
            placeholder="ex. 長路線"
          />
        ) : (
          <ProfileTextDisplay text={favoriteRouteType} isMobile={isMobile} />
        )}
      </ProfileFormField>
    </div>
  )
}
