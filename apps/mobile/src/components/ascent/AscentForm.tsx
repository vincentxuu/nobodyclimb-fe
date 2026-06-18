import { FONT_SIZE, RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { Calendar, Instagram, Star, X, Youtube } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ImageUploader } from '@/components/editor/ImageUploader'
import type { AscentType } from '@/lib/constants/ascent'
import { uploadGalleryImage } from '@/lib/hooks/useGallery'
import { AscentTypeSelect } from './AscentTypeSelect'

interface AscentFormData {
  ascent_type: AscentType
  ascent_date: string
  attempts_count: number
  rating: number | null
  perceived_grade?: string | null
  notes?: string | null
  photos?: string[]
  youtube_url?: string | null
  instagram_url?: string | null
}

interface AscentFormProps {
  visible: boolean
  ascent: {
    id: string
    ascent_type: AscentType
    date?: string
    ascent_date?: string
    attempts?: number
    attempts_count?: number
    rating?: number
    perceived_grade?: string | null
    notes?: string
    photos?: string[]
    youtube_url?: string | null
    instagram_url?: string | null
    route_name: string
    crag_name: string
    grade?: string
    route_grade?: string
  }
  onSubmit: (data: AscentFormData) => void
  onClose: () => void
  loading: boolean
}

interface ImageItem {
  id: string
  uri: string
  width?: number
  height?: number
}

function getInitialForm(ascent: AscentFormProps['ascent']): AscentFormData {
  return {
    ascent_type: ascent.ascent_type,
    ascent_date: ascent.ascent_date ?? ascent.date ?? new Date().toISOString().slice(0, 10),
    attempts_count: ascent.attempts_count ?? ascent.attempts ?? 1,
    rating: ascent.rating ?? null,
    perceived_grade: ascent.perceived_grade ?? '',
    notes: ascent.notes ?? '',
    photos: ascent.photos ?? [],
    youtube_url: ascent.youtube_url ?? '',
    instagram_url: ascent.instagram_url ?? '',
  }
}

export function AscentForm({ visible, ascent, onSubmit, onClose, loading }: AscentFormProps) {
  const [form, setForm] = useState<AscentFormData>(() => getInitialForm(ascent))
  const [photos, setPhotos] = useState<ImageItem[]>(
    () => ascent.photos?.map((uri, index) => ({ id: `existing-${index}`, uri })) ?? []
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setForm(getInitialForm(ascent))
      setPhotos(ascent.photos?.map((uri, index) => ({ id: `existing-${index}`, uri })) ?? [])
      setError(null)
    }
  }, [visible, ascent])

  if (!visible) return null

  const routeGrade = ascent.grade ?? ascent.route_grade

  const handleUploadImage = async (uri: string) => {
    const result = await uploadGalleryImage(uri)
    if (!result.success || !result.data?.url) {
      throw new Error('圖片上傳失敗')
    }
    return result.data.url
  }

  const isUrl = (value?: string | null) => {
    if (!value?.trim()) return true
    try {
      new URL(value.trim())
      return true
    } catch {
      return false
    }
  }

  const handleSave = () => {
    if (!form.ascent_date.trim()) {
      setError('請輸入攀爬日期。')
      return
    }
    if (!isUrl(form.youtube_url)) {
      setError('請輸入有效的 YouTube 影片連結。')
      return
    }
    if (!isUrl(form.instagram_url)) {
      setError('請輸入有效的 Instagram 貼文連結。')
      return
    }
    setError(null)
    onSubmit({
      ...form,
      attempts_count: Math.max(1, form.attempts_count || 1),
      perceived_grade: form.perceived_grade?.trim() || null,
      notes: form.notes?.trim() || null,
      photos: photos.map((photo) => photo.uri),
      youtube_url: form.youtube_url?.trim() || null,
      instagram_url: form.instagram_url?.trim() || null,
    })
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>編輯攀登記錄</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={SEMANTIC_COLORS.textSubtle} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{ascent.route_name}</Text>
            <Text style={styles.routeMeta}>
              {ascent.crag_name}
              {routeGrade ? ` · ${routeGrade}` : ''}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>類型</Text>
            <AscentTypeSelect
              value={form.ascent_type}
              onChange={(t) => setForm((f) => ({ ...f, ascent_type: t }))}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>攀爬日期</Text>
            <View style={styles.inputWithIcon}>
              <Calendar size={18} color={SEMANTIC_COLORS.textSubtle} />
              <TextInput
                style={styles.iconInput}
                value={form.ascent_date}
                onChangeText={(v) => setForm((f) => ({ ...f, ascent_date: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={SEMANTIC_COLORS.textSubtle}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>嘗試次數</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(form.attempts_count)}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, attempts_count: Number.parseInt(v, 10) || 1 }))
              }
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>評分（可選）</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() =>
                    setForm((f) => ({ ...f, rating: f.rating === star ? null : star }))
                  }
                  hitSlop={8}
                >
                  <Star
                    size={28}
                    color={form.rating && star <= form.rating ? '#F59E0B' : SEMANTIC_COLORS.border}
                    fill={form.rating && star <= form.rating ? '#F59E0B' : 'transparent'}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>感受難度（可選）</Text>
            <TextInput
              style={styles.input}
              value={form.perceived_grade ?? ''}
              onChangeText={(v) => setForm((f) => ({ ...f, perceived_grade: v }))}
              placeholder="例如：比標示難度稍難"
              placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>備註</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={4}
              value={form.notes ?? ''}
              onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              placeholder="記錄這次攀登的感受..."
              placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>照片（可選）</Text>
            <ImageUploader
              images={photos}
              onChange={setPhotos}
              maxImages={5}
              uploadHandler={handleUploadImage}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>媒體連結（可選）</Text>
            <View style={styles.inputWithIcon}>
              <Youtube size={18} color="#EF4444" />
              <TextInput
                style={styles.iconInput}
                value={form.youtube_url ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, youtube_url: v }))}
                placeholder="YouTube 影片連結"
                placeholderTextColor={SEMANTIC_COLORS.textSubtle}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={styles.inputWithIcon}>
              <Instagram size={18} color="#EC4899" />
              <TextInput
                style={styles.iconInput}
                value={form.instagram_url ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, instagram_url: v }))}
                placeholder="Instagram 貼文連結"
                placeholderTextColor={SEMANTIC_COLORS.textSubtle}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Pressable
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading && (
              <ActivityIndicator size="small" color={WB_COLORS[0]} style={styles.spinner} />
            )}
            <Text style={styles.saveText}>儲存</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.pageBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
  },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  body: { flex: 1 },
  bodyContent: { padding: SPACING.md, gap: SPACING.lg },
  routeInfo: { gap: 2 },
  routeName: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  routeMeta: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  field: { gap: SPACING.xs },
  fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  input: {
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    color: SEMANTIC_COLORS.textMain,
    fontSize: FONT_SIZE.base,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: WB_COLORS[0],
  },
  iconInput: {
    flex: 1,
    padding: 0,
    color: SEMANTIC_COLORS.textMain,
    fontSize: FONT_SIZE.base,
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  ratingRow: { flexDirection: 'row', gap: SPACING.xs },
  errorText: { color: SEMANTIC_COLORS.error, fontSize: FONT_SIZE.sm },
  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: SEMANTIC_COLORS.border,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  cancelText: { color: SEMANTIC_COLORS.textMain, fontSize: FONT_SIZE.base },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  spinner: { marginRight: SPACING.xs },
  saveText: { color: WB_COLORS[0], fontWeight: '700', fontSize: FONT_SIZE.base },
})
