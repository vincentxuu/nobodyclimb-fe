/**
 * 圖庫頁面
 *
 * 對應 apps/web/src/app/gallery/page.tsx
 * 使用 apps/mobile/src/components/gallery/ 組件
 */
import React, { useState, useCallback, useMemo } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, Plus, ImageIcon } from 'lucide-react-native'

import { Text, IconButton, EmptyState } from '@/components/ui'
import {
  GalleryGrid,
  PhotoPopup,
  PhotoEditDialog,
  UploadPhotoDialog,
  type GalleryGridPhoto,
  type PhotoPopupPhoto,
} from '@/components/gallery'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useAuthStore } from '@/store/authStore'
import { useGallery, useRefreshGallery } from '@/lib/hooks'
import type { GalleryPhoto } from '@nobodyclimb/types'

export default function GalleryScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  // API 資料
  const { data, isLoading, isError } = useGallery(1, 30)
  const refreshGallery = useRefreshGallery()
  const photos = data?.photos ?? []

  // 刷新狀態
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Popup 狀態
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [viewerVisible, setViewerVisible] = useState(false)

  // 編輯和上傳 Dialog 狀態
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null)

  // 當前選中的照片
  const selectedPhoto = useMemo<PhotoPopupPhoto | null>(() => {
    if (selectedPhotoIndex === null || !photos[selectedPhotoIndex]) return null
    const photo = photos[selectedPhotoIndex]
    return {
      id: photo.id,
      src: photo.src,
      alt: photo.alt,
      location: photo.location,
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
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1)
    }
  }, [selectedPhotoIndex, photos.length])

  // 上一張
  const handlePrev = useCallback(() => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1)
    }
  }, [selectedPhotoIndex])

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    refreshGallery()
    setIsRefreshing(false)
  }, [refreshGallery])

  // 上傳成功
  const handleUploadSuccess = useCallback(
    (photo: GalleryPhoto) => {
      console.log('Photo uploaded:', photo)
      refreshGallery()
    },
    [refreshGallery]
  )

  // 編輯成功
  const handleEditSuccess = useCallback(
    (photo: GalleryPhoto) => {
      console.log('Photo edited:', photo)
      refreshGallery()
    },
    [refreshGallery]
  )

  // 開啟上傳 Dialog
  const handleOpenUpload = useCallback(() => {
    setUploadDialogOpen(true)
  }, [])

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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      ) : (
        <GalleryGrid
          photos={photos}
          onPhotoClick={handlePhotoClick}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
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
        hasNext={selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1}
        hasPrev={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
      />

      {/* 上傳 Dialog */}
      <UploadPhotoDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
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
