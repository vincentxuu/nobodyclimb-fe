/**
 * 文章創建頁面
 *
 * 對應 apps/web/src/app/blog/create/page.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { ChevronLeft, Eye, ImagePlus, Save, Send, X } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArticleHtmlContent } from '@/components/blog'
import { RichTextEditor } from '@/components/editor'
import { ProtectedRoute } from '@/components/shared'
import { Button, IconButton, Select, TagInput, Text } from '@/components/ui'
import { markdownToArticleHtml, plainTextSummary } from '@/lib/articleFormatting'
import {
  POST_CATEGORIES,
  type PostPayload,
  useCreatePost,
  useUploadPostImage,
} from '@/lib/hooks/usePosts'

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateSummary(content: string, fallback: string) {
  return plainTextSummary(content, fallback)
}

export default function CreateArticleScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostPayload['category']>(null)
  const [tags, setTags] = useState<string[]>([])
  const [summary, setSummary] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const createPost = useCreatePost()
  const uploadPostImage = useUploadPostImage()
  const isSubmitting = createPost.isPending || uploadPostImage.isPending

  const handleBack = () => {
    if (title || content) {
      Alert.alert('放棄編輯？', '你的文章尚未儲存，確定要離開嗎？', [
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

  const handleInsertContentImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    })

    if (result.canceled || !result.assets[0]) return

    try {
      const imageUrl = await uploadPostImage.mutateAsync({ uri: result.assets[0].uri })
      setContent((current) => `${current.trim()}\n\n![image](${imageUrl})\n\n`)
    } catch (_error) {
      Alert.alert('圖片上傳失敗', '請稍後再試')
    }
  }

  const handleSubmit = useCallback(
    async (status: 'draft' | 'published') => {
      if (!title.trim()) {
        Alert.alert('請輸入標題')
        return
      }
      if (!content.trim()) {
        Alert.alert('請輸入內容')
        return
      }
      if (!category) {
        Alert.alert('請選擇分類')
        return
      }

      try {
        const uploadedCover =
          coverImage && !coverImage.startsWith('http')
            ? await uploadPostImage.mutateAsync({ uri: coverImage })
            : coverImage

        await createPost.mutateAsync({
          title: title.trim(),
          slug: generateSlug(title),
          content: markdownToArticleHtml(content),
          excerpt: generateSummary(content, summary),
          cover_image: uploadedCover || '',
          category,
          tags,
          status,
        })
        Alert.alert(
          status === 'published' ? '發布成功' : '草稿已儲存',
          '文章已儲存到你的文章列表',
          [{ text: '好', onPress: () => router.replace('/profile/articles' as never) }]
        )
      } catch (_error) {
        Alert.alert('發布失敗', '請稍後再試')
      }
    },
    [category, content, coverImage, createPost, router, summary, tags, title, uploadPostImage]
  )

  const handleSaveDraft = () => handleSubmit('draft')
  const handlePublish = () => handleSubmit('published')

  const isValid = title.trim() && content.trim() && category

  if (showPreview) {
    return (
      <ProtectedRoute>
        <SafeAreaView style={styles.container} edges={['top']}>
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
            {coverImage ? (
              <Image
                source={{ uri: coverImage }}
                style={styles.previewCoverImage}
                contentFit="cover"
              />
            ) : null}
            <View style={styles.previewContent}>
              <View style={styles.previewMetaRow}>
                {category ? (
                  <View style={styles.categoryChip}>
                    <Text variant="small" style={styles.categoryChipText}>
                      {POST_CATEGORIES.find((item) => item.value === category)?.label ?? category}
                    </Text>
                  </View>
                ) : null}
                {tags.map((tag) => (
                  <View key={tag} style={styles.previewTagChip}>
                    <Text variant="small" color="textSubtle">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
              <Text variant="h2" fontWeight="700">
                {title || '未命名文章'}
              </Text>
              {content.trim() ? (
                <ArticleHtmlContent html={markdownToArticleHtml(content)} />
              ) : (
                <Text variant="body" style={styles.previewText}>
                  尚無內容
                </Text>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </ProtectedRoute>
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
          <Text variant="h4" fontWeight="600">
            發表文章
          </Text>
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
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {/* 封面圖 */}
            <View style={styles.coverSection}>
              {coverImage ? (
                <View style={styles.coverImageContainer}>
                  <Image
                    source={{ uri: coverImage }}
                    style={styles.coverImage}
                    contentFit="cover"
                  />
                  <Pressable style={styles.removeImageButton} onPress={handleRemoveImage}>
                    <X size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.addCoverButton} onPress={handlePickImage}>
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

            <View style={styles.metaSection}>
              <View style={styles.fieldBlock}>
                <Text variant="bodyBold">分類</Text>
                <Select
                  value={category ?? ''}
                  onValueChange={(value) => setCategory(value as PostPayload['category'])}
                  title="文章分類"
                  placeholder="選擇分類"
                  options={POST_CATEGORIES}
                />
              </View>
              <View style={styles.fieldBlock}>
                <Text variant="bodyBold">標籤</Text>
                <TagInput
                  tags={tags}
                  onTagsChange={setTags}
                  maxTags={5}
                  placeholder="輸入標籤後按完成"
                />
              </View>
              <View style={styles.fieldBlock}>
                <Text variant="bodyBold">摘要（選填）</Text>
                <TextInput
                  style={styles.summaryInput}
                  value={summary}
                  onChangeText={setSummary}
                  placeholder="留空會自動從內容產生摘要..."
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  multiline
                  maxLength={200}
                />
                <Text variant="caption" color="textMuted" align="right">
                  {summary.length}/200
                </Text>
              </View>
            </View>

            {/* 內容輸入 */}
            <View style={styles.contentSection}>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="開始寫你的文章..."
                minHeight={300}
                maxHeight={520}
                onImageInsert={handleInsertContentImage}
              />
            </View>
            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>

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
            <Send size={18} color={isValid ? '#FFFFFF' : SEMANTIC_COLORS.textMuted} />
            <Text fontWeight="600" style={isValid ? styles.publishTextActive : styles.publishText}>
              {isSubmitting ? '發布中...' : '發布文章'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  metaSection: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  fieldBlock: {
    gap: SPACING.sm,
  },
  summaryInput: {
    minHeight: 96,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
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
  previewCoverImage: {
    width: '100%',
    height: 220,
  },
  previewContent: {
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    gap: SPACING.md,
  },
  previewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  categoryChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  categoryChipText: {
    color: '#FFFFFF',
  },
  previewTagChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D3D3D3',
  },
  previewText: {
    lineHeight: 26,
    color: SEMANTIC_COLORS.textSubtle,
  },
  bottomPadding: {
    height: 88,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  draftButton: {
    flex: 1,
  },
  publishButton: {
    flex: 1,
  },
  buttonText: {
    marginLeft: SPACING.xs,
  },
})
