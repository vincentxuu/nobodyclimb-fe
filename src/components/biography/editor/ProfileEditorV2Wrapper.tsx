'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { biographyService } from '@/lib/api/services'
import type { BiographyV2 } from '@/lib/types/biography-v2'
import { createEmptyBiographyV2 } from '@/lib/types/biography-v2'
import { SYSTEM_TAG_DIMENSION_LIST } from '@/lib/constants/biography-tags'
import { SYSTEM_ONELINER_QUESTION_LIST, getStoryQuestionsByStoryCategory } from '@/lib/constants/biography-questions'
import { useAuthStore } from '@/store/authStore'
import ProfileEditor from './ProfileEditor'

interface ProfileEditorV2WrapperProps {
  className?: string
}

/**
 * ProfileEditor V2 包裝組件
 * 負責資料獲取、狀態管理和儲存邏輯
 */
export function ProfileEditorV2Wrapper({ className }: ProfileEditorV2WrapperProps) {
  const { user } = useAuthStore()
  const [biography, setBiography] = useState<BiographyV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 獲取故事問題（按分類分組）
  const storyQuestionsByCategory = getStoryQuestionsByStoryCategory()

  // 載入用戶的人物誌資料
  useEffect(() => {
    const loadBiography = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await biographyService.getMyBiographyV2()

        if (response.success && response.data) {
          setBiography(response.data)
        } else {
          // 如果沒有人物誌，建立空白的
          setBiography(createEmptyBiographyV2(user.id))
        }
      } catch (err) {
        console.error('Failed to load biography:', err)
        setError('載入人物誌失敗')
        // 建立空白的人物誌
        setBiography(createEmptyBiographyV2(user.id))
      } finally {
        setLoading(false)
      }
    }

    loadBiography()
  }, [user?.id])

  // 處理資料變更
  const handleChange = useCallback((updates: Partial<BiographyV2>) => {
    setBiography((prev) => {
      if (!prev) return prev
      return { ...prev, ...updates }
    })
  }, [])

  // 處理儲存
  const handleSave = useCallback(async (bio: BiographyV2) => {
    try {
      setSaving(true)
      setError(null)

      // 呼叫 API 儲存（將 null 轉換為 undefined）
      const response = await biographyService.updateMyBiography({
        name: bio.name,
        title: bio.title ?? undefined,
        bio: bio.bio ?? undefined,
        avatar_url: bio.avatar_url ?? undefined,
        cover_image: bio.cover_url ?? undefined,
        climbing_start_year: bio.climbing_start_year?.toString() ?? undefined,
        frequent_locations: bio.frequent_locations ? bio.frequent_locations.join(', ') : undefined,
        favorite_route_type: bio.favorite_route_types ? bio.favorite_route_types.join(', ') : undefined,
        social_links: bio.social_links ? JSON.stringify(bio.social_links) : undefined,
        visibility: bio.visibility ?? undefined,
        // V2 資料欄位
        tags_data: JSON.stringify(bio.tags),
        one_liners_data: JSON.stringify(
          bio.one_liners.reduce((acc, item) => {
            acc[item.question_id] = { answer: item.answer, visibility: 'public' }
            return acc
          }, {} as Record<string, { answer: string; visibility: string }>)
        ),
        stories_data: JSON.stringify(
          bio.stories.reduce((acc, item) => {
            if (!acc['uncategorized']) acc['uncategorized'] = {}
            acc['uncategorized'][item.question_id] = {
              answer: item.content,
              visibility: 'public',
              updated_at: new Date().toISOString(),
            }
            return acc
          }, {} as Record<string, Record<string, { answer: string; visibility: string; updated_at: string }>>)
        ),
        basic_info_data: JSON.stringify({
          name: bio.name,
          title: bio.title ?? '',
          bio: bio.bio ?? '',
          climbing_start_year: bio.climbing_start_year ?? '',
          frequent_locations: bio.frequent_locations?.join(', ') ?? '',
          home_gym: bio.home_gym ?? '',
        }),
      })

      if (!response.success) {
        throw new Error('儲存失敗')
      }

      // 更新本地狀態
      setBiography(bio)
    } catch (err) {
      console.error('Failed to save biography:', err)
      setError('儲存失敗，請稍後再試')
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  // 處理發布
  const handlePublish = useCallback(async () => {
    if (!biography) return

    try {
      setSaving(true)
      // 更新 visibility 為 public
      const updatedBio = { ...biography, visibility: 'public' as const }
      await handleSave(updatedBio)
    } finally {
      setSaving(false)
    }
  }, [biography, handleSave])

  // 載入中狀態
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  // 未登入狀態
  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-[#6D6C6C]">請先登入以編輯人物誌</p>
      </div>
    )
  }

  // 錯誤狀態
  if (error && !biography) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#1B1A1A] px-4 py-2 text-white hover:bg-[#333]"
        >
          重新載入
        </button>
      </div>
    )
  }

  if (!biography) {
    return null
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">
          {error}
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-[#1B1A1A]" />
          </div>
        </div>
      )}

      <ProfileEditor
        biography={biography}
        tagDimensions={SYSTEM_TAG_DIMENSION_LIST}
        oneLinerQuestions={SYSTEM_ONELINER_QUESTION_LIST}
        storyQuestionsByCategory={storyQuestionsByCategory}
        onChange={handleChange}
        onSave={handleSave}
        previewHref={biography.id ? `/biography/profile/${biography.id}` : '#'}
        onPublish={handlePublish}
      />
    </div>
  )
}

export default ProfileEditorV2Wrapper
