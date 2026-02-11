'use client'

import { useState, useRef, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { User, ImageIcon, Pencil, Clock, Link, Instagram, Youtube, X, Plus, Lightbulb } from 'lucide-react'
import type { SocialLinks } from '@/lib/types/biography-v2'

interface BasicInfoSectionProps {
  /** 用戶名稱 */
  name: string
  /** 名稱變更回調 */
  onNameChange: (_name: string) => void
  /** 個人標題 */
  title: string | null
  /** 標題變更回調 */
  onTitleChange: (_title: string | null) => void
  /** 頭像 URL */
  avatarUrl: string | null
  /** 頭像變更回調 */
  onAvatarChange: (_file: File) => void
  /** 封面圖 URL */
  coverUrl: string | null
  /** 封面圖變更回調 */
  onCoverChange: (_file: File) => void
  /** 開始攀岩年份 */
  climbingStartYear: number | null
  /** 開始攀岩年份變更回調 */
  onClimbingStartYearChange: (_year: number | null) => void
  /** 平常出沒的地方 */
  frequentLocations: string[]
  /** 平常出沒的地方變更回調 */
  onFrequentLocationsChange: (_locations: string[]) => void
  /** 喜歡的路線型態 */
  favoriteRouteTypes: string[]
  /** 喜歡的路線型態變更回調 */
  onFavoriteRouteTypesChange: (_types: string[]) => void
  /** 社群連結 */
  socialLinks: SocialLinks
  /** 社群連結變更回調 */
  onSocialLinksChange: (_socialLinks: SocialLinks) => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 基本資料編輯區塊
 *
 * 用於編輯用戶的基本資料
 */
export function BasicInfoSection({
  name,
  onNameChange,
  title,
  onTitleChange,
  avatarUrl,
  onAvatarChange,
  coverUrl,
  onCoverChange,
  climbingStartYear,
  onClimbingStartYearChange,
  frequentLocations,
  onFrequentLocationsChange,
  favoriteRouteTypes,
  onFavoriteRouteTypesChange,
  socialLinks,
  onSocialLinksChange,
  className,
}: BasicInfoSectionProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [newLocation, setNewLocation] = useState('')
  const [newRouteType, setNewRouteType] = useState('')

  // 預設的路線型態選項（分類）
  const routeTypeGroups = [
    {
      category: '攀登方式',
      options: [
        { label: '抱石', value: '抱石' },
        { label: '運動攀登', value: '運動攀登' },
        { label: '頂繩攀登', value: '頂繩攀登' },
        { label: '速度攀登', value: '速度攀登' },
        { label: '傳統攀登', value: '傳統攀登' },
      ],
    },
    {
      category: '地形型態',
      options: [
        { label: '平板岩', value: '平板岩' },
        { label: '垂直岩壁', value: '垂直岩壁' },
        { label: '外傾岩壁', value: '外傾岩壁' },
        { label: '屋簷', value: '屋簷' },
        { label: '裂隙', value: '裂隙' },
        { label: '稜線', value: '稜線' },
        { label: '壁面', value: '壁面' },
        { label: '煙囪', value: '煙囪' },
      ],
    },
    {
      category: '動作風格',
      options: [
        { label: '動態路線', value: '動態路線' },
        { label: '跑酷風格', value: '跑酷風格' },
        { label: '協調性', value: '協調性' },
        { label: '靜態', value: '靜態' },
        { label: '技術性', value: '技術性' },
        { label: '力量型', value: '力量型' },
        { label: '耐力型', value: '耐力型' },
      ],
    },
  ]

  // 扁平化所有選項（用於檢查是否為預設選項）
  const allRouteTypeOptions = routeTypeGroups.flatMap((g) => g.options)

  // Generate year options from current year back to 1970
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const years: number[] = []
    for (let year = currentYear; year >= 1970; year--) {
      years.push(year)
    }
    return years
  }, [currentYear])

  // Calculate climbing years for display
  const climbingYearsDisplay = climbingStartYear
    ? currentYear - climbingStartYear
    : null

  // Handle social links change
  const handleSocialLinkChange = (field: keyof SocialLinks, value: string) => {
    onSocialLinksChange({
      ...socialLinks,
      [field]: value || undefined,
    })
  }

  // Extract username from URL if user pastes full URL
  const extractUsername = (value: string) => {
    if (!value) return ''
    try {
      if (value.includes('/')) {
        const parts = value.split('/').filter(Boolean)
        const username = parts.pop() || ''
        return username.replace(/^@/, '')
      }
      return value.replace(/^@/, '')
    } catch {
      return value
    }
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
      onAvatarChange(file)
    }
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setCoverPreview(previewUrl)
      onCoverChange(file)
    }
  }

  const displayAvatar = avatarPreview || avatarUrl
  const displayCover = coverPreview || coverUrl

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <User size={18} className="text-[#3F3D3D]" />
        <h3 className="font-semibold text-[#1B1A1A]">基本資料</h3>
        <span className="text-xs text-[#6D6C6C] px-2 py-0.5 bg-[#F5F5F5] rounded-full flex items-center gap-1">
          <Clock size={12} />
          1 分鐘
        </span>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">封面圖片</label>
        <div
          className="relative h-32 md:h-48 bg-[#EBEAEA] rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
        >
          {displayCover ? (
            <Image
              src={displayCover}
              alt="封面圖片"
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6D6C6C]">
              <ImageIcon size={32} className="mb-2" />
              <span className="text-sm">點擊上傳封面圖片</span>
            </div>
          )}
          <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">更換封面</span>
          </div>
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverSelect}
          className="hidden"
        />
        <p className="text-xs text-[#8E8C8C]">建議尺寸：1200 x 400 像素</p>
      </div>

      {/* Avatar */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">頭像</label>
        <div className="flex items-center gap-4">
          <div
            className="relative w-20 h-20 bg-[#EBEAEA] rounded-full overflow-hidden cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt="頭像"
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#6D6C6C]">
                <User size={32} />
              </div>
            )}
            <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Pencil size={20} className="text-white" />
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
          <div className="text-sm text-[#6D6C6C]">
            <p>點擊頭像更換</p>
            <p className="text-xs">建議使用正方形圖片</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">
          顯示名稱 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="你想怎麼被稱呼？"
          className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={50}
        />
        <p className="text-xs text-[#8E8C8C]">這會顯示在你的人物誌上</p>
      </div>

      {/* Title / Tagline */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">
          一句話介紹自己
          <span className="text-[#8E8C8C] font-normal ml-1">(選填)</span>
        </label>
        <input
          type="text"
          value={title || ''}
          onChange={(e) => onTitleChange(e.target.value || null)}
          placeholder="例如：快樂最重要的週末岩友"
          className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={100}
        />
        <p className="text-xs text-[#8E8C8C] flex items-center gap-1">
          <Lightbulb size={12} />
          這句話會顯示在你的名字下方
        </p>
      </div>

      {/* Climbing Start Year */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">
          開始攀岩年份
          <span className="text-[#8E8C8C] font-normal ml-1">(選填)</span>
        </label>
        <div className="flex items-center gap-3">
          <select
            value={climbingStartYear ?? ''}
            onChange={(e) => {
              const value = e.target.value
              onClimbingStartYearChange(value ? parseInt(value, 10) : null)
            }}
            className="w-32 px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors appearance-none cursor-pointer"
          >
            <option value="">選擇年份</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <span className="text-[#6D6C6C] text-sm">
            {climbingYearsDisplay !== null && climbingYearsDisplay >= 0
              ? `約 ${climbingYearsDisplay} 年經驗`
              : '從入坑那天起算'}
          </span>
        </div>
        <p className="text-xs text-[#8E8C8C]">選擇你開始攀岩的年份，系統會自動計算年資</p>
      </div>

      {/* Frequent Locations - 多選標籤 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">
          平常出沒的地方
          <span className="text-[#8E8C8C] font-normal ml-1">(可多選)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {frequentLocations.map((location, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] px-3 py-1.5 text-sm text-[#1B1A1A]"
            >
              {location}
              <button
                type="button"
                onClick={() => {
                  const newLocations = frequentLocations.filter((_, i) => i !== index)
                  onFrequentLocationsChange(newLocations)
                }}
                className="ml-1 text-[#6D6C6C] hover:text-[#1B1A1A] transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newLocation.trim()) {
                  e.preventDefault()
                  if (!frequentLocations.includes(newLocation.trim())) {
                    onFrequentLocationsChange([...frequentLocations, newLocation.trim()])
                  }
                  setNewLocation('')
                }
              }}
              placeholder="輸入後按 Enter"
              className="w-32 px-3 py-1.5 text-sm bg-white text-[#1B1A1A] border border-dashed border-[#B6B3B3] rounded-full placeholder:text-[#9D9D9D] focus:outline-none focus:border-brand-dark"
            />
            <button
              type="button"
              onClick={() => {
                if (newLocation.trim() && !frequentLocations.includes(newLocation.trim())) {
                  onFrequentLocationsChange([...frequentLocations, newLocation.trim()])
                  setNewLocation('')
                }
              }}
              className="p-1.5 text-[#6D6C6C] hover:text-brand-dark hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <p className="text-xs text-[#8E8C8C]">岩館、戶外岩場都可以加</p>
      </div>

      {/* Favorite Route Types - 多選標籤 */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-[#3F3D3D]">
          喜歡的路線型態
          <span className="text-[#8E8C8C] font-normal ml-1">(可多選)</span>
        </label>
        {/* 分類預設選項 */}
        {routeTypeGroups.map((group) => (
          <div key={group.category} className="space-y-2">
            <span className="text-xs text-[#6D6C6C]">{group.category}</span>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isSelected = favoriteRouteTypes.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onFavoriteRouteTypesChange(favoriteRouteTypes.filter((t) => t !== option.value))
                      } else {
                        onFavoriteRouteTypesChange([...favoriteRouteTypes, option.value])
                      }
                    }}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-colors',
                      isSelected
                        ? 'bg-brand-dark text-white border-brand-dark'
                        : 'bg-white text-[#3F3D3D] border-[#B6B3B3] hover:border-brand-dark hover:bg-[#F5F5F5]'
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {/* 已選擇的自訂選項（非預設選項的） */}
        {favoriteRouteTypes.filter((t) => !allRouteTypeOptions.some((o) => o.value === t)).length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-[#6D6C6C]">自訂</span>
            <div className="flex flex-wrap gap-2">
              {favoriteRouteTypes
                .filter((type) => !allRouteTypeOptions.some((o) => o.value === type))
                .map((type, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-dark text-white px-3 py-1.5 text-sm"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => {
                        onFavoriteRouteTypesChange(favoriteRouteTypes.filter((t) => t !== type))
                      }}
                      className="ml-1 text-white/70 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}
        {/* 自訂輸入 */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newRouteType}
            onChange={(e) => setNewRouteType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newRouteType.trim()) {
                e.preventDefault()
                if (!favoriteRouteTypes.includes(newRouteType.trim())) {
                  onFavoriteRouteTypesChange([...favoriteRouteTypes, newRouteType.trim()])
                }
                setNewRouteType('')
              }
            }}
            placeholder="沒有想要的？自己輸入..."
            className="flex-1 max-w-xs px-3 py-1.5 text-sm bg-white text-[#1B1A1A] border border-dashed border-[#B6B3B3] rounded-full placeholder:text-[#9D9D9D] focus:outline-none focus:border-brand-dark"
          />
          <button
            type="button"
            onClick={() => {
              if (newRouteType.trim() && !favoriteRouteTypes.includes(newRouteType.trim())) {
                onFavoriteRouteTypesChange([...favoriteRouteTypes, newRouteType.trim()])
                setNewRouteType('')
              }
            }}
            className="p-1.5 text-[#6D6C6C] hover:text-brand-dark hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#EBEAEA] pt-6 mt-6">
        {/* Social Links Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link size={18} className="text-[#3F3D3D]" />
          <h4 className="font-medium text-[#1B1A1A]">社群連結</h4>
        </div>
        <p className="text-sm text-[#6D6C6C] mb-4">
          新增你的社群帳號，讓其他岩友可以追蹤你的動態
        </p>

        {/* Instagram */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
            <Instagram size={16} className="text-pink-600" />
            Instagram
            <span className="text-[#8E8C8C] font-normal">(選填)</span>
          </label>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#6D6C6C] shrink-0">@</span>
            <input
              type="text"
              value={socialLinks.instagram || ''}
              onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
              onBlur={(e) => {
                const username = extractUsername(e.target.value)
                if (username !== e.target.value) {
                  handleSocialLinkChange('instagram', username)
                }
              }}
              placeholder="your_username"
              className="flex-1 min-w-0 px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
              maxLength={50}
            />
          </div>
        </div>

        {/* YouTube */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
            <Youtube size={16} className="text-red-600" />
            YouTube 頻道
            <span className="text-[#8E8C8C] font-normal">(選填)</span>
          </label>
          <input
            type="text"
            value={socialLinks.youtube || ''}
            onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
            onBlur={(e) => {
              const username = extractUsername(e.target.value)
              if (username !== e.target.value) {
                handleSocialLinkChange('youtube', username)
              }
            }}
            placeholder="頻道 ID 或網址"
            className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
            maxLength={100}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
            <Link size={16} className="text-[#3F3D3D]" />
            個人網站
            <span className="text-[#8E8C8C] font-normal">(選填)</span>
          </label>
          <input
            type="url"
            value={socialLinks.website || ''}
            onChange={(e) => handleSocialLinkChange('website', e.target.value)}
            placeholder="https://your-website.com"
            className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
            maxLength={200}
          />
        </div>
      </div>
    </div>
  )
}

export default BasicInfoSection
