import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit,
  ExternalLink,
  FolderOpen,
  Layers,
  Plus,
  RefreshCw,
  Route,
  Save,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
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
import { Button, EmptyState, Select, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type AdminArea,
  type AdminAreaPayload,
  type AdminRoute,
  type AdminRoutePayload,
  type AdminSector,
  type AdminSectorPayload,
  type RouteVideoItem,
  useAddAdminRouteVideo,
  useAdminAreas,
  useAdminRoutes,
  useAdminRouteVideos,
  useAdminSectors,
  useBatchImportAdminRoutes,
  useCreateAdminArea,
  useCreateAdminRoute,
  useCreateAdminSector,
  useDeleteAdminArea,
  useDeleteAdminRoute,
  useDeleteAdminSector,
  useRemoveAdminRouteVideo,
  useSearchAdminVideos,
  useUpdateAdminArea,
  useUpdateAdminRoute,
  useUpdateAdminSector,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

const routeTypeOptions = [
  { value: 'sport', label: '運動攀登' },
  { value: 'trad', label: '傳統攀登' },
  { value: 'boulder', label: '抱石' },
  { value: 'mixed', label: '混合' },
]

const gradeSystemOptions = [
  { value: 'yds', label: 'YDS' },
  { value: 'french', label: 'French' },
  { value: 'v-scale', label: 'V-Scale' },
  { value: 'font', label: 'Font' },
]

type AreaFormState = {
  name: string
  nameEn: string
  description: string
}

type SectorFormState = {
  name: string
  nameEn: string
}

type RouteFormState = {
  name: string
  grade: string
  gradeSystem: string
  height: string
  boltCount: string
  routeType: string
  description: string
  firstAscent: string
  areaId: string
  sectorId: string
}

const emptyAreaForm: AreaFormState = { name: '', nameEn: '', description: '' }
const emptySectorForm: SectorFormState = { name: '', nameEn: '' }
const emptyRouteForm: RouteFormState = {
  name: '',
  grade: '',
  gradeSystem: 'yds',
  height: '',
  boltCount: '',
  routeType: 'sport',
  description: '',
  firstAscent: '',
  areaId: '',
  sectorId: '',
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

function areaFormFromArea(area: AdminArea): AreaFormState {
  return {
    name: area.name,
    nameEn: area.name_en ?? '',
    description: area.description ?? '',
  }
}

function sectorFormFromSector(sector: AdminSector): SectorFormState {
  return {
    name: sector.name,
    nameEn: sector.name_en ?? '',
  }
}

function routeFormFromRoute(route: AdminRoute, areaId?: string, sectorId?: string): RouteFormState {
  return {
    name: route.name,
    grade: route.grade ?? '',
    gradeSystem: route.grade_system || 'yds',
    height: route.height?.toString() ?? '',
    boltCount: route.bolt_count?.toString() ?? '',
    routeType: route.route_type || 'sport',
    description: route.description ?? '',
    firstAscent: route.first_ascent ?? '',
    areaId: route.area_id ?? areaId ?? '',
    sectorId: route.sector_id ?? sectorId ?? '',
  }
}

function areaPayloadFromForm(form: AreaFormState): AdminAreaPayload {
  return {
    name: form.name.trim(),
    name_en: nullableText(form.nameEn),
    description: nullableText(form.description),
  }
}

function sectorPayloadFromForm(form: SectorFormState): AdminSectorPayload {
  return {
    name: form.name.trim(),
    name_en: nullableText(form.nameEn),
  }
}

function routePayloadFromForm(form: RouteFormState): AdminRoutePayload {
  return {
    name: form.name.trim(),
    grade: nullableText(form.grade),
    grade_system: form.gradeSystem || 'yds',
    height: nullableNumber(form.height),
    bolt_count: nullableNumber(form.boltCount),
    route_type: form.routeType as AdminRoutePayload['route_type'],
    description: nullableText(form.description),
    first_ascent: nullableText(form.firstAscent),
    area_id: nullableText(form.areaId),
    sector_id: nullableText(form.sectorId),
  }
}

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed

  const match = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&?#\s]{11})/
  )
  return match?.[1] ?? null
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '--:--'
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export default function AdminCragTreeScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ cragId: string; name?: string }>()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [showAreaForm, setShowAreaForm] = useState(false)
  const [showRouteImportForm, setShowRouteImportForm] = useState(false)
  const [areaForm, setAreaForm] = useState<AreaFormState>(emptyAreaForm)
  const [routeImportText, setRouteImportText] = useState('')
  const [skipExistingRoutes, setSkipExistingRoutes] = useState(false)

  const cragId = params.cragId
  const cragName = params.name ? decodeURIComponent(params.name) : '岩場'
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const { data: areas = [], isLoading, error } = useAdminAreas(cragId)
  const createArea = useCreateAdminArea()
  const batchImportRoutes = useBatchImportAdminRoutes()

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-crag-areas', cragId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-crag-routes', cragId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-crag-sectors', cragId] }),
    ])
    setRefreshing(false)
  }, [cragId, queryClient])

  const handleSaveArea = useCallback(async () => {
    if (!areaForm.name.trim()) {
      Alert.alert('缺少區域名稱', '請輸入區域名稱後再儲存。')
      return
    }

    try {
      await createArea.mutateAsync({ cragId, payload: areaPayloadFromForm(areaForm) })
      setAreaForm(emptyAreaForm)
      setShowAreaForm(false)
    } catch (_error) {
      Alert.alert('新增失敗', '請稍後再試，或確認欄位格式是否正確。')
    }
  }, [areaForm, cragId, createArea])

  const handleBatchImportRoutes = useCallback(async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(routeImportText)
    } catch {
      Alert.alert('JSON 格式錯誤', '請輸入路線陣列 JSON。')
      return
    }

    if (!Array.isArray(parsed)) {
      Alert.alert('資料格式錯誤', '批量匯入內容必須是 JSON 陣列。')
      return
    }

    try {
      const result = await batchImportRoutes.mutateAsync({
        cragId,
        routes: parsed as Partial<AdminRoutePayload>[],
        skipExisting: skipExistingRoutes,
      })
      setRouteImportText('')
      setShowRouteImportForm(false)
      Alert.alert(
        '匯入完成',
        `新增 ${result?.imported ?? 0} 筆，略過 ${result?.skipped ?? 0} 筆${
          result?.errors?.length ? `，錯誤 ${result.errors.length} 筆` : ''
        }。`
      )
    } catch (_error) {
      Alert.alert('匯入失敗', '請稍後再試，或確認 JSON 欄位是否符合 API 格式。')
    }
  }, [batchImportRoutes, cragId, routeImportText, skipExistingRoutes])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={FolderOpen}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到岩場管理"
          onAction={() => router.replace('/admin/crags' as never)}
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
          <FolderOpen size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            結構管理
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
            {cragName}
          </Text>
          <Text variant="body" color="textSubtle">
            管理此岩場的區域、岩壁與路線資料。
          </Text>
          <Button
            variant="primary"
            leftIcon={Plus}
            onPress={() => {
              setAreaForm(emptyAreaForm)
              setShowAreaForm(true)
            }}
            style={styles.addButton}
          >
            新增區域
          </Button>
          <Button
            variant="outline"
            leftIcon={Plus}
            onPress={() => setShowRouteImportForm((current) => !current)}
            style={styles.addButton}
          >
            批量匯入路線
          </Button>
        </View>

        {showAreaForm && (
          <AreaForm
            form={areaForm}
            setForm={setAreaForm}
            saving={createArea.isPending}
            title="新增區域"
            onCancel={() => setShowAreaForm(false)}
            onSave={handleSaveArea}
          />
        )}

        {showRouteImportForm && (
          <RouteBatchImportForm
            value={routeImportText}
            skipExisting={skipExistingRoutes}
            importing={batchImportRoutes.isPending}
            onChangeText={setRouteImportText}
            onSkipExistingChange={setSkipExistingRoutes}
            onCancel={() => setShowRouteImportForm(false)}
            onImport={handleBatchImportRoutes}
          />
        )}

        {isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : error ? (
          <EmptyState
            icon={FolderOpen}
            title="無法載入區域資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : areas.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="尚未建立區域"
            description="先新增區域，再建立岩壁與路線。"
            actionLabel="新增區域"
            onAction={() => setShowAreaForm(true)}
            style={styles.stateCard}
          />
        ) : (
          <View style={styles.treeList}>
            {areas.map((area) => (
              <AreaNode key={area.id} cragId={cragId} area={area} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function AreaNode({ cragId, area }: { cragId: string; area: AdminArea }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showSectorForm, setShowSectorForm] = useState(false)
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [form, setForm] = useState<AreaFormState>(() => areaFormFromArea(area))
  const [sectorForm, setSectorForm] = useState<SectorFormState>(emptySectorForm)
  const [routeForm, setRouteForm] = useState<RouteFormState>({
    ...emptyRouteForm,
    areaId: area.id,
  })
  const { data: sectors = [], isLoading: sectorsLoading } = useAdminSectors(cragId, area.id)
  const { data: routeData, isLoading: routesLoading } = useAdminRoutes(cragId, {
    area_id: area.id,
    limit: 100,
  })
  const updateArea = useUpdateAdminArea()
  const deleteArea = useDeleteAdminArea()
  const createSector = useCreateAdminSector()
  const createRoute = useCreateAdminRoute()

  const directRoutes = useMemo(
    () => (routeData?.routes ?? []).filter((route) => !route.sector_id),
    [routeData]
  )

  const saveArea = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('缺少區域名稱', '請輸入區域名稱後再儲存。')
      return
    }

    try {
      await updateArea.mutateAsync({ cragId, areaId: area.id, payload: areaPayloadFromForm(form) })
      setEditing(false)
    } catch (_error) {
      Alert.alert('更新失敗', '請稍後再試，或確認欄位格式是否正確。')
    }
  }, [area.id, cragId, form, updateArea])

  const removeArea = useCallback(() => {
    Alert.alert('刪除區域', `確定要刪除「${area.name}」？這個動作無法復原。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteArea.mutateAsync({ cragId, areaId: area.id })
          } catch (_error) {
            Alert.alert('刪除失敗', '請稍後再試，或確認此區域是否仍有關聯資料。')
          }
        },
      },
    ])
  }, [area.id, area.name, cragId, deleteArea])

  const saveSector = useCallback(async () => {
    if (!sectorForm.name.trim()) {
      Alert.alert('缺少岩壁名稱', '請輸入岩壁名稱後再儲存。')
      return
    }

    try {
      await createSector.mutateAsync({
        cragId,
        areaId: area.id,
        payload: sectorPayloadFromForm(sectorForm),
      })
      setSectorForm(emptySectorForm)
      setShowSectorForm(false)
      setExpanded(true)
    } catch (_error) {
      Alert.alert('新增失敗', '請稍後再試，或確認欄位格式是否正確。')
    }
  }, [area.id, createSector, cragId, sectorForm])

  const saveRoute = useCallback(async () => {
    if (!routeForm.name.trim()) {
      Alert.alert('缺少路線名稱', '請輸入路線名稱後再儲存。')
      return
    }

    try {
      await createRoute.mutateAsync({
        cragId,
        payload: routePayloadFromForm({ ...routeForm, areaId: area.id, sectorId: '' }),
      })
      setRouteForm({ ...emptyRouteForm, areaId: area.id })
      setShowRouteForm(false)
      setExpanded(true)
    } catch (_error) {
      Alert.alert('新增失敗', '請稍後再試，或確認欄位格式是否正確。')
    }
  }, [area.id, createRoute, cragId, routeForm])

  return (
    <View style={styles.nodeCard}>
      <View style={styles.nodeHeader}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={expanded ? ChevronDown : ChevronRight}
          onPress={() => setExpanded((current) => !current)}
          style={styles.iconButton}
        />
        <View style={styles.nodeTitle}>
          <Text variant="bodyBold" numberOfLines={1}>
            {area.name}
          </Text>
          <Text variant="caption" color="textSubtle">
            {area.route_count} 路線 / {area.bolt_count} bolts
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Edit}
          onPress={() => {
            setForm(areaFormFromArea(area))
            setEditing(true)
          }}
        >
          編輯
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Plus}
          onPress={() => {
            setSectorForm(emptySectorForm)
            setShowSectorForm(true)
            setExpanded(true)
          }}
        >
          岩壁
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Plus}
          onPress={() => {
            setRouteForm({ ...emptyRouteForm, areaId: area.id })
            setShowRouteForm(true)
            setExpanded(true)
          }}
        >
          路線
        </Button>
        <Button variant="outline" size="sm" leftIcon={Trash2} onPress={removeArea}>
          刪除
        </Button>
      </View>

      {editing && (
        <AreaForm
          form={form}
          setForm={setForm}
          saving={updateArea.isPending}
          title="編輯區域"
          onCancel={() => setEditing(false)}
          onSave={saveArea}
        />
      )}

      {expanded && (
        <View style={styles.children}>
          {showSectorForm && (
            <SectorForm
              form={sectorForm}
              setForm={setSectorForm}
              saving={createSector.isPending}
              title="新增岩壁"
              onCancel={() => setShowSectorForm(false)}
              onSave={saveSector}
            />
          )}
          {showRouteForm && (
            <RouteForm
              form={routeForm}
              setForm={setRouteForm}
              saving={createRoute.isPending}
              title="新增路線"
              sectors={sectors}
              onCancel={() => setShowRouteForm(false)}
              onSave={saveRoute}
            />
          )}

          {sectorsLoading || routesLoading ? (
            <LoadingSpinner style={styles.childLoading} />
          ) : (
            <>
              {sectors.map((sector) => (
                <SectorNode key={sector.id} cragId={cragId} area={area} sector={sector} />
              ))}
              {directRoutes.map((route) => (
                <RouteNode
                  key={route.id}
                  cragId={cragId}
                  areaId={area.id}
                  sectorId={null}
                  sectors={sectors}
                  route={route}
                />
              ))}
              {sectors.length === 0 && directRoutes.length === 0 && (
                <Text variant="caption" color="textMuted" style={styles.emptyText}>
                  此區域尚無岩壁或路線。
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  )
}

function SectorNode({
  cragId,
  area,
  sector,
}: {
  cragId: string
  area: AdminArea
  sector: AdminSector
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [form, setForm] = useState<SectorFormState>(() => sectorFormFromSector(sector))
  const [routeForm, setRouteForm] = useState<RouteFormState>({
    ...emptyRouteForm,
    areaId: area.id,
    sectorId: sector.id,
  })
  const { data: routeData, isLoading: routesLoading } = useAdminRoutes(cragId, {
    sector_id: sector.id,
    limit: 100,
  })
  const updateSector = useUpdateAdminSector()
  const deleteSector = useDeleteAdminSector()
  const createRoute = useCreateAdminRoute()
  const routes = routeData?.routes ?? []

  const saveSector = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('缺少岩壁名稱', '請輸入岩壁名稱後再儲存。')
      return
    }

    try {
      await updateSector.mutateAsync({
        cragId,
        areaId: area.id,
        sectorId: sector.id,
        payload: sectorPayloadFromForm(form),
      })
      setEditing(false)
    } catch (_error) {
      Alert.alert('更新失敗', '請稍後再試，或確認欄位格式是否正確。')
    }
  }, [area.id, cragId, form, sector.id, updateSector])

  const removeSector = useCallback(() => {
    Alert.alert('刪除岩壁', `確定要刪除「${sector.name}」？這個動作無法復原。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSector.mutateAsync({ cragId, areaId: area.id, sectorId: sector.id })
          } catch (_error) {
            Alert.alert('刪除失敗', '請稍後再試，或確認此岩壁是否仍有關聯資料。')
          }
        },
      },
    ])
  }, [area.id, cragId, deleteSector, sector.id, sector.name])

  const saveRoute = useCallback(async () => {
    if (!routeForm.name.trim()) {
      Alert.alert('缺少路線名稱', '請輸入路線名稱後再儲存。')
      return
    }

    try {
      await createRoute.mutateAsync({
        cragId,
        payload: routePayloadFromForm({ ...routeForm, areaId: area.id, sectorId: sector.id }),
      })
      setRouteForm({ ...emptyRouteForm, areaId: area.id, sectorId: sector.id })
      setShowRouteForm(false)
      setExpanded(true)
    } catch (_error) {
      Alert.alert('新增失敗', '請稍後再試，或確認欄位格式是否正確。')
    }
  }, [area.id, createRoute, cragId, routeForm, sector.id])

  return (
    <View style={styles.sectorCard}>
      <View style={styles.nodeHeader}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={expanded ? ChevronDown : ChevronRight}
          onPress={() => setExpanded((current) => !current)}
          style={styles.iconButton}
        />
        <Layers size={16} color={SEMANTIC_COLORS.textMuted} />
        <View style={styles.nodeTitle}>
          <Text variant="bodyBold" numberOfLines={1}>
            {sector.name}
          </Text>
          <Text variant="caption" color="textSubtle">
            {routes.length} 路線
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Edit}
          onPress={() => {
            setForm(sectorFormFromSector(sector))
            setEditing(true)
          }}
        >
          編輯
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Plus}
          onPress={() => {
            setRouteForm({ ...emptyRouteForm, areaId: area.id, sectorId: sector.id })
            setShowRouteForm(true)
            setExpanded(true)
          }}
        >
          路線
        </Button>
        <Button variant="outline" size="sm" leftIcon={Trash2} onPress={removeSector}>
          刪除
        </Button>
      </View>

      {editing && (
        <SectorForm
          form={form}
          setForm={setForm}
          saving={updateSector.isPending}
          title="編輯岩壁"
          onCancel={() => setEditing(false)}
          onSave={saveSector}
        />
      )}

      {expanded && (
        <View style={styles.children}>
          {showRouteForm && (
            <RouteForm
              form={routeForm}
              setForm={setRouteForm}
              saving={createRoute.isPending}
              title="新增路線"
              sectors={[sector]}
              onCancel={() => setShowRouteForm(false)}
              onSave={saveRoute}
            />
          )}
          {routesLoading ? (
            <LoadingSpinner style={styles.childLoading} />
          ) : routes.length === 0 ? (
            <Text variant="caption" color="textMuted" style={styles.emptyText}>
              此岩壁尚無路線。
            </Text>
          ) : (
            routes.map((route) => (
              <RouteNode
                key={route.id}
                cragId={cragId}
                areaId={area.id}
                sectorId={sector.id}
                sectors={[sector]}
                route={route}
              />
            ))
          )}
        </View>
      )}
    </View>
  )
}

function RouteNode({
  cragId,
  areaId,
  sectorId,
  sectors,
  route,
}: {
  cragId: string
  areaId: string
  sectorId: string | null
  sectors: AdminSector[]
  route: AdminRoute
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<RouteFormState>(() =>
    routeFormFromRoute(route, areaId, sectorId ?? undefined)
  )
  const updateRoute = useUpdateAdminRoute()
  const deleteRoute = useDeleteAdminRoute()

  const saveRoute = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('缺少路線名稱', '請輸入路線名稱後再儲存。')
      return
    }

    try {
      await updateRoute.mutateAsync({
        cragId,
        routeId: route.id,
        payload: routePayloadFromForm(form),
      })
      setEditing(false)
    } catch (_error) {
      Alert.alert('更新失敗', '請稍後再試，或確認欄位格式是否正確。')
    }
  }, [cragId, form, route.id, updateRoute])

  const removeRoute = useCallback(() => {
    Alert.alert('刪除路線', `確定要刪除「${route.name}」？這個動作無法復原。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoute.mutateAsync({ cragId, routeId: route.id })
          } catch (_error) {
            Alert.alert('刪除失敗', '請稍後再試，或確認此路線是否仍有關聯資料。')
          }
        },
      },
    ])
  }, [cragId, deleteRoute, route.id, route.name])

  return (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Route size={16} color={SEMANTIC_COLORS.textMuted} />
        <View style={styles.nodeTitle}>
          <Text variant="bodyBold" numberOfLines={1}>
            {route.name}
          </Text>
          <Text variant="caption" color="textSubtle">
            {[route.grade, route.route_type, route.bolt_count ? `${route.bolt_count} bolts` : null]
              .filter(Boolean)
              .join(' · ') || '未設定路線資訊'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Edit}
          onPress={() => {
            setForm(routeFormFromRoute(route, areaId, sectorId ?? undefined))
            setEditing(true)
          }}
        >
          編輯
        </Button>
        <Button variant="outline" size="sm" leftIcon={Trash2} onPress={removeRoute}>
          刪除
        </Button>
      </View>

      {editing && (
        <RouteForm
          form={form}
          setForm={setForm}
          saving={updateRoute.isPending}
          title="編輯路線"
          cragId={cragId}
          routeId={route.id}
          sectors={sectors}
          onCancel={() => setEditing(false)}
          onSave={saveRoute}
        />
      )}
    </View>
  )
}

function AreaForm({
  form,
  setForm,
  saving,
  title,
  onCancel,
  onSave,
}: {
  form: AreaFormState
  setForm: React.Dispatch<React.SetStateAction<AreaFormState>>
  saving: boolean
  title: string
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <View style={styles.formCard}>
      <Text variant="bodyBold">{title}</Text>
      <FormInput
        label="區域名稱"
        value={form.name}
        onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
        placeholder="例：校門口"
      />
      <FormInput
        label="英文名稱"
        value={form.nameEn}
        onChangeText={(value) => setForm((current) => ({ ...current, nameEn: value }))}
        placeholder="例：School Gate"
        autoCapitalize="words"
      />
      <FormInput
        label="描述"
        value={form.description}
        onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
        multiline
        style={styles.textarea}
      />
      <FormActions saving={saving} onCancel={onCancel} onSave={onSave} />
    </View>
  )
}

function SectorForm({
  form,
  setForm,
  saving,
  title,
  onCancel,
  onSave,
}: {
  form: SectorFormState
  setForm: React.Dispatch<React.SetStateAction<SectorFormState>>
  saving: boolean
  title: string
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <View style={styles.formCard}>
      <Text variant="bodyBold">{title}</Text>
      <FormInput
        label="岩壁名稱"
        value={form.name}
        onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
        placeholder="例：人面岩"
      />
      <FormInput
        label="英文名稱"
        value={form.nameEn}
        onChangeText={(value) => setForm((current) => ({ ...current, nameEn: value }))}
        placeholder="例：Face Rock"
        autoCapitalize="words"
      />
      <FormActions saving={saving} onCancel={onCancel} onSave={onSave} />
    </View>
  )
}

function RouteForm({
  form,
  setForm,
  saving,
  title,
  cragId,
  routeId,
  sectors,
  onCancel,
  onSave,
}: {
  form: RouteFormState
  setForm: React.Dispatch<React.SetStateAction<RouteFormState>>
  saving: boolean
  title: string
  cragId?: string
  routeId?: string
  sectors: AdminSector[]
  onCancel: () => void
  onSave: () => void
}) {
  const sectorOptions = useMemo(
    () => [
      { value: '', label: '不指定岩壁' },
      ...sectors.map((sector) => ({ value: sector.id, label: sector.name })),
    ],
    [sectors]
  )

  return (
    <View style={styles.formCard}>
      <Text variant="bodyBold">{title}</Text>
      <FormInput
        label="路線名稱"
        value={form.name}
        onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
        placeholder="例：勇者之路"
      />
      <View style={styles.row}>
        <FormInput
          label="難度"
          value={form.grade}
          onChangeText={(value) => setForm((current) => ({ ...current, grade: value }))}
          placeholder="5.10a"
          style={styles.rowItem}
        />
        <View style={styles.rowItem}>
          <Text variant="caption" color="textSubtle" fontWeight="600">
            難度系統
          </Text>
          <Select
            value={form.gradeSystem}
            onValueChange={(value) => setForm((current) => ({ ...current, gradeSystem: value }))}
            title="難度系統"
            options={gradeSystemOptions}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text variant="caption" color="textSubtle" fontWeight="600">
            類型
          </Text>
          <Select
            value={form.routeType}
            onValueChange={(value) => setForm((current) => ({ ...current, routeType: value }))}
            title="類型"
            options={routeTypeOptions}
          />
        </View>
        <View style={styles.rowItem}>
          <Text variant="caption" color="textSubtle" fontWeight="600">
            岩壁
          </Text>
          <Select
            value={form.sectorId}
            onValueChange={(value) => setForm((current) => ({ ...current, sectorId: value }))}
            title="岩壁"
            options={sectorOptions}
          />
        </View>
      </View>
      <View style={styles.row}>
        <FormInput
          label="高度 (m)"
          value={form.height}
          onChangeText={(value) => setForm((current) => ({ ...current, height: value }))}
          keyboardType="number-pad"
          style={styles.rowItem}
        />
        <FormInput
          label="Bolt 數"
          value={form.boltCount}
          onChangeText={(value) => setForm((current) => ({ ...current, boltCount: value }))}
          keyboardType="number-pad"
          style={styles.rowItem}
        />
      </View>
      <FormInput
        label="首攀者"
        value={form.firstAscent}
        onChangeText={(value) => setForm((current) => ({ ...current, firstAscent: value }))}
      />
      <FormInput
        label="描述"
        value={form.description}
        onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
        multiline
        style={styles.textarea}
      />
      {cragId && routeId && <RouteVideoManager cragId={cragId} routeId={routeId} />}
      <FormActions saving={saving} onCancel={onCancel} onSave={onSave} />
    </View>
  )
}

function RouteVideoManager({ cragId, routeId }: { cragId: string; routeId: string }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [youtubeInput, setYoutubeInput] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoChannel, setVideoChannel] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const { data: videos = [], isLoading } = useAdminRouteVideos(cragId, routeId)
  const { data: searchResults = [], isFetching: searching } = useSearchAdminVideos(
    submittedSearch,
    10,
    Boolean(submittedSearch)
  )
  const addVideo = useAddAdminRouteVideo()
  const removeVideo = useRemoveAdminRouteVideo()

  const linkedIds = useMemo(() => new Set(videos.map((video) => video.id)), [videos])
  const filteredSearchResults = useMemo(
    () => searchResults.filter((video) => !linkedIds.has(video.id)),
    [linkedIds, searchResults]
  )

  const resetAddForm = useCallback(() => {
    setShowAddForm(false)
    setYoutubeInput('')
    setVideoTitle('')
    setVideoChannel('')
  }, [])

  const resetSearch = useCallback(() => {
    setShowSearch(false)
    setSearchQuery('')
    setSubmittedSearch('')
  }, [])

  const handleAddByUrl = useCallback(async () => {
    const youtubeId = extractYouTubeId(youtubeInput)
    if (!youtubeId) {
      Alert.alert('影片網址無效', '請輸入有效的 YouTube 網址或影片 ID。')
      return
    }

    try {
      await addVideo.mutateAsync({
        cragId,
        routeId,
        payload: {
          youtubeId,
          title: videoTitle.trim() || undefined,
          channel: videoChannel.trim() || undefined,
          thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        },
      })
      resetAddForm()
    } catch (_error) {
      Alert.alert('新增影片失敗', '請稍後再試，或確認影片是否已存在。')
    }
  }, [addVideo, cragId, resetAddForm, routeId, videoChannel, videoTitle, youtubeInput])

  const handleAddFromSearch = useCallback(
    async (video: RouteVideoItem) => {
      const youtubeId = video.youtubeId || video.id
      if (!youtubeId) return

      try {
        await addVideo.mutateAsync({
          cragId,
          routeId,
          payload: {
            youtubeId,
            title: video.title,
            channel: video.channel || undefined,
            channelId: video.channelId || undefined,
            thumbnailUrl: video.thumbnailUrl || undefined,
            duration: video.duration || undefined,
            publishedAt: video.publishedAt || undefined,
            viewCount: video.viewCount || undefined,
          },
        })
        resetSearch()
      } catch (_error) {
        Alert.alert('關聯影片失敗', '請稍後再試，或確認影片是否已關聯。')
      }
    },
    [addVideo, cragId, resetSearch, routeId]
  )

  const handleRemove = useCallback(
    (video: RouteVideoItem) => {
      Alert.alert('移除影片', `確定要移除「${video.title}」？`, [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeVideo.mutateAsync({ cragId, routeId, videoId: video.id })
            } catch (_error) {
              Alert.alert('移除失敗', '請稍後再試。')
            }
          },
        },
      ])
    },
    [cragId, removeVideo, routeId]
  )

  return (
    <View style={styles.videoSection}>
      <View style={styles.videoHeader}>
        <View style={styles.videoTitle}>
          <Video size={16} color={SEMANTIC_COLORS.textMuted} />
          <Text variant="bodyBold">路線影片</Text>
          <Text variant="caption" color="textSubtle">
            ({videos.length})
          </Text>
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner style={styles.childLoading} />
      ) : videos.length === 0 ? (
        <Text variant="caption" color="textMuted" style={styles.emptyText}>
          尚無關聯影片。
        </Text>
      ) : (
        <View style={styles.videoList}>
          {videos.map((video) => (
            <VideoRow
              key={video.id}
              video={video}
              removing={removeVideo.isPending}
              onRemove={handleRemove}
            />
          ))}
        </View>
      )}

      {!showAddForm && !showSearch && (
        <View style={styles.actions}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={Plus}
            onPress={() => {
              setShowAddForm(true)
              setShowSearch(false)
            }}
          >
            YouTube 網址
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={Search}
            onPress={() => {
              setShowSearch(true)
              setShowAddForm(false)
            }}
          >
            搜尋已有影片
          </Button>
        </View>
      )}

      {showAddForm && (
        <View style={styles.nestedForm}>
          <View style={styles.formHeader}>
            <Text variant="bodyBold">新增 YouTube 影片</Text>
            <Button variant="ghost" size="sm" leftIcon={X} onPress={resetAddForm} />
          </View>
          <FormInput
            label="YouTube 網址或影片 ID"
            value={youtubeInput}
            onChangeText={setYoutubeInput}
            placeholder="https://www.youtube.com/watch?v=..."
            autoCapitalize="none"
          />
          <View style={styles.row}>
            <FormInput
              label="影片標題"
              value={videoTitle}
              onChangeText={setVideoTitle}
              placeholder="選填"
              style={styles.rowItem}
            />
            <FormInput
              label="頻道名稱"
              value={videoChannel}
              onChangeText={setVideoChannel}
              placeholder="選填"
              style={styles.rowItem}
            />
          </View>
          {extractYouTubeId(youtubeInput) && (
            <Image
              source={{
                uri: `https://i.ytimg.com/vi/${extractYouTubeId(youtubeInput)}/hqdefault.jpg`,
              }}
              style={styles.previewImage}
            />
          )}
          <View style={styles.formActions}>
            <Button
              variant="outline"
              size="sm"
              onPress={resetAddForm}
              disabled={addVideo.isPending}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onPress={handleAddByUrl}
              loading={addVideo.isPending}
              disabled={!youtubeInput.trim()}
            >
              新增
            </Button>
          </View>
        </View>
      )}

      {showSearch && (
        <View style={styles.nestedForm}>
          <View style={styles.formHeader}>
            <Text variant="bodyBold">搜尋已有影片</Text>
            <Button variant="ghost" size="sm" leftIcon={X} onPress={resetSearch} />
          </View>
          <FormInput
            label="搜尋"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="影片標題、頻道名稱或 YouTube ID"
          />
          <View style={styles.formActions}>
            <Button variant="outline" size="sm" onPress={resetSearch}>
              取消
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Search}
              loading={searching}
              disabled={!searchQuery.trim()}
              onPress={() => setSubmittedSearch(searchQuery.trim())}
            >
              搜尋
            </Button>
          </View>
          {filteredSearchResults.length > 0 ? (
            <View style={styles.videoList}>
              {filteredSearchResults.map((video) => (
                <SearchVideoRow
                  key={video.id}
                  video={video}
                  adding={addVideo.isPending}
                  onAdd={handleAddFromSearch}
                />
              ))}
            </View>
          ) : submittedSearch && !searching ? (
            <Text variant="caption" color="textMuted" style={styles.emptyText}>
              沒有找到符合的影片。
            </Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

function VideoRow({
  video,
  removing,
  onRemove,
}: {
  video: RouteVideoItem
  removing: boolean
  onRemove: (video: RouteVideoItem) => void
}) {
  const youtubeUrl = video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : null

  return (
    <View style={styles.videoRow}>
      {video.thumbnailUrl ? (
        <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumb} />
      ) : (
        <View style={styles.videoThumbFallback}>
          <Video size={18} color={SEMANTIC_COLORS.textMuted} />
        </View>
      )}
      <View style={styles.videoInfo}>
        <Text variant="caption" fontWeight="600" numberOfLines={2}>
          {video.title}
        </Text>
        <Text variant="caption" color="textSubtle" numberOfLines={1}>
          {[video.channel, formatDuration(video.duration)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {youtubeUrl && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ExternalLink}
          onPress={() => Linking.openURL(youtubeUrl)}
          style={styles.smallIconButton}
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        leftIcon={Trash2}
        onPress={() => onRemove(video)}
        disabled={removing}
        style={styles.smallIconButton}
      />
    </View>
  )
}

function SearchVideoRow({
  video,
  adding,
  onAdd,
}: {
  video: RouteVideoItem
  adding: boolean
  onAdd: (video: RouteVideoItem) => void
}) {
  return (
    <View style={styles.videoRow}>
      {video.thumbnailUrl ? (
        <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumbSmall} />
      ) : (
        <View style={styles.videoThumbSmallFallback}>
          <Video size={14} color={SEMANTIC_COLORS.textMuted} />
        </View>
      )}
      <View style={styles.videoInfo}>
        <Text variant="caption" fontWeight="600" numberOfLines={1}>
          {video.title}
        </Text>
        <Text variant="caption" color="textSubtle" numberOfLines={1}>
          {[video.channel, formatDuration(video.duration)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Button
        variant="outline"
        size="sm"
        leftIcon={Plus}
        onPress={() => onAdd(video)}
        disabled={adding}
      >
        加入
      </Button>
    </View>
  )
}

function RouteBatchImportForm({
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
        批量匯入路線
      </Text>
      <Text variant="caption" color="textSubtle">
        請貼上路線 JSON 陣列，欄位使用 API 的 snake_case 格式，可包含 area_id 與 sector_id。
      </Text>
      <FormInput
        label="JSON"
        value={value}
        onChangeText={onChangeText}
        placeholder='[{"name":"新路線","grade":"5.10a","route_type":"sport","area_id":"..."}]'
        multiline
        autoCapitalize="none"
        style={styles.importTextarea}
      />
      <View style={styles.switchRow}>
        <Text variant="bodyBold">略過既有路線</Text>
        <Switch value={skipExisting} onValueChange={onSkipExistingChange} />
      </View>
      <View style={styles.formActions}>
        <Button variant="outline" size="sm" onPress={onCancel} disabled={importing}>
          取消
        </Button>
        <Button variant="primary" size="sm" leftIcon={Plus} onPress={onImport} loading={importing}>
          匯入
        </Button>
      </View>
    </View>
  )
}

function FormActions({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <View style={styles.formActions}>
      <Button variant="outline" size="sm" onPress={onCancel} disabled={saving}>
        取消
      </Button>
      <Button variant="primary" size="sm" leftIcon={Save} onPress={onSave} loading={saving}>
        儲存
      </Button>
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
  fullState: {
    flex: 1,
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
  treeList: {
    gap: SPACING.md,
  },
  nodeCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  sectorCard: {
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    backgroundColor: WB_COLORS[10],
  },
  routeCard: {
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconButton: {
    minWidth: 36,
  },
  nodeTitle: {
    flex: 1,
    gap: 3,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  children: {
    gap: SPACING.sm,
    paddingLeft: SPACING.sm,
    borderLeftWidth: 2,
    borderLeftColor: WB_COLORS[20],
  },
  childLoading: {
    paddingVertical: SPACING.md,
  },
  emptyText: {
    paddingVertical: SPACING.sm,
  },
  formCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
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
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rowItem: {
    flex: 1,
    gap: 6,
  },
  switchRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
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
  videoSection: {
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    backgroundColor: WB_COLORS[10],
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoList: {
    gap: SPACING.sm,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  videoThumb: {
    width: 88,
    height: 50,
    borderRadius: RADIUS.sm,
  },
  videoThumbFallback: {
    width: 88,
    height: 50,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[20],
  },
  videoThumbSmall: {
    width: 64,
    height: 36,
    borderRadius: RADIUS.sm,
  },
  videoThumbSmallFallback: {
    width: 64,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[20],
  },
  videoInfo: {
    flex: 1,
    gap: 3,
  },
  smallIconButton: {
    minWidth: 36,
  },
  nestedForm: {
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewImage: {
    width: 160,
    height: 90,
    borderRadius: RADIUS.sm,
    backgroundColor: WB_COLORS[20],
  },
})
