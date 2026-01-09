'use client'

import React, { useState } from 'react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserCircle, Key, Upload } from 'lucide-react'
import {
  AvatarOptions,
  generateAvatarElement,
  DEFAULT_AVATARS,
} from '@/components/shared/avatar-options'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'

// 初始資料
const initialUserData = {
  username: 'nobodyclimb',
  email: 'nobodyclimb@gmail.com',
  displayName: '許岩手',
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
  avatarStyle: DEFAULT_AVATARS[0].id,
}

// 表單欄位元件
const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="font-medium text-[#3F3D3D]">{label}</Label>
    {children}
  </div>
)

export default function SettingsPage() {
  const [userData, setUserData] = useState(initialUserData)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [useDefaultAvatar, setUseDefaultAvatar] = useState(!avatar)
  const [activeTab, setActiveTab] = useState<string>('profile')
  const isMobile = useIsMobile()
  const { toast } = useToast()

  // 處理表單變更
  const handleChange = (field: string, value: string) => {
    setUserData({
      ...userData,
      [field]: value,
    })
  }

  // 處理頭像上傳
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatar(file)
      setUseDefaultAvatar(false)

      // 預覽頭像
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 處理預設頭像選擇
  const handleDefaultAvatarChange = (avatarId: string) => {
    setUserData({
      ...userData,
      avatarStyle: avatarId,
    })
    setUseDefaultAvatar(true)
    setAvatar(null)
    setAvatarPreview(null)
  }

  // 移除頭像
  const handleRemoveAvatar = () => {
    setAvatar(null)
    setAvatarPreview(null)
    setUseDefaultAvatar(true)
  }

  // 驗證電子郵件格式
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // 儲存基本資料
  const handleSaveProfile = () => {
    // 驗證顯示名稱
    if (!userData.displayName.trim()) {
      toast({
        title: '請輸入顯示名稱',
        description: '顯示名稱不能為空',
        variant: 'destructive',
      })
      return
    }

    // 驗證使用者名稱
    if (!userData.username.trim()) {
      toast({
        title: '請輸入使用者名稱',
        description: '使用者名稱不能為空',
        variant: 'destructive',
      })
      return
    }

    // 驗證電子郵件格式
    if (!isValidEmail(userData.email)) {
      toast({
        title: '電子郵件格式錯誤',
        description: '請輸入有效的電子郵件地址',
        variant: 'destructive',
      })
      return
    }

    // 在這裡實現 API 呼叫來保存資料
    console.log('儲存個人資料:', userData)

    toast({
      title: '儲存成功',
      description: '個人資料已更新',
    })
  }

  // 更改密碼
  const handleChangePassword = () => {
    // 驗證目前密碼
    if (!userData.currentPassword) {
      toast({
        title: '請輸入目前密碼',
        description: '請先輸入您目前的密碼以進行驗證',
        variant: 'destructive',
      })
      return
    }

    // 驗證新密碼
    if (!userData.newPassword) {
      toast({
        title: '請輸入新密碼',
        description: '新密碼不能為空',
        variant: 'destructive',
      })
      return
    }

    // 驗證密碼一致性
    if (userData.newPassword !== userData.confirmNewPassword) {
      toast({
        title: '密碼不一致',
        description: '新密碼與確認密碼不一致，請重新輸入',
        variant: 'destructive',
      })
      return
    }

    // 驗證密碼長度
    if (userData.newPassword.length < 8) {
      toast({
        title: '密碼太短',
        description: '新密碼長度至少為 8 個字元',
        variant: 'destructive',
      })
      return
    }

    // 在這裡實現 API 呼叫來更新密碼
    console.log('更新密碼:', {
      currentPassword: userData.currentPassword,
      newPassword: userData.newPassword,
    })

    // 清空密碼欄位
    setUserData({
      ...userData,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    })

    toast({
      title: '更新成功',
      description: '密碼已成功更新',
    })
  }

  // 頭像上傳區元件
  const AvatarUpload = () => {
    // 獲取選中的預設頭像樣式
    const selectedAvatarStyle =
      DEFAULT_AVATARS.find((a) => a.id === userData.avatarStyle) || DEFAULT_AVATARS[0]

    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className={`${isMobile ? 'h-28 w-28' : 'h-40 w-40'} flex items-center justify-center overflow-hidden rounded-full bg-[#EBEAEA]`}
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="頭像預覽" className="h-full w-full object-cover" />
          ) : useDefaultAvatar ? (
            generateAvatarElement(selectedAvatarStyle, isMobile ? 'w-28 h-28' : 'w-40 h-40')
          ) : (
            <UserCircle size={isMobile ? 80 : 120} className="text-[#3F3D3D]" />
          )}
        </div>

        <div className="flex gap-2">
          <label
            htmlFor="avatar-upload"
            className={`cursor-pointer ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} flex items-center gap-1.5 rounded-sm border border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]`}
          >
            <Upload size={isMobile ? 14 : 16} />
            上傳頭像
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>

          {(avatar || avatarPreview) && (
            <Button
              variant="outline"
              className="border-[#B6B3B3] text-sm text-[#D94A4A]"
              onClick={handleRemoveAvatar}
            >
              移除
            </Button>
          )}
        </div>

        <p className="text-xs text-[#8E8C8C]">建議上傳寬高比為 1:1 的圖片</p>

        <div className="mt-2 w-full">
          <h3 className={`${isMobile ? 'text-sm' : 'text-base'} mb-2 font-medium`}>預設頭像</h3>
          <div className="rounded-md border border-[#EBEAEA]">
            <AvatarOptions value={userData.avatarStyle} onChange={handleDefaultAvatarChange} />
          </div>
        </div>
      </div>
    )
  }

  // 個人資料表單元件
  const ProfileForm = () => (
    <div className="space-y-4">
      <FormField label="顯示名稱">
        <Input
          value={userData.displayName}
          onChange={(e) => handleChange('displayName', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <FormField label="使用者名稱">
        <Input
          value={userData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <FormField label="電子郵件">
        <Input
          value={userData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <Button
        onClick={handleSaveProfile}
        className="mt-4 bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]"
      >
        儲存變更
      </Button>
    </div>
  )

  // 密碼變更表單元件
  const PasswordForm = () => (
    <div className="space-y-4">
      <FormField label="目前密碼">
        <Input
          type="password"
          value={userData.currentPassword}
          onChange={(e) => handleChange('currentPassword', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <FormField label="新密碼">
        <Input
          type="password"
          value={userData.newPassword}
          onChange={(e) => handleChange('newPassword', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <FormField label="確認新密碼">
        <Input
          type="password"
          value={userData.confirmNewPassword}
          onChange={(e) => handleChange('confirmNewPassword', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <Button onClick={handleChangePassword} className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]">
        更新密碼
      </Button>
    </div>
  )

  // 切換標籤頁
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // 顯示當前活動的內容
  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <div className="space-y-6">
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-8`}>
            {/* 左側頭像上傳 */}
            <AvatarUpload />

            {/* 右側基本資料 */}
            <ProfileForm />
          </div>
        </div>
      )
    } else {
      return (
        <div className="space-y-8">
          <div className={`rounded-sm border border-[#DBD8D8] ${isMobile ? 'p-4' : 'p-6'}`}>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} mb-4 font-medium`}>修改密碼</h2>
            <PasswordForm />
          </div>
        </div>
      )
    }
  }

  return (
    <ProfilePageLayout>
      <div className={`bg-white ${isMobile ? 'p-4 md:p-6' : 'p-8 md:p-12'} rounded-sm`}>
        <h1
          className={`${isMobile ? 'mb-4 text-2xl' : 'mb-8 text-4xl'} font-medium text-[#1B1A1A]`}
        >
          帳號設定
        </h1>

        {/* 標籤切換區域 */}
        <div className="mb-6 border-b border-[#DBD8D8]">
          <div className={`flex ${isMobile ? 'w-full' : 'w-full md:w-[400px]'}`}>
            <button
              onClick={() => handleTabChange('profile')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 px-4 py-3 font-medium transition-colors',
                activeTab === 'profile'
                  ? 'border-b-2 border-[#1B1A1A] text-[#1B1A1A]'
                  : 'text-[#6D6C6C] hover:bg-[#F5F5F5]'
              )}
            >
              <UserCircle size={isMobile ? 16 : 18} />
              <span className={`${isMobile ? 'text-sm' : ''}`}>個人資料</span>
            </button>
            <button
              onClick={() => handleTabChange('security')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 px-4 py-3 font-medium transition-colors',
                activeTab === 'security'
                  ? 'border-b-2 border-[#1B1A1A] text-[#1B1A1A]'
                  : 'text-[#6D6C6C] hover:bg-[#F5F5F5]'
              )}
            >
              <Key size={isMobile ? 16 : 18} />
              <span className={`${isMobile ? 'text-sm' : ''}`}>安全設定</span>
            </button>
          </div>
        </div>

        {/* 內容區域 */}
        {renderContent()}
      </div>
    </ProfilePageLayout>
  )
}
