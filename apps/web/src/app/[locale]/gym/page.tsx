'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Filter, Loader2, Star } from 'lucide-react'
import BackToTop from '@/components/ui/back-to-top'
import { GymCoverGenerator } from '@/components/shared/GymCoverGenerator'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import { useGyms } from '@/hooks/api/useGyms'
import { filterGyms } from '@/lib/adapters/gym-adapter'
import type { GymListItem } from '@/lib/gym-data'
import { useTranslations } from 'next-intl'

// 岩館卡片組件（使用 CSS 動畫）
function GymCard({ gym }: { gym: GymListItem }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <Link href={`/gym/${gym.id}`}>
        <div className="relative h-48 w-full">
          <GymCoverGenerator
            type={gym.type}
            name={gym.name}
            typeLabel={gym.typeLabel}
            aspectRatio="card"
            className="h-full w-full"
          />
        </div>
        <div className="p-4">
          <div className="mb-2">
            <h3 className="text-base font-bold text-gray-900">{gym.name}</h3>
            {gym.nameEn && gym.nameEn !== gym.name && (
              <p className="text-sm text-gray-500">{gym.nameEn}</p>
            )}
          </div>

          <div className="mb-2 flex items-center">
            <MapPin size={14} className="mr-1 text-gray-400" />
            <span className="text-sm text-gray-600">{gym.location}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {gym.typeLabel}
            </span>
            {gym.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-yellow-500">
                <Star size={14} fill="currentColor" />
                {gym.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function GymListPage() {
  const t = useTranslations('GymPage')

  // 區域篩選選項（僅保留有岩館的地區）
  const allRegionsLabel = t('filterAllRegions')
  const regions = [
    allRegionsLabel,
    t('regionTaipei'),
    t('regionNewTaipei'),
    t('regionTaoyuan'),
    t('regionHsinchu'),
    t('regionTaichung'),
    t('regionChanghua'),
    t('regionTainan'),
    t('regionKaohsiung'),
    t('regionYilan'),
    t('regionHualien'),
    t('regionTaitung'),
  ]

  // 攀岩館類型篩選選項
  const allTypesLabel = t('filterAllTypes')
  const gymTypes = [allTypesLabel, t('typeTopRope'), t('typeBouldering')]

  const [selectedRegion, setSelectedRegion] = useState(allRegionsLabel)
  const [selectedType, setSelectedType] = useState(allTypesLabel)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // 使用 API hook 獲取資料
  const { data, isLoading, error } = useGyms({ limit: 100 })
  // 在前端進行篩選
  const gyms = useMemo(() => {
    const allGyms = data?.gyms || []
    return filterGyms(allGyms, {
      region: selectedRegion,
      type: selectedType,
    })
  }, [data?.gyms, selectedRegion, selectedType])

  return (
    <main className="min-h-screen bg-page-content-bg">
      <PageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: t('breadcrumbHome'), href: '/' }, { label: t('breadcrumbGyms') }]} />
        </div>

        {/* 篩選區塊 */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">{t('filterTitle')}</h2>
            <button
              className="flex items-center font-medium text-primary md:hidden"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={18} className="mr-1" />
              {isFilterOpen ? t('filterCollapse') : t('filterExpand')}
            </button>
          </div>

          <div className={`${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-medium text-gray-900">{t('filterRegionLabel')}</h3>
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => (
                    <button
                      key={region}
                      className={`border-b-2 px-4 py-1.5 text-sm transition ${
                        selectedRegion === region
                          ? 'border-[#1B1A1A] font-medium text-[#1B1A1A]'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                      }`}
                      onClick={() => setSelectedRegion(region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-medium text-gray-900">{t('filterTypeLabel')}</h3>
                <div className="flex flex-wrap gap-2">
                  {gymTypes.map((type) => (
                    <button
                      key={type}
                      className={`border-b-2 px-4 py-1.5 text-sm transition ${
                        selectedType === type
                          ? 'border-[#1B1A1A] font-medium text-[#1B1A1A]'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                      }`}
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 載入中狀態 */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">{t('loading')}</span>
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <div className="py-12 text-center">
            <p className="text-lg text-red-500">{t('loadError')}</p>
          </div>
        )}

        {/* 搜尋結果 */}
        {!isLoading && !error && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {t('resultCount', { count: gyms.length })}
              </p>
            </div>

            {/* 攀岩館列表 */}
            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {gyms.map((gym) => (
                <GymCard key={gym.id} gym={gym} />
              ))}
            </div>

            {/* 無結果提示 */}
            {gyms.length === 0 && (
              <div className="py-12 text-center">
                <p className="mb-4 text-lg text-gray-500">{t('noResults')}</p>
                <button
                  className="border-b border-gray-900 pb-1 text-gray-900 transition-colors hover:border-gray-700 hover:text-gray-700"
                  onClick={() => {
                    setSelectedRegion(allRegionsLabel)
                    setSelectedType(allTypesLabel)
                  }}
                >
                  {t('clearFilters')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <BackToTop />
    </main>
  )
}
