import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  Bolt,
  Calendar,
  ChevronRight,
  Edit,
  MapPin,
  Mountain,
  Plus,
  RefreshCw,
  Route,
  Save,
  Search,
  Star,
  Trash2,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, SearchInput, Select, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type AdminCrag,
  type AdminCragPayload,
  type AdminCragsOptions,
  useAdminCragStats,
  useAdminCrags,
  useBatchImportAdminCrags,
  useCreateAdminCrag,
  useDeleteAdminCrag,
  useUpdateAdminCrag,
  useUpdateAdminCragCounts,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

type CragFormState = {
  name: string
  slug: string
  description: string
  location: string
  region: string
  latitude: string
  longitude: string
  altitude: string
  rockType: string
  climbingTypes: string
  difficultyRange: string
  isFeatured: boolean
  accessInfo: string
  parkingInfo: string
  approachTime: string
  bestSeasons: string
  restrictions: string
}

const emptyCragForm: CragFormState = {
  name: '',
  slug: '',
  description: '',
  location: '',
  region: '',
  latitude: '',
  longitude: '',
  altitude: '',
  rockType: '',
  climbingTypes: '',
  difficultyRange: '',
  isFeatured: false,
  accessInfo: '',
  parkingInfo: '',
  approachTime: '',
  bestSeasons: '',
  restrictions: '',
}

function formFromCrag(crag: AdminCrag): CragFormState {
  return {
    name: crag.name,
    slug: crag.slug,
    description: crag.description ?? '',
    location: crag.location ?? '',
    region: crag.region ?? '',
    latitude: crag.latitude?.toString() ?? '',
    longitude: crag.longitude?.toString() ?? '',
    altitude: crag.altitude?.toString() ?? '',
    rockType: crag.rock_type ?? '',
    climbingTypes: crag.climbing_types?.join(', ') ?? '',
    difficultyRange: crag.difficulty_range ?? '',
    isFeatured: Boolean(crag.is_featured),
    accessInfo: crag.access_info ?? '',
    parkingInfo: crag.parking_info ?? '',
    approachTime: crag.approach_time?.toString() ?? '',
    bestSeasons: crag.best_seasons?.join(', ') ?? '',
    restrictions: crag.restrictions ?? '',
  }
}

function nullableText(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

function nullableNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function splitComma(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function payloadFromCragForm(form: CragFormState, editing: boolean): AdminCragPayload {
  const payload: AdminCragPayload = {
    name: form.name.trim(),
    description: nullableText(form.description),
    location: nullableText(form.location),
    region: nullableText(form.region),
    latitude: nullableNumber(form.latitude),
    longitude: nullableNumber(form.longitude),
    altitude: nullableNumber(form.altitude),
    rock_type: nullableText(form.rockType),
    climbing_types: splitComma(form.climbingTypes),
    difficulty_range: nullableText(form.difficultyRange),
    is_featured: form.isFeatured ? 1 : 0,
    access_info: nullableText(form.accessInfo),
    parking_info: nullableText(form.parkingInfo),
    approach_time: nullableNumber(form.approachTime),
    best_seasons: splitComma(form.bestSeasons),
    restrictions: nullableText(form.restrictions),
  }

  if (!editing && form.slug.trim()) {
    payload.slug = form.slug.trim()
  }

  return payload
}

export default function AdminCragsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [editingCrag, setEditingCrag] = useState<AdminCrag | null>(null)
  const [form, setForm] = useState<CragFormState>(emptyCragForm)
  const [importText, setImportText] = useState('')
  const [skipExisting, setSkipExisting] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const options = useMemo<AdminCragsOptions>(
    () => ({
      page,
      limit: 20,
      search: search.trim() || undefined,
      region: region || undefined,
    }),
    [page, region, search]
  )

  const { data: cragsData, isLoading, error } = useAdminCrags(options)
  const { data: stats } = useAdminCragStats()
  const updateCounts = useUpdateAdminCragCounts()
  const createCrag = useCreateAdminCrag()
  const updateCrag = useUpdateAdminCrag()
  const deleteCrag = useDeleteAdminCrag()
  const batchImportCrags = useBatchImportAdminCrags()

  const crags = cragsData?.crags ?? []
  const total = cragsData?.pagination.total ?? 0
  const totalPages = cragsData?.pagination.total_pages ?? 1

  const regionOptions = useMemo(
    () => [
      { value: '', label: '所有區域' },
      ...(stats?.regions ?? [])
        .filter((item) => item.region)
        .map((item) => ({
          value: item.region,
          label: `${item.region} (${item.count})`,
        })),
    ],
    [stats]
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] }),
    ])
    setRefreshing(false)
  }, [queryClient])

  const handleUpdateCounts = useCallback(
    (crag: AdminCrag) => {
      Alert.alert('重算岩場統計', `確定要重算「${crag.name}」的路線數與 bolt 數？`, [
        { text: '取消', style: 'cancel' },
        {
          text: '重算',
          onPress: () => updateCounts.mutate(crag.id),
        },
      ])
    },
    [updateCounts]
  )

  const handleAdd = useCallback(() => {
    setEditingCrag(null)
    setForm(emptyCragForm)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((crag: AdminCrag) => {
    setEditingCrag(crag)
    setForm(formFromCrag(crag))
    setShowForm(true)
  }, [])

  const handleCancelForm = useCallback(() => {
    setShowForm(false)
    setEditingCrag(null)
    setForm(emptyCragForm)
  }, [])

  const handleSaveCrag = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('缺少岩場名稱', '請輸入岩場名稱後再儲存。')
      return
    }

    const editing = Boolean(editingCrag)
    const payload = payloadFromCragForm(form, editing)

    try {
      if (editingCrag) {
        await updateCrag.mutateAsync({ id: editingCrag.id, payload })
      } else {
        await createCrag.mutateAsync(payload)
      }
      handleCancelForm()
    } catch (_error) {
      Alert.alert('儲存失敗', '請稍後再試，或確認欄位格式是否正確。')
    }
  }, [createCrag, editingCrag, form, handleCancelForm, updateCrag])

  const handleDeleteCrag = useCallback(
    (crag: AdminCrag) => {
      Alert.alert('刪除岩場', `確定要刪除「${crag.name}」？這個動作無法復原。`, [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCrag.mutateAsync(crag.id)
              if (editingCrag?.id === crag.id) {
                handleCancelForm()
              }
            } catch (_error) {
              Alert.alert('刪除失敗', '請稍後再試，或確認此岩場是否仍有關聯資料。')
            }
          },
        },
      ])
    },
    [deleteCrag, editingCrag?.id, handleCancelForm]
  )

  const handleBatchImport = useCallback(async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(importText)
    } catch {
      Alert.alert('JSON 格式錯誤', '請輸入岩場陣列 JSON。')
      return
    }

    if (!Array.isArray(parsed)) {
      Alert.alert('資料格式錯誤', '批量匯入內容必須是 JSON 陣列。')
      return
    }

    try {
      const result = await batchImportCrags.mutateAsync({
        crags: parsed as Partial<AdminCragPayload>[],
        skipExisting,
      })
      setImportText('')
      setShowImportForm(false)
      Alert.alert(
        '匯入完成',
        `新增 ${result?.imported ?? 0} 筆，略過 ${result?.skipped ?? 0} 筆${
          result?.errors?.length ? `，錯誤 ${result.errors.length} 筆` : ''
        }。`
      )
    } catch (_error) {
      Alert.alert('匯入失敗', '請稍後再試，或確認 JSON 欄位是否符合 API 格式。')
    }
  }, [batchImportCrags, importText, skipExisting])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Mountain}
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
          <Mountain size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            岩場管理
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
            岩場管理
          </Text>
          <Text variant="body" color="textSubtle">
            建立、編輯與刪除岩場資料，並可重算單一岩場的路線與 bolt 數。
          </Text>
          <View style={styles.headerActions}>
            <Button variant="primary" leftIcon={Plus} onPress={handleAdd}>
              新增岩場
            </Button>
            <Button
              variant="outline"
              leftIcon={Plus}
              onPress={() => setShowImportForm((current) => !current)}
            >
              批量匯入
            </Button>
          </View>
        </View>

        {showForm && (
          <CragForm
            form={form}
            setForm={setForm}
            editing={Boolean(editingCrag)}
            saving={createCrag.isPending || updateCrag.isPending}
            onCancel={handleCancelForm}
            onSave={handleSaveCrag}
          />
        )}

        {showImportForm && (
          <BatchImportForm
            value={importText}
            skipExisting={skipExisting}
            importing={batchImportCrags.isPending}
            onChangeText={setImportText}
            onSkipExistingChange={setSkipExisting}
            onCancel={() => setShowImportForm(false)}
            onImport={handleBatchImport}
          />
        )}

        {stats && (
          <View style={styles.statsGrid}>
            <StatCard
              label="岩場"
              value={stats.total_crags}
              icon={<Mountain size={20} color={SEMANTIC_COLORS.textMain} />}
            />
            <StatCard
              label="路線"
              value={stats.total_routes}
              icon={<Route size={20} color={SEMANTIC_COLORS.textMain} />}
            />
            <StatCard
              label="Bolts"
              value={stats.total_bolts}
              icon={<Bolt size={20} color={SEMANTIC_COLORS.textMain} />}
            />
            <StatCard
              label="精選"
              value={stats.featured_count}
              icon={<Star size={20} color={SEMANTIC_COLORS.textMain} />}
            />
          </View>
        )}

        <View style={styles.filterCard}>
          <SearchInput
            value={search}
            onChangeText={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="搜尋岩場名稱、slug 或地點..."
            style={styles.searchInput}
          />
          <Select
            value={region}
            onValueChange={(value) => {
              setRegion(value)
              setPage(1)
            }}
            title="區域"
            options={regionOptions}
          />
        </View>

        {isLoading && crags.length === 0 ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : error ? (
          <EmptyState
            icon={Activity}
            title="無法載入岩場資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <View style={styles.cragList}>
            {crags.map((item) => (
              <CragCard
                key={item.id}
                crag={item}
                busy={updateCounts.isPending || deleteCrag.isPending}
                onEdit={handleEdit}
                onDelete={handleDeleteCrag}
                onManage={(crag) =>
                  router.push({
                    pathname: '/admin/crags/[cragId]',
                    params: { cragId: crag.id, name: crag.name },
                  } as never)
                }
                onUpdateCounts={handleUpdateCounts}
              />
            ))}
            {crags.length === 0 && (
              <EmptyState
                icon={Search}
                title="沒有找到符合條件的岩場"
                description="請調整搜尋或區域篩選。"
                style={styles.stateCard}
              />
            )}
          </View>
        )}

        <View style={styles.pagination}>
          <Text variant="caption" color="textSubtle">
            共 {total} 個岩場，第 {page} / {totalPages} 頁
          </Text>
          <View style={styles.pageButtons}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onPress={() => setPage((current) => Math.max(1, current - 1))}
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              size="sm"
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

function CragCard({
  crag,
  busy,
  onEdit,
  onDelete,
  onManage,
  onUpdateCounts,
}: {
  crag: AdminCrag
  busy: boolean
  onEdit: (crag: AdminCrag) => void
  onDelete: (crag: AdminCrag) => void
  onManage: (crag: AdminCrag) => void
  onUpdateCounts: (crag: AdminCrag) => void
}) {
  return (
    <View style={styles.cragCard}>
      <View style={styles.cragHeader}>
        {crag.cover_image ? (
          <Image source={{ uri: crag.cover_image }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverFallback}>
            <Mountain size={22} color={SEMANTIC_COLORS.textMuted} />
          </View>
        )}
        <View style={styles.cragTitle}>
          <View style={styles.titleRow}>
            <Text variant="bodyBold" numberOfLines={1} style={styles.titleText}>
              {crag.name}
            </Text>
            {crag.is_featured ? (
              <View style={styles.featuredPill}>
                <Star size={12} color="#A16207" />
                <Text variant="caption" style={styles.featuredText}>
                  精選
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="textSubtle" numberOfLines={1}>
            {crag.slug}
          </Text>
        </View>
      </View>

      <View style={styles.metaRows}>
        <MetaRow
          icon={<MapPin size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="地點"
          value={[crag.region, crag.location].filter(Boolean).join(' / ') || '未設定'}
        />
        <MetaRow
          icon={<Mountain size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="岩質"
          value={crag.rock_type || '未設定'}
        />
        <MetaRow
          icon={<Calendar size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="更新"
          value={new Date(crag.updated_at).toLocaleDateString('zh-TW')}
        />
      </View>

      <View style={styles.countRow}>
        <CountBadge label="路線" value={crag.route_count} />
        <CountBadge label="Bolts" value={crag.bolt_count} />
        <CountBadge label="評分" value={Number(crag.rating_avg || 0).toFixed(1)} />
        <CountBadge label="評論" value={crag.review_count} />
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Edit}
          disabled={busy}
          onPress={() => onEdit(crag)}
        >
          編輯
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={ChevronRight}
          disabled={busy}
          onPress={() => onManage(crag)}
        >
          結構
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={RefreshCw}
          loading={busy}
          disabled={busy}
          onPress={() => onUpdateCounts(crag)}
        >
          重算
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Trash2}
          disabled={busy}
          onPress={() => onDelete(crag)}
        >
          刪除
        </Button>
      </View>
    </View>
  )
}

function CragForm({
  form,
  setForm,
  editing,
  saving,
  onCancel,
  onSave,
}: {
  form: CragFormState
  setForm: React.Dispatch<React.SetStateAction<CragFormState>>
  editing: boolean
  saving: boolean
  onCancel: () => void
  onSave: () => void
}) {
  const updateField = <K extends keyof CragFormState>(key: K, value: CragFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <View style={styles.formCard}>
      <Text variant="h4" fontWeight="700">
        {editing ? '編輯岩場' : '新增岩場'}
      </Text>

      <FormInput
        label="名稱"
        value={form.name}
        onChangeText={(value) => updateField('name', value)}
        placeholder="岩場名稱"
      />
      {!editing && (
        <FormInput
          label="Slug"
          value={form.slug}
          onChangeText={(value) => updateField('slug', value)}
          placeholder="可留空由系統產生"
          autoCapitalize="none"
        />
      )}
      <FormInput
        label="描述"
        value={form.description}
        onChangeText={(value) => updateField('description', value)}
        placeholder="岩場介紹"
        multiline
        style={styles.textarea}
      />
      <View style={styles.coordinateRow}>
        <FormInput
          label="區域"
          value={form.region}
          onChangeText={(value) => updateField('region', value)}
          placeholder="北部"
          style={styles.coordinateInput}
        />
        <FormInput
          label="地點"
          value={form.location}
          onChangeText={(value) => updateField('location', value)}
          placeholder="城市或地址"
          style={styles.coordinateInput}
        />
      </View>
      <View style={styles.coordinateRow}>
        <FormInput
          label="緯度"
          value={form.latitude}
          onChangeText={(value) => updateField('latitude', value)}
          keyboardType="decimal-pad"
          style={styles.coordinateInput}
        />
        <FormInput
          label="經度"
          value={form.longitude}
          onChangeText={(value) => updateField('longitude', value)}
          keyboardType="decimal-pad"
          style={styles.coordinateInput}
        />
        <FormInput
          label="海拔"
          value={form.altitude}
          onChangeText={(value) => updateField('altitude', value)}
          keyboardType="number-pad"
          style={styles.coordinateInput}
        />
      </View>
      <View style={styles.coordinateRow}>
        <FormInput
          label="岩質"
          value={form.rockType}
          onChangeText={(value) => updateField('rockType', value)}
          placeholder="砂岩 / 石灰岩"
          style={styles.coordinateInput}
        />
        <FormInput
          label="難度範圍"
          value={form.difficultyRange}
          onChangeText={(value) => updateField('difficultyRange', value)}
          placeholder="5.8 - 5.13"
          style={styles.coordinateInput}
        />
      </View>
      <FormInput
        label="攀登類型"
        value={form.climbingTypes}
        onChangeText={(value) => updateField('climbingTypes', value)}
        placeholder="sport, trad, bouldering"
      />
      <FormInput
        label="最佳季節"
        value={form.bestSeasons}
        onChangeText={(value) => updateField('bestSeasons', value)}
        placeholder="春, 秋"
      />
      <FormInput
        label="交通資訊"
        value={form.accessInfo}
        onChangeText={(value) => updateField('accessInfo', value)}
        multiline
        style={styles.textarea}
      />
      <FormInput
        label="停車資訊"
        value={form.parkingInfo}
        onChangeText={(value) => updateField('parkingInfo', value)}
        multiline
        style={styles.textarea}
      />
      <View style={styles.coordinateRow}>
        <FormInput
          label="接近時間（分鐘）"
          value={form.approachTime}
          onChangeText={(value) => updateField('approachTime', value)}
          keyboardType="number-pad"
          style={styles.coordinateInput}
        />
        <View style={[styles.switchRow, styles.coordinateInput]}>
          <Text variant="bodyBold">精選岩場</Text>
          <Switch
            value={form.isFeatured}
            onValueChange={(value) => updateField('isFeatured', value)}
          />
        </View>
      </View>
      <FormInput
        label="限制事項"
        value={form.restrictions}
        onChangeText={(value) => updateField('restrictions', value)}
        multiline
        style={styles.textarea}
      />

      <View style={styles.formActions}>
        <Button variant="outline" onPress={onCancel} disabled={saving}>
          取消
        </Button>
        <Button variant="primary" leftIcon={Save} onPress={onSave} loading={saving}>
          儲存
        </Button>
      </View>
    </View>
  )
}

function BatchImportForm({
  value,
  skipExisting,
  importing,
  onChangeText,
  onSkipExistingChange,
  onCancel,
  onImport,
}: {
  value: string
  skipExisting: boolean
  importing: boolean
  onChangeText: (value: string) => void
  onSkipExistingChange: (value: boolean) => void
  onCancel: () => void
  onImport: () => void
}) {
  return (
    <View style={styles.formCard}>
      <Text variant="h4" fontWeight="700">
        批量匯入岩場
      </Text>
      <Text variant="caption" color="textSubtle">
        請貼上岩場 JSON 陣列，欄位使用 API 的 snake_case 格式。
      </Text>
      <FormInput
        label="JSON"
        value={value}
        onChangeText={onChangeText}
        placeholder='[{"name":"新岩場","slug":"new-crag","region":"北部"}]'
        multiline
        autoCapitalize="none"
        style={styles.importTextarea}
      />
      <View style={styles.switchRow}>
        <Text variant="bodyBold">略過既有岩場</Text>
        <Switch value={skipExisting} onValueChange={onSkipExistingChange} />
      </View>
      <View style={styles.formActions}>
        <Button variant="outline" onPress={onCancel} disabled={importing}>
          取消
        </Button>
        <Button variant="primary" leftIcon={Plus} onPress={onImport} loading={importing}>
          匯入
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
  keyboardType,
  multiline,
  autoCapitalize,
  style,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  keyboardType?: TextInputProps['keyboardType']
  multiline?: boolean
  autoCapitalize?: TextInputProps['autoCapitalize']
  style?: ViewStyle
}) {
  return (
    <View style={[styles.formField, style]}>
      <Text variant="caption" color="textSubtle" fontWeight="600">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SEMANTIC_COLORS.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.textareaInput]}
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
  addButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
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
  searchInput: {
    marginBottom: 0,
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
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: WB_COLORS[30],
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  textarea: {
    minHeight: 96,
  },
  importTextarea: {
    minHeight: 180,
  },
  textareaInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  coordinateInput: {
    flex: 1,
  },
  switchRow: {
    minHeight: 68,
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: WB_COLORS[30],
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
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
  cragList: {
    gap: SPACING.md,
  },
  cragCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cragHeader: {
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
  cragTitle: {
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
    flexWrap: 'wrap',
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
