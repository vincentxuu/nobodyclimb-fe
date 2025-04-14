'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageTransition } from '@/components/shared/page-transition'
import { useToast } from '@/components/ui/use-toast'

interface SelfIntroFormData {
  climbingReason: string
  climbingMeaning: string
  climbingBucketList: string
  messageToBeginners: string
  isPublic: boolean
}

export default function SelfIntroPage() {
  const router = useRouter()
  const { user, updateUser, isAuthenticated, loading } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState<SelfIntroFormData>({
    climbingReason: '',
    climbingMeaning: '',
    climbingBucketList: '',
    messageToBeginners: '',
    isPublic: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // 如果使用者未登入，重定向至登入頁面
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
    
    // 如果使用者已有自我介紹資料，則預填寫表單
    if (user && user.bio) {
      try {
        // 假設 bio 是 JSON 格式儲存的
        const bioData = JSON.parse(user.bio)
        if (bioData) {
          setFormData(prev => ({
            ...prev,
            climbingReason: bioData.climbingReason || '',
            climbingMeaning: bioData.climbingMeaning || '',
            climbingBucketList: bioData.climbingBucketList || '',
            messageToBeginners: bioData.messageToBeginners || '',
            isPublic: bioData.isPublic || false
          }))
        }
      } catch (error) {
        // 如果不是 JSON 格式，忽略錯誤
        console.error('解析使用者 bio 時發生錯誤', error)
      }
    }
  }, [user, isAuthenticated, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 將自我介紹資料儲存為 JSON 格式
      const bioData = JSON.stringify({
        climbingReason: formData.climbingReason,
        climbingMeaning: formData.climbingMeaning,
        climbingBucketList: formData.climbingBucketList,
        messageToBeginners: formData.messageToBeginners,
        isPublic: formData.isPublic
      })

      const userData = {
        bio: bioData
      }

      const result = await updateUser(userData)
      
      if (result.success) {
        toast({
          title: "自我介紹已更新",
          description: "您的自我介紹已成功更新",
          variant: "default",
        })
        // 導航到完成頁面
        router.push('/auth/profile-setup/complete')
      } else {
        toast({
          title: "更新失敗",
          description: result.error || "更新資料時發生錯誤",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('更新資料失敗', error)
      toast({
        title: "更新失敗",
        description: "更新資料時發生錯誤，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleSkip = () => {
    router.push('/auth/profile-setup/complete')
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* 步驟指示器 */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  1
                </div>
                <span className="mt-2 text-sm">基本資料</span>
              </div>
              <div className="h-1 w-16 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  2
                </div>
                <span className="mt-2 text-sm">自我介紹</span>
              </div>
              <div className="h-1 w-16 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                  3
                </div>
                <span className="mt-2 text-sm text-gray-500">完成</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">自我介紹</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 攀岩原因 */}
          <div className="space-y-2">
            <label className="text-gray-700">踏上攀岩不歸路的原因</label>
            <Textarea
              name="climbingReason"
              value={formData.climbingReason}
              onChange={handleChange}
              placeholder="分享你是如何開始攀岩的故事..."
              className="min-h-24"
            />
          </div>

          {/* 攀岩意義 */}
          <div className="space-y-2">
            <label className="text-gray-700">攀岩對你來說是什麼樣的存在</label>
            <Textarea
              name="climbingMeaning"
              value={formData.climbingMeaning}
              onChange={handleChange}
              placeholder="攀岩對你的意義是什麼？"
              className="min-h-24"
            />
          </div>

          {/* 攀岩清單 */}
          <div className="space-y-2">
            <label className="text-gray-700">在攀岩世界裡，想做的人生清單是什麼</label>
            <Textarea
              name="climbingBucketList"
              value={formData.climbingBucketList}
              onChange={handleChange}
              placeholder="你有想完成的攀岩目標或願望嗎？"
              className="min-h-24"
            />
          </div>

          {/* 給新手的話 */}
          <div className="space-y-2">
            <label className="text-gray-700">對於初踏入攀岩的岩友，留言給他們的一句話</label>
            <Input
              type="outline"
              name="messageToBeginners"
              value={formData.messageToBeginners}
              onChange={handleChange}
              placeholder="享受其中是最重要的事！"
            />
          </div>

          {/* 公開分享選項 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleCheckboxChange}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isPublic" className="text-gray-700">
              我願意將自我介紹公開放到人物誌
            </label>
          </div>

          {/* 按鈕區 */}
          <div className="flex justify-between space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-gray-700 py-3 rounded-lg"
              disabled={isSubmitting}
            >
              略過
            </Button>
            <Button
              type="submit"
              className="flex-1 py-3 text-white rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? '處理中...' : '完成'}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}
