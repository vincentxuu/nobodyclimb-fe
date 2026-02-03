'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { galleryService } from '@/lib/api/services'
import { GalleryPhoto } from '@/lib/types'

interface UploadPhotoDialogProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line no-unused-vars
  onSuccess: (_photo: GalleryPhoto) => void
}

// File validation constants
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 500 * 1024 // 500KB
const MAX_FILE_COUNT = 20
const MAX_IMAGE_DIMENSION = 1920

interface FileWithPreview {
  file: File
  preview: string
  id: string
  originalSize?: number
  wasCompressed?: boolean
}

interface UploadStatus {
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// Validate file type only (size will be handled by compression)
const validateFileType = (file: File): string | null => {
  if (!VALID_FILE_TYPES.includes(file.type)) {
    return '請上傳 JPG、PNG 或 WebP 格式的圖片'
  }
  return null
}

// Compress image if it exceeds the size limit
const compressImageFile = async (file: File): Promise<{ file: File; wasCompressed: boolean }> => {
  if (file.size <= MAX_FILE_SIZE) {
    return { file, wasCompressed: false }
  }

  const options = {
    maxSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    maxWidthOrHeight: MAX_IMAGE_DIMENSION,
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return { file: compressedFile, wasCompressed: true }
  } catch (error) {
    console.error('圖片壓縮失敗:', error)
    throw new Error(`圖片 "${file.name}" 壓縮失敗`)
  }
}

const UploadPhotoDialog: React.FC<UploadPhotoDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const filesRef = useRef<FileWithPreview[]>([])
  const [caption, setCaption] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationSpot, setLocationSpot] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressProgress, setCompressProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])

  // Derived state: calculate counts from uploadStatuses
  const successCount = uploadStatuses.filter((s) => s.status === 'success').length
  const uploadingCount = uploadStatuses.filter((s) => s.status === 'uploading').length

  // Keep filesRef in sync with files state
  useEffect(() => {
    filesRef.current = files
  }, [files])

  // Cleanup preview URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview))
    }
  }, [])

  // Process, validate and compress files, then set state
  const processFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)

    // Check total count limit
    if (files.length + fileArray.length > MAX_FILE_COUNT) {
      setError(`最多只能上傳 ${MAX_FILE_COUNT} 張照片`)
      return
    }

    // First validate file types
    const typeErrors: string[] = []
    const filesToProcess: File[] = []

    fileArray.forEach((file) => {
      const typeError = validateFileType(file)
      if (typeError) {
        typeErrors.push(typeError)
      } else {
        filesToProcess.push(file)
      }
    })

    if (typeErrors.length > 0) {
      setError(typeErrors.join('\n'))
      if (filesToProcess.length === 0) return
    } else {
      setError(null)
    }

    // Process files with compression
    setIsCompressing(true)
    setCompressProgress({ current: 0, total: filesToProcess.length })

    const validFiles: FileWithPreview[] = []
    const compressionErrors: string[] = []

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i]
      setCompressProgress({ current: i + 1, total: filesToProcess.length })

      try {
        const originalSize = file.size
        const { file: processedFile, wasCompressed } = await compressImageFile(file)
        const id = crypto.randomUUID()

        validFiles.push({
          file: processedFile,
          preview: URL.createObjectURL(processedFile),
          id,
          originalSize: wasCompressed ? originalSize : undefined,
          wasCompressed,
        })
      } catch (err) {
        compressionErrors.push(err instanceof Error ? err.message : `處理 ${file.name} 失敗`)
      }
    }

    setIsCompressing(false)
    setCompressProgress(null)

    if (compressionErrors.length > 0) {
      setError((prev) => {
        const combined = [prev, ...compressionErrors].filter(Boolean).join('\n')
        return combined
      })
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles])
    }
  }, [files.length])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles)
      }
      // Reset input value to allow selecting the same files again
      e.target.value = ''
    },
    [processFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFiles = e.dataTransfer.files
      if (droppedFiles && droppedFiles.length > 0) {
        processFiles(droppedFiles)
      }
    },
    [processFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const resetForm = useCallback(() => {
    // Cleanup preview URLs
    files.forEach((f) => URL.revokeObjectURL(f.preview))
    setFiles([])
    setCaption('')
    setLocationCountry('')
    setLocationCity('')
    setLocationSpot('')
    setError(null)
    setUploadStatuses([])
  }, [files])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      setError('請選擇要上傳的圖片')
      return
    }

    setIsUploading(true)
    setError(null)

    // Initialize all statuses as uploading (parallel upload)
    const initialStatuses: UploadStatus[] = files.map((f) => ({
      id: f.id,
      status: 'uploading',
    }))
    setUploadStatuses(initialStatuses)

    // Parallel upload using Promise.all
    const uploadPromises = files.map(async (fileItem) => {
      try {
        // Step 1: Upload the image file to storage
        const uploadResult = await galleryService.uploadImage(fileItem.file)
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

        // Update status to success
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.id === fileItem.id ? { ...s, status: 'success' } : s
          )
        )

        // Call onSuccess for each uploaded photo
        onSuccess(photoResult.data)

        return { status: 'success' as const, photo: photoResult.data }
      } catch (err) {
        // Update status to error
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.id === fileItem.id
              ? { ...s, status: 'error', error: err instanceof Error ? err.message : '上傳失敗' }
              : s
          )
        )
        return { status: 'error' as const }
      }
    })

    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter((r) => r.status === 'success').length

    setIsUploading(false)

    // If all uploads succeeded, close dialog
    if (successfulUploads === files.length) {
      resetForm()
      onClose()
    } else if (successfulUploads > 0) {
      // Some succeeded, some failed - show message
      setError(`${successfulUploads} 張照片上傳成功，${files.length - successfulUploads} 張失敗`)
    } else {
      setError('所有照片上傳失敗，請稍後再試')
    }
  }

  const handleClose = () => {
    if (!isUploading && !isCompressing) {
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
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg bg-white flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-neutral-800">上傳照片</h2>
            <button
              onClick={handleClose}
              disabled={isUploading || isCompressing}
              className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
            {/* Image Upload Area */}
            <div
              className={`mb-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                files.length > 0
                  ? 'border-neutral-200 bg-neutral-50'
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('photo-input')?.click()}
            >
              <Upload size={32} className="mb-2 text-neutral-400" />
              <p className="text-sm text-neutral-600">拖曳照片到這裡，或點擊選擇</p>
              <p className="mt-1 text-xs text-neutral-400">
                支援 JPG、PNG、WebP（超過 500KB 自動壓縮，最多 {MAX_FILE_COUNT} 張）
              </p>
              <input
                id="photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Compression Progress */}
            {isCompressing && compressProgress && (
              <div className="mb-4 rounded-md bg-amber-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    正在處理圖片... ({compressProgress.current}/{compressProgress.total})
                  </span>
                </div>
                <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{
                      width: `${(compressProgress.current / compressProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Selected Files Preview */}
            {files.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">
                    已選擇 {files.length} 張照片
                    {files.some((f) => f.wasCompressed) && (
                      <span className="ml-2 text-xs text-amber-600">
                        (已壓縮 {files.filter((f) => f.wasCompressed).length} 張)
                      </span>
                    )}
                  </Label>
                  {!isUploading && !isCompressing && (
                    <button
                      type="button"
                      onClick={() => {
                        files.forEach((f) => URL.revokeObjectURL(f.preview))
                        setFiles([])
                      }}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      清除全部
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[200px] overflow-y-auto p-1">
                  {files.map((fileItem) => {
                    const status = uploadStatuses.find((s) => s.id === fileItem.id)
                    return (
                      <div
                        key={fileItem.id}
                        className="relative aspect-square rounded-md overflow-hidden group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fileItem.preview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        {/* Overlay for upload status */}
                        {status && (
                          <div
                            className={`absolute inset-0 flex items-center justify-center ${
                              status.status === 'uploading'
                                ? 'bg-black bg-opacity-50'
                                : status.status === 'success'
                                ? 'bg-green-500 bg-opacity-50'
                                : status.status === 'error'
                                ? 'bg-red-500 bg-opacity-50'
                                : ''
                            }`}
                          >
                            {status.status === 'uploading' && (
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                            )}
                            {status.status === 'success' && (
                              <CheckCircle className="h-6 w-6 text-white" />
                            )}
                            {status.status === 'error' && (
                              <AlertCircle className="h-6 w-6 text-white" />
                            )}
                          </div>
                        )}
                        {/* Remove button (only show when not uploading) */}
                        {!isUploading && !isCompressing && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(fileItem.id)
                            }}
                            className="absolute right-1 top-1 rounded-full bg-black bg-opacity-50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
                          >
                            <X size={12} />
                          </button>
                        )}
                        {/* File size indicator with compression info */}
                        <div className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-xs text-white text-center ${
                          fileItem.wasCompressed ? 'bg-amber-600 bg-opacity-80' : 'bg-black bg-opacity-50'
                        }`}>
                          {fileItem.wasCompressed && fileItem.originalSize ? (
                            <span title={`原始: ${(fileItem.originalSize / 1024).toFixed(0)}KB`}>
                              {(fileItem.originalSize / 1024).toFixed(0)}→{(fileItem.file.size / 1024).toFixed(0)}KB
                            </span>
                          ) : (
                            `${(fileItem.file.size / 1024).toFixed(0)}KB`
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-4 rounded-md bg-blue-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    正在上傳 {uploadingCount} 張照片...（已完成 {successCount}/{files.length}）
                  </span>
                </div>
                <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${(successCount / files.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Caption */}
            <div className="mb-4">
              <Label htmlFor="caption" className="mb-1.5 block text-sm font-medium">
                說明（選填，套用至所有照片）
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
                拍攝地點（選填，套用至所有照片）
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
              <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 whitespace-pre-line">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={files.length === 0 || isUploading || isCompressing}
            >
              {isCompressing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上傳中...
                </>
              ) : files.length > 0 ? (
                `上傳 ${files.length} 張照片`
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
