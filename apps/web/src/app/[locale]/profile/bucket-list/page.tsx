'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, Target } from 'lucide-react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import {
  BucketListItemCard,
  BucketListForm,
  BucketListCompletionForm,
} from '@/components/bucket-list'
import { biographyService, bucketListService } from '@/lib/api/services'
import type { BucketListItem, BucketListCategory } from '@/lib/types'
import { BUCKET_LIST_CATEGORIES } from '@/lib/types'
import type { BucketListItemInputSchema, BucketListCompleteSchema } from '@/lib/schemas/bucket-list'
import { useToast } from '@/components/ui/use-toast'
import { useTranslations } from 'next-intl'

type TabValue = 'all' | 'active' | 'completed' | 'archived'

export default function BucketListPage() {
  const t = useTranslations('ProfilePage')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // 狀態
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null)
  const [completingItem, setCompletingItem] = useState<BucketListItem | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<BucketListCategory | 'all'>('all')

  // 獲取我的人物誌
  const { data: biographyData, isLoading: isBiographyLoading } = useQuery({
    queryKey: ['my-biography'],
    queryFn: () => biographyService.getMyBiography(),
  })

  const biography = biographyData?.data

  // 獲取人生清單
  const { data: bucketListData, isLoading: isBucketListLoading } = useQuery({
    queryKey: ['bucket-list', biography?.id],
    queryFn: () => bucketListService.getBucketList(biography!.id),
    enabled: !!biography?.id,
  })

  // 穩定化 bucketList 引用，避免 useMemo 依賴問題
  const bucketList = useMemo(() => bucketListData?.data ?? [], [bucketListData?.data])

  // 新增項目
  const createMutation = useMutation({
    mutationFn: (data: BucketListItemInputSchema) => bucketListService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
      setShowForm(false)
      toast({ title: t('toastGoalAdded'), variant: 'default' })
    },
    onError: () => {
      toast({ title: t('toastCreateFailedRetry'), variant: 'destructive' })
    },
  })

  // 更新項目
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BucketListItemInputSchema> }) =>
      bucketListService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
      setEditingItem(null)
      toast({ title: t('toastGoalUpdated'), variant: 'default' })
    },
    onError: () => {
      toast({ title: t('toastUpdateFailedRetry'), variant: 'destructive' })
    },
  })

  // 刪除項目
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bucketListService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
      toast({ title: t('toastGoalDeleted'), variant: 'default' })
    },
    onError: () => {
      toast({ title: t('toastDeleteFailedRetry'), variant: 'destructive' })
    },
  })

  // 完成項目
  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BucketListCompleteSchema }) =>
      bucketListService.completeItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
      setCompletingItem(null)
      toast({ title: t('toastGoalCompleted'), variant: 'default' })
    },
    onError: () => {
      toast({ title: t('toastUpdateFailedRetry'), variant: 'destructive' })
    },
  })

  // 更新里程碑
  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, milestoneId, completed }: { id: string; milestoneId: string; completed: boolean }) =>
      bucketListService.updateMilestone(id, milestoneId, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
      toast({ title: t('toastMilestoneUpdated'), variant: 'default' })
    },
    onError: () => {
      toast({ title: t('toastUpdateFailedRetry'), variant: 'destructive' })
    },
  })

  // 篩選人生清單
  const filteredList = useMemo(() => {
    let items = [...bucketList]

    // 按分頁篩選
    if (activeTab !== 'all') {
      items = items.filter((item) => item.status === activeTab)
    }

    // 按分類篩選
    if (categoryFilter !== 'all') {
      items = items.filter((item) => item.category === categoryFilter)
    }

    // 排序：進行中 > 待完成 > 已完成 > 已封存
    const statusOrder = { active: 0, completed: 1, archived: 2 }
    items.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return (a.sort_order || 0) - (b.sort_order || 0)
    })

    return items
  }, [bucketList, activeTab, categoryFilter])

  // 統計數據
  const stats = useMemo(() => {
    return {
      total: bucketList.length,
      active: bucketList.filter((item) => item.status === 'active').length,
      completed: bucketList.filter((item) => item.status === 'completed').length,
      archived: bucketList.filter((item) => item.status === 'archived').length,
    }
  }, [bucketList])

  // 事件處理
  const handleSubmit = useCallback(
    (data: BucketListItemInputSchema) => {
      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data })
      } else {
        createMutation.mutate(data)
      }
    },
    [editingItem, createMutation, updateMutation]
  )

  const handleComplete = useCallback((item: BucketListItem) => {
    setCompletingItem(item)
  }, [])

  const handleEdit = useCallback((item: BucketListItem) => {
    setEditingItem(item)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(
    (item: BucketListItem) => {
      if (window.confirm(t('confirmDeleteGoal', { title: item.title }))) {
        deleteMutation.mutate(item.id)
      }
    },
    [deleteMutation]
  )

  const handleCompletionSubmit = useCallback(
    (data: BucketListCompleteSchema) => {
      if (completingItem) {
        completeMutation.mutate({ id: completingItem.id, data })
      }
    },
    [completingItem, completeMutation]
  )

  const handleMilestoneToggle = useCallback(
    (itemId: string, milestoneId: string, completed: boolean) => {
      updateMilestoneMutation.mutate({ id: itemId, milestoneId, completed })
    },
    [updateMilestoneMutation]
  )

  // 載入中
  if (isBiographyLoading) {
    return (
      <ProfilePageLayout>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </ProfilePageLayout>
    )
  }

  // 未建立人物誌
  if (!biography) {
    return (
      <ProfilePageLayout>
        <div className="rounded-lg bg-white p-8">
          <EmptyState
            icon={<Target className="h-12 w-12 text-gray-400" />}
            title={t('noBiographyTitle')}
            description={t('noBiographyForBucketListDesc')}
            action={
              <Button onClick={() => (window.location.href = '/profile')}>
                {t('createBiography')}
              </Button>
            }
          />
        </div>
      </ProfilePageLayout>
    )
  }

  return (
    <ProfilePageLayout>
      <div className="space-y-6">
        <ProfilePageTitle
          title={t('bucketListTitle')}
          subtitle={t('bucketListSubtitle')}
          action={
            <Button onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />}>
              {t('addGoal')}
            </Button>
          }
        />

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label={t('statAllGoals')} value={stats.total} />
          <StatCard label={t('statActive')} value={stats.active} highlight />
          <StatCard label={t('statCompleted')} value={stats.completed} />
          <StatCard label={t('statArchived')} value={stats.archived} muted />
        </div>

        {/* 分頁和篩選 */}
        <div className="rounded-lg bg-white">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <div className="flex items-center justify-between border-b border-gray-200 px-4">
              <div className="-mb-px flex gap-6">
                <UnderlineTab value="all" activeTab={activeTab} onClick={() => setActiveTab('all')}>
                  {t('tabAllGoals', { count: stats.total })}
                </UnderlineTab>
                <UnderlineTab value="active" activeTab={activeTab} onClick={() => setActiveTab('active')}>
                  {t('tabActiveGoals', { count: stats.active })}
                </UnderlineTab>
                <UnderlineTab value="completed" activeTab={activeTab} onClick={() => setActiveTab('completed')}>
                  {t('tabCompletedGoals', { count: stats.completed })}
                </UnderlineTab>
                <UnderlineTab value="archived" activeTab={activeTab} onClick={() => setActiveTab('archived')}>
                  {t('tabArchivedGoals', { count: stats.archived })}
                </UnderlineTab>
              </div>

              {/* 分類篩選 */}
              <div className="relative hidden sm:block">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as BucketListCategory | 'all')}
                  className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 pr-7 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  <option value="all">{t('allCategories')}</option>
                  {BUCKET_LIST_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <Filter className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <TabsContent value={activeTab} className="p-4">
              {isBucketListLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : filteredList.length === 0 ? (
                <EmptyState
                  icon={<Target className="h-12 w-12 text-gray-400" />}
                  title={activeTab === 'all' ? t('noGoalsYet') : t('noGoalsInTab', { tab: getTabLabel(activeTab, t) })}
                  description={t('noGoalsDesc')}
                  action={
                    <Button onClick={() => setShowForm(true)} variant="secondary">
                      {t('addFirstGoal')}
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredList.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <BucketListItemCard
                          item={item}
                          variant="default"
                          isOwner
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onComplete={handleComplete}
                          onMilestoneToggle={(milestoneId, completed) =>
                            handleMilestoneToggle(item.id, milestoneId, completed)
                          }
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* 新增/編輯表單 Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
              onClick={() => {
                setShowForm(false)
                setEditingItem(null)
              }}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="h-[95vh] sm:h-auto sm:max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-lg bg-white"
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 sm:hidden">
                  <h2 className="text-lg font-semibold">{editingItem ? t('editGoal') : t('addGoal')}</h2>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingItem(null)
                    }}
                    className="rounded-full p-2 hover:bg-gray-100"
                  >
                    <span className="text-xl">&times;</span>
                  </button>
                </div>
                <div className="p-4 pb-24 sm:p-6 sm:pb-6">
                  <BucketListForm
                    item={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                      setShowForm(false)
                      setEditingItem(null)
                    }}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 完成故事表單 Modal */}
        <AnimatePresence>
          {completingItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
              onClick={() => setCompletingItem(null)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="h-[95vh] sm:h-auto sm:max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-lg bg-white"
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 sm:hidden">
                  <h2 className="text-lg font-semibold">{t('completeGoal')}</h2>
                  <button
                    onClick={() => setCompletingItem(null)}
                    className="rounded-full p-2 hover:bg-gray-100"
                  >
                    <span className="text-xl">&times;</span>
                  </button>
                </div>
                <div className="p-4 pb-24 sm:p-6 sm:pb-6">
                  <BucketListCompletionForm
                    item={completingItem}
                    onSubmit={handleCompletionSubmit}
                    onCancel={() => setCompletingItem(null)}
                    isLoading={completeMutation.isPending}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProfilePageLayout>
  )
}

// 統計卡片組件
function StatCard({
  label,
  value,
  highlight,
  muted,
}: {
  label: string
  value: number
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'border-brand-accent/30 bg-brand-accent/5'
          : muted
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-200 bg-white'
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-2xl font-bold ${
          muted ? 'text-gray-400' : 'text-[#1B1A1A]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

// Underline 風格的 Tab 按鈕
function UnderlineTab({
  value,
  activeTab,
  onClick,
  children,
}: {
  value: string
  activeTab: string
  onClick: () => void
  children: React.ReactNode
}) {
  const isActive = activeTab === value
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 py-3 text-sm font-medium transition-colors ${
        isActive
          ? 'border-[#1B1A1A] text-[#1B1A1A]'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

// 分頁標籤文字
function getTabLabel(tab: TabValue, t: (key: string) => string): string {
  const labels: Record<TabValue, string> = {
    all: t('statAllGoals'),
    active: t('statActive'),
    completed: t('statCompleted'),
    archived: t('statArchived'),
  }
  return labels[tab]
}
