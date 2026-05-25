'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface ProfileActionButtonsProps {
  onCancel: () => void
  onSave: () => void
  isMobile: boolean
  isLoading?: boolean
}

export default function ProfileActionButtons({
  onCancel,
  onSave,
  isMobile,
  isLoading = false,
}: ProfileActionButtonsProps) {
  const t = useTranslations('ProfileUI')
  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'} mt-6 gap-3`}>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
        className={`border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#F5F5F5] ${isMobile ? 'w-full' : ''}`}
      >
        {t('cancel')}
      </Button>
      <Button
        onClick={onSave}
        disabled={isLoading}
        className={`bg-[#1B1A1A] text-white hover:bg-[#3F3D3D] ${isMobile ? 'w-full' : ''}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('saving')}
          </>
        ) : (
          t('saveProfile')
        )}
      </Button>
    </div>
  )
}
