/**
 * 我的照片頁面
 *
 * 對應 apps/web/src/app/profile/photos/page.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import {
  ChevronLeft,
  X,
  Trash2,
  Plus,
  ImageIcon,
} from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Text, IconButton, Button } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const NUM_COLUMNS = 3
const ITEM_SIZE = (SCREEN_WIDTH - SPACING.md * 2 - SPACING.xs * (NUM_COLUMNS - 1)) / NUM_COLUMNS

// 模擬資料
const MOCK_PHOTOS = Array.from({ length: 12 }, (_, i) => ({
  id: `photo-${i + 1}`,
  url: `https://picsum.photos/400/400?random=${i + 100}`,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}))

interface Photo {
  id: string
  url: string
  createdAt: string
}

interface PhotoItemProps {
  photo: Photo
  onPress: () => void
  index: number
}

function PhotoItem({ photo, onPress, index }: PhotoItemProps) {
  return (
    <Animated.View entering={FadeIn.duration(300).delay(index * 30)}>
      <Pressable onPress={onPress} style={styles.photoItem}>
        <Image
          source={{ uri: photo.url }}
          style={styles.photoImage}
          contentFit="cover"
          transition={300}
        />
      </Pressable>
    </Animated.View>
  )
}

interface PhotoViewerProps {
  photo: Photo | null
  visible: boolean
  onClose: () => void
  onDelete: () => void
}

function PhotoViewer({ photo, visible, onClose, onDelete }: PhotoViewerProps) {
  if (!photo) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* 頂部操作列 */}
        <SafeAreaView style={styles.modalHeader} edges={['top']}>
          <IconButton
            icon={<X size={24} color="#FFFFFF" />}
            onPress={onClose}
            variant="ghost"
          />
          <IconButton
            icon={<Trash2 size={24} color="#EF4444" />}
            onPress={onDelete}
            variant="ghost"
          />
        </SafeAreaView>

        {/* 圖片 */}
        <Pressable style={styles.modalImageContainer} onPress={onClose}>
          <Image
            source={{ uri: photo.url }}
            style={styles.modalImage}
            contentFit="contain"
          />
        </Pressable>

        {/* 底部資訊 */}
        <SafeAreaView style={styles.modalFooter} edges={['bottom']}>
          <Text style={styles.modalDate}>
            {new Date(photo.createdAt).toLocaleDateString('zh-TW')}
          </Text>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

export default function PhotosScreen() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS)
  const [isLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [viewerVisible, setViewerVisible] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handlePhotoPress = useCallback((photo: Photo) => {
    setSelectedPhoto(photo)
    setViewerVisible(true)
  }, [])

  const handleCloseViewer = () => {
    setViewerVisible(false)
    setSelectedPhoto(null)
  }

  const handleDeletePhoto = () => {
    if (selectedPhoto) {
      setPhotos((prev) => prev.filter((p) => p.id !== selectedPhoto.id))
      handleCloseViewer()
    }
  }

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets.map((asset, index) => ({
        id: `new-photo-${Date.now()}-${index}`,
        url: asset.uri,
        createdAt: new Date().toISOString(),
      }))
      setPhotos((prev) => [...newPhotos, ...prev])
    }
  }

  const renderItem = ({ item, index }: { item: Photo; index: number }) => (
    <PhotoItem
      photo={item}
      onPress={() => handlePhotoPress(item)}
      index={index}
    />
  )

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 標題區 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            我的照片
          </Text>
          <IconButton
            icon={<Plus size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleAddPhoto}
            variant="ghost"
          />
        </View>

        {/* 圖片網格 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ImageIcon size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              還沒有照片
            </Text>
            <Button variant="primary" size="md" onPress={handleAddPhoto}>
              <Text fontWeight="600" style={styles.addButtonText}>
                上傳照片
              </Text>
            </Button>
          </View>
        ) : (
          <FlatList
            data={photos}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
          />
        )}

        {/* 圖片檢視器 */}
        <PhotoViewer
          photo={selectedPhoto}
          visible={viewerVisible}
          onClose={handleCloseViewer}
          onDelete={handleDeletePhoto}
        />
      </SafeAreaView>
    </ProtectedRoute>
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
  gridContent: {
    padding: SPACING.md,
  },
  gridRow: {
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    marginBottom: SPACING.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  modalDate: {
    color: '#FFFFFF',
    fontSize: 14,
  },
})
