/**
 * 圖庫頁面
 *
 * 對應 apps/web/src/app/gallery/page.tsx
 * 使用 apps/mobile/src/components/gallery/ 組件
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { GalleryPhoto } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import { ChevronLeft, ImageIcon, Plus } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  GalleryGrid,
  type GalleryGridPhoto,
  PhotoEditDialog,
  PhotoPopup,
  type PhotoPopupPhoto,
  UploadPhotoDialog,
} from '@/components/gallery'
import { EmptyState, IconButton, LoadMoreButton, Text } from '@/components/ui'
import {
  updateGalleryPhoto,
  uploadGalleryImage,
  uploadGalleryPhoto,
  useGallery,
  useRefreshGallery,
} from '@/lib/hooks'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 18

export default function GalleryScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  // API 資料
  const [page, setPage] = useState(1)
  const [photos, setPhotos] = useState<GalleryGridPhoto[]>([])
  const { data, isLoading, isFetching, isError } = useGallery(page, PAGE_SIZE)
  const refreshGallery = useRefreshGallery()
  const pagination = data?.pagination
  const hasMore = pagination ? pagination.page < pagination.total_pages : false

  // 刷新狀態
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Popup 狀態
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [viewerVisible, setViewerVisible] = useState(false)

  // 編輯和上傳 Dialog 狀態
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null)

  useEffect(() => {
    if (!data?.photos) return
    if (page === 1) {
      setPhotos(data.photos)
      return
    }

    setPhotos((prev) => {
      const existingIds = new Set(prev.map((photo) => photo.id))
      const nextPhotos = data.photos.filter((photo) => !existingIds.has(photo.id))
      return [...prev, ...nextPhotos]
    })
  }, [data?.photos, page])

  // 當前選中的照片
  const selectedPhoto = useMemo<PhotoPopupPhoto | null>(() => {
    if (selectedPhotoIndex === null || !photos[selectedPhotoIndex]) return null
    const photo = photos[selectedPhotoIndex]
    return {
      id: photo.id,
      src: photo.src,
      alt: photo.alt,
      location: photo.location,
      uploadDate: photo.uploadDate,
      author: photo.author,
    }
  }, [selectedPhotoIndex, photos])

  // 導航
  const handleBack = () => {
    router.back()
  }

  // 照片點擊
  const handlePhotoClick = useCallback((_photo: GalleryGridPhoto, index: number) => {
    setSelectedPhotoIndex(index)
    setViewerVisible(true)
  }, [])

  // 關閉檢視器
  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false)
    setSelectedPhotoIndex(null)
  }, [])

  // 下一張
  const handleNext = useCallback(() => {
    if (selectedPhotoIndex !== null && photos.length > 0) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length)
    }
  }, [selectedPhotoIndex, photos.length])

  // 上一張
  const handlePrev = useCallback(() => {
    if (selectedPhotoIndex !== null && photos.length > 0) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length)
    }
  }, [selectedPhotoIndex, photos.length])

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setPage(1)
    refreshGallery()
    setIsRefreshing(false)
  }, [refreshGallery])

  // 上傳成功
  const handleUploadSuccess = useCallback(
    (_photo: GalleryPhoto) => {
      setPage(1)
      refreshGallery()
    },
    [refreshGallery]
  )

  // 編輯成功
  const handleEditSuccess = useCallback(
    (_photo: GalleryPhoto) => {
      setPage(1)
      refreshGallery()
    },
    [refreshGallery]
  )

  // 開啟上傳 Dialog
  const handleOpenUpload = useCallback(() => {
    setUploadDialogOpen(true)
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1)
    }
  }, [hasMore, isFetching])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 標題區 */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleBack}
          variant="ghost"
        />
        <Text variant="h3" fontWeight="600">
          攀岩圖庫
        </Text>
        {isAuthenticated ? (
          <IconButton
            icon={<Plus size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleOpenUpload}
            variant="ghost"
          />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* 圖片網格 */}
      {isLoading && page === 1 && photos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      ) : (
        <GalleryGrid
          photos={photos}
          onPhotoClick={handlePhotoClick}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={
            photos.length > 0 ? (
              <LoadMoreButton
                onPress={handleLoadMore}
                loading={isFetching && page > 1}
                hasMore={hasMore}
                text="載入更多照片"
                noMoreText="已顯示全部照片"
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={ImageIcon}
              title={isError ? '載入失敗' : '暫無照片'}
              description={isError ? '請稍後再試' : '成為第一個分享攀岩照片的人吧！'}
              actionLabel={isAuthenticated && !isError ? '上傳照片' : undefined}
              onAction={isAuthenticated && !isError ? handleOpenUpload : undefined}
            />
          }
        />
      )}

      {/* 照片檢視器 */}
      <PhotoPopup
        photo={selectedPhoto}
        visible={viewerVisible}
        onClose={handleCloseViewer}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={photos.length > 1}
        hasPrev={photos.length > 1}
      />

      {/* 上傳 Dialog */}
      <UploadPhotoDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
        onUploadImage={uploadGalleryImage}
        onUploadPhoto={uploadGalleryPhoto}
      />

      {/* 編輯 Dialog */}
      <PhotoEditDialog
        isOpen={editDialogOpen}
        photo={editingPhoto}
        onClose={() => {
          setEditDialogOpen(false)
          setEditingPhoto(null)
        }}
        onSuccess={handleEditSuccess}
        onUpdatePhoto={updateGalleryPhoto}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
