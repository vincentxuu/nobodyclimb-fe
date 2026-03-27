import React, { useState, useEffect } from 'react'
import {
  Modal, View, Text, TextInput, Pressable,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS, FONT_SIZE, WB_COLORS } from '@nobodyclimb/constants'
import { AscentTypeSelect } from './AscentTypeSelect'
import type { AscentType } from '@/lib/constants/ascent'

interface AscentFormData {
  ascent_type: AscentType
  date: string
  attempts: number
  rating: number
  notes: string
}

interface AscentFormProps {
  visible: boolean
  ascent: {
    id: string
    ascent_type: AscentType
    date: string
    attempts?: number
    rating?: number
    notes?: string
    route_name: string
    crag_name: string
    grade: string
  }
  onSubmit: (data: AscentFormData) => void
  onClose: () => void
  loading: boolean
}

export function AscentForm({ visible, ascent, onSubmit, onClose, loading }: AscentFormProps) {
  const [form, setForm] = useState<AscentFormData>({
    ascent_type: ascent.ascent_type,
    date: ascent.date,
    attempts: ascent.attempts ?? 1,
    rating: ascent.rating ?? 0,
    notes: ascent.notes ?? '',
  })

  useEffect(() => {
    if (visible) {
      setForm({
        ascent_type: ascent.ascent_type,
        date: ascent.date,
        attempts: ascent.attempts ?? 1,
        rating: ascent.rating ?? 0,
        notes: ascent.notes ?? '',
      })
    }
  }, [visible, ascent])

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
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
            <Text style={styles.routeMeta}>{ascent.crag_name} · {ascent.grade}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>類型</Text>
            <AscentTypeSelect
              value={form.ascent_type}
              onChange={(t) => setForm((f) => ({ ...f, ascent_type: t }))}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>嘗試次數</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(form.attempts)}
              onChangeText={(v) => setForm((f) => ({ ...f, attempts: Number(v) || 1 }))}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>評分</Text>
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Pressable key={i} onPress={() => setForm((f) => ({ ...f, rating: i + 1 }))}>
                  <Text style={{ fontSize: 24, color: i < form.rating ? '#F59E0B' : SEMANTIC_COLORS.border }}>
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>備註</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={4}
              value={form.notes}
              onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              placeholder="記錄這次攀登的感受..."
              placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Pressable
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={() => onSubmit(form)}
            disabled={loading}
          >
            {loading && <ActivityIndicator size="small" color={WB_COLORS[0]} style={styles.spinner} />}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: SEMANTIC_COLORS.border,
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
    borderWidth: 1, borderColor: SEMANTIC_COLORS.border, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    color: SEMANTIC_COLORS.textMain, fontSize: FONT_SIZE.base,
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  ratingRow: { flexDirection: 'row', gap: SPACING.xs },
  footer: {
    flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md,
    borderTopWidth: 1, borderTopColor: SEMANTIC_COLORS.border,
  },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.sm, padding: SPACING.sm, alignItems: 'center',
  },
  cancelText: { color: SEMANTIC_COLORS.textMain, fontSize: FONT_SIZE.base },
  saveBtn: {
    flex: 2, flexDirection: 'row', backgroundColor: '#10B981',
    borderRadius: RADIUS.sm, padding: SPACING.sm, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  spinner: { marginRight: SPACING.xs },
  saveText: { color: WB_COLORS[0], fontWeight: '700', fontSize: FONT_SIZE.base },
})
