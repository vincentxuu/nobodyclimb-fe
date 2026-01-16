'use client'

/**
 * 版本 C - 步驟式引導精靈
 *
 * 特點：
 * - 逐步引導用戶完成每個區塊
 * - 明確的進度指示
 * - 一次專注一件事，減少認知負擔
 * - 適合新用戶首次設定
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mountain,
  Link2,
  BookOpen,
  Globe,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  SkipForward,
  Camera,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '../ProfileContext'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { SocialLinks } from '../types'
import { mapProfileDataToApi } from '../mappers'

interface Step {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  component: React.ReactNode
}

interface ProfileEditorVersionCProps {
  onBack?: () => void
  onComplete?: () => void
}

export default function ProfileEditorVersionC({ onBack, onComplete }: ProfileEditorVersionCProps) {
  const { profileData, setProfileData } = useProfile()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // 處理表單變更
  const handleChange = (field: string, value: string | boolean | SocialLinks) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.replace('socialLinks.', '')
      setProfileData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value as string,
        },
      }))
    } else {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
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
        toast({ title: '圖片上傳成功' })
      }
    } catch (error) {
      console.error('上傳失敗:', error)
      toast({ title: '上傳失敗', variant: 'destructive' })
    }
  }

  // 儲存並前往下一步
  const saveAndNext = async () => {
    setIsSaving(true)
    try {
      const biographyData = mapProfileDataToApi(profileData, { includeAdvancedStories: false })

      await biographyService.updateMyBiography(biographyData)

      setCompletedSteps((prev) => new Set([...prev, currentStep]))

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
        toast({ title: '已儲存' })
      } else {
        toast({ title: '設定完成！', description: '你的人物誌已準備就緒' })
        onComplete?.()
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      toast({ title: '儲存失敗', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // 步驟 1: 頭像設定
  const AvatarStep = () => (
    <div className="flex flex-col items-center">
      <div
        className="group relative mb-6 h-40 w-40 cursor-pointer overflow-hidden rounded-full bg-gray-100"
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
              <Camera className="h-8 w-8 text-white" />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
            <Camera className="mb-2 h-10 w-10" />
            <span className="text-sm">點擊上傳</span>
          </div>
        )}
      </div>
      <p className="text-center text-sm text-gray-500">
        選擇一張能代表你的照片
        <br />
        建議使用正方形圖片
      </p>
    </div>
  )

  // 步驟 2: 基本資料
  const BasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          你的暱稱是什麼？
        </label>
        <Input
          value={profileData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="例如：小岩、岩手"
          className="text-lg"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          用一句話形容自己
        </label>
        <Input
          value={profileData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="例如：週末抱石愛好者"
        />
        <p className="mt-1 text-xs text-gray-400">
          這會顯示在你的名字下方
        </p>
      </div>
    </div>
  )

  // 步驟 3: 攀岩資訊
  const ClimbingInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          你是哪一年開始攀岩的？
        </label>
        <Input
          type="number"
          value={profileData.startYear}
          onChange={(e) => handleChange('startYear', e.target.value)}
          placeholder="例如：2020"
          min={1990}
          max={new Date().getFullYear()}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          平常都在哪裡攀岩？
        </label>
        <Input
          value={profileData.frequentGyms}
          onChange={(e) => handleChange('frequentGyms', e.target.value)}
          placeholder="例如：紅石攀岩館、龍洞"
        />
        <p className="mt-1 text-xs text-gray-400">
          可以填寫多個地點，用逗號分隔
        </p>
      </div>
    </div>
  )

  // 步驟 4: 社群連結
  const SocialLinksStep = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          你的 Instagram
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">@</span>
          <Input
            value={profileData.socialLinks.instagram || ''}
            onChange={(e) => handleChange('socialLinks.instagram', e.target.value)}
            placeholder="你的 IG 帳號"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          YouTube 頻道（選填）
        </label>
        <Input
          value={profileData.socialLinks.youtube_channel || ''}
          onChange={(e) => handleChange('socialLinks.youtube_channel', e.target.value)}
          placeholder="YouTube 頻道連結"
        />
      </div>
    </div>
  )

  // 步驟 5: 攀岩故事
  const StoryStep = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          你與攀岩的相遇
        </label>
        <Textarea
          value={profileData.climbingReason}
          onChange={(e) => handleChange('climbingReason', e.target.value)}
          placeholder="分享你是如何開始攀岩的..."
          className="min-h-[120px]"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          攀岩對你來說是什麼？
        </label>
        <Textarea
          value={profileData.climbingMeaning}
          onChange={(e) => handleChange('climbingMeaning', e.target.value)}
          placeholder="攀岩在你的生活中扮演什麼角色..."
          className="min-h-[120px]"
        />
      </div>
    </div>
  )

  // 步驟 6: 公開設定
  const PrivacyStep = () => (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => handleChange('isPublic', true)}
            className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
              profileData.isPublic
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Globe className={`mb-2 h-6 w-6 ${profileData.isPublic ? 'text-green-600' : 'text-gray-400'}`} />
            <div className="font-medium">公開</div>
            <p className="mt-1 text-sm text-gray-500">
              其他人可以看到你的人物誌
            </p>
          </button>
          <button
            onClick={() => handleChange('isPublic', false)}
            className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
              !profileData.isPublic
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User className={`mb-2 h-6 w-6 ${!profileData.isPublic ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="font-medium">私人</div>
            <p className="mt-1 text-sm text-gray-500">
              只有你自己可以看到
            </p>
          </button>
        </div>
      </div>
      <p className="text-center text-sm text-gray-500">
        你可以隨時在設定中更改這個選項
      </p>
    </div>
  )

  const steps: Step[] = [
    {
      id: 'avatar',
      icon: <ImageIcon className="h-6 w-6" />,
      title: '設定你的頭像',
      subtitle: '讓大家認識你',
      component: <AvatarStep />,
    },
    {
      id: 'basic',
      icon: <User className="h-6 w-6" />,
      title: '介紹一下自己',
      subtitle: '你的暱稱和簡介',
      component: <BasicInfoStep />,
    },
    {
      id: 'climbing',
      icon: <Mountain className="h-6 w-6" />,
      title: '你的攀岩旅程',
      subtitle: '分享你的攀岩經歷',
      component: <ClimbingInfoStep />,
    },
    {
      id: 'social',
      icon: <Link2 className="h-6 w-6" />,
      title: '連結社群帳號',
      subtitle: '讓岩友能找到你',
      component: <SocialLinksStep />,
    },
    {
      id: 'story',
      icon: <BookOpen className="h-6 w-6" />,
      title: '分享你的故事',
      subtitle: '與攀岩的相遇',
      component: <StoryStep />,
    },
    {
      id: 'privacy',
      icon: <Globe className="h-6 w-6" />,
      title: '隱私設定',
      subtitle: '選擇誰可以看到',
      component: <PrivacyStep />,
    },
  ]

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* 頂部進度條 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur">
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-gray-900"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => {
              if (currentStep > 0) {
                setCurrentStep(currentStep - 1)
              } else {
                onBack?.()
              }
            }}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentStep > 0 ? '上一步' : '返回'}
          </button>

          <div className="text-sm text-gray-400">
            {currentStep + 1} / {steps.length}
          </div>

          <button
            onClick={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1)
              }
            }}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            跳過
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 步驟指示器 */}
      <div className="flex justify-center gap-2 py-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              index === currentStep
                ? 'bg-gray-900 text-white'
                : index < currentStep || completedSteps.has(index)
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {index < currentStep || completedSteps.has(index) ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="text-xs">{index + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* 主要內容 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* 步驟標題 */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                {currentStepData.icon}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentStepData.title}
              </h1>
              <p className="mt-1 text-gray-500">{currentStepData.subtitle}</p>
            </div>

            {/* 步驟內容 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              {currentStepData.component}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部按鈕 */}
      <div className="sticky bottom-0 border-t bg-white p-4">
        <div className="mx-auto max-w-md">
          <Button
            className="w-full"
            size="lg"
            onClick={saveAndNext}
            disabled={isSaving}
          >
            {isSaving ? (
              '儲存中...'
            ) : currentStep === steps.length - 1 ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                完成設定
              </>
            ) : (
              <>
                下一步
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
