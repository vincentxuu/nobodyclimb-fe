'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageTransition } from '@/components/shared/page-transition'
import { useToast } from '@/components/ui/use-toast'

interface BasicInfoFormData {
  displayName: string
  startYear: string
  frequentGym: string
  favoriteRouteType: string
  avatar?: File | null
}

const yearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 1990; year--) {
    years.push(year.toString())
  }
  return years
}

export default function BasicInfoPage() {
  const router = useRouter()
  const { user, updateUser, isAuthenticated, loading } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState<BasicInfoFormData>({
    displayName: '',
    startYear: '',
    frequentGym: '',
    favoriteRouteType: '',
    avatar: null
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // 如果使用者未登入，重定向至登入頁面
    // if (!loading && !isAuthenticated) {
    //   router.push('/auth/login')
    // }
    
    // 如果使用者已有名稱，則預填寫表單
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || user.username || '',
      }))
    }
  }, [user, isAuthenticated, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData(prev => ({ ...prev, avatar: file }))
      
      // 建立預覽
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string || null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 這裡需要根據實際 API 實現處理檔案上傳
      // 假設 updateUser 已經能處理檔案上傳
      const userData = {
        displayName: formData.displayName,
        climbingStartYear: formData.startYear,
        frequentGym: formData.frequentGym,
        favoriteRouteType: formData.favoriteRouteType,
        // 頭像處理邏輯需要根據實際 API 實現
        avatar: formData.avatar,
      }

      const result = await updateUser(userData)
      
      if (result.success) {
        toast({
          title: "基本資料已更新",
          description: "您的個人資料已成功更新",
          variant: "default",
        })
        // 導航到下一步
        router.push('/auth/profile-setup/self-intro')
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
    router.push('/auth/profile-setup/self-intro')
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                  2
                </div>
                <span className="mt-2 text-sm text-gray-500">自我介紹</span>
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
          <h1 className="text-2xl font-bold">基本資料</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 頭像上傳 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="頭像預覽"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
            </div>
            <div>
              <label className="cursor-pointer rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-100">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="mr-2 inline-block h-4 w-4" />
                上傳照片
              </label>
            </div>
          </div>

          {/* 名稱 */}
          <div className="space-y-2">
            <label className="text-gray-700">名稱</label>
            <Input
              type="outline"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="輸入名字或暱稱"
              required
            />
          </div>

          {/* 攀岩經驗 */}
          <div className="space-y-2">
            <label className="text-gray-700">哪一年開始攀岩</label>
            <select
              name="startYear"
              value={formData.startYear}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:border-primary bg-white"
            >
              <option value="" className="bg-white">請選擇年份</option>
              {yearOptions().map(year => (
                <option key={year} value={year} className="bg-white">{year}</option>
              ))}
            </select>
          </div>

          {/* 常去的岩場 */}
          <div className="space-y-2">
            <label className="text-gray-700">平常出沒岩場</label>
            <Input
              type="outline"
              name="frequentGym"
              value={formData.frequentGym}
              onChange={handleChange}
              placeholder="ex. 小岩攀岩館"
            />
          </div>

          {/* 喜歡的路線類型 */}
          <div className="space-y-2">
            <label className="text-gray-700">喜歡的路線型態</label>
            <Input
              type="outline"
              name="favoriteRouteType"
              value={formData.favoriteRouteType}
              onChange={handleChange}
              placeholder="ex. 長路線"
            />
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
              {isSubmitting ? '處理中...' : '下一步'}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}
