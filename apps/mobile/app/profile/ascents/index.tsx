import {
  BORDER_RADIUS,
  FONT_SIZE,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { Filter, MapPin, Mountain, Plus, TrendingUp } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AscentCard } from '@/components/ascent/AscentCard'
import { AscentForm } from '@/components/ascent/AscentForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { ASCENT_TYPE_LABELS, type AscentType } from '@/lib/constants/ascent'
import {
  useDeleteAscent,
  useMyAscentStats,
  useMyAscents,
  useUpdateAscent,
} from '@/lib/hooks/useAscents'

interface Ascent {
  id: string
  ascent_type: AscentType
  route_name: string
  crag_id?: string
  crag_name: string
  grade?: string
  route_grade?: string
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
}

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

const AscentsListSeparator = () => <View style={{ height: SPACING.sm }} />
const PAGE_SIZE = 10

export default function AscentsPage() {
  const router = useRouter()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [ascentTypeFilter, setAscentTypeFilter] = useState<AscentType | 'all'>('all')
  const [cragFilter, setCragFilter] = useState('all')
  const [editingAscent, setEditingAscent] = useState<Ascent | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, isError, refetch } = useMyAscents({
    page,
    limit: PAGE_SIZE,
    ascent_type: ascentTypeFilter !== 'all' ? ascentTypeFilter : undefined,
    crag_id: cragFilter !== 'all' ? cragFilter : undefined,
  })
  const { data: stats, isError: isStatsError } = useMyAscentStats()
  const updateMutation = useUpdateAscent()
  const deleteMutation = useDeleteAscent()

  const ascents: Ascent[] = data?.ascents ?? data?.data ?? []
  const total = data?.total ?? data?.pagination?.total ?? ascents.length
  const totalPages = Math.max(
    1,
    data?.pagination?.total_pages ?? data?.total_pages ?? Math.ceil(total / PAGE_SIZE)
  )

  const crags = Array.from(
    ascents
      .reduce((map, ascent) => {
        if (ascent.crag_id && ascent.crag_name) map.set(ascent.crag_id, ascent.crag_name)
        return map
      }, new Map<string, string>())
      .entries()
  ).map(([id, name]) => ({ id, name }))

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleEdit = useCallback((ascent: Ascent) => setEditingAscent(ascent), [])
  const handleDelete = useCallback((id: string) => setDeletingId(id), [])

  const handleUpdateSubmit = useCallback(
    (formData: AscentFormData) => {
      if (!editingAscent) return
      updateMutation.mutate(
        { id: editingAscent.id, body: formData },
        {
          onSuccess: () => {
            setEditingAscent(null)
            toast.show({ message: '攀登記錄已更新', variant: 'success' })
          },
          onError: () => toast.show({ message: '更新失敗，請稍後再試', variant: 'error' }),
        }
      )
    },
    [editingAscent, updateMutation, toast]
  )

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingId) return
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        setDeletingId(null)
        toast.show({ message: '攀登記錄已刪除', variant: 'success' })
      },
      onError: () => toast.show({ message: '刪除失敗，請稍後再試', variant: 'error' }),
    })
  }, [deletingId, deleteMutation, toast])

  const highestGrade = stats?.highest_grade ?? Object.values(stats?.highest_grades ?? {})[0] ?? '—'
  const statCards = [
    { label: '總記錄', value: String(stats?.total_ascents ?? stats?.total ?? 0), Icon: Mountain },
    { label: '路線數', value: String(stats?.unique_routes ?? 0), Icon: TrendingUp },
    { label: '岩場數', value: String(stats?.unique_crags ?? 0), Icon: MapPin },
    { label: '最高級', value: highestGrade, Icon: Mountain },
  ]

  const handleAscentTypeChange = useCallback((type: AscentType | 'all') => {
    setAscentTypeFilter(type)
    setPage(1)
  }, [])

  const handleCragChange = useCallback((cragId: string) => {
    setCragFilter(cragId)
    setPage(1)
  }, [])

  const handleResetFilters = useCallback(() => {
    setAscentTypeFilter('all')
    setCragFilter('all')
    setPage(1)
  }, [])

  const hasActiveFilters = ascentTypeFilter !== 'all' || cragFilter !== 'all'

  const handleFilterButtonPress = useCallback(() => {
    if (hasActiveFilters) {
      handleResetFilters()
      return
    }
    toast.show({ message: '可在下方篩選攀登類型與岩場', variant: 'info' })
  }, [handleResetFilters, hasActiveFilters, toast])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>攀登記錄</Text>
        <Pressable style={styles.filterBtn} onPress={handleFilterButtonPress}>
          <Filter size={20} color={SEMANTIC_COLORS.textSubtle} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={SEMANTIC_COLORS.success} />
      ) : isError ? (
        <View style={styles.errorState}>
          <Mountain size={48} color={SEMANTIC_COLORS.textSubtle} />
          <Text style={styles.emptyText}>載入攀登記錄失敗</Text>
          <Text style={styles.emptySubtext}>請檢查網路狀態後再試一次</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>重新載入</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={ascents}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.statsRow}>
                {statCards.map(({ label, value, Icon }) => (
                  <View key={label} style={styles.statCard}>
                    <Icon size={16} color={SEMANTIC_COLORS.success} />
                    <Text style={styles.statValue}>{isStatsError ? '—' : value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.filterPanel}>
                <View style={styles.filterHeader}>
                  <View style={styles.filterTitleRow}>
                    <Filter size={16} color={SEMANTIC_COLORS.textSubtle} />
                    <Text style={styles.filterTitle}>篩選</Text>
                  </View>
                  {hasActiveFilters && (
                    <Pressable onPress={handleResetFilters} hitSlop={8}>
                      <Text style={styles.resetText}>重設</Text>
                    </Pressable>
                  )}
                </View>

                <FlatList
                  horizontal
                  data={[
                    { key: 'all' as const, label: '全部類型' },
                    ...(Object.entries(ASCENT_TYPE_LABELS) as Array<[AscentType, string]>).map(
                      ([key, label]) => ({ key, label })
                    ),
                  ]}
                  keyExtractor={(item) => item.key}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChips}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleAscentTypeChange(item.key)}
                      style={[
                        styles.filterChip,
                        ascentTypeFilter === item.key && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          ascentTypeFilter === item.key && styles.filterChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  )}
                />

                {crags.length > 0 && (
                  <FlatList
                    horizontal
                    data={[{ id: 'all', name: '全部岩場' }, ...crags]}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChips}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => handleCragChange(item.id)}
                        style={[
                          styles.filterChip,
                          cragFilter === item.id && styles.filterChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            cragFilter === item.id && styles.filterChipTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    )}
                  />
                )}
              </View>

              {ascents.length > 0 && (
                <View style={styles.resultMeta}>
                  <Text style={styles.resultMetaText}>共 {total} 筆記錄</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <AscentCard ascent={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          ItemSeparatorComponent={AscentsListSeparator}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                  onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  <Text style={styles.pageButtonText}>上一頁</Text>
                </Pressable>
                <Text style={styles.pageText}>
                  {page} / {totalPages}
                </Text>
                <Pressable
                  style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
                  onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  <Text style={styles.pageButtonText}>下一頁</Text>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Mountain size={48} color={SEMANTIC_COLORS.textSubtle} />
              <Text style={styles.emptyText}>尚無攀登記錄</Text>
              <Text style={styles.emptySubtext}>點擊右下角按鈕新增第一筆記錄</Text>
              <Pressable
                style={styles.emptyActionButton}
                onPress={() => router.push('/profile/ascents/create' as any)}
              >
                <Plus size={16} color={WB_COLORS[0]} />
                <Text style={styles.emptyActionText}>新增記錄</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <Pressable
        testID="fab-new-ascent"
        style={styles.fab}
        onPress={() => router.push('/profile/ascents/create' as any)}
      >
        <Plus size={24} color={WB_COLORS[0]} />
      </Pressable>

      {editingAscent && (
        <AscentForm
          visible={!!editingAscent}
          ascent={editingAscent}
          onSubmit={handleUpdateSubmit}
          onClose={() => setEditingAscent(null)}
          loading={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        title="刪除記錄"
        message="確定要刪除這筆攀登記錄嗎？此操作無法復原。"
        confirmLabel="刪除"
        cancelLabel="取消"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </SafeAreaView>
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
  headerTitle: { fontSize: FONT_SIZE['2xl'], fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  filterBtn: { padding: SPACING.xs },
  loader: { marginTop: SPACING.xl },
  listContent: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: 100 },
  listHeader: { gap: SPACING.md },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: {
    flex: 1,
    backgroundColor: WB_COLORS[5],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  statLabel: { fontSize: FONT_SIZE.xs, color: SEMANTIC_COLORS.textSubtle },
  filterPanel: {
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: WB_COLORS[0],
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  filterTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  resetText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: SEMANTIC_COLORS.success },
  filterChips: { gap: SPACING.xs, paddingRight: SPACING.sm },
  filterChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: WB_COLORS[0],
  },
  filterChipActive: {
    borderColor: SEMANTIC_COLORS.success,
    backgroundColor: SEMANTIC_COLORS.success,
  },
  filterChipText: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  filterChipTextActive: { color: WB_COLORS[0], fontWeight: '700' },
  resultMeta: { paddingHorizontal: SPACING.xs },
  resultMetaText: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  pageButton: {
    minWidth: 76,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: WB_COLORS[0],
  },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  pageText: { minWidth: 56, textAlign: 'center', fontSize: FONT_SIZE.sm, color: WB_COLORS[60] },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl * 2, gap: SPACING.sm },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle, textAlign: 'center' },
  retryButton: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: SEMANTIC_COLORS.success,
  },
  retryButtonText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: WB_COLORS[0] },
  emptyActionButton: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: SEMANTIC_COLORS.success,
  },
  emptyActionText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: WB_COLORS[0] },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SEMANTIC_COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
