'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { galleryService } from '@/lib/api/services'
import { GalleryPhoto } from '@/lib/types'

interface PhotoEditDialogProps {
  isOpen: boolean
  photo: GalleryPhoto | null
  onClose: () => void
  // eslint-disable-next-line no-unused-vars
  onSuccess: (_photo: GalleryPhoto) => void
}

const PhotoEditDialog: React.FC<PhotoEditDialogProps> = ({
  isOpen,
  photo,
  onClose,
  onSuccess,
}) => {
  const [caption, setCaption] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationSpot, setLocationSpot] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 當 photo 變更時，更新表單資料
  useEffect(() => {
    if (photo) {
      setCaption(photo.caption || '')
      setLocationCountry(photo.location_country || '')
      setLocationCity(photo.location_city || '')
      setLocationSpot(photo.location_spot || '')
      setError(null)
    }
  }, [photo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photo) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await galleryService.updatePhoto(photo.id, {
        caption,
        location_country: locationCountry,
        location_city: locationCity,
        location_spot: locationSpot,
      })

      if (response.success && response.data) {
        onSuccess(response.data)
        onClose()
      } else {
        setError('更新失敗，請稍後再試')
      }
    } catch (err) {
      console.error('Failed to update photo:', err)
      setError('更新失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen || !photo) return null

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
          className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-lg bg-white flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-neutral-800">編輯照片資訊</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
            {/* Photo Preview */}
            <div className="mb-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={photo.image_url}
                  alt={photo.caption || '照片'}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Caption */}
            <div className="mb-4">
              <Label htmlFor="caption" className="mb-1.5 block text-sm font-medium">
                說明
              </Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="為照片添加說明..."
                className="resize-none"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Location */}
            <div className="mb-4">
              <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <MapPin size={14} />
                拍攝地點
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="國家"
                  value={locationCountry}
                  onChange={(e) => setLocationCountry(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="城市"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="地點"
                  value={locationSpot}
                  onChange={(e) => setLocationSpot(e.target.value)}
                  disabled={isSubmitting}
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
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  '儲存變更'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PhotoEditDialog
