'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Upload, X, AlertCircle, Scissors } from 'lucide-react'
import { IMAGE_CONSTRAINTS } from '../types'
import { compressImage, validateImageType, readImageAsDataURL } from './imageUtils'
import ImageCropDialog from './ImageCropDialog'

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>
  disabled?: boolean
  currentCount: number
  enableCrop?: boolean
}

export default function ImageUploader({
  onUpload,
  disabled = false,
  currentCount,
  enableCrop = true,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const remainingSlots = IMAGE_CONSTRAINTS.maxCount - currentCount
  const canUpload = remainingSlots > 0 && !disabled && !isProcessing

  const processAndUpload = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      setError(null)

      try {
        // 檢查圖片格式
        if (!validateImageType(file)) {
          throw new Error('請上傳 JPG、PNG 或 WebP 格式的圖片')
        }

        // 壓縮圖片（如果需要）
        let processedFile = file
        if (file.size > IMAGE_CONSTRAINTS.maxSizeBytes) {
          setProcessingStatus('壓縮中...')
          processedFile = await compressImage(file)
        }

        // 上傳
        setProcessingStatus('上傳中...')
        await onUpload(processedFile)
      } catch (err) {
        const message = err instanceof Error ? err.message : '上傳失敗，請稍後再試'
        setError(message)
        console.error('Upload error:', err)
      } finally {
        setIsProcessing(false)
        setProcessingStatus('')
      }
    },
    [onUpload]
  )

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      // 檢查圖片格式
      if (!validateImageType(file)) {
        setError('請上傳 JPG、PNG 或 WebP 格式的圖片')
        return
      }

      // 如果啟用裁剪，顯示裁剪對話框
      if (enableCrop) {
        const dataURL = await readImageAsDataURL(file)
        setCropImageSrc(dataURL)
        setPendingFile(file)
      } else {
        // 直接處理上傳
        await processAndUpload(file)
      }
    },
    [enableCrop, processAndUpload]
  )

  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      setCropImageSrc(null)

      // 將 Blob 轉換為 File
      const fileName = pendingFile?.name || `cropped_${Date.now()}.jpg`
      const croppedFile = new File([croppedBlob], fileName, { type: 'image/jpeg' })

      setPendingFile(null)
      await processAndUpload(croppedFile)
    },
    [pendingFile, processAndUpload]
  )

  const handleCropCancel = useCallback(() => {
    setCropImageSrc(null)
    setPendingFile(null)
  }, [])

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
    <>
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

          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-gray-500">{processingStatus || '處理中...'}</span>
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
                JPG、PNG、WebP，超過 {IMAGE_CONSTRAINTS.maxSizeMB}MB 自動壓縮
              </p>
              <p className="text-xs text-gray-400">
                還可上傳 {remainingSlots} 張（共 {IMAGE_CONSTRAINTS.maxCount} 張）
              </p>
              {enableCrop && (
                <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <Scissors className="h-3 w-3" />
                  支援裁剪
                </p>
              )}
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

      {/* 裁剪對話框 */}
      {cropImageSrc && (
        <ImageCropDialog
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={4 / 3}
        />
      )}
    </>
  )
}
