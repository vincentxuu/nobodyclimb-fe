'use client'

import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import BasicInfoSection from '../BasicInfoSection'
import ClimbingInfoSection from '../ClimbingInfoSection'
import ClimbingExperienceSection from '../ClimbingExperienceSection'
import SocialLinksSection from '../SocialLinksSection'
import PublicSettingSection from '../PublicSettingSection'
import BiographyAvatarSection from '../BiographyAvatarSection'
import ClimbingFootprintsSection from '../ClimbingFootprintsSection'
import { AdvancedStoryEditor } from '@/components/biography/advanced-story-editor'
import { ProfileData, SocialLinks } from '../types'
import { EditPanelType } from './ProfileDashboard'

// 面板配置
const PANEL_CONFIG: Record<
  Exclude<EditPanelType, null>,
  { title: string; description: string }
> = {
  avatar: { title: '頭像與封面', description: '設定你的個人形象照片' },
  basic: { title: '基本資料', description: '編輯暱稱和自我介紹' },
  climbing: { title: '攀岩資訊', description: '編輯攀岩相關資訊' },
  social: { title: '社群連結', description: '連結你的社群帳號' },
  'core-stories': { title: '核心故事', description: '分享你與攀岩的故事' },
  'advanced-stories': { title: '小故事', description: '記錄更多攀岩故事' },
  footprints: { title: '攀岩足跡', description: '記錄去過的攀岩地點' },
  settings: { title: '公開設定', description: '設定人物誌的公開狀態' },
}

interface ProfileEditSheetProps {
  activePanel: EditPanelType
  onClose: () => void
  profileData: ProfileData
  isMobile: boolean
  onChange: (field: string, value: string | boolean | SocialLinks) => void
  onSave: () => Promise<void>
  onAvatarUpload: (file: File) => Promise<void>
  onCoverImageUpload: (file: File) => Promise<void>
  onAvatarDelete: () => void
  onCoverImageDelete: () => void
  onAdvancedStorySave: (field: string, value: string) => Promise<void>
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
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
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
              <SheetTitle>{config.title}</SheetTitle>
              <SheetDescription>{config.description}</SheetDescription>
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
                  取消
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? '儲存中...' : '儲存'}
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
