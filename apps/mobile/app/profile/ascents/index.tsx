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
import type { AscentType } from '@/lib/constants/ascent'
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
  crag_name: string
  grade: string
  date: string
  attempts?: number
  rating?: number
  notes?: string
}

interface AscentFormData {
  ascent_type: AscentType
  date: string
  attempts: number
  rating: number
  notes: string
}

const AscentsListSeparator = () => <View style={{ height: SPACING.sm }} />

export default function AscentsPage() {
  const router = useRouter()
  const toast = useToast()
  const [editingAscent, setEditingAscent] = useState<Ascent | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, refetch } = useMyAscents()
  const { data: stats } = useMyAscentStats()
  const updateMutation = useUpdateAscent()
  const deleteMutation = useDeleteAscent()

  const ascents = data?.ascents ?? []

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
          onSuccess: () => setEditingAscent(null),
          onError: () => toast.show({ message: '更新失敗，請稍後再試', variant: 'error' }),
        }
      )
    },
    [editingAscent, updateMutation, toast]
  )

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingId) return
    deleteMutation.mutate(deletingId, {
      onSuccess: () => setDeletingId(null),
      onError: () => toast.show({ message: '刪除失敗，請稍後再試', variant: 'error' }),
    })
  }, [deletingId, deleteMutation, toast])

  const statCards = [
    { label: '總記錄', value: String(stats?.total ?? 0), Icon: Mountain },
    { label: '路線數', value: String(stats?.unique_routes ?? 0), Icon: TrendingUp },
    { label: '岩場數', value: String(stats?.unique_crags ?? 0), Icon: MapPin },
    { label: '最高級', value: stats?.highest_grade ?? '—', Icon: Mountain },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>攀登記錄</Text>
        <Pressable style={styles.filterBtn}>
          <Filter size={20} color={SEMANTIC_COLORS.textSubtle} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={SEMANTIC_COLORS.success} />
      ) : (
        <FlatList
          data={ascents}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              {statCards.map(({ label, value, Icon }) => (
                <View key={label} style={styles.statCard}>
                  <Icon size={16} color={SEMANTIC_COLORS.success} />
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <AscentCard ascent={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          ItemSeparatorComponent={AscentsListSeparator}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Mountain size={48} color={SEMANTIC_COLORS.textSubtle} />
              <Text style={styles.emptyText}>尚無攀登記錄</Text>
              <Text style={styles.emptySubtext}>點擊右下角按鈕新增第一筆記錄</Text>
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
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
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
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl * 2, gap: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle, textAlign: 'center' },
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
