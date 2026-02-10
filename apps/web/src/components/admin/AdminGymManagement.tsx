'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  MapPin,
  Phone,
  Globe,
  Mail,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import apiClient from '@/lib/api/client'

// Backend gym type (snake_case, matching API response)
interface AdminGym {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  website: string | null
  cover_image: string | null
  is_featured: number
  opening_hours: Record<string, string> | null
  facilities: string[] | null
  price_info: Record<string, unknown> | null
  rating_avg: number
  review_count: number
  created_at: string
  updated_at: string
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Days of the week (Traditional Chinese)
const WEEKDAYS = [
  { key: 'monday', label: '週一' },
  { key: 'tuesday', label: '週二' },
  { key: 'wednesday', label: '週三' },
  { key: 'thursday', label: '週四' },
  { key: 'friday', label: '週五' },
  { key: 'saturday', label: '週六' },
  { key: 'sunday', label: '週日' },
] as const

// Gym form data
interface GymFormData {
  name: string
  description: string
  address: string
  city: string
  region: string
  phone: string
  email: string
  website: string
  is_featured: boolean
  facilities: string
  opening_hours: Record<string, string>
  price_info: string
  latitude: string
  longitude: string
}

const emptyGymForm: GymFormData = {
  name: '',
  description: '',
  address: '',
  city: '',
  region: '',
  phone: '',
  email: '',
  website: '',
  is_featured: false,
  facilities: '',
  opening_hours: {},
  price_info: '',
  latitude: '',
  longitude: '',
}

// API response types
interface GymListResponse {
  success: boolean
  data: AdminGym[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export default function AdminGymManagement() {
  const { toast } = useToast()

  const [gyms, setGyms] = useState<AdminGym[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [cities, setCities] = useState<string[]>([])

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingGym, setEditingGym] = useState<AdminGym | null>(null)
  const [gymForm, setGymForm] = useState<GymFormData>(emptyGymForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deletingGymId, setDeletingGymId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 0,
    limit: 20,
  })

  const fetchGyms = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      }
      if (cityFilter) params.city = cityFilter
      // 使用 backend-side 搜尋
      if (debouncedSearch) params.search = debouncedSearch

      const response = await apiClient.get<GymListResponse>('/gyms', { params })
      if (response.data.success && response.data.data) {
        setGyms(response.data.data)
        if (response.data.pagination) {
          setPagination({
            total: response.data.pagination.total,
            total_pages: response.data.pagination.total_pages,
            limit: response.data.pagination.limit,
          })
        }

        // Collect unique cities for filter
        const allCities = response.data.data
          .map((g) => g.city)
          .filter((c): c is string => !!c)
        setCities((prev) => {
          const merged = new Set([...prev, ...allCities])
          return [...merged].sort()
        })
      }
    } catch (error) {
      console.error('Failed to fetch gyms:', error)
    } finally {
      setLoading(false)
    }
  }, [page, cityFilter, debouncedSearch])

  useEffect(() => {
    fetchGyms()
  }, [fetchGyms])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, cityFilter])

  const handleRefresh = () => {
    fetchGyms()
  }

  const handleAddGym = () => {
    setEditingGym(null)
    setGymForm(emptyGymForm)
    setShowForm(true)
  }

  const handleEditGym = (gym: AdminGym) => {
    setEditingGym(gym)
    setGymForm({
      name: gym.name,
      description: gym.description || '',
      address: gym.address || '',
      city: gym.city || '',
      region: gym.region || '',
      phone: gym.phone || '',
      email: gym.email || '',
      website: gym.website || '',
      is_featured: gym.is_featured === 1,
      facilities: gym.facilities?.join(', ') || '',
      opening_hours: (gym.opening_hours && typeof gym.opening_hours === 'object')
        ? gym.opening_hours
        : {},
      price_info: (gym.price_info && typeof gym.price_info === 'object')
        ? JSON.stringify(gym.price_info, null, 2)
        : '',
      latitude: gym.latitude?.toString() || '',
      longitude: gym.longitude?.toString() || '',
    })
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingGym(null)
    setGymForm(emptyGymForm)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymForm.name.trim()) return

    setSubmitting(true)
    try {
      // Parse price_info JSON
      let parsedPriceInfo = null
      if (gymForm.price_info.trim()) {
        try {
          parsedPriceInfo = JSON.parse(gymForm.price_info)
        } catch {
          toast({ variant: 'warning', title: '格式錯誤', description: '價格資訊 JSON 格式不正確' })
          setSubmitting(false)
          return
        }
      }

      const payload = {
        name: gymForm.name.trim(),
        description: gymForm.description || null,
        address: gymForm.address || null,
        city: gymForm.city || null,
        region: gymForm.region || null,
        latitude: gymForm.latitude ? Number(gymForm.latitude) : null,
        longitude: gymForm.longitude ? Number(gymForm.longitude) : null,
        phone: gymForm.phone || null,
        email: gymForm.email || null,
        website: gymForm.website || null,
        is_featured: gymForm.is_featured ? 1 : 0,
        facilities: gymForm.facilities
          ? gymForm.facilities.split(',').map((f) => f.trim()).filter(Boolean)
          : [],
        opening_hours: Object.keys(gymForm.opening_hours).length > 0
          ? gymForm.opening_hours
          : null,
        price_info: parsedPriceInfo,
      }

      if (editingGym) {
        await apiClient.put(`/gyms/${editingGym.id}`, payload)
      } else {
        await apiClient.post('/gyms', payload)
      }

      await fetchGyms()
      handleCancelForm()
    } catch (error) {
      console.error('Failed to save gym:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '儲存岩館失敗' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGym = async (id: string) => {
    try {
      await apiClient.delete(`/gyms/${id}`)
      await fetchGyms()
      setDeletingGymId(null)
    } catch (error) {
      console.error('Failed to delete gym:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '刪除岩館失敗' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wb-100">岩館管理</h1>
          <p className="text-sm text-wb-70 mt-1">管理室內攀岩館資訊</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddGym}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            新增岩館
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-wb-10 text-wb-70 rounded-lg hover:bg-wb-20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            重新整理
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="總岩館數"
          value={pagination.total}
          loading={loading}
        />
        <StatCard
          icon={Star}
          label="精選岩館"
          value={gyms.filter((g) => g.is_featured).length}
          loading={loading}
        />
        <StatCard
          icon={MapPin}
          label="城市數"
          value={cities.length}
          loading={loading}
        />
        <StatCard
          icon={Building2}
          label="有評論"
          value={gyms.filter((g) => g.review_count > 0).length}
          loading={loading}
        />
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-wb-100">
              {editingGym ? '編輯岩館' : '新增岩館'}
            </h3>
            <button
              onClick={handleCancelForm}
              className="p-2 text-wb-50 hover:text-wb-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={gymForm.name}
                  onChange={(e) => setGymForm({ ...gymForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">城市</label>
                <input
                  type="text"
                  value={gymForm.city}
                  onChange={(e) => setGymForm({ ...gymForm, city: e.target.value })}
                  placeholder="例：台北市"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">區域</label>
                <select
                  value={gymForm.region}
                  onChange={(e) => setGymForm({ ...gymForm, region: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white"
                >
                  <option value="">選擇區域</option>
                  <option value="北部">北部</option>
                  <option value="中部">中部</option>
                  <option value="南部">南部</option>
                  <option value="東部">東部</option>
                  <option value="離島">離島</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-wb-70 mb-1">地址</label>
                <input
                  type="text"
                  value={gymForm.address}
                  onChange={(e) => setGymForm({ ...gymForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">電話</label>
                <input
                  type="text"
                  value={gymForm.phone}
                  onChange={(e) => setGymForm({ ...gymForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">Email</label>
                <input
                  type="email"
                  value={gymForm.email}
                  onChange={(e) => setGymForm({ ...gymForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">網站</label>
                <input
                  type="url"
                  value={gymForm.website}
                  onChange={(e) => setGymForm({ ...gymForm, website: e.target.value })}
                  placeholder="https://"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-wb-70 mb-1">設施</label>
                <input
                  type="text"
                  value={gymForm.facilities}
                  onChange={(e) => setGymForm({ ...gymForm, facilities: e.target.value })}
                  placeholder="以逗號分隔，例：抱石區, 先鋒區, 速度牆, 淋浴間"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-wb-70 mb-1">描述</label>
                <textarea
                  value={gymForm.description}
                  onChange={(e) => setGymForm({ ...gymForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none"
                />
              </div>
            </div>

            {/* 地理資訊 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">緯度</label>
                <input
                  type="number"
                  step="any"
                  value={gymForm.latitude}
                  onChange={(e) => setGymForm({ ...gymForm, latitude: e.target.value })}
                  placeholder="例：25.0330"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">經度</label>
                <input
                  type="number"
                  step="any"
                  value={gymForm.longitude}
                  onChange={(e) => setGymForm({ ...gymForm, longitude: e.target.value })}
                  placeholder="例：121.5654"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
            </div>

            {/* 營業時間 */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-wb-70 mb-2">營業時間</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {WEEKDAYS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-wb-50 mb-1">{label}</label>
                    <input
                      type="text"
                      value={gymForm.opening_hours[key] || ''}
                      onChange={(e) =>
                        setGymForm({
                          ...gymForm,
                          opening_hours: {
                            ...gymForm.opening_hours,
                            [key]: e.target.value,
                          },
                        })
                      }
                      placeholder="例：10:00-22:00 或 公休"
                      className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 價格資訊 */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-wb-70 mb-1">
                價格資訊 <span className="text-xs text-wb-50">(JSON 格式)</span>
              </label>
              <textarea
                value={gymForm.price_info}
                onChange={(e) => setGymForm({ ...gymForm, price_info: e.target.value })}
                rows={4}
                placeholder={'例：\n{\n  "單次入場": "350元",\n  "月票": "2000元",\n  "學生優惠": "300元"\n}'}
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={gymForm.is_featured}
                onChange={(e) => setGymForm({ ...gymForm, is_featured: e.target.checked })}
                className="rounded border-wb-20 text-wb-100 focus:ring-wb-100/20"
              />
              <label htmlFor="is_featured" className="text-sm text-wb-70">
                設為精選岩館
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-sm text-wb-70 hover:text-wb-100 rounded-lg hover:bg-wb-10 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting || !gymForm.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingGym ? '更新' : '新增'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wb-50" />
            <input
              type="text"
              placeholder="搜尋岩館名稱、地址..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 focus:border-wb-100"
            />
          </div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-2 border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 focus:border-wb-100 bg-white"
          >
            <option value="">所有城市</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 岩館列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-wb-20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-wb-50" />
          </div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-12 text-wb-70">
            {search || cityFilter ? '沒有找到符合條件的岩館' : '尚無岩館資料'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-wb-10">
                  <tr className="text-left text-sm text-wb-70">
                    <th className="px-4 py-3 font-medium">岩館</th>
                    <th className="px-4 py-3 font-medium">城市</th>
                    <th className="px-4 py-3 font-medium">聯絡方式</th>
                    <th className="px-4 py-3 font-medium text-center">評分</th>
                    <th className="px-4 py-3 font-medium text-center">評論</th>
                    <th className="px-4 py-3 font-medium text-center">精選</th>
                    <th className="px-4 py-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {gyms.map((gym) => (
                    <tr
                      key={gym.id}
                      className="border-t border-wb-20 hover:bg-wb-10/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-wb-10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-wb-70" />
                          </div>
                          <div>
                            <div className="font-medium text-wb-100">{gym.name}</div>
                            <div className="text-xs text-wb-50">{gym.address || gym.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-wb-10 text-wb-90">
                          <MapPin className="h-3 w-3" />
                          {gym.city || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {gym.phone && (
                            <span className="text-wb-50" title={gym.phone}>
                              <Phone className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {gym.email && (
                            <span className="text-wb-50" title={gym.email}>
                              <Mail className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {gym.website && (
                            <a
                              href={gym.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-wb-50 hover:text-wb-100"
                              title={gym.website}
                            >
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {!gym.phone && !gym.email && !gym.website && (
                            <span className="text-wb-50 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-wb-100">
                          {gym.rating_avg ? gym.rating_avg.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-wb-70">{gym.review_count || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {gym.is_featured ? (
                          <Star className="h-4 w-4 text-yellow-500 mx-auto fill-yellow-500" />
                        ) : (
                          <span className="text-wb-50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/gym/${gym.slug}`}
                            target="_blank"
                            className="p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors"
                            title="查看頁面"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEditGym(gym)}
                            className="p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors"
                            title="編輯"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {deletingGymId === gym.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteGym(gym.id)}
                                className="px-2.5 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                確認刪除
                              </button>
                              <button
                                onClick={() => setDeletingGymId(null)}
                                className="px-2.5 py-1.5 text-xs text-wb-70 hover:text-wb-100 rounded hover:bg-wb-10 transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingGymId(gym.id)}
                              className="p-2 text-wb-70 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="刪除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分頁 */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-wb-20">
                <div className="text-sm text-wb-70">
                  共 {pagination.total} 間岩館，第 {page} / {pagination.total_pages} 頁
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-wb-70">
                    {page} / {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.total_pages}
                    className="p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 說明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">管理說明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>- 點擊「新增岩館」按鈕可建立新的岩館資料</li>
          <li>- 點擊編輯圖示可修改岩館資訊（含營業時間、價格、座標等完整資訊）</li>
          <li>- 刪除岩館會同時移除其封面圖片</li>
          <li>- 設施欄位以逗號分隔填寫</li>
          <li>- 價格資訊使用 JSON 格式，例：{`{"單次": "350元", "月票": "2000元"}`}</li>
        </ul>
      </div>
    </div>
  )
}

// 統計卡片組件
function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  loading?: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-wb-10 rounded-lg">
          <Icon className="h-5 w-5 text-wb-100" />
        </div>
        <div>
          <p className="text-xs text-wb-70">{label}</p>
          {loading ? (
            <div className="h-7 w-12 bg-wb-10 rounded animate-pulse mt-0.5" />
          ) : (
            <p className="text-2xl font-bold text-wb-100">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
