import {
  BORDER_RADIUS,
  FONT_SIZE,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Instagram, Star, Youtube } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { ImageUploader } from '@/components/editor/ImageUploader'
import { apiClient } from '@/lib/api'
import type { AscentType } from '@/lib/constants/ascent'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { uploadGalleryImage } from '@/lib/hooks/useGallery'
import { AscentTypeSelect } from './AscentTypeSelect'

type Step = 'crag' | 'route' | 'form'

interface CreateAscentFlowProps {
  onSuccess: () => void
  onCancel: () => void
}

interface CragResult {
  id: string
  name: string
  area_name?: string
}

interface RouteResult {
  id: string
  name: string
  grade: string
}

interface ImageItem {
  id: string
  uri: string
  width?: number
  height?: number
}

const STEPS: Step[] = ['crag', 'route', 'form']

export function CreateAscentFlow({ onSuccess, onCancel }: CreateAscentFlowProps) {
  const [step, setStep] = useState<Step>('crag')
  const [cragQuery, setCragQuery] = useState('')
  const [routeQuery, setRouteQuery] = useState('')
  const [selectedCrag, setSelectedCrag] = useState<CragResult | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null)
  const [ascentType, setAscentType] = useState<AscentType>('redpoint')
  const [ascentDate, setAscentDate] = useState(new Date().toISOString().slice(0, 10))
  const [attemptsCount, setAttemptsCount] = useState('1')
  const [rating, setRating] = useState<number | null>(null)
  const [perceivedGrade, setPerceivedGrade] = useState('')
  const [notes, setNotes] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [photos, setPhotos] = useState<ImageItem[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const debouncedCragQuery = useDebounce(cragQuery, 300)
  const debouncedRouteQuery = useDebounce(routeQuery, 200)

  const qc = useQueryClient()

  const cragsQuery = useQuery({
    queryKey: ['crags', 'search', debouncedCragQuery],
    queryFn: async () => {
      const { data } = await apiClient.get(`/crags?q=${debouncedCragQuery}&limit=20`)
      return data.data.crags ?? []
    },
    enabled: debouncedCragQuery.length >= 1,
  })

  const routesQuery = useQuery({
    queryKey: ['routes', 'crag', selectedCrag?.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/crags/${selectedCrag!.id}/routes?limit=500`)
      return data.data.routes ?? []
    },
    enabled: !!selectedCrag,
  })

  const filteredRoutes = useMemo(() => {
    const routes = routesQuery.data ?? []
    const query = debouncedRouteQuery.trim().toLowerCase()
    if (!query) return routes
    return routes.filter((route: RouteResult) => {
      const name = route.name?.toLowerCase() ?? ''
      const grade = route.grade?.toLowerCase() ?? ''
      return name.includes(query) || grade.includes(query)
    })
  }, [routesQuery.data, debouncedRouteQuery])

  const createMutation = useMutation({
    mutationFn: async () => {
      const attempts = Math.max(1, Number.parseInt(attemptsCount, 10) || 1)
      const { data } = await apiClient.post('/ascents', {
        route_id: selectedRoute!.id,
        ascent_type: ascentType,
        ascent_date: ascentDate.trim(),
        attempts_count: attempts,
        rating,
        perceived_grade: perceivedGrade.trim() || null,
        notes: notes.trim() || null,
        photos: photos.map((photo) => photo.uri),
        youtube_url: youtubeUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        is_public: true,
      })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ascents'] })
      qc.invalidateQueries({ queryKey: ['ascents', 'route', selectedRoute?.id] })
      onSuccess()
    },
    onError: () => setFormError('新增失敗，請確認欄位後再試一次。'),
  })

  const stepIndex = STEPS.indexOf(step)

  const handleUploadImage = async (uri: string) => {
    const result = await uploadGalleryImage(uri)
    if (!result.success || !result.data?.url) {
      throw new Error('圖片上傳失敗')
    }
    return result.data.url
  }

  const isUrl = (value: string) => {
    if (!value.trim()) return true
    try {
      new URL(value.trim())
      return true
    } catch {
      return false
    }
  }

  const handleCreate = () => {
    if (!ascentDate.trim()) {
      setFormError('請輸入攀爬日期。')
      return
    }
    if (!isUrl(youtubeUrl)) {
      setFormError('請輸入有效的 YouTube 影片連結。')
      return
    }
    if (!isUrl(instagramUrl)) {
      setFormError('請輸入有效的 Instagram 貼文連結。')
      return
    }
    setFormError(null)
    createMutation.mutate()
  }

  return (
    <View style={styles.container}>
      <View testID="step-indicator" style={styles.stepIndicator}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]} />
        ))}
      </View>

      {step === 'crag' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>選擇岩場</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜尋岩場名稱..."
            placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            value={cragQuery}
            onChangeText={setCragQuery}
            autoFocus
          />
          {cragsQuery.isLoading && <ActivityIndicator color={SEMANTIC_COLORS.textSubtle} />}
          <FlatList
            data={cragsQuery.data ?? []}
            keyExtractor={(item: CragResult) => item.id}
            renderItem={({ item }: { item: CragResult }) => (
              <Pressable
                style={styles.listItem}
                onPress={() => {
                  setSelectedCrag(item)
                  setRouteQuery('')
                  setStep('route')
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                <Text style={styles.listItemSub}>{item.area_name}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              cragQuery.length > 0 && !cragsQuery.isLoading ? (
                <Text style={styles.empty}>找不到岩場</Text>
              ) : null
            }
          />
        </View>
      )}

      {step === 'route' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>選擇路線</Text>
          <Text style={styles.stepSub}>{selectedCrag?.name}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜尋路線名稱或難度..."
            placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            value={routeQuery}
            onChangeText={setRouteQuery}
            autoCapitalize="none"
          />
          {routesQuery.isLoading && <ActivityIndicator color={SEMANTIC_COLORS.textSubtle} />}
          <FlatList
            data={filteredRoutes}
            keyExtractor={(item: RouteResult) => item.id}
            renderItem={({ item }: { item: RouteResult }) => (
              <Pressable
                style={styles.listItem}
                onPress={() => {
                  setSelectedRoute(item)
                  setStep('form')
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                <Text style={styles.listItemGrade}>{item.grade}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              !routesQuery.isLoading ? (
                <Text style={styles.empty}>
                  {routeQuery.trim() ? '找不到符合的路線' : '這個岩場目前沒有路線資料'}
                </Text>
              ) : null
            }
          />
          <Pressable style={styles.backBtn} onPress={() => setStep('crag')}>
            <Text style={styles.backText}>← 返回</Text>
          </Pressable>
        </View>
      )}

      {step === 'form' && (
        <ScrollView
          style={styles.stepScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.routeSummary}>
            <Text style={styles.stepTitle}>{selectedRoute?.name}</Text>
            <Text style={styles.stepSub}>
              {selectedCrag?.name} · {selectedRoute?.grade}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>攀爬類型</Text>
            <AscentTypeSelect value={ascentType} onChange={setAscentType} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>攀爬日期</Text>
            <View style={styles.inputWithIcon}>
              <Calendar size={18} color={SEMANTIC_COLORS.textSubtle} />
              <TextInput
                style={styles.iconInput}
                value={ascentDate}
                onChangeText={setAscentDate}
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
              keyboardType="number-pad"
              value={attemptsCount}
              onChangeText={setAttemptsCount}
              placeholder="1"
              placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>個人評分（可選）</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating((current) => (current === star ? null : star))}
                  hitSlop={8}
                >
                  <Star
                    size={28}
                    color={rating && star <= rating ? '#F59E0B' : SEMANTIC_COLORS.border}
                    fill={rating && star <= rating ? '#F59E0B' : 'transparent'}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>感受難度（可選）</Text>
            <TextInput
              style={styles.input}
              value={perceivedGrade}
              onChangeText={setPerceivedGrade}
              placeholder="例如：比標示難度稍難"
              placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>筆記（可選）</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="記錄這次攀爬的心得..."
              placeholderTextColor={SEMANTIC_COLORS.textSubtle}
              multiline
              textAlignVertical="top"
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
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
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
                value={instagramUrl}
                onChangeText={setInstagramUrl}
                placeholder="Instagram 貼文連結"
                placeholderTextColor={SEMANTIC_COLORS.textSubtle}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          {createMutation.isPending && <ActivityIndicator color={SEMANTIC_COLORS.success} />}
          <Pressable
            style={[styles.saveBtn, createMutation.isPending && styles.saveBtnDisabled]}
            onPress={handleCreate}
            disabled={createMutation.isPending}
          >
            <Text style={styles.saveText}>新增記錄</Text>
          </Pressable>
          <Pressable style={styles.backBtn} onPress={() => setStep('route')}>
            <Text style={styles.backText}>← 返回</Text>
          </Pressable>
        </ScrollView>
      )}

      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>取消</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md, gap: SPACING.md },
  stepIndicator: { flexDirection: 'row', gap: SPACING.xs, justifyContent: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SEMANTIC_COLORS.border },
  stepDotActive: { backgroundColor: SEMANTIC_COLORS.success },
  stepContent: { flex: 1, gap: SPACING.sm },
  stepScroll: { flex: 1 },
  formContent: { gap: SPACING.md, paddingBottom: SPACING.xl },
  routeSummary: { gap: SPACING.xs },
  stepTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  stepSub: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  field: { gap: SPACING.xs },
  fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  searchInput: {
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    color: SEMANTIC_COLORS.textMain,
    fontSize: FONT_SIZE.base,
  },
  input: {
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
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
    borderRadius: BORDER_RADIUS.sm,
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
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  ratingRow: { flexDirection: 'row', gap: SPACING.xs },
  listItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
  },
  listItemText: { fontSize: FONT_SIZE.base, color: SEMANTIC_COLORS.textMain },
  listItemSub: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  listItemGrade: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: SEMANTIC_COLORS.success },
  empty: { color: SEMANTIC_COLORS.textSubtle, textAlign: 'center', marginTop: SPACING.lg },
  errorText: { color: SEMANTIC_COLORS.error, fontSize: FONT_SIZE.sm },
  backBtn: { paddingVertical: SPACING.sm },
  backText: { color: SEMANTIC_COLORS.textSubtle, fontSize: FONT_SIZE.sm },
  saveBtn: {
    backgroundColor: SEMANTIC_COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: WB_COLORS[100], fontWeight: '700', fontSize: FONT_SIZE.base },
  cancelBtn: { paddingVertical: SPACING.sm, alignItems: 'center' },
  cancelText: { color: SEMANTIC_COLORS.textSubtle, fontSize: FONT_SIZE.sm },
})
