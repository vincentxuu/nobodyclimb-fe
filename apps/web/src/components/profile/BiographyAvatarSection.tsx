'use client'

import { Image as ImageIcon, User, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { processImage, validateImageType } from '@/lib/utils/image'

interface BiographyAvatarSectionProps {
  avatarUrl: string | null
  coverImageUrl: string | null
  isEditing: boolean
  isMobile: boolean
  // eslint-disable-next-line no-unused-vars
  onAvatarUpload: (_file: File) => Promise<void>
  // eslint-disable-next-line no-unused-vars
  onCoverImageUpload: (_file: File) => Promise<void>
  onAvatarDelete: () => void
  onCoverImageDelete: () => void
}

export default function BiographyAvatarSection({
  avatarUrl,
  coverImageUrl,
  isEditing,
  isMobile,
  onAvatarUpload,
  onCoverImageUpload,
  onAvatarDelete,
  onCoverImageDelete,
}: BiographyAvatarSectionProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const t = useTranslations('ProfileUI')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 驗證檔案類型
    if (!validateImageType(file)) {
      toast({
        title: t('unsupportedFileFormat'),
        description: t('imageFormatHint'),
        variant: 'destructive',
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      // 壓縮圖片到 500KB
      const compressedFile = await processImage(file)
      await onAvatarUpload(compressedFile)
    } catch (error) {
      console.error('上傳失敗:', error)
      const message = error instanceof Error ? error.message : t('uploadFailed')
      toast({
        title: t('uploadFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
      // 清空 input 以允許重複上傳相同檔案
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 驗證檔案類型
    if (!validateImageType(file)) {
      toast({
        title: t('unsupportedFileFormat'),
        description: t('imageFormatHint'),
        variant: 'destructive',
      })
      return
    }

    setIsUploadingCover(true)
    try {
      // 壓縮圖片到 500KB
      const compressedFile = await processImage(file)
      await onCoverImageUpload(compressedFile)
    } catch (error) {
      console.error('上傳失敗:', error)
      const message = error instanceof Error ? error.message : t('uploadFailed')
      toast({
        title: t('uploadFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsUploadingCover(false)
      // 清空 input 以允許重複上傳相同檔案
      if (coverInputRef.current) {
        coverInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 頭像 */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">{t('biographyAvatar')}</h3>
        <div className="flex items-start gap-4">
          {/* 頭像顯示 */}
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={t('avatarAlt')} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <User className="h-12 w-12" />
              </div>
            )}
            {isEditing && avatarUrl && (
              <button
                onClick={onAvatarDelete}
                className="absolute right-0 top-0 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                title={t('deleteAvatar')}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* 上傳按鈕 */}
          {isEditing && (
            <div className="flex-1">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size={isMobile ? 'sm' : 'default'}
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar
                  ? t('uploading')
                  : avatarUrl
                    ? t('changeAvatar')
                    : t('uploadAvatar')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 封面照片 */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">{t('biographyCover')}</h3>
        <div className="space-y-3">
          {/* 封面照片顯示 */}
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-100">
            {coverImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt={t('coverAlt')}
                  className="h-full w-full object-cover"
                />
                {isEditing && (
                  <button
                    onClick={onCoverImageDelete}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
                    title={t('deleteCover')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                  <p className="text-sm">{t('noCoverSet')}</p>
                </div>
              </div>
            )}
          </div>

          {/* 上傳按鈕 */}
          {isEditing && (
            <div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size={isMobile ? 'sm' : 'default'}
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
              >
                {isUploadingCover
                  ? t('uploading')
                  : coverImageUrl
                    ? t('changeCover')
                    : t('uploadCover')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isEditing && !avatarUrl && !coverImageUrl && (
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500">{t('emptyMediaHint')}</p>
        </div>
      )}
    </div>
  )
}
