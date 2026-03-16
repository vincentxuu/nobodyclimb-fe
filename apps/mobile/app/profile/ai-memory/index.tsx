import React, { useState, useCallback } from 'react'
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, Brain, Trash2 } from 'lucide-react-native'
import { Text, ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { SPACING, WB_COLORS, BORDER_RADIUS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import {
  useAiMemory,
  useDeleteAiMemory,
  type UserMemory,
  type MemoryKey,
  type MemoryType,
} from '@/lib/hooks/useAiMemory'

const KEY_LABELS: Record<MemoryKey, string> = {
  climbing_level: '攀岩程度',
  preferred_region: '偏好地區',
  preferred_style: '偏好類型',
  preferred_crag: '偏好岩場',
  goals: '攀岩目標',
}

const TYPE_CONFIG: Record<MemoryType, { label: string; color: string }> = {
  preference: { label: '偏好', color: SEMANTIC_COLORS.info },
  behavior: { label: '行為', color: SEMANTIC_COLORS.warning },
  fact: { label: '事實', color: SEMANTIC_COLORS.success },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '剛剛'
  if (hours < 24) return `${hours} 小時前`
  return `${Math.floor(hours / 24)} 天前`
}

const ListSeparator = () => <View style={{ height: SPACING.sm }} />

export default function AiMemoryScreen() {
  const router = useRouter()
  const { data: memories, isLoading, isError } = useAiMemory()
  const deleteMemory = useDeleteAiMemory()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const toast = useToast()

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteMemory.mutateAsync(deletingId)
      setDeletingId(null)
      toast.show({ message: '記憶已刪除', variant: 'success' })
    } catch {
      toast.show({ message: '刪除失敗，請稍後再試', variant: 'error' })
    }
  }

  const renderItem = useCallback(({ item }: { item: UserMemory }) => {
    const typeConfig = TYPE_CONFIG[item.memory_type]
    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.keyLabel}>{KEY_LABELS[item.memory_key] ?? item.memory_key}</Text>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20' }]}>
            <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
        </View>
        <Text style={styles.content}>{item.content}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.time}>{relativeTime(item.updated_at)}</Text>
          <Pressable testID="delete-btn" onPress={() => setDeletingId(item.id)} style={styles.deleteBtn}>
            <Trash2 size={16} color={SEMANTIC_COLORS.error} />
          </Pressable>
        </View>
      </View>
    )
  }, [])

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.center} testID="loading-spinner">
          <ActivityIndicator color={SEMANTIC_COLORS.success} />
        </View>
      )
    }
    if (isError) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>載入失敗，請稍後再試</Text>
        </View>
      )
    }
    if (memories && memories.length > 0) {
      return (
        <FlatList
          data={memories}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={ListSeparator}
        />
      )
    }
    return (
      <View style={styles.center}>
        <Brain size={48} color={WB_COLORS[30]} />
        <Text style={styles.emptyText}>AI 會在你提問後自動學習你的偏好，目前尚無記憶</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[80]} />
        </Pressable>
        <Text style={styles.title}>AI 記憶</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderContent()}

      <ConfirmDialog
        open={!!deletingId}
        title="確定刪除此記憶？"
        message="刪除後 AI 將不再記得此資訊。"
        confirmLabel="刪除"
        cancelLabel="取消"
        loading={deleteMemory.isPending}
        destructive
        onConfirm={handleDelete}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.xl,
  },
  list: { padding: SPACING.md },
  item: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  keyLabel: { fontSize: 15, fontWeight: '600', flex: 1, color: SEMANTIC_COLORS.textMain },
  typeBadge: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  typeLabel: { fontSize: 11, fontWeight: '500' },
  content: { fontSize: 14, color: SEMANTIC_COLORS.textSubtle, lineHeight: 22 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, color: SEMANTIC_COLORS.textMuted },
  deleteBtn: { padding: 4 },
  emptyText: { fontSize: 15, color: SEMANTIC_COLORS.textSubtle, textAlign: 'center', lineHeight: 24 },
})
