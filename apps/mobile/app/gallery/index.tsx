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
import { ChevronLeft, Plus } from 'lucide-react-native'

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
import type { GalleryPhoto } from '@nobodyclimb/types'

// 模擬資料（之後替換為 API 呼叫）
const MOCK_PHOTOS: GalleryGridPhoto[] = Array.from({ length: 20 }, (_, i) => ({
  id: `photo-${i + 1}`,
  src: `https://picsum.photos/400/600?random=${i + 40}`,
  alt: `攀岩照片 ${i + 1}`,
  location: i % 3 === 0 ? {
    country: '台灣',
    city: '新北市',
    spot: i % 2 === 0 ? '龍洞' : '大砲岩',
  } : undefined,
  author: {
    id: `user-${i + 1}`,
    username: `climber${i + 1}`,
    displayName: `攀岩者 ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?u=${i + 1}`,
  },
}))

export default function GalleryScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  // 狀態
  const [photos] = useState<GalleryGridPhoto[]>(MOCK_PHOTOS)
  const [isLoading, setIsLoading] = useState(false)
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
    // TODO: 呼叫 API 重新載入
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }, [])

  // 上傳成功
  const handleUploadSuccess = useCallback((photo: GalleryPhoto) => {
    // TODO: 更新照片列表
    console.log('Photo uploaded:', photo)
  }, [])

  // 編輯成功
  const handleEditSuccess = useCallback((photo: GalleryPhoto) => {
    // TODO: 更新照片列表
    console.log('Photo edited:', photo)
  }, [])

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
              icon="image"
              title="暫無照片"
              description="成為第一個分享攀岩照片的人吧！"
              actionLabel={isAuthenticated ? '上傳照片' : undefined}
              onAction={isAuthenticated ? handleOpenUpload : undefined}
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
        // TODO: 連接實際 API
        // onUploadImage={galleryService.uploadImage}
        // onUploadPhoto={galleryService.uploadPhoto}
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
        // TODO: 連接實際 API
        // onUpdatePhoto={galleryService.updatePhoto}
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
