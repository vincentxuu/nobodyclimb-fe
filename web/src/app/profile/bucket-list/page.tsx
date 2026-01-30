'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, Target } from 'lucide-react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

type TabValue = 'all' | 'active' | 'completed' | 'archived'

export default function BucketListPage() {
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
      toast({ title: '目標已新增', variant: 'default' })
    },
    onError: () => {
      toast({ title: '新增失敗，請稍後再試', variant: 'destructive' })
    },
  })

  // 更新項目
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BucketListItemInputSchema> }) =>
      bucketListService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
      setEditingItem(null)
      toast({ title: '目標已更新', variant: 'default' })
    },
    onError: () => {
      toast({ title: '更新失敗，請稍後再試', variant: 'destructive' })
    },
  })

  // 刪除項目
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bucketListService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
      toast({ title: '目標已刪除', variant: 'default' })
    },
    onError: () => {
      toast({ title: '刪除失敗，請稍後再試', variant: 'destructive' })
    },
  })

  // 完成項目
  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BucketListCompleteSchema }) =>
      bucketListService.completeItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
      setCompletingItem(null)
      toast({ title: '恭喜完成目標！', variant: 'default' })
    },
    onError: () => {
      toast({ title: '更新失敗，請稍後再試', variant: 'destructive' })
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
      if (window.confirm(`確定要刪除「${item.title}」嗎？`)) {
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
            title="尚未建立人物誌"
            description="請先建立你的人物誌，才能開始管理人生清單"
            action={
              <Button onClick={() => (window.location.href = '/profile')}>
                建立人物誌
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
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B1A1A]">人生清單</h1>
            <p className="mt-1 text-sm text-gray-500">
              追蹤你的攀岩目標，記錄每一次突破
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />}>
            新增目標
          </Button>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="全部目標" value={stats.total} />
          <StatCard label="進行中" value={stats.active} highlight />
          <StatCard label="已完成" value={stats.completed} />
          <StatCard label="已封存" value={stats.archived} muted />
        </div>

        {/* 分頁和篩選 */}
        <div className="rounded-lg bg-white">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <div className="flex items-center justify-between border-b px-4">
              <TabsList>
                <TabsTrigger value="all">全部 ({stats.total})</TabsTrigger>
                <TabsTrigger value="active">進行中 ({stats.active})</TabsTrigger>
                <TabsTrigger value="completed">已完成 ({stats.completed})</TabsTrigger>
                <TabsTrigger value="archived">已封存 ({stats.archived})</TabsTrigger>
              </TabsList>

              {/* 分類篩選 */}
              <div className="relative hidden sm:block">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as BucketListCategory | 'all')}
                  className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 pr-7 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  <option value="all">全部分類</option>
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
                  title={activeTab === 'all' ? '還沒有任何目標' : `沒有${getTabLabel(activeTab)}的目標`}
                  description="開始設定你的攀岩目標，追蹤每一步進展"
                  action={
                    <Button onClick={() => setShowForm(true)} variant="secondary">
                      新增第一個目標
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => {
                setShowForm(false)
                setEditingItem(null)
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6"
              >
                <BucketListForm
                  item={editingItem}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false)
                    setEditingItem(null)
                  }}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                />
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setCompletingItem(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6"
              >
                <BucketListCompletionForm
                  item={completingItem}
                  onSubmit={handleCompletionSubmit}
                  onCancel={() => setCompletingItem(null)}
                  isLoading={completeMutation.isPending}
                />
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
      className={`rounded-lg p-4 ${
        highlight ? 'bg-[#FAF40A]/20' : muted ? 'bg-gray-100' : 'bg-white'
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-2xl font-bold ${
          highlight ? 'text-[#1B1A1A]' : muted ? 'text-gray-400' : 'text-[#1B1A1A]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

// 分頁標籤文字
function getTabLabel(tab: TabValue): string {
  const labels: Record<TabValue, string> = {
    all: '全部',
    active: '進行中',
    completed: '已完成',
    archived: '已封存',
  }
  return labels[tab]
}
