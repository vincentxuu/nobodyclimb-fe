import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import type { ClimbingLocationRecord } from '@nobodyclimb/types'
import { Edit2, MapPin, Plus, Trash2 } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native'
import { apiClient } from '@/lib/api'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Text } from '../ui/Text'

interface ClimbingFootprintsSectionProps {
  isEditing: boolean
  isMobile?: boolean
}

interface LocationFormState {
  location: string
  country: string
  visitYear: string
  notes: string
  isPublic: boolean
}

const emptyForm: LocationFormState = {
  location: '',
  country: '台灣',
  visitYear: '',
  notes: '',
  isPublic: true,
}

function extractRecords(raw: unknown): ClimbingLocationRecord[] {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const data = (raw as { data?: unknown }).data
    return Array.isArray(data) ? (data as ClimbingLocationRecord[]) : []
  }
  return Array.isArray(raw) ? (raw as ClimbingLocationRecord[]) : []
}

export default function ClimbingFootprintsSection({ isEditing }: ClimbingFootprintsSectionProps) {
  const [locations, setLocations] = useState<ClimbingLocationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingLocation, setEditingLocation] = useState<ClimbingLocationRecord | null>(null)
  const [form, setForm] = useState<LocationFormState>(emptyForm)

  const loadLocations = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/climbing-locations')
      setLocations(extractRecords(response.data))
    } catch (error) {
      console.error('Failed to load climbing locations:', error)
      Alert.alert('載入失敗', '無法載入攀岩足跡')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  const locationsByCountry = useMemo(() => {
    return locations.reduce<Record<string, ClimbingLocationRecord[]>>((acc, item) => {
      const country = item.country || '未知'
      acc[country] = [...(acc[country] || []), item]
      return acc
    }, {})
  }, [locations])

  const openCreateForm = () => {
    setEditingLocation(null)
    setForm(emptyForm)
    setIsFormVisible(true)
  }

  const openEditForm = (item: ClimbingLocationRecord) => {
    setEditingLocation(item)
    setForm({
      location: item.location,
      country: item.country,
      visitYear: item.visit_year || '',
      notes: item.notes || '',
      isPublic: item.is_public,
    })
    setIsFormVisible(true)
  }

  const closeForm = () => {
    if (isSaving) return
    setIsFormVisible(false)
  }

  const saveLocation = async () => {
    if (!form.location.trim()) {
      Alert.alert('請輸入地點名稱')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        location: form.location.trim(),
        country: form.country.trim() || '未知',
        visit_year: form.visitYear.trim() || null,
        notes: form.notes.trim() || null,
        is_public: form.isPublic,
      }

      if (editingLocation) {
        await apiClient.put(`/climbing-locations/${editingLocation.id}`, payload)
      } else {
        await apiClient.post('/climbing-locations', payload)
      }

      await loadLocations()
      setIsFormVisible(false)
      Alert.alert('已更新', '攀岩足跡已儲存')
    } catch (error) {
      console.error('Failed to save climbing location:', error)
      Alert.alert('儲存失敗', '請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteLocation = (item: ClimbingLocationRecord) => {
    Alert.alert('刪除足跡', `確定要刪除「${item.location}」嗎？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/climbing-locations/${item.id}`)
            await loadLocations()
          } catch (error) {
            console.error('Failed to delete climbing location:', error)
            Alert.alert('刪除失敗', '請稍後再試')
          }
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {locations.length === 0 ? (
        <View style={styles.placeholder}>
          <Icon icon={MapPin} size="lg" color={WB_COLORS[50]} />
          <Text variant="body" style={styles.placeholderTitle}>
            還沒有記錄攀岩足跡
          </Text>
          <Text variant="caption" style={styles.placeholderText}>
            記錄你去過的岩場和攀爬地點
          </Text>
          {isEditing && (
            <Pressable style={styles.addButton} onPress={openCreateForm}>
              <Icon icon={Plus} size="sm" color={SEMANTIC_COLORS.textMain} />
              <Text variant="body" style={styles.addButtonText}>
                新增地點
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          <View style={styles.summaryRow}>
            <Text variant="bodyBold">攀岩足跡</Text>
            <Text variant="caption" color="textSubtle">
              {Object.keys(locationsByCountry).length} 國 · {locations.length} 地點
            </Text>
          </View>

          {Object.entries(locationsByCountry).map(([country, items]) => (
            <View key={country} style={styles.countryGroup}>
              <Text variant="bodyBold" style={styles.countryTitle}>
                {country} ({items.length})
              </Text>
              {items.map((item) => (
                <View key={item.id} style={styles.locationRow}>
                  <View style={styles.locationInfo}>
                    <Text variant="body">{item.location}</Text>
                    <Text variant="caption" color="textSubtle">
                      {[item.visit_year, item.notes].filter(Boolean).join(' · ') || '未填寫備註'}
                    </Text>
                  </View>
                  {isEditing && (
                    <View style={styles.rowActions}>
                      <Pressable style={styles.iconButton} onPress={() => openEditForm(item)}>
                        <Icon icon={Edit2} size="xs" color={SEMANTIC_COLORS.textMain} />
                      </Pressable>
                      <Pressable style={styles.iconButton} onPress={() => deleteLocation(item)}>
                        <Icon icon={Trash2} size="xs" color="#DC2626" />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}

          {isEditing && (
            <Pressable style={styles.addButton} onPress={openCreateForm}>
              <Icon icon={Plus} size="sm" color={SEMANTIC_COLORS.textMain} />
              <Text variant="body" style={styles.addButtonText}>
                新增地點
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <Modal visible={isFormVisible} animationType="slide" onRequestClose={closeForm}>
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text variant="h3" fontWeight="600" style={styles.modalTitle}>
              {editingLocation ? '編輯地點' : '新增地點'}
            </Text>

            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={(location) => setForm((prev) => ({ ...prev, location }))}
              placeholder="地點名稱"
              placeholderTextColor={SEMANTIC_COLORS.textMuted}
            />
            <TextInput
              style={styles.input}
              value={form.country}
              onChangeText={(country) => setForm((prev) => ({ ...prev, country }))}
              placeholder="國家 / 地區"
              placeholderTextColor={SEMANTIC_COLORS.textMuted}
            />
            <TextInput
              style={styles.input}
              value={form.visitYear}
              onChangeText={(visitYear) => setForm((prev) => ({ ...prev, visitYear }))}
              placeholder="造訪年份，例如 2025"
              placeholderTextColor={SEMANTIC_COLORS.textMuted}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={form.notes}
              onChangeText={(notes) => setForm((prev) => ({ ...prev, notes }))}
              placeholder="備註"
              placeholderTextColor={SEMANTIC_COLORS.textMuted}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.switchRow}>
              <Text variant="body">公開顯示</Text>
              <Switch
                value={form.isPublic}
                onValueChange={(isPublic) => setForm((prev) => ({ ...prev, isPublic }))}
              />
            </View>

            <View style={styles.modalActions}>
              <Button variant="ghost" onPress={closeForm} disabled={isSaving} style={styles.button}>
                取消
              </Button>
              <Button
                variant="primary"
                onPress={saveLocation}
                disabled={isSaving}
                style={styles.button}
              >
                <Text fontWeight="600" style={styles.primaryButtonText}>
                  {isSaving ? '儲存中...' : '儲存'}
                </Text>
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  placeholder: {
    padding: 32,
    backgroundColor: WB_COLORS[5],
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    color: SEMANTIC_COLORS.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  placeholderText: {
    color: SEMANTIC_COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    gap: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryGroup: {
    gap: SPACING.xs,
  },
  countryTitle: {
    color: SEMANTIC_COLORS.textMain,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WB_COLORS[5],
    borderRadius: 10,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  locationInfo: {
    flex: 1,
    gap: 2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WB_COLORS[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  addButtonText: {
    color: SEMANTIC_COLORS.textMain,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  modalContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  modalTitle: {
    marginBottom: SPACING.sm,
  },
  input: {
    minHeight: 48,
    backgroundColor: WB_COLORS[0],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    color: SEMANTIC_COLORS.textMain,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 96,
    paddingTop: SPACING.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  button: {
    minWidth: 96,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
})
