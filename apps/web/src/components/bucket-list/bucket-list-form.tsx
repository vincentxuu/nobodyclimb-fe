'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  type BucketListItemInputSchema,
  bucketListItemInputSchema,
} from '@/lib/schemas/bucket-list'
import { BUCKET_LIST_CATEGORIES, type BucketListItem, type Milestone } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BucketListFormProps {
  item?: BucketListItem | null
  onSubmit: (data: BucketListItemInputSchema) => void // eslint-disable-line no-unused-vars
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

/**
 * 人生清單表單組件
 * 用於新增/編輯人生清單項目
 */
export function BucketListForm({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: BucketListFormProps) {
  const t = useTranslations('BucketList')
  const isEditing = !!item

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BucketListItemInputSchema>({
    resolver: zodResolver(bucketListItemInputSchema),
    defaultValues: {
      title: item?.title || '',
      category: item?.category || 'other',
      description: item?.description || '',
      target_grade: item?.target_grade || '',
      target_location: item?.target_location || '',
      target_date: item?.target_date || '',
      enable_progress: Boolean(item?.enable_progress),
      progress_mode: item?.progress_mode || null,
      progress: Number(item?.progress) || 0,
      milestones: (item?.milestones || []).map((m) => ({
        ...m,
        completed: Boolean(m.completed),
        percentage: Number(m.percentage),
      })),
      is_public: item?.is_public !== undefined ? Boolean(item.is_public) : true,
    },
  })

  const enableProgress = watch('enable_progress')
  const progressMode = watch('progress_mode')
  const milestones = watch('milestones') || []
  const category = watch('category')

  // 新增里程碑
  const addMilestone = () => {
    const currentMilestones = milestones || []
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: t('milestoneDefaultTitle', { index: currentMilestones.length + 1 }),
      percentage: Math.min(100, (currentMilestones.length + 1) * 20),
      completed: false,
      completed_at: null,
      note: null,
    }
    setValue('milestones', [...currentMilestones, newMilestone])
  }

  // 刪除里程碑
  const removeMilestone = (id: string) => {
    setValue(
      'milestones',
      (milestones || []).filter((m) => m.id !== id)
    )
  }

  // 更新里程碑
  const updateMilestone = (id: string, field: keyof Milestone, value: unknown) => {
    setValue(
      'milestones',
      (milestones || []).map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {/* 基本資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#1B1A1A]">
          {isEditing ? t('editGoal') : t('addGoal')}
        </h3>

        {/* 目標標題 */}
        <div>
          <Label htmlFor="title">{t('titleLabel')}</Label>
          <Input
            id="title"
            placeholder={t('titlePlaceholder')}
            {...register('title')}
            className="mt-1"
            state={errors.title ? 'error' : 'default'}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
        </div>

        {/* 分類 */}
        <div>
          <Label>{t('categoryLabel')}</Label>
          <Select
            value={category || 'other'}
            onValueChange={(value) =>
              setValue('category', value as BucketListItemInputSchema['category'])
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('categoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {BUCKET_LIST_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {t(`categoryLabels.${cat.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 詳細描述 */}
        <div>
          <Label htmlFor="description">{t('descriptionLabel')}</Label>
          <Textarea
            id="description"
            placeholder={t('descriptionPlaceholder')}
            {...register('description')}
            className="mt-1 min-h-[100px]"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* 目標細節 */}
      <div className="space-y-4">
        <h4 className="font-medium text-[#1B1A1A]">{t('goalDetailsSection')}</h4>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* 目標難度 */}
          <div>
            <Label htmlFor="target_grade">{t('targetGradeLabel')}</Label>
            <Input
              id="target_grade"
              placeholder={t('targetGradePlaceholder')}
              {...register('target_grade')}
              className="mt-1"
            />
          </div>

          {/* 目標地點 */}
          <div>
            <Label htmlFor="target_location">{t('targetLocationLabel')}</Label>
            <Input
              id="target_location"
              placeholder={t('targetLocationPlaceholder')}
              {...register('target_location')}
              className="mt-1"
            />
          </div>

          {/* 預計完成日期 */}
          <div>
            <Label htmlFor="target_date">{t('targetDateLabel')}</Label>
            <div className="relative mt-1">
              <input
                id="target_date"
                type="date"
                {...register('target_date')}
                className="w-full rounded-lg border border-[#D3D3D3] bg-white px-3 py-3 text-base text-[#1B1A1A] transition-colors focus:border-[#ffe70c] focus:bg-[#F0F0F0] focus:outline-none sm:py-2 sm:text-sm [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-2"
                style={{
                  minHeight: '48px',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 進度追蹤 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[#1B1A1A]">{t('progressTrackingTitle')}</h4>
            <p className="text-sm text-gray-500">{t('progressTrackingHint')}</p>
          </div>
          <Switch
            checked={enableProgress}
            onCheckedChange={(checked) => {
              setValue('enable_progress', checked)
              if (!checked) {
                setValue('progress_mode', null)
                setValue('progress', 0)
                setValue('milestones', [])
              }
            }}
          />
        </div>

        {enableProgress && (
          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            {/* 進度模式選擇 */}
            <div>
              <Label>{t('trackingMethodLabel')}</Label>
              {errors.progress_mode && (
                <p className="mt-1 text-sm text-red-500">{errors.progress_mode.message}</p>
              )}
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setValue('progress_mode', 'manual')
                    setValue('milestones', [])
                  }}
                  className={cn(
                    'flex-1 rounded-lg border-2 p-3 text-sm transition-colors',
                    progressMode === 'manual'
                      ? 'border-[#1B1A1A] bg-white'
                      : 'border-transparent bg-white hover:border-gray-200'
                  )}
                >
                  <div className="font-medium">{t('manualModeTitle')}</div>
                  <div className="mt-1 text-xs text-gray-500">{t('manualModeHint')}</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('progress_mode', 'milestone')
                    if (!milestones || milestones.length === 0) {
                      // 預設新增 5 個里程碑
                      setValue('milestones', [
                        {
                          id: '1',
                          title: t('milestoneDefaultTitle', { index: 1 }),
                          percentage: 20,
                          completed: false,
                          completed_at: null,
                          note: null,
                        },
                        {
                          id: '2',
                          title: t('milestoneDefaultTitle', { index: 2 }),
                          percentage: 40,
                          completed: false,
                          completed_at: null,
                          note: null,
                        },
                        {
                          id: '3',
                          title: t('milestoneDefaultTitle', { index: 3 }),
                          percentage: 60,
                          completed: false,
                          completed_at: null,
                          note: null,
                        },
                        {
                          id: '4',
                          title: t('milestoneDefaultTitle', { index: 4 }),
                          percentage: 80,
                          completed: false,
                          completed_at: null,
                          note: null,
                        },
                        {
                          id: '5',
                          title: t('milestoneGoalTitle'),
                          percentage: 100,
                          completed: false,
                          completed_at: null,
                          note: null,
                        },
                      ])
                    }
                  }}
                  className={cn(
                    'flex-1 rounded-lg border-2 p-3 text-sm transition-colors',
                    progressMode === 'milestone'
                      ? 'border-[#1B1A1A] bg-white'
                      : 'border-transparent bg-white hover:border-gray-200'
                  )}
                >
                  <div className="font-medium">{t('milestoneModeTitle')}</div>
                  <div className="mt-1 text-xs text-gray-500">{t('milestoneModeHint')}</div>
                </button>
              </div>
            </div>

            {/* 手動進度 */}
            {progressMode === 'manual' && (
              <div>
                <Label htmlFor="progress">
                  {t('currentProgress', { progress: watch('progress') })}
                </Label>
                <input
                  type="range"
                  id="progress"
                  min="0"
                  max="100"
                  {...register('progress', { valueAsNumber: true })}
                  className="mt-2 w-full"
                />
              </div>
            )}

            {/* 里程碑編輯 */}
            {progressMode === 'milestone' && (
              <div className="space-y-3">
                <Label>{t('milestoneSettingsLabel')}</Label>
                {errors.milestones && (
                  <p className="text-sm text-red-500">{errors.milestones.message}</p>
                )}
                {(milestones || []).map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center gap-2">
                    <span className="w-8 text-sm text-gray-500">{index + 1}.</span>
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                      placeholder={t('milestoneNamePlaceholder')}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={milestone.percentage}
                      onChange={(e) =>
                        updateMilestone(milestone.id, 'percentage', parseInt(e.target.value, 10))
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">%</span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(milestone.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addMilestone}
                  className="mt-2"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t('addMilestone')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 公開設定 */}
      <div className="flex items-center justify-between">
        <div>
          <Label>{t('publicGoalLabel')}</Label>
          <p className="text-sm text-gray-500">{t('publicGoalHint')}</p>
        </div>
        <Switch
          checked={watch('is_public')}
          onCheckedChange={(checked) => setValue('is_public', checked)}
        />
      </div>

      {/* 表單錯誤提示 */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{t('fixErrorsBelow')}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
            {Object.entries(errors).map(([key, error]) => {
              if (error && 'message' in error && error.message) {
                return <li key={key}>{error.message as string}</li>
              }
              return null
            })}
          </ul>
        </div>
      )}

      {/* 按鈕 */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('saving') : isEditing ? t('saveChanges') : t('addGoal')}
        </Button>
      </div>
    </form>
  )
}

/**
 * 快速新增表單（簡化版）
 */
export function QuickAddForm({
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: {
  onSubmit: (title: string) => void // eslint-disable-line no-unused-vars
  onCancel: () => void
  isLoading?: boolean
  className?: string
}) {
  const t = useTranslations('BucketList')
  const [title, setTitle] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit(title.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex items-center gap-2', className)}>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('quickAddPlaceholder')}
        className="flex-1"
        autoFocus
      />
      <Button type="submit" disabled={!title.trim() || isLoading}>
        {isLoading ? t('adding') : t('add')}
      </Button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </button>
    </form>
  )
}
