'use client'

import { BarChart3, Bell, Key, Loader2, Upload, UserCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import NotificationPreferences from '@/components/profile/NotificationPreferences'
import NotificationStats from '@/components/profile/NotificationStats'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import {
  AvatarOptions,
  DEFAULT_AVATARS,
  generateAvatarElement,
  getAvatarStyleById,
} from '@/components/shared/avatar-options'
import ImageCropper from '@/components/shared/image-cropper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { authService, userService } from '@/lib/api/services'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { cn } from '@/lib/utils'

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
  // eslint-disable-next-line no-unused-vars
  onAvatarChange: (_e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveAvatar: () => void
  // eslint-disable-next-line no-unused-vars
  onDefaultAvatarChange: (_avatarId: string) => void
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
  const t = useTranslations('ProfilePage')
  const selectedAvatarStyle = getAvatarStyleById(avatarStyle)

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${isMobile ? 'h-28 w-28' : 'h-40 w-40'} flex items-center justify-center overflow-hidden rounded-full bg-[#EBEAEA]`}
      >
        {avatarPreview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarPreview}
            alt={t('avatarPreview')}
            className="h-full w-full object-cover"
          />
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
          {t('uploadAvatar')}
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
            {t('removeAvatar')}
          </Button>
        )}
      </div>

      <p className="text-xs text-[#8E8C8C]">{t('avatarAspectRatioHint')}</p>

      <div className="mt-2 w-full">
        <h3 className={`${isMobile ? 'text-sm' : 'text-base'} mb-2 font-medium`}>
          {t('defaultAvatar')}
        </h3>
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
  // eslint-disable-next-line no-unused-vars
  onFieldChange: (_field: keyof UserFormData, _value: string) => void
  onSave: () => void
}

const ProfileForm = ({ userData, isSaving, onFieldChange, onSave }: ProfileFormProps) => {
  const t = useTranslations('ProfilePage')
  return (
    <div className="space-y-4">
      <FormField label={t('fieldDisplayName')}>
        <Input
          value={userData.displayName}
          onChange={(e) => onFieldChange('displayName', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <FormField label={t('fieldUsername')}>
        <Input
          value={userData.username}
          onChange={(e) => onFieldChange('username', e.target.value)}
          className="border-[#B6B3B3]"
          placeholder={t('usernamePlaceholder')}
        />
        <p className="mt-1 text-xs text-[#8E8C8C]">
          {t('usernameHint', { username: userData.username || 'username' })}
        </p>
      </FormField>
      <FormField label={t('fieldEmail')}>
        <Input value={userData.email} className="border-[#B6B3B3]" disabled />
      </FormField>
      <Button
        onClick={onSave}
        disabled={isSaving}
        className="mt-4 bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('saving')}
          </>
        ) : (
          t('saveChanges')
        )}
      </Button>
    </div>
  )
}

// 密碼變更表單元件 - 移到外部避免重新渲染
interface PasswordFormProps {
  userData: UserFormData
  isChangingPassword: boolean
  // eslint-disable-next-line no-unused-vars
  onFieldChange: (_field: string, _value: string) => void
  onChangePassword: () => void
}

const PasswordForm = ({
  userData,
  isChangingPassword,
  onFieldChange,
  onChangePassword,
}: PasswordFormProps) => {
  const t = useTranslations('ProfilePage')
  return (
    <div className="space-y-4">
      <FormField label={t('fieldCurrentPassword')}>
        <Input
          type="password"
          value={userData.currentPassword}
          onChange={(e) => onFieldChange('currentPassword', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <FormField label={t('fieldNewPassword')}>
        <Input
          type="password"
          value={userData.newPassword}
          onChange={(e) => onFieldChange('newPassword', e.target.value)}
          className="border-[#B6B3B3]"
        />
      </FormField>
      <FormField label={t('fieldConfirmNewPassword')}>
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
            {t('updating')}
          </>
        ) : (
          t('updatePassword')
        )}
      </Button>
    </div>
  )
}

export default function SettingsPage() {
  const t = useTranslations('ProfilePage')
  const [userData, setUserData] = useState<UserFormData>(initialUserData)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [useDefaultAvatar, setUseDefaultAvatar] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  // 裁切器相關狀態
  const [showCropper, setShowCropper] = useState(false)
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('')
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
          title: t('toastLoadFailed'),
          description: t('toastLoadFailedDesc'),
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [toast])

  // 處理表單變更 - 使用 functional update 避免 closure 問題
  const handleChange = (field: string, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 處理頭像上傳 - 顯示裁切器
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // 驗證檔案類型
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('toastFileTypeError'),
          description: t('toastFileTypeErrorDesc'),
          variant: 'destructive',
        })
        return
      }

      // 使用 URL.createObjectURL 以提升性能
      const objectUrl = URL.createObjectURL(file)
      setCropperImageSrc(objectUrl)
      setShowCropper(true)

      // 清除 input 值以允許重新選擇同一檔案
      e.target.value = ''
    }
  }

  // 裁切器關閉時清理 blob URL
  const handleCropperClose = () => {
    setShowCropper(false)
    if (cropperImageSrc && cropperImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropperImageSrc)
      setCropperImageSrc('')
    }
  }

  // 裁切完成後的處理
  const handleCropComplete = (croppedFile: File) => {
    setAvatar(croppedFile)
    setUseDefaultAvatar(false)

    // 釋放舊的預覽 URL
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    // 使用 URL.createObjectURL 產生預覽
    setAvatarPreview(URL.createObjectURL(croppedFile))
  }

  // 處理預設頭像選擇
  const handleDefaultAvatarChange = (avatarId: string) => {
    setUserData((prev) => ({
      ...prev,
      avatarStyle: avatarId,
    }))
    setUseDefaultAvatar(true)
    setAvatar(null)
    // 釋放舊的預覽 URL
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview(null)
  }

  // 移除頭像
  const handleRemoveAvatar = () => {
    setAvatar(null)
    // 釋放舊的預覽 URL
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview(null)
    setUseDefaultAvatar(true)
  }

  // 儲存基本資料
  const handleSaveProfile = async () => {
    // 驗證顯示名稱
    if (!userData.displayName.trim()) {
      toast({
        title: t('toastDisplayNameRequired'),
        description: t('toastDisplayNameRequiredDesc'),
        variant: 'destructive',
      })
      return
    }

    // 驗證使用者名稱格式
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(userData.username)) {
      toast({
        title: t('toastUsernameFormatError'),
        description: t('toastUsernameFormatErrorDesc'),
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
            title: t('toastAvatarUploadFailed'),
            description: t('toastAvatarUploadFailedDesc'),
            variant: 'destructive',
          })
          return
        }
      }

      // 更新用戶資料 - 使用後端 API 期望的 snake_case 欄位名稱
      const profileData: Record<string, string | undefined> = {
        display_name: userData.displayName,
        username: userData.username,
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
          title: t('toastSaveSuccess'),
          description: t('toastSaveSuccessDesc'),
        })
      } else {
        toast({
          title: t('toastSaveFailed'),
          description: t('toastSaveFailedDesc'),
          variant: 'destructive',
        })
      }
    } catch (error: unknown) {
      console.error('儲存個人資料失敗:', error)
      // 處理 API 錯誤回應
      interface ApiError {
        response?: {
          status?: number
          data?: {
            message?: string
          }
        }
        message?: string
      }
      const apiError = error as ApiError
      let errorMessage = t('toastRetryLater')

      if (apiError.response?.status === 409) {
        errorMessage = t('toastUsernameConflict')
      } else if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      toast({
        title: t('toastSaveFailed'),
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
        title: t('toastCurrentPasswordRequired'),
        description: t('toastCurrentPasswordRequiredDesc'),
        variant: 'destructive',
      })
      return
    }

    // 驗證新密碼
    if (!userData.newPassword) {
      toast({
        title: t('toastNewPasswordRequired'),
        description: t('toastNewPasswordRequiredDesc'),
        variant: 'destructive',
      })
      return
    }

    // 驗證密碼一致性
    if (userData.newPassword !== userData.confirmNewPassword) {
      toast({
        title: t('toastPasswordMismatch'),
        description: t('toastPasswordMismatchDesc'),
        variant: 'destructive',
      })
      return
    }

    // 驗證密碼長度
    if (userData.newPassword.length < 8) {
      toast({
        title: t('toastPasswordTooShort'),
        description: t('toastPasswordTooShortDesc'),
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
        setUserData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        }))

        toast({
          title: t('toastPasswordUpdateSuccess'),
          description: t('toastPasswordUpdateSuccessDesc'),
        })
      } else {
        toast({
          title: t('toastPasswordUpdateFailed'),
          description: t('toastPasswordUpdateFailedDesc'),
          variant: 'destructive',
        })
      }
    } catch (error: unknown) {
      console.error('更新密碼失敗:', error)
      const errorMessage = error instanceof Error ? error.message : t('toastCurrentPasswordWrong')
      toast({
        title: t('toastPasswordUpdateFailed'),
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

  // 頁面載入中的畫面
  if (isLoading) {
    return (
      <ProfilePageLayout>
        <div className="flex min-h-[400px] items-center justify-center rounded-sm bg-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3F3D3D]" />
            <p className="text-[#6D6C6C]">{t('loading')}</p>
          </div>
        </div>
      </ProfilePageLayout>
    )
  }

  return (
    <ProfilePageLayout>
      <div className={`bg-white ${isMobile ? 'p-4 md:p-6' : 'p-8 md:p-12'} rounded-sm`}>
        <ProfilePageTitle title={t('settingsTitle')} />

        {/* 標籤切換區域 */}
        <div className="mb-6 border-b border-[#DBD8D8]">
          <div className={`flex ${isMobile ? 'w-full' : 'w-full md:w-[600px]'}`}>
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
              <span className={`${isMobile ? 'text-sm' : ''}`}>{t('tabProfile')}</span>
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
              <span className={`${isMobile ? 'text-sm' : ''}`}>{t('tabSecurity')}</span>
            </button>
            <button
              onClick={() => handleTabChange('notifications')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 px-4 py-3 font-medium transition-colors',
                activeTab === 'notifications'
                  ? 'border-b-2 border-[#1B1A1A] text-[#1B1A1A]'
                  : 'text-[#6D6C6C] hover:bg-[#F5F5F5]'
              )}
            >
              <Bell size={isMobile ? 16 : 18} />
              <span className={`${isMobile ? 'text-sm' : ''}`}>{t('tabNotifications')}</span>
            </button>
          </div>
        </div>

        {/* 內容區域 */}
        {activeTab === 'profile' && (
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
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className={`rounded-sm border border-[#DBD8D8] ${isMobile ? 'p-4' : 'p-6'}`}>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} mb-4 font-medium`}>
                {t('changePassword')}
              </h2>
              <PasswordForm
                userData={userData}
                isChangingPassword={isChangingPassword}
                onFieldChange={handleChange}
                onChangePassword={handleChangePassword}
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            {/* 通知統計 */}
            <div className={`rounded-sm border border-[#DBD8D8] ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={isMobile ? 18 : 20} className="text-[#3F3D3D]" />
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium`}>
                  {t('notificationStats')}
                </h2>
              </div>
              <NotificationStats />
            </div>

            {/* 通知偏好設定 */}
            <div className={`rounded-sm border border-[#DBD8D8] ${isMobile ? 'p-4' : 'p-6'}`}>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} mb-4 font-medium`}>
                {t('notificationPreferences')}
              </h2>
              <p className="text-sm text-[#6D6C6C] mb-6">{t('notificationPreferencesDesc')}</p>
              <NotificationPreferences />
            </div>
          </div>
        )}
      </div>

      {/* 圖片裁切器 */}
      <ImageCropper
        open={showCropper}
        onClose={handleCropperClose}
        imageSrc={cropperImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title={t('cropAvatarTitle')}
      />
    </ProfilePageLayout>
  )
}
