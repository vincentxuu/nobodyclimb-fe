'use client'

/**
 * 版本 B - 所見即所得內聯編輯
 *
 * 特點：
 * - 直接在預覽頁面上編輯，點擊區域即可編輯
 * - 類似 Notion 的編輯體驗
 * - 即時預覽效果
 * - 自動儲存機制
 * - 使用品牌色 (brand-dark, brand-accent)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mountain,
  Link2,
  BookOpen,
  Globe,
  Check,
  X,
  Pencil,
  Camera,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '../ProfileContext'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { ALL_STORY_QUESTIONS, StoryQuestion } from '@/lib/constants/biography-stories'

type EditingField = string | null
type StoryFilter = 'all' | 'filled' | 'unfilled'

interface ProfileEditorVersionBProps {
  onBack?: () => void
}

export default function ProfileEditorVersionB({ onBack }: ProfileEditorVersionBProps) {
  const { profileData, setProfileData } = useProfile()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [editingField, setEditingField] = useState<EditingField>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // 故事篩選和分頁
  const [storyFilter, setStoryFilter] = useState<StoryFilter>('all')
  const [visibleStoryCount, setVisibleStoryCount] = useState(3)

  // 自動聚焦
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingField])

  // 取得故事值
  const getStoryValue = (field: string): string => {
    // 先檢查 advancedStories
    const advancedValue = profileData.advancedStories?.[field as keyof typeof profileData.advancedStories]
    if (advancedValue) return advancedValue as string

    // 核心故事的欄位映射
    const coreFieldMap: Record<string, keyof typeof profileData> = {
      climbing_origin: 'climbingReason',
      climbing_meaning: 'climbingMeaning',
      advice_to_self: 'adviceForBeginners',
    }

    if (coreFieldMap[field]) {
      return (profileData[coreFieldMap[field]] as string) || ''
    }

    return ''
  }

  // 篩選故事
  const getFilteredStories = (): StoryQuestion[] => {
    return ALL_STORY_QUESTIONS.filter((q) => {
      const value = getStoryValue(q.field)
      const isFilled = value && value.trim().length > 0

      if (storyFilter === 'filled') return isFilled
      if (storyFilter === 'unfilled') return !isFilled
      return true
    })
  }

  const filteredStories = getFilteredStories()
  const visibleStories = filteredStories.slice(0, visibleStoryCount)
  const remainingCount = filteredStories.length - visibleStoryCount

  // 計算已填寫數量
  const filledCount = ALL_STORY_QUESTIONS.filter((q) => {
    const value = getStoryValue(q.field)
    return value && value.trim().length > 0
  }).length

  // 開始編輯
  const startEditing = (field: string, value: string) => {
    setEditingField(field)
    setTempValue(value || '')
  }

  // 取消編輯
  const cancelEditing = () => {
    setEditingField(null)
    setTempValue('')
  }

  // 儲存單一欄位
  const saveField = async (field: string, value: string) => {
    setIsSaving(true)
    try {
      // 更新本地狀態
      if (field.startsWith('socialLinks.')) {
        const socialField = field.replace('socialLinks.', '')
        setProfileData((prev) => ({
          ...prev,
          socialLinks: {
            ...prev.socialLinks,
            [socialField]: value,
          },
        }))
      } else {
        setProfileData((prev) => ({
          ...prev,
          [field]: value,
        }))
      }

      // 建立 API 資料
      const fieldMap: Record<string, string> = {
        name: 'name',
        title: 'title',
        startYear: 'climbing_start_year',
        frequentGyms: 'frequent_locations',
        climbingReason: 'climbing_origin',
        climbingMeaning: 'climbing_meaning',
        adviceForBeginners: 'advice_to_self',
      }

      let apiData: Record<string, unknown>

      if (field.startsWith('socialLinks.')) {
        const socialField = field.replace('socialLinks.', '')
        const newSocialLinks = {
          ...profileData.socialLinks,
          [socialField]: value,
        }
        apiData = { social_links: JSON.stringify(newSocialLinks) }
      } else {
        const apiField = fieldMap[field] || field
        apiData = { [apiField]: value }
      }

      await biographyService.updateMyBiography(apiData)
      toast({ title: '已儲存' })
      setEditingField(null)
      setTempValue('')
    } catch (error) {
      console.error('儲存失敗:', error)
      toast({ title: '儲存失敗', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // 儲存故事欄位
  const saveStoryField = async (field: string, value: string) => {
    setIsSaving(true)
    try {
      // 核心故事的欄位映射
      const coreFieldMap: Record<string, string> = {
        climbing_origin: 'climbingReason',
        climbing_meaning: 'climbingMeaning',
        advice_to_self: 'adviceForBeginners',
      }

      // 更新本地狀態
      if (coreFieldMap[field]) {
        setProfileData((prev) => ({
          ...prev,
          [coreFieldMap[field]]: value,
        }))
      } else {
        setProfileData((prev) => ({
          ...prev,
          advancedStories: {
            ...prev.advancedStories,
            [field]: value,
          },
        }))
      }

      // API 使用原始欄位名
      await biographyService.updateMyBiography({ [field]: value })
      toast({ title: '已儲存' })
      setEditingField(null)
      setTempValue('')
    } catch (error) {
      console.error('儲存失敗:', error)
      toast({ title: '儲存失敗', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // 處理圖片上傳
  const handleImageUpload = async (file: File, field: 'avatarUrl' | 'coverImageUrl') => {
    try {
      const response = await biographyService.uploadImage(file)
      if (response.success && response.data?.url) {
        setProfileData((prev) => ({
          ...prev,
          [field]: response.data!.url,
        }))

        const apiField = field === 'avatarUrl' ? 'avatar_url' : 'cover_image'
        await biographyService.updateMyBiography({ [apiField]: response.data.url })
        toast({ title: '圖片上傳成功' })
      }
    } catch (error) {
      console.error('上傳失敗:', error)
      toast({ title: '上傳失敗', variant: 'destructive' })
    }
  }

  // 可編輯的文字區塊
  const EditableText = ({
    field,
    value,
    placeholder,
    multiline = false,
    className = '',
    onSave,
  }: {
    field: string
    value: string
    placeholder: string
    multiline?: boolean
    className?: string
    onSave?: (field: string, value: string) => Promise<void>
  }) => {
    const isEditing = editingField === field
    const saveFn = onSave || saveField

    if (isEditing) {
      return (
        <div className="flex items-start gap-2">
          {multiline ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className={`min-h-[120px] border-brand-dark focus:ring-brand-accent ${className}`}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEditing()
              }}
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className={`border-brand-dark focus:ring-brand-accent ${className}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveFn(field, tempValue)
                if (e.key === 'Escape') cancelEditing()
              }}
            />
          )}
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-brand-accent/20"
              onClick={() => saveFn(field, tempValue)}
              disabled={isSaving}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={cancelEditing}
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <button
        onClick={() => startEditing(field, value)}
        className={`group flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-brand-light ${className}`}
      >
        <span className={value ? 'text-brand-dark' : 'text-subtle'}>
          {value || placeholder}
        </span>
        <Pencil className="h-3.5 w-3.5 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    )
  }

  // 故事卡片
  const StoryCard = ({ question }: { question: StoryQuestion }) => {
    const value = getStoryValue(question.field)
    const isFilled = value && value.trim().length > 0
    const isEditing = editingField === question.field

    if (isEditing) {
      return (
        <div className="rounded-lg border border-brand-dark bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-brand-dark">{question.title}</h4>
          </div>
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder={question.placeholder}
            className="mb-3 min-h-[120px] border-brand-dark focus:ring-brand-accent"
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancelEditing()
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEditing}
              className="border-subtle"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => saveStoryField(question.field, tempValue)}
              disabled={isSaving}
              className="bg-brand-dark hover:bg-brand-dark-hover"
            >
              {isSaving ? '儲存中...' : '儲存'}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <button
        onClick={() => startEditing(question.field, value)}
        className="group w-full rounded-lg border border-subtle bg-white p-4 text-left transition-all hover:border-brand-dark hover:shadow-sm"
      >
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-medium text-brand-dark">{question.title}</h4>
          <div className="flex items-center gap-2">
            {isFilled ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent">
                <Check className="h-3 w-3 text-brand-dark" />
              </span>
            ) : (
              <span className="h-5 w-5 rounded-full border-2 border-subtle" />
            )}
            <Pencil className="h-4 w-4 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
        <p className={`text-sm ${isFilled ? 'text-text-subtle line-clamp-2' : 'text-subtle'}`}>
          {isFilled ? value : question.placeholder}
        </p>
      </button>
    )
  }

  return (
    <div className={`min-h-screen bg-page-bg ${isMobile ? 'pb-20' : ''}`}>
      {/* 封面區域 */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-brand-dark to-brand-dark-hover md:h-64">
          {profileData.coverImageUrl ? (
            <img
              src={profileData.coverImageUrl}
              alt="封面"
              className="h-full w-full object-cover"
            />
          ) : null}
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleImageUpload(file, 'coverImageUrl')
              }
              input.click()
            }}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-brand-dark shadow-sm transition-colors hover:bg-white"
          >
            <Camera className="h-4 w-4" />
            {profileData.coverImageUrl ? '更換封面' : '新增封面'}
          </button>
        </div>

        {/* 頭像 */}
        <div className="absolute -bottom-16 left-6 md:left-12">
          <div
            className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-brand-light shadow-lg"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleImageUpload(file, 'avatarUrl')
              }
              input.click()
            }}
          >
            {profileData.avatarUrl ? (
              <>
                <img
                  src={profileData.avatarUrl}
                  alt="頭像"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-12 w-12 text-subtle" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="mx-auto max-w-3xl px-4 pt-20 md:px-8">
        {/* 基本資料區塊 */}
        <section className="mb-8">
          <div className="mb-2">
            <EditableText
              field="name"
              value={profileData.name}
              placeholder="輸入你的暱稱"
              className="text-2xl font-bold"
            />
          </div>
          <EditableText
            field="title"
            value={profileData.title}
            placeholder="用一句話形容自己..."
            className="text-text-subtle"
          />
        </section>

        {/* 攀岩資訊卡片 */}
        <section className="mb-8 rounded-xl border border-subtle bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Mountain className="h-5 w-5 text-brand-dark" />
            <h2 className="font-semibold text-brand-dark">攀岩資訊</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-subtle">開始攀岩的年份</label>
              <EditableText
                field="startYear"
                value={profileData.startYear}
                placeholder="例如：2020"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-subtle">常去的岩館/岩場</label>
              <EditableText
                field="frequentGyms"
                value={profileData.frequentGyms}
                placeholder="例如：紅石攀岩館、龍洞"
              />
            </div>
          </div>
        </section>

        {/* 社群連結卡片 */}
        <section className="mb-8 rounded-xl border border-subtle bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-brand-dark" />
            <h2 className="font-semibold text-brand-dark">社群連結</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-subtle">Instagram</label>
              <div className="flex items-center gap-2">
                <span className="text-subtle">@</span>
                <EditableText
                  field="socialLinks.instagram"
                  value={profileData.socialLinks.instagram || ''}
                  placeholder="你的 IG 帳號"
                  className="flex-1"
                />
                {profileData.socialLinks.instagram && (
                  <a
                    href={`https://instagram.com/${profileData.socialLinks.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-subtle hover:text-brand-dark"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-subtle">YouTube 頻道</label>
              <EditableText
                field="socialLinks.youtube_channel"
                value={profileData.socialLinks.youtube_channel || ''}
                placeholder="你的 YouTube 頻道連結"
              />
            </div>
          </div>
        </section>

        {/* 故事區塊 - 全部合併 */}
        <section className="mb-8 rounded-xl border border-subtle bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-dark" />
              <h2 className="font-semibold text-brand-dark">我的故事</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-subtle">已填</span>
              <span className="font-medium text-brand-dark">{filledCount}/{ALL_STORY_QUESTIONS.length}</span>
            </div>
          </div>

          {/* 進度條 */}
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-brand-light">
            <div
              className="h-full bg-brand-accent transition-all duration-300"
              style={{ width: `${(filledCount / ALL_STORY_QUESTIONS.length) * 100}%` }}
            />
          </div>

          {/* 篩選標籤 */}
          <div className="mb-4 flex gap-2">
            {[
              { key: 'all', label: '全部', count: ALL_STORY_QUESTIONS.length },
              { key: 'filled', label: '已填', count: filledCount },
              { key: 'unfilled', label: '未填', count: ALL_STORY_QUESTIONS.length - filledCount },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setStoryFilter(filter.key as StoryFilter)
                  setVisibleStoryCount(3)
                }}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  storyFilter === filter.key
                    ? 'bg-brand-dark text-white'
                    : 'bg-brand-light text-brand-dark hover:bg-brand-dark/10'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* 故事列表 */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleStories.map((question) => (
                <motion.div
                  key={question.field}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <StoryCard question={question} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 顯示更多按鈕 */}
          {remainingCount > 0 && (
            <button
              onClick={() => setVisibleStoryCount((prev) => prev + 3)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-subtle py-3 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light"
            >
              顯示更多 ({remainingCount} 題)
              <ChevronDown className="h-4 w-4" />
            </button>
          )}

          {/* 無結果提示 */}
          {filteredStories.length === 0 && (
            <div className="py-8 text-center text-text-subtle">
              {storyFilter === 'filled' ? '還沒有填寫任何故事' : '所有故事都已填寫！'}
            </div>
          )}
        </section>

        {/* 公開設定 */}
        <section className="mb-8 rounded-xl border border-subtle bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand-dark" />
              <div>
                <h2 className="font-semibold text-brand-dark">公開設定</h2>
                <p className="text-sm text-text-subtle">
                  {profileData.isPublic ? '其他人可以看到你的人物誌' : '只有你可以看到'}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const newValue = !profileData.isPublic
                setProfileData((prev) => ({ ...prev, isPublic: newValue }))
                try {
                  await biographyService.updateMyBiography({ is_public: newValue ? 1 : 0 })
                  toast({ title: newValue ? '已設為公開' : '已設為私人' })
                } catch {
                  setProfileData((prev) => ({ ...prev, isPublic: !newValue }))
                  toast({ title: '更新失敗', variant: 'destructive' })
                }
              }}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                profileData.isPublic ? 'bg-brand-accent' : 'bg-subtle'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  profileData.isPublic ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>
      </div>

      {/* 返回按鈕 (固定在底部) */}
      {onBack && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-subtle bg-white p-4">
          <Button
            variant="outline"
            className="w-full border-brand-dark text-brand-dark"
            onClick={onBack}
          >
            返回
          </Button>
        </div>
      )}

      {/* 桌面版返回按鈕 */}
      {onBack && !isMobile && (
        <div className="fixed bottom-8 right-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-brand-dark text-brand-dark shadow-lg hover:bg-brand-light"
          >
            返回選擇
          </Button>
        </div>
      )}
    </div>
  )
}
