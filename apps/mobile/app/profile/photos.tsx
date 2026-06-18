/**
 * 我的照片頁面
 *
 * 對應 apps/web/src/app/profile/photos/page.tsx
 * 使用 GET /galleries/photos/me 取得用戶照片
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { ChevronLeft, Edit2, ImageIcon, Plus, Trash2, X } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { UploadPhotoDialog } from '@/components/gallery'
import { ProtectedRoute } from '@/components/shared'
import { Button, IconButton, LoadMoreButton, Text } from '@/components/ui'
import {
  type GalleryPhoto,
  uploadGalleryImage,
  uploadGalleryPhoto,
  useDeletePhoto,
  useMyPhotos,
  useUpdatePhoto,
} from '@/lib/hooks'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const NUM_COLUMNS = 3
const ITEM_SIZE = (SCREEN_WIDTH - SPACING.md * 2 - SPACING.xs * (NUM_COLUMNS - 1)) / NUM_COLUMNS
const PAGE_SIZE = 20

interface PhotoItemProps {
  photo: GalleryPhoto
  onPress: () => void
  index: number
}

function PhotoItem({ photo, onPress, index }: PhotoItemProps) {
  return (
    <Animated.View entering={FadeIn.duration(300).delay(index * 30)}>
      <Pressable onPress={onPress} style={styles.photoItem}>
        <Image
          source={{ uri: photo.thumbnail_url || photo.image_url }}
          style={styles.photoImage}
          contentFit="cover"
          transition={300}
        />
      </Pressable>
    </Animated.View>
  )
}

interface PhotoViewerProps {
  photo: GalleryPhoto | null
  visible: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function PhotoViewer({ photo, visible, onClose, onEdit, onDelete }: PhotoViewerProps) {
  if (!photo) return null

  const handleDelete = () => {
    Alert.alert('刪除照片', '確定要刪除這張照片嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: onDelete },
    ])
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* 頂部操作列 */}
        <SafeAreaView style={styles.modalHeader} edges={['top']}>
          <IconButton icon={<X size={24} color="#FFFFFF" />} onPress={onClose} variant="ghost" />
          <View style={styles.modalHeaderActions}>
            <IconButton
              icon={<Edit2 size={22} color="#FFFFFF" />}
              onPress={onEdit}
              variant="ghost"
            />
            <IconButton
              icon={<Trash2 size={24} color="#EF4444" />}
              onPress={handleDelete}
              variant="ghost"
            />
          </View>
        </SafeAreaView>

        {/* 圖片 */}
        <Pressable style={styles.modalImageContainer} onPress={onClose}>
          <Image source={{ uri: photo.image_url }} style={styles.modalImage} contentFit="contain" />
        </Pressable>

        {/* 底部資訊 */}
        <SafeAreaView style={styles.modalFooter} edges={['bottom']}>
          <View style={styles.modalFooterContent}>
            {photo.caption && <Text style={styles.modalCaption}>{photo.caption}</Text>}
            <Text style={styles.modalDate}>
              {new Date(photo.created_at).toLocaleDateString('zh-TW')}
            </Text>
            {(photo.location_city || photo.location_spot) && (
              <Text style={styles.modalLocation}>
                {[photo.location_spot, photo.location_city].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

interface PhotoEditModalProps {
  photo: GalleryPhoto | null
  visible: boolean
  isSaving: boolean
  onClose: () => void
  onSave: (payload: {
    caption?: string
    location_country?: string
    location_city?: string
    location_spot?: string
  }) => void
}

function PhotoEditModal({ photo, visible, isSaving, onClose, onSave }: PhotoEditModalProps) {
  const [caption, setCaption] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [spot, setSpot] = useState('')

  useEffect(() => {
    if (!photo || !visible) return
    setCaption(photo.caption || '')
    setCountry(photo.location_country || '')
    setCity(photo.location_city || '')
    setSpot(photo.location_spot || '')
  }, [photo, visible])

  if (!photo) return null

  const handleSave = () => {
    onSave({
      caption: caption.trim() || undefined,
      location_country: country.trim() || undefined,
      location_city: city.trim() || undefined,
      location_spot: spot.trim() || undefined,
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.editModalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.editModal}>
          <View style={styles.editModalHeader}>
            <Text variant="h3" fontWeight="600">
              編輯照片
            </Text>
            <IconButton icon={<X size={22} color={SEMANTIC_COLORS.textMain} />} onPress={onClose} />
          </View>

          <TextInput
            style={[styles.editInput, styles.editTextArea]}
            value={caption}
            onChangeText={setCaption}
            placeholder="照片說明"
            placeholderTextColor={SEMANTIC_COLORS.textMuted}
            multiline
            textAlignVertical="top"
          />
          <TextInput
            style={styles.editInput}
            value={country}
            onChangeText={setCountry}
            placeholder="國家 / 地區"
            placeholderTextColor={SEMANTIC_COLORS.textMuted}
          />
          <TextInput
            style={styles.editInput}
            value={city}
            onChangeText={setCity}
            placeholder="城市"
            placeholderTextColor={SEMANTIC_COLORS.textMuted}
          />
          <TextInput
            style={styles.editInput}
            value={spot}
            onChangeText={setSpot}
            placeholder="岩場 / 地點"
            placeholderTextColor={SEMANTIC_COLORS.textMuted}
          />

          <View style={styles.editActions}>
            <Button variant="ghost" size="md" onPress={onClose} disabled={isSaving}>
              取消
            </Button>
            <Button variant="primary" size="md" onPress={handleSave} disabled={isSaving}>
              <Text fontWeight="600" style={styles.addButtonText}>
                {isSaving ? '儲存中...' : '儲存'}
              </Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default function PhotosScreen() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const { data, isLoading, isFetching, isError, refetch } = useMyPhotos(page, PAGE_SIZE)
  const deletePhotoMutation = useDeletePhoto()
  const updatePhotoMutation = useUpdatePhoto()
  const pagination = data?.pagination
  const hasMore = pagination ? pagination.page < pagination.total_pages : false

  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)
  const [viewerVisible, setViewerVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [uploadVisible, setUploadVisible] = useState(false)

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

  const handleBack = () => {
    router.back()
  }

  const handlePhotoPress = useCallback((photo: GalleryPhoto) => {
    setSelectedPhoto(photo)
    setViewerVisible(true)
  }, [])

  const handleCloseViewer = () => {
    setViewerVisible(false)
    setSelectedPhoto(null)
  }

  const handleOpenEdit = () => {
    setEditVisible(true)
  }

  const handleCloseEdit = () => {
    if (updatePhotoMutation.isPending) return
    setEditVisible(false)
  }

  const handleSavePhoto = (payload: {
    caption?: string
    location_country?: string
    location_city?: string
    location_spot?: string
  }) => {
    if (!selectedPhoto) return
    updatePhotoMutation.mutate(
      { id: selectedPhoto.id, payload },
      {
        onSuccess: (updatedPhoto) => {
          setPhotos((prev) =>
            prev.map((photo) => (photo.id === updatedPhoto.id ? updatedPhoto : photo))
          )
          setSelectedPhoto(updatedPhoto)
          setEditVisible(false)
          Alert.alert('更新成功', '照片資訊已更新')
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : '請稍後再試'
          Alert.alert('更新失敗', message)
        },
      }
    )
  }

  const handleDeletePhoto = () => {
    if (selectedPhoto) {
      deletePhotoMutation.mutate(selectedPhoto.id, {
        onSuccess: () => {
          setPhotos((prev) => prev.filter((photo) => photo.id !== selectedPhoto.id))
          handleCloseViewer()
        },
      })
    }
  }

  const handleAddPhoto = () => {
    setUploadVisible(true)
  }

  const handleUploadSuccess = (photo: GalleryPhoto) => {
    setPhotos((prev) => [photo, ...prev.filter((item) => item.id !== photo.id)])
  }

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  const renderItem = ({ item, index }: { item: GalleryPhoto; index: number }) => (
    <PhotoItem photo={item} onPress={() => handlePhotoPress(item)} index={index} />
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
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <ImageIcon size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              載入失敗，請重試
            </Text>
            <Pressable onPress={() => refetch()}>
              <Text variant="body" color="textMain" fontWeight="600">
                重試
              </Text>
            </Pressable>
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
            ListFooterComponent={
              <LoadMoreButton
                onPress={handleLoadMore}
                loading={isFetching && page > 1}
                hasMore={hasMore}
                text="載入更多照片"
                noMoreText="已顯示全部照片"
              />
            }
          />
        )}

        {/* 圖片檢視器 */}
        <PhotoViewer
          photo={selectedPhoto}
          visible={viewerVisible}
          onClose={handleCloseViewer}
          onEdit={handleOpenEdit}
          onDelete={handleDeletePhoto}
        />
        <PhotoEditModal
          photo={selectedPhoto}
          visible={editVisible}
          isSaving={updatePhotoMutation.isPending}
          onClose={handleCloseEdit}
          onSave={handleSavePhoto}
        />
        <UploadPhotoDialog
          isOpen={uploadVisible}
          onClose={() => setUploadVisible(false)}
          onSuccess={handleUploadSuccess}
          onUploadImage={uploadGalleryImage}
          onUploadPhoto={uploadGalleryPhoto}
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
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalFooterContent: {
    alignItems: 'center',
    gap: 4,
  },
  modalCaption: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalDate: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.7,
  },
  modalLocation: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.7,
  },
  editModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  editModal: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: SPACING.sm,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: '#FFFFFF',
  },
  editTextArea: {
    minHeight: 96,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
})
