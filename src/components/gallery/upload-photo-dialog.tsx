'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { galleryService } from '@/lib/api/services'
import { GalleryPhoto } from '@/lib/types'

interface UploadPhotoDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (photo: GalleryPhoto) => void
}

const UploadPhotoDialog: React.FC<UploadPhotoDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationSpot, setLocationSpot] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(selectedFile.type)) {
        setError('請上傳 JPG、PNG 或 WebP 格式的圖片')
        return
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB')
        return
      }
      setFile(selectedFile)
      setError(null)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(droppedFile.type)) {
        setError('請上傳 JPG、PNG 或 WebP 格式的圖片')
        return
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB')
        return
      }
      setFile(droppedFile)
      setError(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(droppedFile)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const resetForm = useCallback(() => {
    setFile(null)
    setPreview(null)
    setCaption('')
    setLocationCountry('')
    setLocationCity('')
    setLocationSpot('')
    setError(null)
  }, [])

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
        location_country: locationCountry || undefined,
        location_city: locationCity || undefined,
        location_spot: locationSpot || undefined,
      })

      if (!photoResult.success || !photoResult.data) {
        throw new Error('照片資料儲存失敗')
      }

      onSuccess(photoResult.data)
      resetForm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '上傳失敗，請稍後再試')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      resetForm()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg overflow-hidden rounded-lg bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-neutral-800">上傳照片</h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Image Upload Area */}
            <div
              className={`mb-4 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                preview
                  ? 'border-transparent'
                  : 'border-neutral-300 hover:border-neutral-400'
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
                      setFile(null)
                      setPreview(null)
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black bg-opacity-50 p-1 text-white hover:bg-opacity-75"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={40} className="mb-2 text-neutral-400" />
                  <p className="text-sm text-neutral-600">拖曳照片到這裡，或點擊選擇</p>
                  <p className="mt-1 text-xs text-neutral-400">支援 JPG、PNG、WebP（最大 5MB）</p>
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
            <div className="mb-4">
              <Label htmlFor="caption" className="mb-1.5 block text-sm font-medium">
                說明（選填）
              </Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="為照片添加說明..."
                className="resize-none"
                rows={2}
                disabled={isUploading}
              />
            </div>

            {/* Location */}
            <div className="mb-4">
              <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <MapPin size={14} />
                拍攝地點（選填）
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="國家"
                  value={locationCountry}
                  onChange={(e) => setLocationCountry(e.target.value)}
                  disabled={isUploading}
                />
                <Input
                  placeholder="城市"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  disabled={isUploading}
                />
                <Input
                  placeholder="地點"
                  value={locationSpot}
                  onChange={(e) => setLocationSpot(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
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
      </motion.div>
    </AnimatePresence>
  )
}

export default UploadPhotoDialog
