'use client'

import React, { useState, useEffect } from 'react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserCircle, Key, Upload, Loader2 } from 'lucide-react'
import {
  AvatarOptions,
  generateAvatarElement,
  getAvatarStyleById,
  DEFAULT_AVATARS,
} from '@/components/shared/avatar-options'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'
import { authService, userService } from '@/lib/api/services'

// 表單資料類型
interface UserFormData {
  username: string
  email: string
  displayName: string
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
  avatarStyle: string
  avatarUrl?: string
}

// 初始資料
const initialUserData: UserFormData = {
  username: '',
  email: '',
  displayName: '',
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
  avatarStyle: DEFAULT_AVATARS[0].id,
  avatarUrl: '',
}

// 表單欄位元件
const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="font-medium text-[#3F3D3D]">{label}</Label>
    {children}
  </div>
)

// 頭像上傳區元件 - 移到外部避免重新渲染
interface AvatarUploadProps {
  isMobile: boolean
  avatarPreview: string | null
  useDefaultAvatar: boolean
  avatarStyle: string
  avatar: File | null
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveAvatar: () => void
  onDefaultAvatarChange: (avatarId: string) => void
}

const AvatarUpload = ({
  isMobile,
  avatarPreview,
  useDefaultAvatar,
  avatarStyle,
  avatar,
  onAvatarChange,
  onRemoveAvatar,
  onDefaultAvatarChange,
}: AvatarUploadProps) => {
  const selectedAvatarStyle = getAvatarStyleById(avatarStyle)

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
            onChange={onAvatarChange}
          />
        </label>

        {(avatar || avatarPreview) && (
          <Button
            variant="outline"
            className="border-[#B6B3B3] text-sm text-[#D94A4A]"
            onClick={onRemoveAvatar}
          >
            移除
          </Button>
        )}
      </div>

      <p className="text-xs text-[#8E8C8C]">建議上傳寬高比為 1:1 的圖片</p>

      <div className="mt-2 w-full">
        <h3 className={`${isMobile ? 'text-sm' : 'text-base'} mb-2 font-medium`}>預設頭像</h3>
        <div className="rounded-md border border-[#EBEAEA]">
          <AvatarOptions value={avatarStyle} onChange={onDefaultAvatarChange} />
        </div>
      </div>
    </div>
  )
}

// 個人資料表單元件 - 移到外部避免重新渲染
interface ProfileFormProps {
  userData: UserFormData
  isSaving: boolean
  onFieldChange: (field: keyof UserFormData, value: string) => void
  onSave: () => void
}

const ProfileForm = ({ userData, isSaving, onFieldChange, onSave }: ProfileFormProps) => (
  <div className="space-y-4">
    <FormField label="顯示名稱">
      <Input
        value={userData.displayName}
        onChange={(e) => onFieldChange('displayName', e.target.value)}
        className="border-[#B6B3B3]"
      />
    </FormField>
    <FormField label="使用者名稱">
      <Input
        value={userData.username}
        className="border-[#B6B3B3]"
        disabled
      />
    </FormField>
    <FormField label="電子郵件">
      <Input
        value={userData.email}
        className="border-[#B6B3B3]"
        disabled
      />
    </FormField>
    <Button
      onClick={onSave}
      disabled={isSaving}
      className="mt-4 bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]"
    >
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          儲存中...
        </>
      ) : (
        '儲存變更'
      )}
    </Button>
  </div>
)

// 密碼變更表單元件 - 移到外部避免重新渲染
interface PasswordFormProps {
  userData: UserFormData
  isChangingPassword: boolean
  onFieldChange: (field: string, value: string) => void
  onChangePassword: () => void
}

const PasswordForm = ({
  userData,
  isChangingPassword,
  onFieldChange,
  onChangePassword,
}: PasswordFormProps) => (
  <div className="space-y-4">
    <FormField label="目前密碼">
      <Input
        type="password"
        value={userData.currentPassword}
        onChange={(e) => onFieldChange('currentPassword', e.target.value)}
        className="border-[#B6B3B3]"
      />
    </FormField>
    <FormField label="新密碼">
      <Input
        type="password"
        value={userData.newPassword}
        onChange={(e) => onFieldChange('newPassword', e.target.value)}
        className="border-[#B6B3B3]"
      />
    </FormField>
    <FormField label="確認新密碼">
      <Input
        type="password"
        value={userData.confirmNewPassword}
        onChange={(e) => onFieldChange('confirmNewPassword', e.target.value)}
        className="border-[#B6B3B3]"
      />
    </FormField>
    <Button
      onClick={onChangePassword}
      disabled={isChangingPassword}
      className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]"
    >
      {isChangingPassword ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          更新中...
        </>
      ) : (
        '更新密碼'
      )}
    </Button>
  </div>
)

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserFormData>(initialUserData)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [useDefaultAvatar, setUseDefaultAvatar] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const isMobile = useIsMobile()
  const { toast } = useToast()

  // 從後端獲取當前用戶資料
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser()
        if (response.success && response.data) {
          const user = response.data
          setUserData({
            username: user.username || '',
            email: user.email || '',
            displayName: user.displayName || '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
            avatarStyle: user.avatarStyle || DEFAULT_AVATARS[0].id,
            avatarUrl: user.avatar || '',
          })
          // 如果用戶有自訂頭像，則不使用預設頭像
          if (user.avatar && !user.avatarStyle) {
            setUseDefaultAvatar(false)
            setAvatarPreview(user.avatar)
          } else {
            setUseDefaultAvatar(true)
          }
        }
      } catch (error) {
        console.error('獲取用戶資料失敗:', error)
        toast({
          title: '載入失敗',
          description: '無法獲取用戶資料，請重新整理頁面',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

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

  // 儲存基本資料
  const handleSaveProfile = async () => {
    // 驗證顯示名稱
    if (!userData.displayName.trim()) {
      toast({
        title: '請輸入顯示名稱',
        description: '顯示名稱不能為空',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      let avatarUrl = userData.avatarUrl

      // 如果有上傳新頭像，先上傳頭像
      if (avatar) {
        const uploadResponse = await userService.uploadAvatar(avatar)
        if (uploadResponse.success && uploadResponse.data) {
          avatarUrl = uploadResponse.data.url
        } else {
          toast({
            title: '頭像上傳失敗',
            description: '無法儲存您的新頭像，個人資料未更新。',
            variant: 'destructive',
          })
          return
        }
      }

      // 更新用戶資料 - 使用後端 API 期望的 snake_case 欄位名稱
      const profileData: Record<string, string | undefined> = {
        display_name: userData.displayName,
      }

      // 設定頭像相關資料
      if (avatarUrl && !useDefaultAvatar) {
        profileData.avatar_url = avatarUrl
      }

      const response = await authService.updateProfile(profileData)

      if (response.success) {
        // 更新本地狀態
        if (avatarUrl && !useDefaultAvatar) {
          setUserData((prev) => ({ ...prev, avatarUrl }))
        }
        toast({
          title: '儲存成功',
          description: '個人資料已更新',
        })
      } else {
        toast({
          title: '儲存失敗',
          description: '無法更新個人資料，請稍後再試',
          variant: 'destructive',
        })
      }
    } catch (error: unknown) {
      console.error('儲存個人資料失敗:', error)
      const errorMessage = error instanceof Error ? error.message : '請稍後再試'
      toast({
        title: '儲存失敗',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 更改密碼
  const handleChangePassword = async () => {
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

    try {
      setIsChangingPassword(true)
      const response = await authService.changePassword(
        userData.currentPassword,
        userData.newPassword
      )

      if (response.success) {
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
      } else {
        toast({
          title: '更新失敗',
          description: '無法更新密碼，請稍後再試',
          variant: 'destructive',
        })
      }
    } catch (error: unknown) {
      console.error('更新密碼失敗:', error)
      const errorMessage = error instanceof Error ? error.message : '目前密碼可能不正確'
      toast({
        title: '更新失敗',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

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
            <AvatarUpload
              isMobile={isMobile}
              avatarPreview={avatarPreview}
              useDefaultAvatar={useDefaultAvatar}
              avatarStyle={userData.avatarStyle}
              avatar={avatar}
              onAvatarChange={handleAvatarChange}
              onRemoveAvatar={handleRemoveAvatar}
              onDefaultAvatarChange={handleDefaultAvatarChange}
            />

            {/* 右側基本資料 */}
            <ProfileForm
              userData={userData}
              isSaving={isSaving}
              onFieldChange={handleChange}
              onSave={handleSaveProfile}
            />
          </div>
        </div>
      )
    } else {
      return (
        <div className="space-y-8">
          <div className={`rounded-sm border border-[#DBD8D8] ${isMobile ? 'p-4' : 'p-6'}`}>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} mb-4 font-medium`}>修改密碼</h2>
            <PasswordForm
              userData={userData}
              isChangingPassword={isChangingPassword}
              onFieldChange={handleChange}
              onChangePassword={handleChangePassword}
            />
          </div>
        </div>
      )
    }
  }

  // 頁面載入中的畫面
  if (isLoading) {
    return (
      <ProfilePageLayout>
        <div className="flex min-h-[400px] items-center justify-center rounded-sm bg-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3F3D3D]" />
            <p className="text-[#6D6C6C]">載入中...</p>
          </div>
        </div>
      </ProfilePageLayout>
    )
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
