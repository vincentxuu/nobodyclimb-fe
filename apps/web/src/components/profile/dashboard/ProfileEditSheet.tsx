'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { AdvancedStoryEditor } from '@/components/biography/advanced-story-editor'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import BasicInfoSection from '../BasicInfoSection'
import BiographyAvatarSection from '../BiographyAvatarSection'
import ClimbingExperienceSection from '../ClimbingExperienceSection'
import ClimbingFootprintsSection from '../ClimbingFootprintsSection'
import ClimbingInfoSection from '../ClimbingInfoSection'
import PublicSettingSection from '../PublicSettingSection'
import SocialLinksSection from '../SocialLinksSection'
import { ProfileData, SocialLinks } from '../types'
import { EditPanelType } from './ProfileDashboard'

// 面板配置（標題與描述的翻譯 key）
const PANEL_CONFIG: Record<
  Exclude<EditPanelType, null>,
  { titleKey: string; descriptionKey: string }
> = {
  avatar: { titleKey: 'panelAvatarTitle', descriptionKey: 'panelAvatarDescription' },
  basic: { titleKey: 'panelBasicTitle', descriptionKey: 'panelBasicDescription' },
  climbing: { titleKey: 'panelClimbingTitle', descriptionKey: 'panelClimbingDescription' },
  social: { titleKey: 'panelSocialTitle', descriptionKey: 'panelSocialDescription' },
  'core-stories': {
    titleKey: 'panelCoreStoriesTitle',
    descriptionKey: 'panelCoreStoriesDescription',
  },
  'advanced-stories': {
    titleKey: 'panelAdvancedStoriesTitle',
    descriptionKey: 'panelAdvancedStoriesDescription',
  },
  footprints: { titleKey: 'panelFootprintsTitle', descriptionKey: 'panelFootprintsDescription' },
  settings: { titleKey: 'panelSettingsTitle', descriptionKey: 'panelSettingsDescription' },
}

interface ProfileEditSheetProps {
  activePanel: EditPanelType
  onClose: () => void
  profileData: ProfileData
  isMobile: boolean
  onChange: (_field: string, _value: string | boolean | SocialLinks) => void
  onSave: () => Promise<void>
  onAvatarUpload: (_file: File) => Promise<void>
  onCoverImageUpload: (_file: File) => Promise<void>
  onAvatarDelete: () => void
  onCoverImageDelete: () => void
  onAdvancedStorySave: (_field: string, _value: string) => Promise<void>
}

export function ProfileEditSheet({
  activePanel,
  onClose,
  profileData,
  isMobile,
  onChange,
  onSave,
  onAvatarUpload,
  onCoverImageUpload,
  onAvatarDelete,
  onCoverImageDelete,
  onAdvancedStorySave,
}: ProfileEditSheetProps) {
  const t = useTranslations('ProfileGallery')
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
    } catch {
      // 錯誤已在 onSave 中處理
    } finally {
      setIsSaving(false)
    }
  }

  const config = activePanel ? PANEL_CONFIG[activePanel] : null

  // 小故事不需要儲存按鈕（即時儲存）
  const showSaveButton = activePanel !== 'advanced-stories' && activePanel !== 'footprints'

  return (
    <Sheet open={!!activePanel} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={`flex flex-col ${isMobile ? 'h-[85vh] rounded-t-2xl' : 'sm:max-w-xl'}`}
      >
        {config && (
          <>
            {/* 行動裝置拖動指示器 */}
            {isMobile && (
              <div className="mb-2 flex justify-center">
                <div className="h-1.5 w-12 rounded-full bg-gray-300" />
              </div>
            )}
            <SheetHeader className="flex-shrink-0">
              <SheetTitle>{t(config.titleKey)}</SheetTitle>
              <SheetDescription>{t(config.descriptionKey)}</SheetDescription>
            </SheetHeader>

            {/* 內容區域 */}
            <div className="flex-1 overflow-y-auto py-4">
              {/* 頭像與封面 */}
              {activePanel === 'avatar' && (
                <BiographyAvatarSection
                  avatarUrl={profileData.avatarUrl}
                  coverImageUrl={profileData.coverImageUrl}
                  isEditing={true}
                  isMobile={isMobile}
                  onAvatarUpload={onAvatarUpload}
                  onCoverImageUpload={onCoverImageUpload}
                  onAvatarDelete={onAvatarDelete}
                  onCoverImageDelete={onCoverImageDelete}
                />
              )}

              {/* 基本資料 */}
              {activePanel === 'basic' && (
                <BasicInfoSection
                  name={profileData.name}
                  title={profileData.title}
                  isEditing={true}
                  isMobile={isMobile}
                  onChange={onChange}
                />
              )}

              {/* 攀岩資訊 */}
              {activePanel === 'climbing' && (
                <ClimbingInfoSection
                  startYear={profileData.startYear}
                  frequentGyms={profileData.frequentGyms}
                  favoriteRouteType={profileData.favoriteRouteType}
                  isEditing={true}
                  isMobile={isMobile}
                  onChange={onChange}
                />
              )}

              {/* 社群連結 */}
              {activePanel === 'social' && (
                <SocialLinksSection
                  socialLinks={profileData.socialLinks}
                  isEditing={true}
                  isMobile={isMobile}
                  onChange={onChange}
                />
              )}

              {/* 核心故事 */}
              {activePanel === 'core-stories' && (
                <ClimbingExperienceSection
                  climbingReason={profileData.climbingReason}
                  climbingMeaning={profileData.climbingMeaning}
                  adviceForBeginners={profileData.adviceForBeginners}
                  isEditing={true}
                  isMobile={isMobile}
                  onChange={onChange}
                />
              )}

              {/* 小故事 */}
              {activePanel === 'advanced-stories' && (
                <div className="-mx-2">
                  <AdvancedStoryEditor
                    biography={profileData.advancedStories as unknown as Record<string, unknown>}
                    onSave={onAdvancedStorySave}
                    onClose={onClose}
                    className="max-h-none border-0 shadow-none"
                  />
                </div>
              )}

              {/* 攀岩足跡 */}
              {activePanel === 'footprints' && (
                <ClimbingFootprintsSection isEditing={true} isMobile={isMobile} />
              )}

              {/* 公開設定 */}
              {activePanel === 'settings' && (
                <PublicSettingSection
                  isPublic={profileData.isPublic}
                  isMobile={isMobile}
                  onChange={onChange}
                />
              )}
            </div>

            {/* 底部按鈕 */}
            {showSaveButton && (
              <div className="flex flex-shrink-0 gap-3 border-t pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? t('saving') : t('save')}
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
