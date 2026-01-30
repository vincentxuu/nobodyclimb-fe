'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Globe, Users, Loader2, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LocationExploreCard, CountryCard } from '@/components/biography/climbing-location-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { climbingLocationService } from '@/lib/api/services'
import { LocationStat, CountryStat } from '@/lib/types'

export default function ExploreLocationsPage() {
  const [locations, setLocations] = useState<LocationStat[]>([])
  const [countries, setCountries] = useState<CountryStat[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalLocations, setTotalLocations] = useState(0)

  // 載入國家列表（使用正規化表格 API）
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await climbingLocationService.exploreCountries()
        if (response.success && response.data) {
          setCountries(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch countries:', err)
      }
    }
    fetchCountries()
  }, [])

  // 載入地點列表（使用正規化表格 API）
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await climbingLocationService.exploreLocations({
          country: selectedCountry || undefined,
          limit: 50,
        })
        if (response.success && response.data) {
          setLocations(response.data as LocationStat[])
          // Use pagination total from API response
          setTotalLocations(response.pagination?.total || response.data.length)
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err)
        setError('無法載入地點資料')
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [selectedCountry])

  // 篩選地點（依搜尋關鍵字）
  const filteredLocations = locations.filter(
    (loc) =>
      loc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 統計數據（從 API 回傳的國家統計計算）
  const totalCountries = countries.length
  const totalVisitors = countries.reduce((sum, c) => sum + c.visitor_count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部區域 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              { label: '攀岩足跡探索' },
            ]}
          />

          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <MapPin className="h-7 w-7 text-emerald-500" />
                攀岩足跡探索
              </h1>
              <p className="mt-1 text-gray-600">
                探索社群岩友去過的攀岩地點，找到志同道合的夥伴
              </p>
            </div>
            <Link href="/biography">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回人物誌
              </Button>
            </Link>
          </div>

          {/* 統計數據 */}
          <div className="mt-6 flex gap-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Globe className="h-5 w-5 text-emerald-500" />
              <span>
                <strong className="text-gray-900">{totalCountries}</strong> 個國家
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <span>
                <strong className="text-gray-900">{totalLocations}</strong> 個地點
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-5 w-5 text-emerald-500" />
              <span>
                <strong className="text-gray-900">{totalVisitors}</strong> 次造訪
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左側：國家篩選 */}
          <div className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-6 rounded-lg border bg-white p-4">
              <h3 className="mb-4 font-medium text-gray-900">依國家篩選</h3>

              <button
                onClick={() => setSelectedCountry(null)}
                className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedCountry === null
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                全部國家
              </button>

              <div className="space-y-1">
                {countries.map((country) => (
                  <CountryCard
                    key={country.country}
                    country={country.country}
                    locationCount={country.location_count}
                    visitorCount={country.visitor_count}
                    onClick={() => setSelectedCountry(country.country)}
                    isSelected={selectedCountry === country.country}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 右側：地點列表 */}
          <div className="flex-1">
            {/* 搜尋欄 */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋地點名稱..."
                  className="pl-10"
                />
              </div>

              {/* 手機版國家選擇 */}
              <select
                value={selectedCountry || ''}
                onChange={(e) => setSelectedCountry(e.target.value || null)}
                className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm lg:hidden"
              >
                <option value="">全部國家</option>
                {countries.map((country) => (
                  <option key={country.country} value={country.country}>
                    {country.country} ({country.visitor_count})
                  </option>
                ))}
              </select>
            </div>

            {/* 載入狀態 */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            )}

            {/* 錯誤狀態 */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
                {error}
              </div>
            )}

            {/* 空狀態 */}
            {!loading && !error && filteredLocations.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  {searchQuery ? '找不到符合的地點' : '還沒有攀岩足跡'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? '試試其他搜尋關鍵字'
                    : '成為第一個分享攀岩足跡的人吧！'}
                </p>
              </div>
            )}

            {/* 地點列表 */}
            {!loading && !error && filteredLocations.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredLocations.map((location, index) => (
                  <LocationExploreCard
                    key={`${location.location}|${location.country}`}
                    location={location}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
