'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { stringToTags, TagInput, tagsToString } from '@/components/ui/tag-input'
import ProfileFormField from './ProfileFormField'
import ProfileTextDisplay from './ProfileTextDisplay'
import { RouteTypeSelector, routeTypesToString, stringToRouteTypes } from './RouteTypeSelector'

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
  const t = useTranslations('ProfileUI')
  // 將字串轉換為標籤陣列
  const locationTags = useMemo(() => stringToTags(frequentGyms), [frequentGyms])
  const routeTypes = useMemo(() => stringToRouteTypes(favoriteRouteType), [favoriteRouteType])

  // 處理地點標籤變更
  const handleLocationChange = useCallback(
    (tags: string[]) => {
      onChange('frequentGyms', tagsToString(tags))
    },
    [onChange]
  )

  // 處理路線型態變更
  const handleRouteTypeChange = useCallback(
    (types: string[]) => {
      onChange('favoriteRouteType', routeTypesToString(types))
    },
    [onChange]
  )

  return (
    <div className="space-y-4">
      <ProfileFormField label={t('startYearLabel')} isMobile={isMobile}>
        {isEditing ? (
          <Select value={startYear} onValueChange={(value) => onChange('startYear', value)}>
            <SelectTrigger className="h-10 border-[#B6B3B3] text-sm md:text-base">
              <SelectValue placeholder={t('startYearPlaceholder')} />
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

      <ProfileFormField
        label={t('frequentGymsLabel')}
        hint={isEditing ? t('frequentGymsHint') : undefined}
        isMobile={isMobile}
      >
        {isEditing ? (
          <TagInput
            value={locationTags}
            onChange={handleLocationChange}
            placeholder={t('frequentGymsPlaceholder')}
          />
        ) : (
          <ProfileTextDisplay text={frequentGyms} isMobile={isMobile} asTags />
        )}
      </ProfileFormField>

      <ProfileFormField
        label={t('favoriteRouteTypeLabel')}
        hint={isEditing ? t('multiSelectHint') : undefined}
        isMobile={isMobile}
      >
        {isEditing ? (
          <RouteTypeSelector value={routeTypes} onChange={handleRouteTypeChange} />
        ) : (
          <ProfileTextDisplay text={favoriteRouteType} isMobile={isMobile} asTags />
        )}
      </ProfileFormField>
    </div>
  )
}
