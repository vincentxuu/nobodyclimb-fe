import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Star,
  Trash2,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, SearchInput, Select, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type AdminGym,
  type AdminGymPayload,
  type AdminGymsOptions,
  useAdminGyms,
  useCreateAdminGym,
  useDeleteAdminGym,
  useUpdateAdminGym,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

type GymFormState = {
  name: string
  description: string
  address: string
  city: string
  region: string
  phone: string
  email: string
  website: string
  latitude: string
  longitude: string
  facilities: string
  openingHours: Record<string, string>
  priceInfo: string
  isFeatured: boolean
}

const weekdays = [
  { key: 'monday', label: '週一' },
  { key: 'tuesday', label: '週二' },
  { key: 'wednesday', label: '週三' },
  { key: 'thursday', label: '週四' },
  { key: 'friday', label: '週五' },
  { key: 'saturday', label: '週六' },
  { key: 'sunday', label: '週日' },
] as const

const emptyGymForm: GymFormState = {
  name: '',
  description: '',
  address: '',
  city: '',
  region: '',
  phone: '',
  email: '',
  website: '',
  latitude: '',
  longitude: '',
  facilities: '',
  openingHours: {},
  priceInfo: '',
  isFeatured: false,
}

function formFromGym(gym: AdminGym): GymFormState {
  return {
    name: gym.name,
    description: gym.description || '',
    address: gym.address || '',
    city: gym.city || '',
    region: gym.region || '',
    phone: gym.phone || '',
    email: gym.email || '',
    website: gym.website || '',
    latitude: gym.latitude?.toString() || '',
    longitude: gym.longitude?.toString() || '',
    facilities: gym.facilities?.join(', ') || '',
    openingHours: gym.opening_hours || {},
    priceInfo: gym.price_info ? JSON.stringify(gym.price_info, null, 2) : '',
    isFeatured: gym.is_featured === 1,
  }
}

function payloadFromForm(form: GymFormState): AdminGymPayload | null {
  let priceInfo: Record<string, unknown> | null = null
  if (form.priceInfo.trim()) {
    try {
      const parsed = JSON.parse(form.priceInfo)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        priceInfo = parsed as Record<string, unknown>
      } else {
        return null
      }
    } catch {
      return null
    }
  }

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    region: form.region.trim() || null,
    latitude: form.latitude.trim() ? Number(form.latitude) : null,
    longitude: form.longitude.trim() ? Number(form.longitude) : null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    website: form.website.trim() || null,
    is_featured: form.isFeatured ? 1 : 0,
    facilities: form.facilities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    opening_hours:
      Object.keys(form.openingHours).filter((key) => form.openingHours[key]?.trim()).length > 0
        ? form.openingHours
        : null,
    price_info: priceInfo,
  }
}

export default function AdminGymsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ add?: string }>()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [knownCities, setKnownCities] = useState<string[]>([])
  const [editingGym, setEditingGym] = useState<AdminGym | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<GymFormState>(emptyGymForm)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const options = useMemo<AdminGymsOptions>(
    () => ({
      page,
      limit: 20,
      search: search.trim() || undefined,
      city: cityFilter || undefined,
    }),
    [cityFilter, page, search]
  )

  const { data, isLoading, error } = useAdminGyms(options)
  const deleteGym = useDeleteAdminGym()
  const createGym = useCreateAdminGym()
  const updateGym = useUpdateAdminGym()
  const gyms = data?.gyms ?? []
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.total_pages ?? 1

  useEffect(() => {
    const currentCities = gyms
      .map((gym) => gym.city)
      .filter((city): city is string => Boolean(city))
    const merged = Array.from(new Set([...knownCities, ...currentCities])).sort()
    if (merged.length !== knownCities.length) {
      setKnownCities(merged)
    }
  }, [gyms, knownCities])

  const cityOptions = useMemo(
    () => [
      { value: '', label: '所有城市' },
      ...knownCities.map((city) => ({ value: city, label: city })),
    ],
    [knownCities]
  )

  const featuredCount = gyms.filter((gym) => gym.is_featured).length
  const reviewedCount = gyms.filter((gym) => gym.review_count > 0).length

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['admin-gyms'] })
    setRefreshing(false)
  }, [queryClient])

  const handleDelete = useCallback(
    (gym: AdminGym) => {
      Alert.alert('刪除岩館', `確定要刪除「${gym.name}」？此操作無法復原。`, [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => deleteGym.mutate(gym.id),
        },
      ])
    },
    [deleteGym]
  )

  const handleAdd = useCallback(() => {
    setEditingGym(null)
    setForm(emptyGymForm)
    setShowForm(true)
  }, [])

  useEffect(() => {
    if (params.add === '1') {
      handleAdd()
    }
  }, [handleAdd, params.add])

  const handleEdit = useCallback((gym: AdminGym) => {
    setEditingGym(gym)
    setForm(formFromGym(gym))
    setShowForm(true)
  }, [])

  const handleCancelForm = useCallback(() => {
    setEditingGym(null)
    setForm(emptyGymForm)
    setShowForm(false)
  }, [])

  const handleSaveGym = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('缺少名稱', '請輸入岩館名稱。')
      return
    }
    const payload = payloadFromForm(form)
    if (!payload) {
      Alert.alert('價格資訊格式錯誤', '價格資訊必須是 JSON object，例如 {"單次入場":"350元"}。')
      return
    }
    if (editingGym) {
      await updateGym.mutateAsync({ id: editingGym.id, payload })
    } else {
      await createGym.mutateAsync(payload)
    }
    handleCancelForm()
  }, [createGym, editingGym, form, handleCancelForm, updateGym])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Building2}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到管理後台"
          onAction={() => router.replace('/admin' as never)}
          style={styles.fullState}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
          返回
        </Button>
        <View style={styles.navTitle}>
          <Building2 size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            岩館管理
          </Text>
        </View>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={RefreshCw}
          onPress={handleRefresh}
          loading={refreshing}
          style={styles.refreshButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="h2" fontWeight="700">
            岩館管理
          </Text>
          <Text variant="body" color="textSubtle">
            管理室內攀岩館資訊，支援新增、編輯、搜尋、城市篩選與刪除。
          </Text>
        </View>

        <Button variant="primary" leftIcon={Plus} onPress={handleAdd} style={styles.addButton}>
          新增岩館
        </Button>

        {showForm && (
          <GymForm
            form={form}
            setForm={setForm}
            editing={Boolean(editingGym)}
            saving={createGym.isPending || updateGym.isPending}
            onCancel={handleCancelForm}
            onSave={handleSaveGym}
          />
        )}

        <View style={styles.statsGrid}>
          <StatCard
            label="總岩館數"
            value={total}
            icon={<Building2 size={20} color={SEMANTIC_COLORS.textMain} />}
          />
          <StatCard
            label="本頁精選"
            value={featuredCount}
            icon={<Star size={20} color={SEMANTIC_COLORS.textMain} />}
          />
          <StatCard
            label="已知城市"
            value={knownCities.length}
            icon={<MapPin size={20} color={SEMANTIC_COLORS.textMain} />}
          />
          <StatCard
            label="本頁有評論"
            value={reviewedCount}
            icon={<Activity size={20} color={SEMANTIC_COLORS.textMain} />}
          />
        </View>

        <View style={styles.filterCard}>
          <SearchInput
            value={search}
            onChangeText={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="搜尋岩館名稱、地址..."
            style={styles.searchInput}
          />
          <Select
            value={cityFilter}
            onValueChange={(value) => {
              setCityFilter(value)
              setPage(1)
            }}
            title="城市"
            options={cityOptions}
          />
        </View>

        {isLoading && gyms.length === 0 ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : error ? (
          <EmptyState
            icon={Activity}
            title="無法載入岩館資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <View style={styles.gymList}>
            {gyms.map((gym) => (
              <GymCard
                key={gym.id}
                gym={gym}
                deleting={deleteGym.isPending}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
            {gyms.length === 0 && (
              <EmptyState
                icon={Search}
                title="沒有找到符合條件的岩館"
                description="請調整搜尋或城市篩選。"
                style={styles.stateCard}
              />
            )}
          </View>
        )}

        <View style={styles.pagination}>
          <Text variant="caption" color="textSubtle">
            共 {total} 間岩館，第 {page} / {totalPages} 頁
          </Text>
          <View style={styles.pageButtons}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={ChevronLeft}
              disabled={page <= 1}
              onPress={() => setPage((current) => Math.max(1, current - 1))}
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              size="sm"
              rightIcon={ChevronRight}
              disabled={page >= totalPages}
              onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              下一頁
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <View>
        <Text variant="caption" color="textSubtle">
          {label}
        </Text>
        <Text variant="h3" fontWeight="700">
          {value.toLocaleString()}
        </Text>
      </View>
    </View>
  )
}

function GymCard({
  gym,
  deleting,
  onDelete,
  onEdit,
}: {
  gym: AdminGym
  deleting: boolean
  onDelete: (gym: AdminGym) => void
  onEdit: (gym: AdminGym) => void
}) {
  return (
    <View style={styles.gymCard}>
      <View style={styles.gymHeader}>
        {gym.cover_image ? (
          <Image source={{ uri: gym.cover_image }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverFallback}>
            <Building2 size={22} color={SEMANTIC_COLORS.textMuted} />
          </View>
        )}
        <View style={styles.gymTitle}>
          <View style={styles.titleRow}>
            <Text variant="bodyBold" numberOfLines={1} style={styles.titleText}>
              {gym.name}
            </Text>
            {gym.is_featured ? (
              <View style={styles.featuredPill}>
                <Star size={12} color="#A16207" />
                <Text variant="caption" style={styles.featuredText}>
                  精選
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="textSubtle" numberOfLines={1}>
            {gym.address || gym.slug}
          </Text>
        </View>
      </View>

      <View style={styles.metaRows}>
        <MetaRow
          icon={<MapPin size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="城市"
          value={[gym.region, gym.city].filter(Boolean).join(' / ') || '未設定'}
        />
        <MetaRow
          icon={<Phone size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="電話"
          value={gym.phone || '未設定'}
        />
        <MetaRow
          icon={<Mail size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="Email"
          value={gym.email || '未設定'}
        />
      </View>

      <View style={styles.countRow}>
        <CountBadge label="評分" value={Number(gym.rating_avg || 0).toFixed(1)} />
        <CountBadge label="評論" value={gym.review_count} />
        <CountBadge label="設施" value={gym.facilities?.length ?? 0} />
      </View>

      <View style={styles.actions}>
        <Button variant="outline" size="sm" leftIcon={Edit} onPress={() => onEdit(gym)}>
          編輯
        </Button>
        {gym.website ? (
          <Button
            variant="outline"
            size="sm"
            leftIcon={Globe}
            onPress={() => {
              Linking.openURL(gym.website as string)
            }}
          >
            網站
          </Button>
        ) : null}
        <Button
          variant="destructive"
          size="sm"
          leftIcon={Trash2}
          loading={deleting}
          disabled={deleting}
          onPress={() => onDelete(gym)}
        >
          刪除
        </Button>
      </View>
    </View>
  )
}

function GymForm({
  form,
  setForm,
  editing,
  saving,
  onCancel,
  onSave,
}: {
  form: GymFormState
  setForm: React.Dispatch<React.SetStateAction<GymFormState>>
  editing: boolean
  saving: boolean
  onCancel: () => void
  onSave: () => void
}) {
  const update = (key: keyof GymFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <View style={styles.formCard}>
      <Text variant="h4" fontWeight="700">
        {editing ? '編輯岩館' : '新增岩館'}
      </Text>
      <FormInput label="名稱 *" value={form.name} onChangeText={(value) => update('name', value)} />
      <FormInput
        label="城市"
        value={form.city}
        onChangeText={(value) => update('city', value)}
        placeholder="例：台北市"
      />
      <FormInput
        label="區域"
        value={form.region}
        onChangeText={(value) => update('region', value)}
        placeholder="北部 / 中部 / 南部 / 東部"
      />
      <FormInput
        label="地址"
        value={form.address}
        onChangeText={(value) => update('address', value)}
      />
      <FormInput label="電話" value={form.phone} onChangeText={(value) => update('phone', value)} />
      <FormInput
        label="Email"
        value={form.email}
        onChangeText={(value) => update('email', value)}
        keyboardType="email-address"
      />
      <FormInput
        label="網站"
        value={form.website}
        onChangeText={(value) => update('website', value)}
        placeholder="https://"
        keyboardType="url"
      />
      <View style={styles.coordinateRow}>
        <FormInput
          label="緯度"
          value={form.latitude}
          onChangeText={(value) => update('latitude', value)}
          keyboardType="decimal-pad"
          style={styles.coordinateInput}
        />
        <FormInput
          label="經度"
          value={form.longitude}
          onChangeText={(value) => update('longitude', value)}
          keyboardType="decimal-pad"
          style={styles.coordinateInput}
        />
      </View>
      <FormInput
        label="設施"
        value={form.facilities}
        onChangeText={(value) => update('facilities', value)}
        placeholder="抱石區, 先鋒區, 淋浴間"
      />
      <View style={styles.openingHoursSection}>
        <Text variant="caption" fontWeight="600">
          營業時間
        </Text>
        <Text variant="caption" color="textMuted">
          例：10:00-22:00 或 公休
        </Text>
        <View style={styles.openingHoursGrid}>
          {weekdays.map((day) => (
            <FormInput
              key={day.key}
              label={day.label}
              value={form.openingHours[day.key] || ''}
              onChangeText={(value) =>
                setForm((current) => ({
                  ...current,
                  openingHours: {
                    ...current.openingHours,
                    [day.key]: value,
                  },
                }))
              }
              placeholder="10:00-22:00"
              style={styles.openingHourInput}
            />
          ))}
        </View>
      </View>
      <FormInput
        label="描述"
        value={form.description}
        onChangeText={(value) => update('description', value)}
        multiline
      />
      <FormInput
        label="價格資訊 JSON"
        value={form.priceInfo}
        onChangeText={(value) => update('priceInfo', value)}
        placeholder='{"單次入場":"350元"}'
        multiline
      />
      <View style={styles.switchRow}>
        <View>
          <Text variant="bodyBold">精選岩館</Text>
          <Text variant="caption" color="textSubtle">
            顯示為推薦岩館
          </Text>
        </View>
        <Switch value={form.isFeatured} onValueChange={(value) => update('isFeatured', value)} />
      </View>
      <View style={styles.formActions}>
        <Button variant="outline" onPress={onCancel} disabled={saving}>
          取消
        </Button>
        <Button
          variant="primary"
          leftIcon={saving ? undefined : Save}
          loading={saving}
          disabled={saving || !form.name.trim()}
          onPress={onSave}
        >
          {editing ? '更新' : '新增'}
        </Button>
      </View>
    </View>
  )
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  style,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  multiline?: boolean
  keyboardType?: 'default' | 'email-address' | 'url' | 'decimal-pad'
  style?: object
}) {
  return (
    <View style={[styles.formField, style]}>
      <Text variant="caption" fontWeight="600">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SEMANTIC_COLORS.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      {icon}
      <Text variant="caption" color="textMuted" style={styles.metaLabel}>
        {label}
      </Text>
      <Text variant="caption" color="textSubtle" numberOfLines={1} style={styles.metaValue}>
        {value}
      </Text>
    </View>
  )
}

function CountBadge({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.countBadge}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="bodyBold">{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: WB_COLORS[20],
  },
  navTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    minWidth: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    gap: 6,
    marginBottom: SPACING.lg,
  },
  fullState: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '47%',
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  filterCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  addButton: {
    marginBottom: SPACING.lg,
  },
  formCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  formField: {
    gap: 6,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: WB_COLORS[0],
  },
  textarea: {
    minHeight: 96,
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  coordinateInput: {
    flex: 1,
  },
  openingHoursSection: {
    gap: 6,
  },
  openingHoursGrid: {
    gap: SPACING.sm,
  },
  openingHourInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  loading: {
    paddingVertical: 80,
  },
  stateCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  gymList: {
    gap: SPACING.md,
  },
  gymCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  gymHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  coverImage: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
  },
  coverFallback: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[20],
  },
  gymTitle: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titleText: {
    flex: 1,
  },
  featuredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
  },
  featuredText: {
    color: '#A16207',
  },
  metaRows: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    width: 48,
  },
  metaValue: {
    flex: 1,
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  countBadge: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pagination: {
    gap: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  pageButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
})
