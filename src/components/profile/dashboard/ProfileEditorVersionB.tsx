'use client'

/**
 * 版本 B - 所見即所得內聯編輯
 *
 * 特點：
 * - 直接在預覽頁面上編輯，點擊區域即可編輯
 * - 類似 Notion 的編輯體驗
 * - 即時預覽效果
 * - 自動儲存機制
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
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
  Check,
  X,
  Pencil,
  Camera,
  Plus,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '../ProfileContext'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { SocialLinks } from '../types'

type EditingField = string | null

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

  // 自動聚焦
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingField])

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
  }: {
    field: string
    value: string
    placeholder: string
    multiline?: boolean
    className?: string
  }) => {
    const isEditing = editingField === field

    if (isEditing) {
      return (
        <div className="flex items-start gap-2">
          {multiline ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className={`min-h-[100px] ${className}`}
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
              className={className}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveField(field, tempValue)
                if (e.key === 'Escape') cancelEditing()
              }}
            />
          )}
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => saveField(field, tempValue)}
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
        className={`group flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-gray-100 ${className}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <Pencil className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    )
  }

  // 圖片上傳區塊
  const ImageUploadArea = ({
    imageUrl,
    field,
    aspectRatio = 'aspect-square',
    placeholder,
  }: {
    imageUrl: string | null
    field: 'avatarUrl' | 'coverImageUrl'
    aspectRatio?: string
    placeholder: string
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
      <div
        className={`group relative ${aspectRatio} cursor-pointer overflow-hidden rounded-lg bg-gray-100`}
        onClick={() => fileInputRef.current?.click()}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
            <Camera className="mb-2 h-8 w-8" />
            <span className="text-sm">{placeholder}</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file, field)
          }}
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      {/* 封面區域 */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-gray-800 to-gray-600 md:h-64">
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
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-white"
          >
            <Camera className="h-4 w-4" />
            {profileData.coverImageUrl ? '更換封面' : '新增封面'}
          </button>
        </div>

        {/* 頭像 */}
        <div className="absolute -bottom-16 left-6 md:left-12">
          <div
            className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-lg"
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
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
            className="text-gray-600"
          />
        </section>

        {/* 攀岩資訊卡片 */}
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Mountain className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">攀岩資訊</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-500">開始攀岩的年份</label>
              <EditableText
                field="startYear"
                value={profileData.startYear}
                placeholder="例如：2020"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">常去的岩館/岩場</label>
              <EditableText
                field="frequentGyms"
                value={profileData.frequentGyms}
                placeholder="例如：紅石攀岩館、龍洞"
              />
            </div>
          </div>
        </section>

        {/* 社群連結卡片 */}
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">社群連結</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-500">Instagram</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">@</span>
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
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">YouTube 頻道</label>
              <EditableText
                field="socialLinks.youtube_channel"
                value={profileData.socialLinks.youtube_channel || ''}
                placeholder="你的 YouTube 頻道連結"
              />
            </div>
          </div>
        </section>

        {/* 核心故事卡片 */}
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">你的攀岩故事</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                你與攀岩的相遇
              </label>
              <EditableText
                field="climbingReason"
                value={profileData.climbingReason}
                placeholder="分享你是如何開始攀岩的..."
                multiline
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                攀岩對你來說是什麼？
              </label>
              <EditableText
                field="climbingMeaning"
                value={profileData.climbingMeaning}
                placeholder="攀岩在你的生活中扮演什麼角色..."
                multiline
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                給剛開始攀岩的自己
              </label>
              <EditableText
                field="adviceForBeginners"
                value={profileData.adviceForBeginners}
                placeholder="如果能回到過去，你會對自己說什麼..."
                multiline
              />
            </div>
          </div>
        </section>

        {/* 公開設定 */}
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-600" />
              <div>
                <h2 className="font-semibold text-gray-900">公開設定</h2>
                <p className="text-sm text-gray-500">
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
              className={`relative h-6 w-11 rounded-full transition-colors ${
                profileData.isPublic ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  profileData.isPublic ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>
      </div>

      {/* 返回按鈕 (固定在底部) */}
      {onBack && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
          <Button variant="outline" className="w-full" onClick={onBack}>
            返回
          </Button>
        </div>
      )}

      {/* 桌面版返回按鈕 */}
      {onBack && !isMobile && (
        <div className="fixed bottom-8 right-8">
          <Button variant="outline" onClick={onBack} className="shadow-lg">
            返回選擇
          </Button>
        </div>
      )}
    </div>
  )
}
