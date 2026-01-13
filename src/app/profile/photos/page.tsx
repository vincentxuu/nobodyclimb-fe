'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Loader2, MapPin, Upload } from 'lucide-react'
import Image from 'next/image'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { galleryService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'
import { GalleryPhoto } from '@/lib/types'
import PhotoEditDialog from '@/components/gallery/photo-edit-dialog'
import UploadPhotoDialog from '@/components/gallery/upload-photo-dialog'

// 頁面標題元件
interface PageHeaderProps {
  title: string
  actionButton?: React.ReactNode
}

const PageHeader = ({ title, actionButton }: PageHeaderProps) => (
  <div className="mb-8 flex items-center justify-between">
    <h1 className="text-2xl font-medium text-[#1B1A1A] md:text-4xl">{title}</h1>
    {actionButton}
  </div>
)

// 照片卡片元件
interface PhotoCardProps {
  photo: GalleryPhoto
  // eslint-disable-next-line no-unused-vars
  onEdit: (_photo: GalleryPhoto) => void
  // eslint-disable-next-line no-unused-vars
  onDelete: (_id: string) => void
  isDeleting: boolean
}

const PhotoCard = ({ photo, onEdit, onDelete, isDeleting }: PhotoCardProps) => {
  const locationParts = [photo.location_country, photo.location_city, photo.location_spot].filter(
    Boolean
  )
  const locationText = locationParts.length > 0 ? locationParts.join('・') : null

  return (
    <div className="rounded-sm border border-[#DBD8D8] overflow-hidden">
      {/* 照片預覽 */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={photo.image_url}
          alt={photo.caption || '照片'}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* 照片資訊 */}
      <div className="p-3 md:p-4">
        {/* 說明 */}
        <p className="mb-2 line-clamp-2 text-sm text-[#3F3D3D] min-h-[2.5rem]">
          {photo.caption || '無說明'}
        </p>

        {/* 地點和日期 */}
        <div className="mb-3 flex flex-col gap-1 text-xs text-[#8E8C8C]">
          {locationText && (
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span className="truncate">{locationText}</span>
            </div>
          )}
          <span>{new Date(photo.created_at).toLocaleDateString('zh-TW')}</span>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(photo)}
            className="flex-1 border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
          >
            <Edit2 size={14} className="mr-1" />
            編輯
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(photo.id)}
            disabled={isDeleting}
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} className="mr-1" />
            刪除
          </Button>
        </div>
      </div>
    </div>
  )
}

// 空狀態元件
interface EmptyStateProps {
  onUpload: () => void
}

const EmptyState = ({ onUpload }: EmptyStateProps) => (
  <div className="py-12 text-center">
    <p className="mb-4 text-[#6D6C6C]">你還沒有上傳任何照片</p>
    <Button
      onClick={onUpload}
      className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]"
    >
      上傳第一張照片
    </Button>
  </div>
)

// 載入狀態元件
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-[#6D6C6C]" />
    <span className="ml-2 text-[#6D6C6C]">載入中...</span>
  </div>
)

// 錯誤狀態元件
const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="py-12 text-center">
    <p className="mb-4 text-red-600">{message}</p>
    <Button onClick={onRetry} className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]">
      重試
    </Button>
  </div>
)

// 上傳照片按鈕元件
interface UploadButtonProps {
  onClick: () => void
}

const UploadButton = ({ onClick }: UploadButtonProps) => (
  <Button
    onClick={onClick}
    className="flex items-center gap-2 bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]"
  >
    <Upload size={18} />
    上傳照片
  </Button>
)

const PHOTOS_PER_PAGE = 20

export default function PhotosPage() {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 刪除對話框狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 編輯對話框狀態
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [photoToEdit, setPhotoToEdit] = useState<GalleryPhoto | null>(null)

  // 上傳對話框狀態
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // 獲取用戶照片列表
  const fetchPhotos = useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)
    try {
      const response = await galleryService.getMyPhotos(page, PHOTOS_PER_PAGE)
      if (response.success && response.data) {
        if (append) {
          setPhotos((prev) => [...prev, ...response.data])
        } else {
          setPhotos(response.data)
        }
        setCurrentPage(response.pagination.page)
        setTotalPages(response.pagination.total_pages)
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err)
      setError('無法載入照片列表，請稍後再試')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  // 載入更多照片
  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchPhotos(currentPage + 1, true)
    }
  }

  // 處理編輯
  const handleEditClick = (photo: GalleryPhoto) => {
    setPhotoToEdit(photo)
    setEditDialogOpen(true)
  }

  // 編輯成功
  const handleEditSuccess = (updatedPhoto: GalleryPhoto) => {
    setPhotos((prev) => prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)))
    toast({
      title: '更新成功',
      description: '照片資訊已更新',
    })
  }

  // 關閉編輯對話框
  const handleEditClose = () => {
    setEditDialogOpen(false)
    setPhotoToEdit(null)
  }

  // 處理刪除確認
  const handleDeleteClick = (id: string) => {
    setPhotoToDelete(id)
    setDeleteDialogOpen(true)
  }

  // 執行刪除
  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return

    setIsDeleting(true)
    try {
      await galleryService.deletePhoto(photoToDelete)
      setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete))
      toast({
        title: '刪除成功',
        description: '照片已成功刪除',
      })
    } catch (err) {
      console.error('Failed to delete photo:', err)
      toast({
        title: '刪除失敗',
        description: '無法刪除照片，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setPhotoToDelete(null)
    }
  }

  // 關閉刪除對話框
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setPhotoToDelete(null)
  }

  // 處理上傳成功
  const handleUploadSuccess = (photo: GalleryPhoto) => {
    setPhotos((prev) => [photo, ...prev])
    toast({
      title: '上傳成功',
      description: '照片已成功上傳',
    })
  }

  // 開啟上傳對話框
  const handleUploadClick = () => {
    setUploadDialogOpen(true)
  }

  return (
    <ProfilePageLayout>
      <div className="rounded-sm bg-white p-4 md:p-8 lg:p-12">
        <PageHeader title="我的照片" actionButton={<UploadButton onClick={handleUploadClick} />} />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchPhotos()} />
        ) : photos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  isDeleting={isDeleting && photoToDelete === photo.id}
                />
              ))}
            </div>
            {/* 載入更多按鈕 */}
            {currentPage < totalPages && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      載入中...
                    </>
                  ) : (
                    '載入更多'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState onUpload={handleUploadClick} />
        )}
      </div>

      {/* 編輯對話框 */}
      <PhotoEditDialog
        isOpen={editDialogOpen}
        photo={photoToEdit}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
      />

      {/* 刪除確認對話框 */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="刪除照片"
        message="確定要刪除這張照片嗎？此操作無法復原。"
        confirmText="刪除"
        cancelText="取消"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* 上傳對話框 */}
      <UploadPhotoDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </ProfilePageLayout>
  )
}
