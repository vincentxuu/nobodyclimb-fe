import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, WB_COLORS } from '@nobodyclimb/constants'
import { AscentTypeSelect } from './AscentTypeSelect'
import type { AscentType } from '@/lib/constants/ascent'
import { useDebounce } from '@/lib/hooks/useDebounce'

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

const STEPS: Step[] = ['crag', 'route', 'form']

export function CreateAscentFlow({ onSuccess, onCancel }: CreateAscentFlowProps) {
  const [step, setStep] = useState<Step>('crag')
  const [cragQuery, setCragQuery] = useState('')
  const [selectedCrag, setSelectedCrag] = useState<CragResult | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null)
  const [ascentType, setAscentType] = useState<AscentType>('redpoint')

  const debouncedCragQuery = useDebounce(cragQuery, 300)

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
      const { data } = await apiClient.get(`/crags/${selectedCrag!.id}/routes?limit=50`)
      return data.data.routes ?? []
    },
    enabled: !!selectedCrag,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/ascents', {
        route_id: selectedRoute!.id,
        ascent_type: ascentType,
        date: new Date().toISOString().slice(0, 10),
      })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ascents'] })
      onSuccess()
    },
    onError: () => {
      // Error silently handled - parent component can show toast
    },
  })

  const stepIndex = STEPS.indexOf(step)

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
          {routesQuery.isLoading && <ActivityIndicator color={SEMANTIC_COLORS.textSubtle} />}
          <FlatList
            data={routesQuery.data ?? []}
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
          />
          <Pressable style={styles.backBtn} onPress={() => setStep('crag')}>
            <Text style={styles.backText}>← 返回</Text>
          </Pressable>
        </View>
      )}

      {step === 'form' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{selectedRoute?.name}</Text>
          <Text style={styles.stepSub}>{selectedCrag?.name} · {selectedRoute?.grade}</Text>
          <AscentTypeSelect value={ascentType} onChange={setAscentType} />
          {createMutation.isPending && <ActivityIndicator color={SEMANTIC_COLORS.success} />}
          <Pressable
            style={styles.saveBtn}
            onPress={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            <Text style={styles.saveText}>新增記錄</Text>
          </Pressable>
          <Pressable style={styles.backBtn} onPress={() => setStep('route')}>
            <Text style={styles.backText}>← 返回</Text>
          </Pressable>
        </View>
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
  stepTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  stepSub: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  searchInput: {
    borderWidth: 1, borderColor: SEMANTIC_COLORS.border, borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    color: SEMANTIC_COLORS.textMain, fontSize: FONT_SIZE.base,
  },
  listItem: {
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: SEMANTIC_COLORS.border,
  },
  listItemText: { fontSize: FONT_SIZE.base, color: SEMANTIC_COLORS.textMain },
  listItemSub: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  listItemGrade: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: SEMANTIC_COLORS.success },
  empty: { color: SEMANTIC_COLORS.textSubtle, textAlign: 'center', marginTop: SPACING.lg },
  backBtn: { paddingVertical: SPACING.sm },
  backText: { color: SEMANTIC_COLORS.textSubtle, fontSize: FONT_SIZE.sm },
  saveBtn: {
    backgroundColor: SEMANTIC_COLORS.success, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md, alignItems: 'center',
  },
  saveText: { color: WB_COLORS[100], fontWeight: '700', fontSize: FONT_SIZE.base },
  cancelBtn: { paddingVertical: SPACING.sm, alignItems: 'center' },
  cancelText: { color: SEMANTIC_COLORS.textSubtle, fontSize: FONT_SIZE.sm },
})
