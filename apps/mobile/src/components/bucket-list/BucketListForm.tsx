/**
 * BucketListForm 組件
 *
 * 心願清單表單，用於新增/編輯心願清單項目
 * 對應 apps/web/src/components/bucket-list/bucket-list-form.tsx
 */
import React, { useState, useCallback } from 'react'
import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import {
  createBucketListSchema,
  BUCKET_LIST_CATEGORIES,
  type CreateBucketListInput,
  type MilestoneInput,
} from '@nobodyclimb/schemas'
import type { BucketListItem, Milestone } from '@nobodyclimb/types'
import { Text } from '../ui/Text'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import { Label } from '../ui/Label'
import { Switch } from '../ui/Switch'
import { Select } from '../ui/Select'

// 分類選項
const categoryOptions = [
  { value: 'outdoor_route', label: '戶外路線' },
  { value: 'indoor_grade', label: '室內難度' },
  { value: 'competition', label: '比賽目標' },
  { value: 'training', label: '訓練目標' },
  { value: 'adventure', label: '冒險挑戰' },
  { value: 'skill', label: '技能學習' },
  { value: 'injury_recovery', label: '受傷復原' },
  { value: 'other', label: '其他' },
]

export interface BucketListFormProps {
  /** 編輯的項目（若為 null 則為新增模式） */
  item?: BucketListItem | null
  /** 提交回調 */
  onSubmit: (data: CreateBucketListInput) => void
  /** 取消回調 */
  onCancel: () => void
  /** 載入中狀態 */
  isLoading?: boolean
}

/**
 * 心願清單表單
 */
export function BucketListForm({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
}: BucketListFormProps) {
  const isEditing = !!item

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBucketListInput>({
    resolver: zodResolver(createBucketListSchema),
    defaultValues: {
      title: item?.title || '',
      category: item?.category || 'other',
      description: item?.description || '',
      target_grade: item?.target_grade || '',
      target_location: item?.target_location || '',
      target_date: item?.target_date || '',
      enable_progress: item?.enable_progress || false,
      progress_mode: item?.progress_mode || null,
      progress: item?.progress || 0,
      milestones: (item?.milestones as MilestoneInput[]) || [],
      is_public: item?.is_public ?? true,
    },
  })

  const enableProgress = watch('enable_progress')
  const progressMode = watch('progress_mode')
  const milestones = watch('milestones') || []
  const category = watch('category')

  // 新增里程碑
  const addMilestone = useCallback(() => {
    const currentMilestones = milestones || []
    const newMilestone: MilestoneInput = {
      id: `milestone-${Date.now()}`,
      title: '',
      percentage: Math.min(100, (currentMilestones.length + 1) * 20),
      completed: false,
      completed_at: null,
      note: null,
    }
    setValue('milestones', [...currentMilestones, newMilestone])
  }, [milestones, setValue])

  // 刪除里程碑
  const removeMilestone = useCallback(
    (id: string) => {
      setValue(
        'milestones',
        (milestones || []).filter((m) => m.id !== id)
      )
    },
    [milestones, setValue]
  )

  // 更新里程碑
  const updateMilestone = useCallback(
    (id: string, field: keyof MilestoneInput, value: unknown) => {
      setValue(
        'milestones',
        (milestones || []).map((m) =>
          m.id === id ? { ...m, [field]: value } : m
        )
      )
    },
    [milestones, setValue]
  )

  // 切換進度模式
  const handleProgressModeChange = useCallback(
    (mode: 'manual' | 'milestone') => {
      setValue('progress_mode', mode)
      if (mode === 'milestone' && (!milestones || milestones.length === 0)) {
        // 預設新增 5 個里程碑
        setValue('milestones', [
          { id: '1', title: '里程碑 1', percentage: 20, completed: false, completed_at: null, note: null },
          { id: '2', title: '里程碑 2', percentage: 40, completed: false, completed_at: null, note: null },
          { id: '3', title: '里程碑 3', percentage: 60, completed: false, completed_at: null, note: null },
          { id: '4', title: '里程碑 4', percentage: 80, completed: false, completed_at: null, note: null },
          { id: '5', title: '達成目標', percentage: 100, completed: false, completed_at: null, note: null },
        ])
      } else if (mode === 'manual') {
        setValue('milestones', [])
      }
    },
    [milestones, setValue]
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 基本資訊 */}
      <View style={styles.section}>
        <Text variant="h4" style={styles.sectionTitle}>
          {isEditing ? '編輯目標' : '新增目標'}
        </Text>

        {/* 目標標題 */}
        <View style={styles.field}>
          <Label required>目標標題</Label>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder="例如：完攀龍洞校門口"
                error={!!errors.title}
              />
            )}
          />
          {errors.title && (
            <Text variant="caption" style={styles.errorText}>
              {errors.title.message}
            </Text>
          )}
        </View>

        {/* 分類 */}
        <View style={styles.field}>
          <Label>分類</Label>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <Select
                options={categoryOptions}
                value={value}
                onValueChange={onChange}
                placeholder="選擇分類"
                title="選擇分類"
              />
            )}
          />
        </View>

        {/* 詳細描述 */}
        <View style={styles.field}>
          <Label>詳細描述</Label>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextArea
                value={value || ''}
                onChangeText={onChange}
                placeholder="描述你想達成的目標..."
                minRows={3}
                error={!!errors.description}
              />
            )}
          />
          {errors.description && (
            <Text variant="caption" style={styles.errorText}>
              {errors.description.message}
            </Text>
          )}
        </View>
      </View>

      {/* 目標細節 */}
      <View style={styles.section}>
        <Text variant="bodyBold" style={styles.sectionTitle}>
          目標細節（選填）
        </Text>

        {/* 目標難度 */}
        <View style={styles.field}>
          <Label>目標難度</Label>
          <Controller
            control={control}
            name="target_grade"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value || ''}
                onChangeText={onChange}
                placeholder="例如：5.12a / V6"
              />
            )}
          />
        </View>

        {/* 目標地點 */}
        <View style={styles.field}>
          <Label>目標地點</Label>
          <Controller
            control={control}
            name="target_location"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value || ''}
                onChangeText={onChange}
                placeholder="例如：龍洞"
              />
            )}
          />
        </View>

        {/* 預計完成日期 */}
        <View style={styles.field}>
          <Label>預計完成日期</Label>
          <Controller
            control={control}
            name="target_date"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value || ''}
                onChangeText={onChange}
                placeholder="例如：2026-06-01"
              />
            )}
          />
        </View>
      </View>

      {/* 進度追蹤 */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text variant="bodyBold">進度追蹤</Text>
            <Text variant="caption" color="textSubtle">
              開啟後可追蹤目標完成進度
            </Text>
          </View>
          <Controller
            control={control}
            name="enable_progress"
            render={({ field: { onChange, value } }) => (
              <Switch
                checked={value}
                onCheckedChange={(checked) => {
                  onChange(checked)
                  if (!checked) {
                    setValue('progress_mode', null)
                    setValue('progress', 0)
                    setValue('milestones', [])
                  }
                }}
              />
            )}
          />
        </View>

        {enableProgress && (
          <View style={styles.progressOptions}>
            {/* 進度模式選擇 */}
            <View style={styles.field}>
              <Label>追蹤方式</Label>
              <View style={styles.modeButtons}>
                <Pressable
                  onPress={() => handleProgressModeChange('manual')}
                  style={[
                    styles.modeButton,
                    progressMode === 'manual' && styles.modeButtonActive,
                  ]}
                >
                  <Text
                    variant="bodyBold"
                    color={progressMode === 'manual' ? 'textMain' : 'textSubtle'}
                  >
                    百分比進度
                  </Text>
                  <Text variant="caption" color="textSubtle">
                    手動調整進度百分比
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleProgressModeChange('milestone')}
                  style={[
                    styles.modeButton,
                    progressMode === 'milestone' && styles.modeButtonActive,
                  ]}
                >
                  <Text
                    variant="bodyBold"
                    color={progressMode === 'milestone' ? 'textMain' : 'textSubtle'}
                  >
                    里程碑模式
                  </Text>
                  <Text variant="caption" color="textSubtle">
                    設定多個階段性目標
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 手動進度滑桿 */}
            {progressMode === 'manual' && (
              <View style={styles.field}>
                <Label>目前進度：{watch('progress')}%</Label>
                {/* TODO: 使用 Slider 組件 */}
                <Controller
                  control={control}
                  name="progress"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={String(value || 0)}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10)
                        if (!isNaN(num) && num >= 0 && num <= 100) {
                          onChange(num)
                        }
                      }}
                      placeholder="0-100"
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
            )}

            {/* 里程碑編輯 */}
            {progressMode === 'milestone' && (
              <View style={styles.field}>
                <Label>里程碑設定</Label>
                <View style={styles.milestoneList}>
                  {(milestones || []).map((milestone, index) => (
                    <View key={milestone.id} style={styles.milestoneRow}>
                      <Text variant="body" color="textSubtle" style={styles.milestoneIndex}>
                        {index + 1}.
                      </Text>
                      <Input
                        value={milestone.title}
                        onChangeText={(text) =>
                          updateMilestone(milestone.id, 'title', text)
                        }
                        placeholder="里程碑名稱"
                        containerStyle={styles.milestoneInput}
                      />
                      <Input
                        value={String(milestone.percentage)}
                        onChangeText={(text) => {
                          const num = parseInt(text, 10)
                          if (!isNaN(num)) {
                            updateMilestone(milestone.id, 'percentage', num)
                          }
                        }}
                        placeholder="0-100"
                        keyboardType="numeric"
                        containerStyle={styles.milestonePercentage}
                      />
                      <Text variant="caption" color="textSubtle">%</Text>
                      <Pressable
                        onPress={() => removeMilestone(milestone.id)}
                        style={styles.milestoneDelete}
                      >
                        <Trash2 size={16} color={SEMANTIC_COLORS.textSubtle} />
                      </Pressable>
                    </View>
                  ))}
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Plus}
                  onPress={addMilestone}
                  style={styles.addMilestoneButton}
                >
                  新增里程碑
                </Button>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 公開設定 */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text variant="bodyBold">公開目標</Text>
            <Text variant="caption" color="textSubtle">
              其他人可以看到這個目標
            </Text>
          </View>
          <Controller
            control={control}
            name="is_public"
            render={({ field: { onChange, value } }) => (
              <Switch checked={value ?? true} onCheckedChange={onChange} />
            )}
          />
        </View>
      </View>

      {/* 按鈕 */}
      <View style={styles.buttons}>
        <Button
          variant="ghost"
          onPress={onCancel}
          disabled={isLoading}
          style={styles.button}
        >
          取消
        </Button>
        <Button
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          style={styles.button}
        >
          {isEditing ? '儲存變更' : '新增目標'}
        </Button>
      </View>
    </ScrollView>
  )
}

/**
 * 快速新增表單
 */
export interface QuickAddFormProps {
  onSubmit: (title: string) => void
  onCancel: () => void
  isLoading?: boolean
}

export function QuickAddForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: QuickAddFormProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = useCallback(() => {
    if (title.trim()) {
      onSubmit(title.trim())
    }
  }, [title, onSubmit])

  return (
    <View style={styles.quickAddContainer}>
      <Input
        value={title}
        onChangeText={setTitle}
        placeholder="輸入目標名稱..."
        containerStyle={styles.quickAddInput}
        autoFocus
      />
      <Button
        variant="primary"
        onPress={handleSubmit}
        disabled={!title.trim()}
        loading={isLoading}
      >
        新增
      </Button>
      <Pressable onPress={onCancel} style={styles.quickAddCancel}>
        <Text variant="body" color="textSubtle">
          取消
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    padding: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAEA',
  },
  sectionTitle: {
    marginBottom: SPACING[4],
  },
  field: {
    marginBottom: SPACING[4],
  },
  errorText: {
    color: '#DC2626',
    marginTop: SPACING[1],
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: SPACING[4],
  },
  progressOptions: {
    marginTop: SPACING[4],
    backgroundColor: '#F9F9F9',
    borderRadius: RADIUS.md,
    padding: SPACING[4],
  },
  modeButtons: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[2],
  },
  modeButton: {
    flex: 1,
    padding: SPACING[3],
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    borderColor: SEMANTIC_COLORS.textMain,
  },
  milestoneList: {
    gap: SPACING[2],
    marginTop: SPACING[2],
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  milestoneIndex: {
    width: 24,
  },
  milestoneInput: {
    flex: 1,
  },
  milestonePercentage: {
    width: 60,
  },
  milestoneDelete: {
    padding: SPACING[1],
  },
  addMilestoneButton: {
    marginTop: SPACING[2],
    alignSelf: 'flex-start',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING[4],
    gap: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: '#EBEAEA',
  },
  button: {
    minWidth: 100,
  },
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
  },
  quickAddInput: {
    flex: 1,
  },
  quickAddCancel: {
    padding: SPACING[2],
  },
})
