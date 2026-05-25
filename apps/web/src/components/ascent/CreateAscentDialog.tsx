'use client'

import { ChevronLeft, Grid3X3, Layers, MapPin, Route, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useAllCragsRoutes,
  useCragFullAreas,
  useCragFullRoutes,
  useCrags,
} from '@/hooks/api/useCrags'
import type { CragArea, CragListItem, CragRoute, RouteSearchItem } from '@/lib/crag-data'
import { getRouteName } from '@/lib/route-utils'
import { AscentFormData } from '@/lib/types/ascent'
import { cn } from '@/lib/utils'

type Step = 'crag' | 'area' | 'sector' | 'route' | 'form'

interface CreateAscentDialogProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
  onSubmit: (_data: AscentFormData) => Promise<unknown>
  isLoading?: boolean
}

export function CreateAscentDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateAscentDialogProps) {
  const t = useTranslations('Ascent')
  const [step, setStep] = useState<Step>('crag')
  const [searchQuery, setSearchQuery] = useState('')
  const [routeSearchQuery, setRouteSearchQuery] = useState('')
  const [selectedCrag, setSelectedCrag] = useState<CragListItem | null>(null)
  const [selectedArea, setSelectedArea] = useState<CragArea | null>(null)
  const [selectedSector, setSelectedSector] = useState<{ id: string; name: string } | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<CragRoute | null>(null)

  // 從 API 取得所有岩場
  const { data: cragsData } = useCrags({ limit: 100 })
  const crags = useMemo(() => cragsData?.crags || [], [cragsData?.crags])

  // 從 API 取得所有路線（用於全域搜尋，僅在對話框開啟時載入）
  const { data: allRoutes = [] } = useAllCragsRoutes(open)

  // 從 API 取得選擇岩場的區域
  const { data: areas = [] } = useCragFullAreas(selectedCrag?.id || '')

  // 從 API 取得選擇岩場的路線
  const { data: cragRoutes = [] } = useCragFullRoutes(selectedCrag?.id || '')

  // 從路線資料計算指定區域的子區域列表
  const getSectorsForArea = (areaId: string): { id: string; name: string }[] => {
    const sectorsSet = new Set<string>()
    cragRoutes
      .filter((route) => route.areaId === areaId && route.sector)
      .forEach((route) => sectorsSet.add(route.sector!))
    return Array.from(sectorsSet).map((sector) => ({ id: sector, name: sector }))
  }

  // 取得選擇區域的子區域（從路線資料計算）
  const sectors = useMemo(() => {
    if (!selectedCrag || !selectedArea) return []
    return getSectorsForArea(selectedArea.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCrag, selectedArea, cragRoutes])

  // 取得路線（根據區域和子區域過濾）
  const routes = useMemo(() => {
    if (!selectedCrag || !selectedArea) return []
    const areaRoutes = cragRoutes.filter((route) => route.areaId === selectedArea.id)
    // 如果選擇了子區域，進一步過濾
    if (selectedSector) {
      return areaRoutes.filter((route) => route.sector === selectedSector.name)
    }
    return areaRoutes
  }, [selectedCrag, selectedArea, selectedSector, cragRoutes])

  // 過濾岩場
  const filteredCrags = useMemo(() => {
    if (!searchQuery.trim()) return crags
    const query = searchQuery.toLowerCase()
    return crags.filter(
      (crag) =>
        crag.name.toLowerCase().includes(query) ||
        crag.nameEn.toLowerCase().includes(query) ||
        crag.location.toLowerCase().includes(query)
    )
  }, [crags, searchQuery])

  // 過濾區域
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas
    const query = searchQuery.toLowerCase()
    return areas.filter(
      (area) => area.name.toLowerCase().includes(query) || area.nameEn.toLowerCase().includes(query)
    )
  }, [areas, searchQuery])

  // 過濾子區域
  const filteredSectors = useMemo(() => {
    if (!searchQuery.trim()) return sectors
    const query = searchQuery.toLowerCase()
    return sectors.filter((sector) => sector.name.toLowerCase().includes(query))
  }, [sectors, searchQuery])

  // 過濾路線（當前區域）
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes
    const query = searchQuery.toLowerCase()
    return routes.filter(
      (route) =>
        route.name.toLowerCase().includes(query) ||
        route.nameEn.toLowerCase().includes(query) ||
        route.grade.toLowerCase().includes(query)
    )
  }, [routes, searchQuery])

  // 全域路線搜尋結果
  const globalRouteResults = useMemo(() => {
    if (!routeSearchQuery.trim()) return []
    const query = routeSearchQuery.toLowerCase()
    return allRoutes
      .filter(
        (item) =>
          item.route.name.toLowerCase().includes(query) ||
          item.route.nameEn.toLowerCase().includes(query) ||
          item.route.grade.toLowerCase().includes(query)
      )
      .slice(0, 20) // 限制顯示數量
  }, [allRoutes, routeSearchQuery])

  // 重置狀態
  const resetState = () => {
    setStep('crag')
    setSearchQuery('')
    setRouteSearchQuery('')
    setSelectedCrag(null)
    setSelectedArea(null)
    setSelectedSector(null)
    setSelectedRoute(null)
  }

  // 處理對話框關閉
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState()
    }
    onOpenChange(newOpen)
  }

  // 選擇岩場
  const handleSelectCrag = (crag: CragListItem) => {
    setSelectedCrag(crag)
    setSearchQuery('')
    setRouteSearchQuery('')
    setStep('area')
  }

  // 選擇區域
  const handleSelectArea = (area: CragArea) => {
    setSelectedArea(area)
    setSearchQuery('')
    setRouteSearchQuery('')
    // 使用共用函式檢查該區域是否有子區域
    const areaSectors = getSectorsForArea(area.id)
    if (areaSectors.length > 0) {
      setStep('sector')
    } else {
      setStep('route')
    }
  }

  // 選擇子區域
  const handleSelectSector = (sector: { id: string; name: string }) => {
    setSelectedSector(sector)
    setSearchQuery('')
    setRouteSearchQuery('')
    setStep('route')
  }

  // 跳過子區域選擇（顯示所有路線）
  const handleSkipSector = () => {
    setSelectedSector(null)
    setSearchQuery('')
    setRouteSearchQuery('')
    setStep('route')
  }

  // 選擇路線
  const handleSelectRoute = (route: CragRoute) => {
    setSelectedRoute(route)
    setSearchQuery('')
    setRouteSearchQuery('')
    setStep('form')
  }

  // 從全域搜尋選擇路線
  const handleSelectGlobalRoute = (item: RouteSearchItem) => {
    // 從岩場列表找到對應的岩場
    const cragListItem = crags.find((c) => c.id === item.cragId)
    if (cragListItem) {
      setSelectedCrag(cragListItem)
    }

    // 設定區域（用搜尋結果中的 areaName 建立最小化的 CragArea）
    if (item.route.areaId) {
      setSelectedArea({
        id: item.route.areaId,
        name: item.areaName,
        nameEn: '',
        boltCount: 0,
        routesCount: 0,
      })
    }

    // 設定子區域（如果有）
    if (item.route.sector) {
      setSelectedSector({ id: item.route.sector, name: item.route.sector })
    }

    setSelectedRoute(item.route)
    setSearchQuery('')
    setRouteSearchQuery('')
    setStep('form')
  }

  // 返回上一步
  const handleBack = () => {
    setSearchQuery('')
    setRouteSearchQuery('')
    switch (step) {
      case 'area':
        setStep('crag')
        setSelectedCrag(null)
        break
      case 'sector':
        setStep('area')
        setSelectedArea(null)
        break
      case 'route':
        // 如果有子區域選項，返回子區域選擇；否則返回區域選擇
        if (sectors.length > 0) {
          setStep('sector')
          setSelectedSector(null)
        } else {
          setStep('area')
          setSelectedArea(null)
        }
        break
      case 'form':
        setStep('route')
        setSelectedRoute(null)
        break
    }
  }

  // 處理表單提交
  const handleFormSubmit = async (data: AscentFormData) => {
    await onSubmit(data)
    resetState()
  }

  // 渲染標題
  const renderTitle = () => {
    switch (step) {
      case 'crag':
        return t('selectCrag')
      case 'area':
        return t('selectAreaWithName', { name: selectedCrag?.name ?? '' })
      case 'sector':
        return t('selectSectorWithName', { name: selectedArea?.name ?? '' })
      case 'route':
        return t('selectRouteWithName', { name: selectedSector?.name || selectedArea?.name || '' })
      case 'form':
        return t('recordAscent')
    }
  }

  // 渲染副標題（麵包屑）
  const renderBreadcrumb = () => {
    const parts: string[] = []
    if (selectedCrag) parts.push(selectedCrag.name)
    if (selectedArea) parts.push(selectedArea.name)
    if (selectedSector) parts.push(selectedSector.name)
    if (parts.length === 0) return null
    return <p className="text-xs text-muted-foreground">{parts.join(' > ')}</p>
  }

  // 渲染路線搜尋框和結果
  const renderRouteSearch = () => {
    const showResults = routeSearchQuery.trim().length > 0

    return (
      <div className="space-y-2">
        <div className="relative">
          <Route className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchRoutePlaceholder')}
            value={routeSearchQuery}
            onChange={(e) => setRouteSearchQuery(e.target.value)}
            className="pl-9 border-dashed"
          />
        </div>
        {showResults && (
          <div className="rounded-lg border bg-muted/30 p-2">
            {globalRouteResults.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">{t('noRoutesFound')}</p>
            ) : (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1">
                  {globalRouteResults.map((item) => (
                    <button
                      key={`${item.cragId}-${item.route.id}`}
                      onClick={() => handleSelectGlobalRoute(item)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors',
                        'hover:bg-brand-light/50'
                      )}
                    >
                      <Route className="h-4 w-4 shrink-0 text-brand-dark" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-main truncate">
                          {getRouteName(item.route.name, item.route.nameEn)}
                          <span className="ml-1 text-xs text-text-subtle">{item.route.grade}</span>
                        </p>
                        <p className="text-xs text-text-subtle truncate">
                          {item.cragName} · {item.areaName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!left-0 !right-0 !top-auto !bottom-0 !translate-x-0 !translate-y-0 max-h-[92dvh] overflow-y-auto rounded-t-2xl border-x-0 border-b-0 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:!left-[50%] sm:!right-auto sm:!top-[50%] sm:!bottom-auto sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:max-w-lg sm:rounded-lg sm:border sm:p-6 sm:pb-6">
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== 'crag' && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogTitle>{renderTitle()}</DialogTitle>
              {step !== 'crag' && step !== 'form' && renderBreadcrumb()}
            </div>
          </div>
          {step === 'form' && selectedRoute && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {selectedRoute.name} <span className="font-medium">({selectedRoute.grade})</span>
              </p>
              {renderBreadcrumb()}
            </div>
          )}
        </DialogHeader>

        {/* 岩場選擇步驟 */}
        {step === 'crag' && (
          <div className="space-y-4">
            {/* 路線快速搜尋 */}
            {renderRouteSearch()}

            <div className="relative flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t('orStepByStep')}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* 岩場搜尋 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchCragPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-2">
                {filteredCrags.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('noCragsFound')}
                  </p>
                ) : (
                  filteredCrags.map((crag) => (
                    <button
                      key={crag.id}
                      onClick={() => handleSelectCrag(crag)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        'hover:border-brand hover:bg-brand-light/50'
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light">
                        <MapPin className="h-5 w-5 text-brand-dark" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-main">{crag.name}</p>
                        <p className="text-sm text-text-subtle">
                          {t('routesCount', { count: crag.routes })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 區域選擇步驟 */}
        {step === 'area' && (
          <div className="space-y-4">
            {/* 路線快速搜尋 */}
            {renderRouteSearch()}

            <div className="relative flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t('orSelectArea')}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* 區域搜尋 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchAreaPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-2">
                {filteredAreas.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('noAreasFound')}
                  </p>
                ) : (
                  filteredAreas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => handleSelectArea(area)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        'hover:border-brand hover:bg-brand-light/50'
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Layers className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-main">
                          {getRouteName(area.name, area.nameEn)}
                        </p>
                        <p className="text-sm text-text-subtle">
                          {t('routesCount', { count: area.routesCount })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 子區域選擇步驟 */}
        {step === 'sector' && (
          <div className="space-y-4">
            {/* 路線快速搜尋 */}
            {renderRouteSearch()}

            <div className="relative flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t('orSelectSector')}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* 子區域搜尋 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchSectorPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-2">
                {/* 跳過選項 - 顯示所有路線 */}
                <button
                  onClick={handleSkipSector}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border border-dashed p-3 text-left transition-colors',
                    'hover:border-brand hover:bg-brand-light/50'
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Route className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-main">{t('showAllRoutes')}</p>
                    <p className="text-sm text-text-subtle">
                      {t('showAllRoutesHint', { count: routes.length })}
                    </p>
                  </div>
                </button>

                {filteredSectors.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t('noSectorsFound')}
                  </p>
                ) : (
                  filteredSectors.map((sector) => {
                    // 計算該子區域的路線數
                    const sectorRouteCount = cragRoutes.filter(
                      (r) => r.areaId === selectedArea!.id && r.sector === sector.name
                    ).length
                    return (
                      <button
                        key={sector.id}
                        onClick={() => handleSelectSector(sector)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                          'hover:border-brand hover:bg-brand-light/50'
                        )}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                          <Grid3X3 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text-main">{sector.name}</p>
                          <p className="text-sm text-text-subtle">
                            {t('routesCount', { count: sectorRouteCount })}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 路線選擇步驟 */}
        {step === 'route' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchRouteStepPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredRoutes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('noRoutesFound')}
                  </p>
                ) : (
                  filteredRoutes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => handleSelectRoute(route)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        'hover:border-brand hover:bg-brand-light/50'
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light">
                        <Route className="h-5 w-5 text-brand-dark" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-main">
                          {getRouteName(route.name, route.nameEn)}
                        </p>
                        <p className="text-sm text-text-subtle">
                          {route.grade} · {route.type}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 表單步驟 */}
        {step === 'form' && selectedRoute && (
          <AscentFormContent
            routeId={selectedRoute.id}
            onSubmit={handleFormSubmit}
            onCancel={() => handleOpenChange(false)}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Instagram, Star, Youtube } from 'lucide-react'
/**
 * 內嵌表單內容（不使用 AscentForm 的 Dialog 包裝）
 */
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Label } from '@/components/ui/label'
import { PhotoUpload } from '@/components/ui/photo-upload'
import { Textarea } from '@/components/ui/textarea'
import { galleryService } from '@/lib/api/services'
import { AscentType } from '@/lib/types/ascent'
import { AscentTypeSelect } from './AscentTypeSelect'

const ascentFormSchema = z.object({
  route_id: z.string().min(1, '請選擇路線'),
  ascent_type: z.enum([
    'redpoint',
    'flash',
    'onsight',
    'attempt',
    'toprope',
    'lead',
    'seconding',
    'repeat',
  ]),
  ascent_date: z.string().min(1, '請選擇日期'),
  attempts_count: z.number().min(1).optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  perceived_grade: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  youtube_url: z.string().url().nullable().optional().or(z.literal('')),
  instagram_url: z.string().url().nullable().optional().or(z.literal('')),
  is_public: z.boolean().optional(),
})

interface AscentFormContentProps {
  routeId: string
  onSubmit: (_data: AscentFormData) => Promise<unknown>
  onCancel: () => void
  isLoading?: boolean
}

function AscentFormContent({
  routeId,
  onSubmit,
  onCancel,
  isLoading = false,
}: AscentFormContentProps) {
  const t = useTranslations('Ascent')
  const [photos, setPhotos] = useState<string[]>([])

  const form = useForm<AscentFormData>({
    resolver: zodResolver(ascentFormSchema),
    defaultValues: {
      route_id: routeId,
      ascent_type: 'redpoint',
      ascent_date: format(new Date(), 'yyyy-MM-dd'),
      attempts_count: 1,
      rating: null,
      perceived_grade: null,
      notes: null,
      photos: [],
      youtube_url: null,
      instagram_url: null,
      is_public: true,
    },
  })

  const handleRatingChange = (newRating: number) => {
    const currentRating = form.getValues('rating')
    const finalRating = currentRating === newRating ? null : newRating
    form.setValue('rating', finalRating)
  }

  const currentRating = form.watch('rating')

  const handleFormSubmit = async (data: AscentFormData) => {
    await onSubmit({
      ...data,
      photos: photos.length > 0 ? photos : undefined,
      youtube_url: data.youtube_url || null,
      instagram_url: data.instagram_url || null,
    })
  }

  return (
    <div className="max-h-[65dvh] overflow-y-auto pr-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 攀爬類型 */}
        <div className="space-y-2">
          <Label>{t('fieldAscentType')}</Label>
          <AscentTypeSelect
            value={form.watch('ascent_type') as AscentType}
            onChange={(type) => form.setValue('ascent_type', type)}
          />
        </div>

        {/* 攀爬日期 */}
        <div className="space-y-2">
          <Label>{t('fieldAscentDate')}</Label>
          <Input
            type="date"
            variant="outline"
            textStatus="filled"
            leftIcon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
            max={format(new Date(), 'yyyy-MM-dd')}
            {...form.register('ascent_date')}
          />
        </div>

        {/* 嘗試次數 */}
        <div className="space-y-2">
          <Label htmlFor="attempts_count">{t('fieldAttemptsCount')}</Label>
          <Input
            id="attempts_count"
            type="number"
            min={1}
            {...form.register('attempts_count', { valueAsNumber: true })}
          />
        </div>

        {/* 個人評分 */}
        <div className="space-y-2">
          <Label>{t('fieldRating')}</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className="p-1"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    currentRating && star <= currentRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 感受難度 */}
        <div className="space-y-2">
          <Label htmlFor="perceived_grade">{t('fieldPerceivedGrade')}</Label>
          <Input
            id="perceived_grade"
            placeholder={t('perceivedGradePlaceholder')}
            {...form.register('perceived_grade')}
          />
        </div>

        {/* 筆記 */}
        <div className="space-y-2">
          <Label htmlFor="notes">{t('fieldNotes')}</Label>
          <Textarea
            id="notes"
            placeholder={t('notesPlaceholder')}
            rows={3}
            {...form.register('notes')}
          />
        </div>

        {/* 照片上傳 */}
        <div className="space-y-2">
          <Label>{t('fieldPhotos')}</Label>
          <PhotoUpload
            photos={photos}
            onChange={setPhotos}
            maxPhotos={5}
            uploadFn={galleryService.uploadImage}
            disabled={isLoading}
          />
        </div>

        {/* 媒體連結 */}
        <div className="space-y-4">
          <Label>{t('fieldMediaLinks')}</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              <Input placeholder={t('youtubeUrlPlaceholder')} {...form.register('youtube_url')} />
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              <Input
                placeholder={t('instagramUrlPlaceholder')}
                {...form.register('instagram_url')}
              />
            </div>
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            {t('cancel')}
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
