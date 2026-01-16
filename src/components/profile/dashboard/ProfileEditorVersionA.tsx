'use client'

/**
 * 版本 A - 全頁面分頁式編輯
 *
 * 特點：
 * - 使用 Tabs 標籤頁設計，所有區塊在同一頁面
 * - 左側導航 + 右側內容的經典佈局
 * - 適合一次編輯多個區塊
 * - 桌面體驗優先
 */

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mountain,
  Link2,
  BookOpen,
  Sparkles,
  MapPin,
  Globe,
  ImageIcon,
  Save,
  ChevronLeft,
  Check,
  Circle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfile } from '../ProfileContext'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { calculateStoryProgress, CORE_STORY_QUESTIONS } from '@/lib/constants/biography-stories'
import BasicInfoSection from '../BasicInfoSection'
import ClimbingInfoSection from '../ClimbingInfoSection'
import ClimbingExperienceSection from '../ClimbingExperienceSection'
import SocialLinksSection from '../SocialLinksSection'
import PublicSettingSection from '../PublicSettingSection'
import BiographyAvatarSection from '../BiographyAvatarSection'
import ClimbingFootprintsSection from '../ClimbingFootprintsSection'
import { AdvancedStoryEditor } from '@/components/biography/advanced-story-editor'
import { SocialLinks, AdvancedStories } from '../types'
import { mapProfileDataToApi, CORE_STORY_FIELD_MAP } from '../mappers'

type TabType =
  | 'avatar'
  | 'basic'
  | 'climbing'
  | 'social'
  | 'core-stories'
  | 'advanced-stories'
  | 'footprints'
  | 'settings'

interface TabConfig {
  id: TabType
  icon: React.ReactNode
  title: string
  description: string
}

const TABS: TabConfig[] = [
  { id: 'avatar', icon: <ImageIcon className="h-4 w-4" />, title: '頭像與封面', description: '個人形象照片' },
  { id: 'basic', icon: <User className="h-4 w-4" />, title: '基本資料', description: '暱稱、一句話介紹' },
  { id: 'climbing', icon: <Mountain className="h-4 w-4" />, title: '攀岩資訊', description: '年資、常去的地方' },
  { id: 'social', icon: <Link2 className="h-4 w-4" />, title: '社群連結', description: 'Instagram、YouTube' },
  { id: 'core-stories', icon: <BookOpen className="h-4 w-4" />, title: '核心故事', description: '與攀岩的相遇' },
  { id: 'advanced-stories', icon: <Sparkles className="h-4 w-4" />, title: '小故事', description: '更多攀岩故事' },
  { id: 'footprints', icon: <MapPin className="h-4 w-4" />, title: '攀岩足跡', description: '去過的地點' },
  { id: 'settings', icon: <Globe className="h-4 w-4" />, title: '公開設定', description: '隱私設定' },
]

interface ProfileEditorVersionAProps {
  onBack?: () => void
}

export default function ProfileEditorVersionA({ onBack }: ProfileEditorVersionAProps) {
  const { profileData, setProfileData } = useProfile()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('avatar')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 快取當前 tab 配置，避免重複查詢
  const activeTabConfig = useMemo(
    () => TABS.find((t) => t.id === activeTab),
    [activeTab]
  )

  // 計算完成狀態
  const getTabCompletion = (tabId: TabType): boolean => {
    switch (tabId) {
      case 'avatar':
        return !!(profileData.avatarUrl || profileData.coverImageUrl)
      case 'basic':
        return !!(profileData.name && profileData.title)
      case 'climbing':
        return !!(profileData.startYear && profileData.frequentGyms)
      case 'social':
        return !!(profileData.socialLinks.instagram || profileData.socialLinks.youtube_channel)
      case 'core-stories':
        return CORE_STORY_QUESTIONS.some((q) => {
          const key = CORE_STORY_FIELD_MAP[q.field] || q.field
          const value = profileData[key as keyof typeof profileData]
          return value && typeof value === 'string' && value.trim().length > 0
        })
      case 'advanced-stories':
        const stories = profileData.advancedStories ?? {}
        const progress = calculateStoryProgress(stories as unknown as Record<string, unknown>)
        return progress.completed > 0
      case 'footprints':
        return false // TODO: 實作足跡完成狀態
      case 'settings':
        return true // 設定總是有值
      default:
        return false
    }
  }

  // 處理表單變更
  const handleChange = (field: string, value: string | boolean | SocialLinks) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setHasChanges(true)
  }

  // 圖片上傳
  const handleImageUpload = async (file: File, field: 'avatarUrl' | 'coverImageUrl') => {
    try {
      const response = await biographyService.uploadImage(file)
      const uploadedUrl = response.data?.url
      if (response.success && uploadedUrl) {
        setProfileData((prev) => ({
          ...prev,
          [field]: uploadedUrl,
        }))
        setHasChanges(true)
        toast({ title: field === 'avatarUrl' ? '頭像上傳成功' : '封面上傳成功' })
      }
    } catch (error) {
      console.error('上傳失敗:', error)
      toast({ title: '上傳失敗', variant: 'destructive' })
    }
  }

  // 進階故事儲存
  const handleAdvancedStorySave = useCallback(
    async (field: string, value: string) => {
      setProfileData((prev) => ({
        ...prev,
        advancedStories: {
          ...prev.advancedStories,
          [field]: value,
        },
      }))

      try {
        await biographyService.updateMyBiography({ [field]: value })
        toast({ title: '故事已儲存' })
      } catch {
        toast({ title: '儲存失敗', variant: 'destructive' })
      }
    },
    [setProfileData, toast]
  )

  // 全部儲存
  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      const biographyData = mapProfileDataToApi(profileData)

      const response = await biographyService.updateMyBiography(biographyData)

      if (response.success) {
        toast({ title: '儲存成功', description: '您的個人資料已成功更新' })
        setHasChanges(false)
      } else {
        throw new Error(response.error || '儲存失敗')
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      toast({ title: '儲存失敗', description: '請稍後再試', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // 渲染標籤內容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'avatar':
        return (
          <BiographyAvatarSection
            avatarUrl={profileData.avatarUrl}
            coverImageUrl={profileData.coverImageUrl}
            isEditing={true}
            isMobile={isMobile}
            onAvatarUpload={(file) => handleImageUpload(file, 'avatarUrl')}
            onCoverImageUpload={(file) => handleImageUpload(file, 'coverImageUrl')}
            onAvatarDelete={() => {
              setProfileData((prev) => ({ ...prev, avatarUrl: null }))
              setHasChanges(true)
            }}
            onCoverImageDelete={() => {
              setProfileData((prev) => ({ ...prev, coverImageUrl: null }))
              setHasChanges(true)
            }}
          />
        )
      case 'basic':
        return (
          <BasicInfoSection
            name={profileData.name}
            title={profileData.title}
            isEditing={true}
            isMobile={isMobile}
            onChange={handleChange}
          />
        )
      case 'climbing':
        return (
          <ClimbingInfoSection
            startYear={profileData.startYear}
            frequentGyms={profileData.frequentGyms}
            favoriteRouteType={profileData.favoriteRouteType}
            isEditing={true}
            isMobile={isMobile}
            onChange={handleChange}
          />
        )
      case 'social':
        return (
          <SocialLinksSection
            socialLinks={profileData.socialLinks}
            isEditing={true}
            isMobile={isMobile}
            onChange={handleChange}
          />
        )
      case 'core-stories':
        return (
          <ClimbingExperienceSection
            climbingReason={profileData.climbingReason}
            climbingMeaning={profileData.climbingMeaning}
            adviceForBeginners={profileData.adviceForBeginners}
            isEditing={true}
            isMobile={isMobile}
            onChange={handleChange}
          />
        )
      case 'advanced-stories':
        return (
          <AdvancedStoryEditor
            biography={(profileData.advancedStories ?? {}) as AdvancedStories & Record<string, string>}
            onSave={handleAdvancedStorySave}
            onClose={() => {}}
            className="max-h-none border-0 shadow-none"
          />
        )
      case 'footprints':
        return <ClimbingFootprintsSection isEditing={true} isMobile={isMobile} />
      case 'settings':
        return (
          <PublicSettingSection
            isPublic={profileData.isPublic}
            isMobile={isMobile}
            onChange={handleChange}
          />
        )
      default:
        return null
    }
  }

  // 手機版 - 水平滾動標籤
  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* 頂部標題列 */}
        <div className="sticky top-0 z-10 border-b bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button onClick={onBack} className="text-gray-500">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <h1 className="text-lg font-semibold">編輯人物誌</h1>
            </div>
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? '儲存中...' : '儲存'}
            </Button>
          </div>

          {/* 水平滾動標籤 */}
          <div className="mt-3 -mx-4 overflow-x-auto">
            <div className="flex gap-2 px-4 pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.icon}
                  {tab.title}
                  {getTabCompletion(tab.id) && (
                    <Check className="h-3 w-3 text-green-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // 桌面版 - 左側導航 + 右側內容
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 左側導航 */}
      <div className="w-64 flex-shrink-0 border-r bg-white">
        <div className="sticky top-0 p-6">
          {/* 返回按鈕 */}
          {onBack && (
            <button
              onClick={onBack}
              className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              返回
            </button>
          )}

          <h1 className="mb-1 text-xl font-semibold text-gray-900">編輯人物誌</h1>
          <p className="mb-6 text-sm text-gray-500">完善你的攀岩檔案</p>

          {/* 導航列表 */}
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-100'
                  }`}
                >
                  {tab.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{tab.title}</span>
                    {getTabCompletion(tab.id) ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-300" />
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-400">{tab.description}</p>
                </div>
              </button>
            ))}
          </nav>

          {/* 儲存按鈕 */}
          <div className="mt-8 border-t pt-6">
            <Button
              className="w-full"
              onClick={handleSaveAll}
              disabled={isSaving || !hasChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? '儲存中...' : hasChanges ? '儲存變更' : '已儲存'}
            </Button>
            {hasChanges && (
              <p className="mt-2 text-center text-xs text-amber-600">有未儲存的變更</p>
            )}
          </div>
        </div>
      </div>

      {/* 右側內容區域 */}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTabConfig?.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeTabConfig?.description}
                </p>
              </div>
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
