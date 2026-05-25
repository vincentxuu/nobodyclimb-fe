'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface ProfilePageHeaderProps {
  title: string
  isEditing: boolean
  onEdit: () => void
  isMobile: boolean
}

export default function ProfilePageHeader({
  title,
  isEditing,
  onEdit,
  isMobile,
}: ProfilePageHeaderProps) {
  const t = useTranslations('ProfileUI')
  return (
    <div className="mb-6 flex items-center justify-between md:mb-8">
      <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-medium text-[#1B1A1A]`}>
        {title}
      </h1>
      {!isEditing && (
        <Button
          variant="outline"
          onClick={onEdit}
          className="border-[#1B1A1A] text-sm text-[#1B1A1A] hover:bg-[#F5F5F5] md:text-base"
        >
          {t('editProfile')}
        </Button>
      )}
    </div>
  )
}
