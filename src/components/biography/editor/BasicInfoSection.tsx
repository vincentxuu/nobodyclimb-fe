'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { User, ImageIcon, Pencil, Clock } from 'lucide-react'

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
  /** 攀岩年資 */
  climbingYears: number | null
  /** 攀岩年資變更回調 */
  onClimbingYearsChange: (_years: number | null) => void
  /** 主要攀岩地點 */
  homeGym: string | null
  /** 攀岩地點變更回調 */
  onHomeGymChange: (_location: string | null) => void
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
  climbingYears,
  onClimbingYearsChange,
  homeGym,
  onHomeGymChange,
  className,
}: BasicInfoSectionProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

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
          className="relative h-32 md:h-48 bg-[#EBEAEA] rounded-xl overflow-hidden cursor-pointer group"
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
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
          className="w-full px-4 py-3 border border-[#B6B3B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={50}
        />
        <p className="text-xs text-[#8E8C8C]">這會顯示在你的人物誌上</p>
      </div>

      {/* Title / Tagline */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">
          個人標語
          <span className="text-[#8E8C8C] font-normal ml-1">(選填)</span>
        </label>
        <input
          type="text"
          value={title || ''}
          onChange={(e) => onTitleChange(e.target.value || null)}
          placeholder="例如：週末岩友、抱石愛好者、嘗試中的上攀者..."
          className="w-full px-4 py-3 border border-[#B6B3B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={100}
        />
        <p className="text-xs text-[#8E8C8C]">
          一句話描述你自己，或是你的攀岩風格
        </p>
      </div>

      {/* Climbing Years */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">
          攀岩年資
          <span className="text-[#8E8C8C] font-normal ml-1">(選填)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={climbingYears ?? ''}
            onChange={(e) => {
              const value = e.target.value
              onClimbingYearsChange(value ? parseInt(value, 10) : null)
            }}
            placeholder="0"
            min={0}
            max={99}
            className="w-24 px-4 py-3 border border-[#B6B3B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-center"
          />
          <span className="text-[#6D6C6C]">年</span>
        </div>
        <p className="text-xs text-[#8E8C8C]">不確定的話，填個大概就好</p>
      </div>

      {/* Home Gym / Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D]">
          常去的岩館/岩場
          <span className="text-[#8E8C8C] font-normal ml-1">(選填)</span>
        </label>
        <input
          type="text"
          value={homeGym || ''}
          onChange={(e) => onHomeGymChange(e.target.value || null)}
          placeholder="例如：內湖運動中心、龍洞、北投..."
          className="w-full px-4 py-3 border border-[#B6B3B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={100}
        />
        <p className="text-xs text-[#8E8C8C]">讓其他岩友更容易找到你</p>
      </div>
    </div>
  )
}

export default BasicInfoSection
