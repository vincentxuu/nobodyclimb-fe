'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Gauge,
  Link2,
  BookOpen,
  Sparkles,
  MapPin,
  Globe,
  ImageIcon,
} from 'lucide-react'
import { ProfileDashboardCard } from './ProfileDashboardCard'
import { ProfileEditSheet } from './ProfileEditSheet'
import { useProfile } from '../ProfileContext'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { calculateStoryProgress, CORE_STORY_QUESTIONS } from '@/lib/constants/biography-stories'
import { SocialLinks } from '../types'

// 編輯面板類型
export type EditPanelType =
  | 'avatar'
  | 'basic'
  | 'climbing'
  | 'social'
  | 'core-stories'
  | 'advanced-stories'
  | 'footprints'
  | 'settings'
  | null

// 有效的面板類型列表（用於驗證）
const VALID_PANELS: EditPanelType[] = [
  'avatar',
  'basic',
  'climbing',
  'social',
  'core-stories',
  'advanced-stories',
  'footprints',
  'settings',
]

// 類別名稱映射
const CATEGORY_NAMES: Record<string, string> = {
  growth: '成長突破',
  psychology: '心理哲學',
  community: '社群連結',
  practical: '實用分享',
  dreams: '夢想探索',
  life: '生活整合',
}

export default function ProfileDashboard() {
  const { profileData, setProfileData } = useProfile()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // 從 URL 讀取當前打開的面板
  const [activePanel, setActivePanel] = useState<EditPanelType>(null)

  // 同步 URL query param
  useEffect(() => {
    const panel = searchParams.get('edit')
    if (panel && VALID_PANELS.includes(panel as EditPanelType)) {
      setActivePanel(panel as EditPanelType)
    }
  }, [searchParams])

  // 打開編輯面板
  const openPanel = (panel: EditPanelType) => {
    setActivePanel(panel)
    if (panel) {
      router.push(`/profile?edit=${panel}`, { scroll: false })
    }
  }

  // 關閉編輯面板
  const closePanel = () => {
    setActivePanel(null)
    router.push('/profile', { scroll: false })
  }

  // 處理表單變更（使用函式更新形式避免 stale state）
  const handleChange = (field: string, value: string | boolean | SocialLinks) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 通用圖片上傳處理
  const handleImageUpload = async (
    file: File,
    field: 'avatarUrl' | 'coverImageUrl',
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      const response = await biographyService.uploadImage(file)
      if (response.success && response.data?.url) {
        const url = response.data.url
        setProfileData((prev) => ({
          ...prev,
          [field]: url,
        }))
        toast({ title: successMessage })
      } else {
        throw new Error(response.error || '上傳失敗')
      }
    } catch (error) {
      console.error(`${errorMessage}:`, error)
      toast({ title: errorMessage, description: '請稍後再試', variant: 'destructive' })
      throw error
    }
  }

  // 處理頭像上傳
  const handleAvatarUpload = (file: File) =>
    handleImageUpload(file, 'avatarUrl', '頭像上傳成功', '頭像上傳失敗')

  // 處理封面照片上傳
  const handleCoverImageUpload = (file: File) =>
    handleImageUpload(file, 'coverImageUrl', '封面照片上傳成功', '封面照片上傳失敗')

  // 處理進階故事單一欄位儲存
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
        throw new Error('儲存失敗')
      }
    },
    [setProfileData, toast]
  )

  // 處理儲存
  const handleSave = async () => {
    try {
      const socialLinksJson = JSON.stringify(profileData.socialLinks)
      const biographyData = {
        // 進階故事（先展開，讓後面的核心故事欄位可以覆蓋）
        ...profileData.advancedStories,
        // 基本資料
        name: profileData.name,
        title: profileData.title || undefined,
        avatar_url: profileData.avatarUrl || undefined,
        cover_image: profileData.coverImageUrl || undefined,
        climbing_start_year: profileData.startYear,
        frequent_locations: profileData.frequentGyms,
        favorite_route_type: profileData.favoriteRouteType,
        // 核心故事（覆蓋 advancedStories 中的 bucket_list_story）
        climbing_origin: profileData.climbingReason,
        climbing_meaning: profileData.climbingMeaning,
        bucket_list_story: profileData.climbingBucketList,
        advice_to_self: profileData.adviceForBeginners,
        // 社群連結與設定
        social_links: socialLinksJson,
        is_public: profileData.isPublic ? 1 : 0,
      }

      const response = await biographyService.updateMyBiography(biographyData)

      if (response.success) {
        toast({ title: '儲存成功', description: '您的個人資料已成功更新' })
        closePanel()
      } else {
        throw new Error(response.error || '儲存失敗')
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      toast({ title: '儲存失敗', description: '請稍後再試', variant: 'destructive' })
    }
  }

  // 計算各區塊的完成狀態和預覽
  const advancedProgress = calculateStoryProgress(
    profileData.advancedStories as unknown as Record<string, unknown>
  )

  // 核心故事完成數
  const coreStoriesCompleted = CORE_STORY_QUESTIONS.filter((q) => {
    const fieldMap: Record<string, string> = {
      climbing_origin: 'climbingReason',
      climbing_meaning: 'climbingMeaning',
      advice_to_self: 'adviceForBeginners',
    }
    const key = fieldMap[q.field] || q.field
    const value = profileData[key as keyof typeof profileData]
    return value && typeof value === 'string' && value.trim().length > 0
  }).length

  // 社群連結完成數
  const socialLinksCompleted = [
    profileData.socialLinks.instagram,
    profileData.socialLinks.youtube_channel,
  ].filter((v) => v && v.trim().length > 0).length

  return (
    <motion.div
      className="w-full flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-sm bg-white p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">我的人物誌</h1>
          <p className="mt-1 text-sm text-gray-500">點擊卡片編輯各區塊內容</p>
        </div>

        {/* Dashboard Grid */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {/* 頭像與封面 */}
          <ProfileDashboardCard
            icon={<ImageIcon className="h-5 w-5" />}
            title="頭像與封面"
            description="個人形象照片"
            onClick={() => openPanel('avatar')}
            isComplete={!!(profileData.avatarUrl || profileData.coverImageUrl)}
            preview={
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {profileData.avatarUrl ? '✓ 已設定頭像' : '○ 未設定頭像'}
                <span className="mx-1">•</span>
                {profileData.coverImageUrl ? '✓ 已設定封面' : '○ 未設定封面'}
              </div>
            }
          />

          {/* 基本資料 */}
          <ProfileDashboardCard
            icon={<User className="h-5 w-5" />}
            title="基本資料"
            description="暱稱、一句話介紹"
            onClick={() => openPanel('basic')}
            isComplete={!!(profileData.name && profileData.title)}
            preview={
              <div className="truncate">
                <span className="font-medium">{profileData.name || '未設定'}</span>
                {profileData.title && (
                  <span className="ml-2 text-gray-400">· {profileData.title}</span>
                )}
              </div>
            }
          />

          {/* 攀岩資訊 */}
          <ProfileDashboardCard
            icon={<Gauge className="h-5 w-5" />}
            title="攀岩資訊"
            description="年資、常去的地方、喜好"
            onClick={() => openPanel('climbing')}
            isComplete={!!(profileData.startYear && profileData.frequentGyms)}
            preview={
              <div className="truncate text-xs">
                {profileData.startYear && <span>{profileData.startYear} 年開始攀岩</span>}
                {profileData.frequentGyms && (
                  <span className="ml-2">· {profileData.frequentGyms}</span>
                )}
              </div>
            }
          />

          {/* 社群連結 */}
          <ProfileDashboardCard
            icon={<Link2 className="h-5 w-5" />}
            title="社群連結"
            description="Instagram、YouTube"
            onClick={() => openPanel('social')}
            progress={{ current: socialLinksCompleted, total: 2 }}
            preview={
              <div className="flex flex-wrap gap-2 text-xs">
                {profileData.socialLinks.instagram && (
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    IG: @{profileData.socialLinks.instagram}
                  </span>
                )}
                {profileData.socialLinks.youtube_channel && (
                  <span className="rounded bg-gray-100 px-2 py-0.5">YouTube 已連結</span>
                )}
              </div>
            }
          />

          {/* 核心故事 */}
          <ProfileDashboardCard
            icon={<BookOpen className="h-5 w-5" />}
            title="核心故事"
            description="與攀岩的相遇、攀岩的意義"
            onClick={() => openPanel('core-stories')}
            progress={{ current: coreStoriesCompleted, total: 3 }}
          />

          {/* 小故事 - 大卡片 */}
          <ProfileDashboardCard
            icon={<Sparkles className="h-5 w-5" />}
            title="小故事"
            description="記錄你的攀岩故事與成長歷程"
            onClick={() => openPanel('advanced-stories')}
            size="large"
            progress={{ current: advancedProgress.completed, total: advancedProgress.total }}
            preview={
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(advancedProgress.byCategory).map(([category, progress]) => (
                  <span
                    key={category}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      progress.completed === progress.total
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {CATEGORY_NAMES[category] || category} {progress.completed}/{progress.total}
                  </span>
                ))}
              </div>
            }
          />

          {/* 攀岩足跡 */}
          <ProfileDashboardCard
            icon={<MapPin className="h-5 w-5" />}
            title="攀岩足跡"
            description="記錄去過的攀岩地點"
            onClick={() => openPanel('footprints')}
          />

          {/* 公開設定 */}
          <ProfileDashboardCard
            icon={<Globe className="h-5 w-5" />}
            title="公開設定"
            description="人物誌是否公開顯示"
            onClick={() => openPanel('settings')}
            preview={
              <span
                className={`text-xs ${profileData.isPublic ? 'text-green-600' : 'text-gray-500'}`}
              >
                {profileData.isPublic ? '● 公開' : '○ 私人'}
              </span>
            }
          />
        </div>
      </div>

      {/* 側滑編輯面板 */}
      <ProfileEditSheet
        activePanel={activePanel}
        onClose={closePanel}
        profileData={profileData}
        isMobile={isMobile}
        onChange={handleChange}
        onSave={handleSave}
        onAvatarUpload={handleAvatarUpload}
        onCoverImageUpload={handleCoverImageUpload}
        onAvatarDelete={() => setProfileData((prev) => ({ ...prev, avatarUrl: null }))}
        onCoverImageDelete={() => setProfileData((prev) => ({ ...prev, coverImageUrl: null }))}
        onAdvancedStorySave={handleAdvancedStorySave}
      />
    </motion.div>
  )
}
