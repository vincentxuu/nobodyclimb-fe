/**
 * 文章創建頁面
 *
 * 對應 apps/web/src/app/blog/create/page.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { ChevronLeft, ImagePlus, X } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'

import { Text, IconButton, Button, Input } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

export default function CreateArticleScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = useCallback(async () => {
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
      // TODO: 整合 articleService
      await new Promise((resolve) => setTimeout(resolve, 1000))
      Alert.alert('發布成功', '你的文章已成功發布', [
        { text: '好', onPress: () => router.back() },
      ])
    } catch (error) {
      Alert.alert('發布失敗', '請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }, [title, content, coverImage, router])

  const isValid = title.trim() && content.trim()

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
          <Button
            variant={isValid ? 'primary' : 'secondary'}
            size="sm"
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            <Text
              fontWeight="600"
              style={isValid ? styles.publishTextActive : styles.publishText}
            >
              {isSubmitting ? '發布中...' : '發布'}
            </Text>
          </Button>
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
})
