'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Youtube, Instagram, Link as LinkIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PhotoUpload } from '@/components/ui/photo-upload'
import { galleryService } from '@/lib/api/services'
import type { RouteStoryFormData } from '@/lib/types/route-story'

// 表單驗證 schema
const photoFormSchema = z.object({
  content: z.string().optional(),
  photos: z.array(z.string()).min(1, '請上傳至少一張照片'),
})

const youtubeFormSchema = z.object({
  content: z.string().optional(),
  youtube_url: z
    .string()
    .min(1, '請輸入 YouTube 連結')
    .url('請輸入有效的網址')
    .refine(
      (url) =>
        url.includes('youtube.com') || url.includes('youtu.be'),
      '請輸入有效的 YouTube 連結'
    ),
})

const instagramFormSchema = z.object({
  content: z.string().optional(),
  instagram_url: z
    .string()
    .min(1, '請輸入 Instagram 連結')
    .url('請輸入有效的網址')
    .refine(
      (url) => url.includes('instagram.com'),
      '請輸入有效的 Instagram 連結'
    ),
})

export type MediaType = 'photo' | 'youtube' | 'instagram'

interface RouteMediaFormProps {
  routeId: string
  routeName: string
  mediaType: MediaType
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RouteStoryFormData) => Promise<void>
  isLoading?: boolean
}

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
    title: '分享照片',
    description: '分享這條路線的攀岩照片',
    icon: <Camera className="h-5 w-5" />,
    placeholder: '說點什麼...',
  },
  youtube: {
    title: '分享 YouTube 影片',
    description: '連結你的攀登影片',
    icon: <Youtube className="h-5 w-5 text-red-500" />,
    placeholder: '說點什麼...',
  },
  instagram: {
    title: '分享 Instagram 貼文',
    description: '連結你的攀岩貼文',
    icon: <Instagram className="h-5 w-5 text-pink-500" />,
    placeholder: '說點什麼...',
  },
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
  const [photos, setPhotos] = useState<string[]>([])
  const config = mediaConfig[mediaType]

  // 根據媒體類型選擇驗證 schema
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
              <Label>照片 *</Label>
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
              <Label htmlFor="youtube_url">YouTube 連結 *</Label>
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
              <Label htmlFor="instagram_url">Instagram 連結 *</Label>
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
              <p className="text-xs text-amber-600">
                請確認貼文設為「公開」，私人帳號的貼文無法顯示
              </p>
            </div>
          )}

          {/* 說明文字（所有模式共用） */}
          <div className="space-y-2">
            <Label htmlFor="content">說點什麼 (可選)</Label>
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
              取消
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? '發布中...' : '分享'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
