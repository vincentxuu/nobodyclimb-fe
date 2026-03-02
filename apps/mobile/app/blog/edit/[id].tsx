/**
 * 文章編輯頁面
 *
 * 對應 apps/web/src/app/blog/edit/[id]/page.tsx
 */
import React, { useState, useCallback, useEffect } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { ChevronLeft, ImagePlus, X, Save, Eye, Send } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'

import { Text, IconButton, Button } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

type ArticleStatus = 'draft' | 'published' | 'archived'

interface ArticleData {
  id: string
  title: string
  content: string
  coverImage?: string | null
  category?: string
  tags?: string[]
  status: ArticleStatus
  excerpt?: string
}

export default function EditArticleScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [status, setStatus] = useState<ArticleStatus>('draft')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  // 載入文章資料
  useEffect(() => {
    const loadArticle = async () => {
      if (!id) {
        router.back()
        return
      }

      try {
        // TODO: 整合 postService.getPostById(id)
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 模擬資料
        const mockArticle: ArticleData = {
          id,
          title: '攀岩入門指南：從零開始的完整攻略',
          content: `攀岩是一項結合力量、技巧和心理素質的運動。

## 什麼是攀岩？

攀岩是指使用手腳攀爬岩壁或人工岩牆的運動。

## 開始前的準備

- 攀岩鞋：最重要的裝備
- 粉袋：用於吸收手汗
- 安全吊帶：如果進行上攀`,
          coverImage: 'https://picsum.photos/800/400?random=30',
          status: 'draft',
        }

        setTitle(mockArticle.title)
        setContent(mockArticle.content)
        setCoverImage(mockArticle.coverImage || null)
        setStatus(mockArticle.status)
      } catch (error) {
        console.error('載入文章時出錯:', error)
        Alert.alert('載入失敗', '無法載入文章，請稍後再試', [
          { text: '確定', onPress: () => router.back() },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadArticle()
  }, [id, router])

  const handleBack = () => {
    if (title || content) {
      Alert.alert('放棄編輯？', '你的修改尚未儲存，確定要離開嗎？', [
        { text: '取消', style: 'cancel' },
        { text: '確定', style: 'destructive', onPress: () => router.back() },
      ])
    } else {
      router.back()
    }
  }

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0].uri)
    }
  }

  const handleRemoveImage = () => {
    setCoverImage(null)
  }

  const handleSubmit = useCallback(
    async (newStatus: ArticleStatus) => {
      if (!title.trim()) {
        Alert.alert('請輸入標題')
        return
      }
      if (!content.trim()) {
        Alert.alert('請輸入內容')
        return
      }

      setIsSubmitting(true)
      try {
        // TODO: 整合 postService.updatePost(id, postData)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const successMessage =
          newStatus === 'published' ? '文章更新成功！' : '草稿儲存成功！'
        Alert.alert('成功', successMessage, [
          { text: '好', onPress: () => router.back() },
        ])
      } catch (error) {
        console.error('更新文章時出錯:', error)
        Alert.alert('更新失敗', '請稍後再試')
      } finally {
        setIsSubmitting(false)
      }
    },
    [id, title, content, coverImage, router]
  )

  const handleSaveDraft = () => handleSubmit('draft')
  const handlePublish = () =>
    handleSubmit(status === 'published' ? 'published' : 'published')

  const isValid = title.trim() && content.trim()

  // 載入中狀態
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          <Text variant="body" color="textSubtle" style={styles.loadingText}>
            載入中...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // 預覽模式
  if (showPreview) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 預覽導航列 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={() => setShowPreview(false)}
            variant="ghost"
          />
          <Text variant="body" color="textMuted">
            預覽模式
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          {coverImage && (
            <Image
              source={{ uri: coverImage }}
              style={styles.previewCoverImage}
              contentFit="cover"
            />
          )}
          <View style={styles.previewContent}>
            <Text variant="h2" fontWeight="700">
              {title || '未命名文章'}
            </Text>
            <Text variant="body" style={styles.previewText}>
              {content || '尚無內容'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 導航列 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <View style={styles.headerCenter}>
            <Text variant="h4" fontWeight="600">
              編輯文章
            </Text>
            {status === 'draft' && (
              <View style={styles.draftBadge}>
                <Text variant="small" style={styles.draftBadgeText}>
                  草稿
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon={<Eye size={20} color={SEMANTIC_COLORS.textMain} />}
              onPress={() => setShowPreview(true)}
              variant="ghost"
              disabled={isSubmitting}
            />
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
            {/* 封面圖 */}
            <View style={styles.coverSection}>
              {coverImage ? (
                <View style={styles.coverImageContainer}>
                  <Image
                    source={{ uri: coverImage }}
                    style={styles.coverImage}
                    contentFit="cover"
                  />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                  >
                    <X size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.addCoverButton}
                  onPress={handlePickImage}
                >
                  <ImagePlus size={32} color={SEMANTIC_COLORS.textMuted} />
                  <Text variant="body" color="textMuted">
                    新增封面圖片
                  </Text>
                </Pressable>
              )}
            </View>

            {/* 標題輸入 */}
            <View style={styles.inputSection}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="輸入文章標題..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                maxLength={100}
              />
            </View>

            {/* 內容輸入 */}
            <View style={styles.contentSection}>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="開始寫你的文章..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 底部操作列 */}
        <View style={styles.bottomBar}>
          <Button
            variant="secondary"
            size="md"
            onPress={handleSaveDraft}
            disabled={!isValid || isSubmitting}
            style={styles.draftButton}
          >
            <Save size={18} color={SEMANTIC_COLORS.textMain} />
            <Text fontWeight="500" style={styles.buttonText}>
              儲存草稿
            </Text>
          </Button>
          <Button
            variant={isValid ? 'primary' : 'secondary'}
            size="md"
            onPress={handlePublish}
            disabled={!isValid || isSubmitting}
            style={styles.publishButton}
          >
            <Send
              size={18}
              color={isValid ? '#FFFFFF' : SEMANTIC_COLORS.textMuted}
            />
            <Text
              fontWeight="600"
              style={isValid ? styles.publishTextActive : styles.publishText}
            >
              {isSubmitting
                ? '處理中...'
                : status === 'published'
                  ? '更新文章'
                  : '發布文章'}
            </Text>
          </Button>
        </View>
      </SafeAreaView>
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  draftBadgeText: {
    color: '#92400E',
    fontSize: 12,
  },
  publishText: {
    color: SEMANTIC_COLORS.textMuted,
  },
  publishTextActive: {
    color: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  coverSection: {
    padding: SPACING.md,
  },
  addCoverButton: {
    height: 160,
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  coverImageContainer: {
    position: 'relative',
    height: 180,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 32,
    padding: 0,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  contentInput: {
    fontSize: 16,
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 26,
    minHeight: 300,
    padding: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  draftButton: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  publishButton: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  buttonText: {
    color: SEMANTIC_COLORS.textMain,
  },
  previewCoverImage: {
    width: '100%',
    height: 200,
  },
  previewContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  previewText: {
    lineHeight: 26,
  },
})
