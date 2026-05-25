'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Textarea } from '@/components/ui/textarea'
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
  const t = useTranslations('ProfileUI')
  return (
    <div className="space-y-4">
      <ProfileFormField
        label={t('meetClimbingLabel')}
        hint={t('meetClimbingHint')}
        isMobile={isMobile}
      >
        {isEditing ? (
          <Textarea
            value={climbingReason}
            onChange={(e) => onChange('climbingReason', e.target.value)}
            placeholder={t('meetClimbingPlaceholder')}
            className="min-h-[120px] resize-none border-subtle text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={climbingReason} minHeight="min-h-[80px]" isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField
        label={t('climbingMeaningLabel')}
        hint={t('climbingMeaningHint')}
        isMobile={isMobile}
      >
        {isEditing ? (
          <Textarea
            value={climbingMeaning}
            onChange={(e) => onChange('climbingMeaning', e.target.value)}
            placeholder={t('climbingMeaningPlaceholder')}
            className="min-h-[120px] resize-none border-subtle text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={climbingMeaning} minHeight="min-h-[80px]" isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField
        label={t('adviceToSelfLabel')}
        hint={t('adviceToSelfHint')}
        isMobile={isMobile}
      >
        {isEditing ? (
          <Textarea
            value={adviceForBeginners}
            onChange={(e) => onChange('adviceForBeginners', e.target.value)}
            placeholder={t('adviceToSelfPlaceholder')}
            className="min-h-[120px] resize-none border-subtle text-sm md:text-base"
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
          className="flex items-center justify-between rounded-lg border border-subtle p-4 transition-colors hover:bg-gray-50"
        >
          <div>
            <p className="font-medium text-gray-900">{t('bucketListLinkTitle')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('bucketListLinkSubtitle')}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Link>
      </div>
    </div>
  )
}
