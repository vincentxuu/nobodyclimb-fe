'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { IMAGE_CONSTRAINTS } from '../types'

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>
  disabled?: boolean
  currentCount: number
}

export default function ImageUploader({
  onUpload,
  disabled = false,
  currentCount,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const remainingSlots = IMAGE_CONSTRAINTS.maxCount - currentCount
  const canUpload = remainingSlots > 0 && !disabled && !isUploading

  const validateFile = (file: File): string | null => {
    if (!IMAGE_CONSTRAINTS.acceptedTypes.includes(file.type)) {
      return '請上傳 JPG、PNG 或 WebP 格式的圖片'
    }
    if (file.size > IMAGE_CONSTRAINTS.maxSizeBytes) {
      return `圖片大小不能超過 ${IMAGE_CONSTRAINTS.maxSizeMB}MB`
    }
    return null
  }

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setIsUploading(true)
      try {
        await onUpload(file)
      } catch (err) {
        setError('上傳失敗，請稍後再試')
        console.error('Upload error:', err)
      } finally {
        setIsUploading(false)
      }
    },
    [onUpload]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (canUpload) {
        setIsDragging(true)
      }
    },
    [canUpload]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (!canUpload) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [canUpload, handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
      // Reset input value to allow uploading same file again
      e.target.value = ''
    },
    [handleFile]
  )

  const handleClick = () => {
    if (canUpload) {
      inputRef.current?.click()
    }
  }

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center
          rounded-lg border-2 border-dashed p-4 transition-colors
          ${
            isDragging
              ? 'border-primary bg-primary/5'
              : canUpload
                ? 'border-gray-300 hover:border-primary hover:bg-gray-50'
                : 'cursor-not-allowed border-gray-200 bg-gray-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_CONSTRAINTS.acceptedExtensions}
          onChange={handleInputChange}
          className="hidden"
          disabled={!canUpload}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-gray-500">上傳中...</span>
          </div>
        ) : (
          <>
            <Upload
              className={`mb-2 h-8 w-8 ${canUpload ? 'text-gray-400' : 'text-gray-300'}`}
            />
            <p className={`text-sm ${canUpload ? 'text-gray-600' : 'text-gray-400'}`}>
              {canUpload ? (
                <>
                  拖拽圖片到這裡，或<span className="text-primary">點擊上傳</span>
                </>
              ) : remainingSlots <= 0 ? (
                '已達到圖片數量上限'
              ) : (
                '無法上傳'
              )}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              JPG、PNG、WebP，最大 {IMAGE_CONSTRAINTS.maxSizeMB}MB
            </p>
            <p className="text-xs text-gray-400">
              還可上傳 {remainingSlots} 張（共 {IMAGE_CONSTRAINTS.maxCount} 張）
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto rounded p-1 hover:bg-red-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
