'use client'

import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MountainSnow,
  Route,
  MapPin,
  TrendingUp,
  Filter,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { AscentCard } from '@/components/ascent/AscentCard'
import { AscentForm } from '@/components/ascent/AscentForm'
import { CreateAscentDialog } from '@/components/ascent/CreateAscentDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAscents } from '@/lib/hooks/useAscents'
import { UserRouteAscent, AscentFormData, ASCENT_TYPE_DISPLAY, AscentType } from '@/lib/types/ascent'
import { useToast } from '@/components/ui/use-toast'

const ITEMS_PER_PAGE = 10

export default function AscentsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getMyAscents, getMyStats, createAscent, updateAscent, deleteAscent } = useAscents()

  // 狀態
  const [page, setPage] = useState(1)
  const [ascentTypeFilter, setAscentTypeFilter] = useState<string>('all')
  const [cragFilter, setCragFilter] = useState<string>('all')

  // 新增表單狀態
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // 編輯表單狀態
  const [editingAscent, setEditingAscent] = useState<UserRouteAscent | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  // 刪除確認狀態
  const [deletingAscent, setDeletingAscent] = useState<UserRouteAscent | null>(null)

  // 取得統計數據
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['my-ascents-stats'],
    queryFn: getMyStats,
  })

  // 取得攀爬紀錄
  const { data: ascentsData, isLoading: ascentsLoading } = useQuery({
    queryKey: ['my-ascents', page, ascentTypeFilter, cragFilter],
    queryFn: () =>
      getMyAscents({
        page,
        limit: ITEMS_PER_PAGE,
        ascent_type: ascentTypeFilter !== 'all' ? ascentTypeFilter : undefined,
        crag_id: cragFilter !== 'all' ? cragFilter : undefined,
      }),
  })

  // 新增 mutation
  const createMutation = useMutation({
    mutationFn: createAscent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ascents'] })
      queryClient.invalidateQueries({ queryKey: ['my-ascents-stats'] })
      setIsCreateDialogOpen(false)
      toast({
        title: '新增成功',
        description: '攀爬紀錄已新增',
      })
    },
    onError: () => {
      toast({
        title: '新增失敗',
        description: '無法新增攀爬紀錄，請稍後再試',
        variant: 'destructive',
      })
    },
  })

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AscentFormData> }) =>
      updateAscent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ascents'] })
      queryClient.invalidateQueries({ queryKey: ['my-ascents-stats'] })
      toast({
        title: '更新成功',
        description: '攀爬紀錄已更新',
      })
    },
    onError: () => {
      toast({
        title: '更新失敗',
        description: '無法更新攀爬紀錄，請稍後再試',
        variant: 'destructive',
      })
    },
  })

  // 刪除 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAscent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ascents'] })
      queryClient.invalidateQueries({ queryKey: ['my-ascents-stats'] })
      setDeletingAscent(null)
      toast({
        title: '刪除成功',
        description: '攀爬紀錄已刪除',
      })
    },
    onError: () => {
      toast({
        title: '刪除失敗',
        description: '無法刪除攀爬紀錄，請稍後再試',
        variant: 'destructive',
      })
    },
  })

  // 處理編輯
  const handleEdit = useCallback((ascent: UserRouteAscent) => {
    setEditingAscent(ascent)
    setIsEditFormOpen(true)
  }, [])

  // 處理編輯提交
  const handleEditSubmit = useCallback(
    async (data: AscentFormData) => {
      if (!editingAscent) return
      await updateMutation.mutateAsync({ id: editingAscent.id, data })
      setIsEditFormOpen(false)
      setEditingAscent(null)
    },
    [editingAscent, updateMutation]
  )

  // 處理刪除
  const handleDelete = useCallback((ascent: UserRouteAscent) => {
    setDeletingAscent(ascent)
  }, [])

  // 確認刪除
  const handleConfirmDelete = useCallback(() => {
    if (!deletingAscent) return
    deleteMutation.mutate(deletingAscent.id)
  }, [deletingAscent, deleteMutation])

  // 收集所有岩場作為篩選選項
  const crags = React.useMemo(() => {
    if (!ascentsData?.data) return []
    const cragMap = new Map<string, string>()
    ascentsData.data.forEach((ascent) => {
      if (ascent.crag_id && ascent.crag_name) {
        cragMap.set(ascent.crag_id, ascent.crag_name)
      }
    })
    return Array.from(cragMap.entries()).map(([id, name]) => ({ id, name }))
  }, [ascentsData?.data])

  const ascents = ascentsData?.data ?? []
  const pagination = ascentsData?.pagination
  const totalPages = pagination?.total_pages ?? 1

  // 計算最高難度顯示
  const highestGrade = stats?.highest_grades
    ? Object.values(stats.highest_grades)[0] ?? '-'
    : '-'

  return (
    <ProfilePageLayout>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B1A1A]">攀爬紀錄</h1>
            <p className="mt-1 text-sm text-text-subtle">管理你的所有攀爬紀錄</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增紀錄
          </Button>
        </div>

        {/* 統計摘要卡片 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            icon={<MountainSnow className="h-5 w-5 text-brand-dark" />}
            label="總攀爬次數"
            value={stats?.total_ascents ?? 0}
            color="bg-brand-light"
            isLoading={statsLoading}
          />
          <SummaryCard
            icon={<Route className="h-5 w-5 text-brand-dark" />}
            label="唯一路線數"
            value={stats?.unique_routes ?? 0}
            color="bg-brand-light"
            isLoading={statsLoading}
          />
          <SummaryCard
            icon={<MapPin className="h-5 w-5 text-brand-dark" />}
            label="唯一岩場數"
            value={stats?.unique_crags ?? 0}
            color="bg-brand-accent/20"
            isLoading={statsLoading}
          />
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5 text-brand-dark" />}
            label="最高難度"
            value={highestGrade}
            color="bg-brand-light"
            isLoading={statsLoading}
          />
        </div>

        {/* 篩選區域 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-subtle" />
              <span className="text-sm font-medium text-text-main">篩選</span>
            </div>

            {/* 攀爬類型篩選 */}
            <Select value={ascentTypeFilter} onValueChange={setAscentTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="攀爬類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類型</SelectItem>
                {(Object.keys(ASCENT_TYPE_DISPLAY) as AscentType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {ASCENT_TYPE_DISPLAY[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 岩場篩選 */}
            {crags.length > 0 && (
              <Select value={cragFilter} onValueChange={setCragFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="岩場" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部岩場</SelectItem>
                  {crags.map((crag) => (
                    <SelectItem key={crag.id} value={crag.id}>
                      {crag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* 重設篩選 */}
            {(ascentTypeFilter !== 'all' || cragFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAscentTypeFilter('all')
                  setCragFilter('all')
                  setPage(1)
                }}
              >
                重設
              </Button>
            )}
          </div>
        </motion.div>

        {/* 攀爬紀錄列表 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {ascentsLoading ? (
            <div className="flex items-center justify-center rounded-lg bg-white py-20">
              <LoadingSpinner />
            </div>
          ) : ascents.length === 0 ? (
            <div className="rounded-lg bg-white p-8">
              <EmptyState
                icon={<MountainSnow className="h-12 w-12 text-subtle" />}
                title="尚無攀爬紀錄"
                description="前往路線頁面記錄你的攀爬吧！"
              />
            </div>
          ) : (
            <>
              {ascents.map((ascent) => (
                <div key={ascent.id} className="group relative">
                  <AscentCard ascent={ascent} showUser={false} className="bg-white" />

                  {/* 操作按鈕 */}
                  <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={() => handleEdit(ascent)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/80 text-destructive hover:bg-white hover:text-destructive"
                      onClick={() => handleDelete(ascent)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-text-subtle">
                    第 {page} 頁，共 {totalPages} 頁
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* 編輯表單 */}
      {editingAscent && (
        <AscentForm
          routeId={editingAscent.route_id}
          routeName={editingAscent.route_name ?? ''}
          routeGrade={editingAscent.route_grade}
          open={isEditFormOpen}
          onOpenChange={(open) => {
            setIsEditFormOpen(open)
            if (!open) setEditingAscent(null)
          }}
          onSubmit={handleEditSubmit}
          initialData={{
            route_id: editingAscent.route_id,
            ascent_type: editingAscent.ascent_type,
            ascent_date: editingAscent.ascent_date,
            attempts_count: editingAscent.attempts_count,
            rating: editingAscent.rating,
            perceived_grade: editingAscent.perceived_grade,
            notes: editingAscent.notes,
            photos: editingAscent.photos,
            youtube_url: editingAscent.youtube_url,
            instagram_url: editingAscent.instagram_url,
            is_public: editingAscent.is_public,
          }}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* 刪除確認對話框 */}
      <ConfirmDialog
        isOpen={!!deletingAscent}
        onClose={() => setDeletingAscent(null)}
        onConfirm={handleConfirmDelete}
        title="確認刪除"
        message={`確定要刪除這筆攀爬紀錄嗎？此操作無法復原。${deletingAscent?.route_name ? `\n\n路線：${deletingAscent.route_name}` : ''}`}
        confirmText="確認刪除"
        cancelText="取消"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      {/* 新增攀爬紀錄對話框 */}
      <CreateAscentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={createMutation.mutateAsync}
        isLoading={createMutation.isPending}
      />
    </ProfilePageLayout>
  )
}

// 摘要卡片組件
function SummaryCard({
  icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  isLoading?: boolean
}) {
  return (
    <div className={`rounded-lg ${color} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-sm text-strong">{label}</span>
      </div>
      {isLoading ? (
        <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className="text-2xl font-bold text-text-main">{value}</p>
      )}
    </div>
  )
}
