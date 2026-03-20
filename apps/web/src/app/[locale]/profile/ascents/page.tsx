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
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
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
import { ToastAction } from '@/components/ui/toast'
import { useTranslations } from 'next-intl'

const ITEMS_PER_PAGE = 10

export default function AscentsPage() {
  const t = useTranslations('ProfilePage')
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

      // 完攀後推薦引導：以 sessionStorage 計數（每日上限 3 次）
      const count = parseInt(sessionStorage.getItem('daily_recommendation_count') ?? '0', 10)
      if (count < 3) {
        sessionStorage.setItem('daily_recommendation_count', String(count + 1))
        toast({
          title: t('toastCreateSuccess'),
          description: t('toastAscentAiRecommendDesc'),
          action: (
            <ToastAction altText={t('toastGoToRecommendations')} onClick={() => window.location.href = '/profile/recommendations'}>
              {t('toastGoView')}
            </ToastAction>
          ),
        })
      } else {
        toast({
          title: t('toastCreateSuccess'),
          description: t('toastAscentAdded'),
        })
      }
    },
    onError: () => {
      toast({
        title: t('toastCreateFailed'),
        description: t('toastAscentCreateFailedDesc'),
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
        title: t('toastUpdateSuccess'),
        description: t('toastAscentUpdated'),
      })
    },
    onError: () => {
      toast({
        title: t('toastUpdateFailed'),
        description: t('toastAscentUpdateFailedDesc'),
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
        title: t('toastDeleteSuccess'),
        description: t('toastAscentDeleted'),
      })
    },
    onError: () => {
      toast({
        title: t('toastDeleteFailed'),
        description: t('toastAscentDeleteFailedDesc'),
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
        <ProfilePageTitle
          title={t('ascentsTitle')}
          subtitle={t('ascentsSubtitle')}
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addRecord')}
            </Button>
          }
        />

        {/* 統計摘要卡片 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            icon={<MountainSnow className="h-5 w-5 text-brand-dark" />}
            label={t('statTotalAscents')}
            value={stats?.total_ascents ?? 0}
            color="bg-brand-light"
            isLoading={statsLoading}
          />
          <SummaryCard
            icon={<Route className="h-5 w-5 text-brand-dark" />}
            label={t('statUniqueRoutes')}
            value={stats?.unique_routes ?? 0}
            color="bg-brand-light"
            isLoading={statsLoading}
          />
          <SummaryCard
            icon={<MapPin className="h-5 w-5 text-brand-dark" />}
            label={t('statUniqueCrags')}
            value={stats?.unique_crags ?? 0}
            color="bg-brand-accent/20"
            isLoading={statsLoading}
          />
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5 text-brand-dark" />}
            label={t('statHighestGrade')}
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
              <span className="text-sm font-medium text-text-main">{t('filter')}</span>
            </div>

            {/* 攀爬類型篩選 */}
            <Select value={ascentTypeFilter} onValueChange={setAscentTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('ascentType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
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
                  <SelectValue placeholder={t('crag')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCrags')}</SelectItem>
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
                {t('reset')}
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
                title={t('ascentsEmpty')}
                description={t('ascentsEmptyDesc')}
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
                    {t('pagination', { page, totalPages })}
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
        title={t('confirmDelete')}
        message={`${t('confirmDeleteAscentMessage')}${deletingAscent?.route_name ? `\n\n${t('route')}：${deletingAscent.route_name}` : ''}`}
        confirmText={t('confirmDelete')}
        cancelText={t('cancel')}
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
