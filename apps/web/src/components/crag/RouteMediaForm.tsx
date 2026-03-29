'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Instagram, Link as LinkIcon, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhotoUpload } from '@/components/ui/photo-upload'
import { Textarea } from '@/components/ui/textarea'
import { galleryService } from '@/lib/api/services'
import type { RouteStoryFormData } from '@/lib/types/route-story'

export type MediaType = 'photo' | 'youtube' | 'instagram'

interface RouteMediaFormProps {
  routeId: string
  routeName: string
  mediaType: MediaType
  open: boolean
  onOpenChange: (_open: boolean) => void
  onSubmit: (_data: RouteStoryFormData) => Promise<void>
  isLoading?: boolean
}

export function RouteMediaForm({
  routeId,
  routeName,
  mediaType,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: RouteMediaFormProps) {
  const t = useTranslations('CragPage')
  const [photos, setPhotos] = useState<string[]>([])

  // 根據媒體類型選擇驗證 schema（使用翻譯的錯誤訊息）
  const photoFormSchema = z.object({
    content: z.string().optional(),
    photos: z.array(z.string()).min(1, t('mediaFormPhotoLabel')),
  })

  const youtubeFormSchema = z.object({
    content: z.string().optional(),
    youtube_url: z
      .string()
      .min(1, t('mediaFormYouTubeLabel'))
      .url(t('mediaFormYouTubeLabel'))
      .refine(
        (url) => url.includes('youtube.com') || url.includes('youtu.be'),
        t('mediaFormYouTubeLabel')
      ),
  })

  const instagramFormSchema = z.object({
    content: z.string().optional(),
    instagram_url: z
      .string()
      .min(1, t('mediaFormInstagramLabel'))
      .url(t('mediaFormInstagramLabel'))
      .refine((url) => url.includes('instagram.com'), t('mediaFormInstagramLabel')),
  })

  const mediaConfig: Record<
    MediaType,
    {
      title: string
      description: string
      icon: React.ReactNode
      placeholder: string
    }
  > = {
    photo: {
      title: t('mediaFormPhotoTitle'),
      description: t('mediaFormPhotoDesc'),
      icon: <Camera className="h-5 w-5" />,
      placeholder: t('mediaFormPlaceholder'),
    },
    youtube: {
      title: t('mediaFormYouTubeTitle'),
      description: t('mediaFormYouTubeDesc'),
      icon: <Youtube className="h-5 w-5 text-red-500" />,
      placeholder: t('mediaFormPlaceholder'),
    },
    instagram: {
      title: t('mediaFormInstagramTitle'),
      description: t('mediaFormInstagramDesc'),
      icon: <Instagram className="h-5 w-5 text-pink-500" />,
      placeholder: t('mediaFormPlaceholder'),
    },
  }

  const config = mediaConfig[mediaType]

  const schema =
    mediaType === 'photo'
      ? photoFormSchema
      : mediaType === 'youtube'
        ? youtubeFormSchema
        : instagramFormSchema

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      content: '',
      photos: [] as string[],
      youtube_url: '',
      instagram_url: '',
    },
  })

  // 當 dialog 關閉時重置表單
  useEffect(() => {
    if (!open) {
      form.reset()
      setPhotos([])
    }
  }, [open, form])

  // 同步 photos 狀態到表單
  useEffect(() => {
    form.setValue('photos', photos)
    if (photos.length > 0) {
      form.clearErrors('photos')
    }
  }, [photos, form])

  const handleFormSubmit = async (data: {
    content?: string
    photos?: string[]
    youtube_url?: string
    instagram_url?: string
  }) => {
    const submitData: RouteStoryFormData = {
      route_id: routeId,
      content: data.content || '',
      visibility: 'public',
    }

    if (mediaType === 'photo' && photos.length > 0) {
      submitData.photos = photos
    } else if (mediaType === 'youtube' && data.youtube_url) {
      submitData.youtube_url = data.youtube_url
    } else if (mediaType === 'instagram' && data.instagram_url) {
      submitData.instagram_url = data.instagram_url
    }

    await onSubmit(submitData)
    setPhotos([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{routeName}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 照片上傳（僅 photo 模式） */}
          {mediaType === 'photo' && (
            <div className="space-y-2">
              <Label>{t('mediaFormPhotoLabel')}</Label>
              <PhotoUpload
                photos={photos}
                onChange={setPhotos}
                maxPhotos={5}
                uploadFn={galleryService.uploadImage}
                disabled={isLoading}
              />
              {form.formState.errors.photos && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.photos.message as string}
                </p>
              )}
            </div>
          )}

          {/* YouTube 連結輸入（僅 youtube 模式） */}
          {mediaType === 'youtube' && (
            <div className="space-y-2">
              <Label htmlFor="youtube_url">{t('mediaFormYouTubeLabel')}</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="youtube_url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...form.register('youtube_url')}
                />
              </div>
              {form.formState.errors.youtube_url && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.youtube_url.message as string}
                </p>
              )}
            </div>
          )}

          {/* Instagram 連結輸入（僅 instagram 模式） */}
          {mediaType === 'instagram' && (
            <div className="space-y-2">
              <Label htmlFor="instagram_url">{t('mediaFormInstagramLabel')}</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="instagram_url"
                  placeholder="https://www.instagram.com/p/..."
                  {...form.register('instagram_url')}
                />
              </div>
              {form.formState.errors.instagram_url && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.instagram_url.message as string}
                </p>
              )}
              <p className="text-xs text-amber-600">{t('mediaFormInstagramNote')}</p>
            </div>
          )}

          {/* 說明文字（所有模式共用） */}
          <div className="space-y-2">
            <Label htmlFor="content">{t('mediaFormSayLabel')}</Label>
            <Textarea
              id="content"
              placeholder={config.placeholder}
              rows={2}
              {...form.register('content')}
            />
          </div>

          {/* 提交按鈕 */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              {t('mediaFormCancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? t('mediaFormSubmitting') : t('mediaFormShare')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
