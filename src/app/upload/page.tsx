'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, MapPin, Loader2, CheckCircle, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { galleryService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

// File validation constants
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Validate file and return error message if invalid
const validateFile = (file: File): string | null => {
  if (!VALID_FILE_TYPES.includes(file.type)) {
    return '請上傳 JPG、PNG 或 WebP 格式的圖片'
  }
  if (file.size > MAX_FILE_SIZE) {
    return '圖片大小不能超過 5MB'
  }
  return null
}

export default function UploadPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState({ country: '', city: '', spot: '' })
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Cleanup object URL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  // Process and validate file, then set state
  const processFile = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    // Revoke previous object URL if exists
    if (preview) {
      URL.revokeObjectURL(preview)
    }

    setFile(selectedFile)
    setError(null)

    // Create preview using object URL (more efficient than FileReader)
    const objectUrl = URL.createObjectURL(selectedFile)
    setPreview(objectUrl)
  }, [preview])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        processFile(selectedFile)
      }
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files?.[0]
      if (droppedFile) {
        processFile(droppedFile)
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const clearPreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setFile(null)
    setPreview(null)
  }, [preview])

  const resetForm = useCallback(() => {
    clearPreview()
    setCaption('')
    setLocation({ country: '', city: '', spot: '' })
    setError(null)
    setIsSuccess(false)
  }, [clearPreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('請選擇要上傳的圖片')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Step 1: Upload the image file to storage
      const uploadResult = await galleryService.uploadImage(file)
      if (!uploadResult.success || !uploadResult.data?.url) {
        throw new Error('圖片上傳失敗')
      }

      // Step 2: Create photo record with metadata
      const photoResult = await galleryService.uploadPhoto({
        image_url: uploadResult.data.url,
        caption: caption || undefined,
        location_country: location.country || undefined,
        location_city: location.city || undefined,
        location_spot: location.spot || undefined,
      })

      if (!photoResult.success || !photoResult.data) {
        throw new Error('照片資料儲存失敗')
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上傳失敗，請稍後再試')
    } finally {
      setIsUploading(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pt-16">
        <div className="text-center">
          <ImageIcon className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
          <h1 className="mb-2 text-xl font-semibold text-neutral-800">請先登入</h1>
          <p className="mb-6 text-neutral-500">登入後即可上傳照片到攝影集</p>
          <Link href="/auth/login">
            <Button>前往登入</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pt-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-xl font-semibold text-neutral-800">上傳成功！</h1>
          <p className="mb-6 text-neutral-500">您的照片已成功上傳到攝影集</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetForm}>
              繼續上傳
            </Button>
            <Button onClick={() => router.push('/gallery')}>
              前往攝影集
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12">
      <div className="mx-auto max-w-xl px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="overflow-hidden rounded-xl bg-white shadow-sm"
        >
          {/* Header */}
          <div className="border-b px-6 py-5">
            <h1 className="text-xl font-semibold text-neutral-800">上傳照片</h1>
            <p className="mt-1 text-sm text-neutral-500">分享你的攀岩照片到社群</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Image Upload Area */}
            <div
              className={`mb-6 flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                preview
                  ? 'border-transparent'
                  : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('photo-input')?.click()}
            >
              {preview ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearPreview()
                    }}
                    className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white hover:bg-black/70"
                  >
                    移除
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={48} className="mb-3 text-neutral-400" />
                  <p className="text-neutral-600">拖曳照片到這裡，或點擊選擇</p>
                  <p className="mt-1 text-sm text-neutral-400">支援 JPG、PNG、WebP（最大 5MB）</p>
                </>
              )}
              <input
                id="photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Caption */}
            <div className="mb-5">
              <Label htmlFor="caption" className="mb-2 block text-sm font-medium">
                說明（選填）
              </Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="為照片添加說明..."
                className="resize-none"
                rows={3}
                disabled={isUploading}
              />
            </div>

            {/* Location */}
            <div className="mb-6">
              <Label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <MapPin size={14} />
                拍攝地點（選填）
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  placeholder="國家"
                  value={location.country}
                  onChange={(e) => setLocation((prev) => ({ ...prev, country: e.target.value }))}
                  disabled={isUploading}
                />
                <Input
                  placeholder="城市"
                  value={location.city}
                  onChange={(e) => setLocation((prev) => ({ ...prev, city: e.target.value }))}
                  disabled={isUploading}
                />
                <Input
                  placeholder="地點"
                  value={location.spot}
                  onChange={(e) => setLocation((prev) => ({ ...prev, spot: e.target.value }))}
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上傳中...
                </>
              ) : (
                '上傳照片'
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
