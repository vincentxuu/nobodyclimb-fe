'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { bucketListItemInputSchema, type BucketListItemInputSchema } from '@/lib/schemas/bucket-list'
import { BUCKET_LIST_CATEGORIES, type BucketListItem, type Milestone } from '@/lib/types'

interface BucketListFormProps {
  item?: BucketListItem | null
  onSubmit: (data: BucketListItemInputSchema) => void
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
      enable_progress: item?.enable_progress || false,
      progress_mode: item?.progress_mode || null,
      progress: item?.progress || 0,
      milestones: item?.milestones || [],
      is_public: item?.is_public ?? true,
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
      title: '',
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
          {isEditing ? '編輯目標' : '新增目標'}
        </h3>

        {/* 目標標題 */}
        <div>
          <Label htmlFor="title">目標標題 *</Label>
          <Input
            id="title"
            placeholder="例如：完攀龍洞校門口"
            {...register('title')}
            className="mt-1"
            state={errors.title ? 'error' : 'default'}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* 分類 */}
        <div>
          <Label>分類</Label>
          <Select
            value={category || 'other'}
            onValueChange={(value) => setValue('category', value as BucketListItemInputSchema['category'])}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="選擇分類" />
            </SelectTrigger>
            <SelectContent>
              {BUCKET_LIST_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 詳細描述 */}
        <div>
          <Label htmlFor="description">詳細描述</Label>
          <Textarea
            id="description"
            placeholder="描述你想達成的目標..."
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
        <h4 className="font-medium text-[#1B1A1A]">目標細節（選填）</h4>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* 目標難度 */}
          <div>
            <Label htmlFor="target_grade">目標難度</Label>
            <Input
              id="target_grade"
              placeholder="例如：5.12a / V6"
              {...register('target_grade')}
              className="mt-1"
            />
          </div>

          {/* 目標地點 */}
          <div>
            <Label htmlFor="target_location">目標地點</Label>
            <Input
              id="target_location"
              placeholder="例如：龍洞"
              {...register('target_location')}
              className="mt-1"
            />
          </div>

          {/* 預計完成日期 */}
          <div>
            <Label htmlFor="target_date">預計完成日期</Label>
            <Input
              id="target_date"
              type="date"
              {...register('target_date')}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* 進度追蹤 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[#1B1A1A]">進度追蹤</h4>
            <p className="text-sm text-gray-500">開啟後可追蹤目標完成進度</p>
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
              <Label>追蹤方式</Label>
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
                  <div className="font-medium">百分比進度</div>
                  <div className="mt-1 text-xs text-gray-500">手動調整進度百分比</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('progress_mode', 'milestone')
                    if (!milestones || milestones.length === 0) {
                      // 預設新增 5 個里程碑
                      setValue('milestones', [
                        { id: '1', title: '里程碑 1', percentage: 20, completed: false, completed_at: null, note: null },
                        { id: '2', title: '里程碑 2', percentage: 40, completed: false, completed_at: null, note: null },
                        { id: '3', title: '里程碑 3', percentage: 60, completed: false, completed_at: null, note: null },
                        { id: '4', title: '里程碑 4', percentage: 80, completed: false, completed_at: null, note: null },
                        { id: '5', title: '達成目標', percentage: 100, completed: false, completed_at: null, note: null },
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
                  <div className="font-medium">里程碑模式</div>
                  <div className="mt-1 text-xs text-gray-500">設定多個階段性目標</div>
                </button>
              </div>
            </div>

            {/* 手動進度 */}
            {progressMode === 'manual' && (
              <div>
                <Label htmlFor="progress">目前進度：{watch('progress')}%</Label>
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
                <Label>里程碑設定</Label>
                {(milestones || []).map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center gap-2">
                    <span className="w-8 text-sm text-gray-500">{index + 1}.</span>
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                      placeholder="里程碑名稱"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={milestone.percentage}
                      onChange={(e) => updateMilestone(milestone.id, 'percentage', parseInt(e.target.value, 10))}
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
                  新增里程碑
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 公開設定 */}
      <div className="flex items-center justify-between">
        <div>
          <Label>公開目標</Label>
          <p className="text-sm text-gray-500">其他人可以看到這個目標</p>
        </div>
        <Switch
          checked={watch('is_public')}
          onCheckedChange={(checked) => setValue('is_public', checked)}
        />
      </div>

      {/* 按鈕 */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '儲存中...' : isEditing ? '儲存變更' : '新增目標'}
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
  onSubmit: (title: string) => void
  onCancel: () => void
  isLoading?: boolean
  className?: string
}) {
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
        placeholder="輸入目標名稱..."
        className="flex-1"
        autoFocus
      />
      <Button type="submit" disabled={!title.trim() || isLoading}>
        {isLoading ? '新增中...' : '新增'}
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
