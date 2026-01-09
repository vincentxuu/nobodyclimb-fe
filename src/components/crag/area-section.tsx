'use client'

import React from 'react'
import PlaceholderImage from '@/components/ui/placeholder-image'
import { ChevronRight } from 'lucide-react'

interface CragAreaSectionProps {
  areas: Array<{
    name: string
    description: string
    difficulty: string
    routes: number
    image?: string
  }>
  onAreaClick?: (areaName: string) => void
}

export const CragAreaSection: React.FC<CragAreaSectionProps> = ({ areas, onAreaClick }) => {
  return (
    <div>
      <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">岩區詳情</h2>
      <p className="mb-6 text-sm text-gray-500">點擊岩區卡片可查看該區的所有路線</p>
      <div className="space-y-10">
        {areas.map((area, index) => (
          <div
            key={index}
            className="group grid cursor-pointer grid-cols-1 gap-6 rounded-lg border border-transparent p-4 transition-all hover:border-[#FFE70C] hover:bg-yellow-50 md:grid-cols-3"
            onClick={() => onAreaClick?.(area.name)}
            role="button"
            aria-label={`查看 ${area.name} 的路線`}
          >
            <div className="relative h-60 overflow-hidden rounded-lg">
              <PlaceholderImage text={`${area.name} 岩區`} bgColor="#E0F2FE" />
            </div>
            <div className="md:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold group-hover:text-[#1B1A1A]">{area.name}</h3>
                <span className="flex items-center text-sm text-gray-400 transition-colors group-hover:text-[#FFE70C]">
                  查看路線
                  <ChevronRight size={16} className="ml-1" />
                </span>
              </div>
              <p className="mb-4 text-gray-700">{area.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3 transition-colors group-hover:bg-white">
                  <p className="mb-1 text-sm text-gray-500">難度範圍</p>
                  <p className="font-semibold">{area.difficulty}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 transition-colors group-hover:bg-white">
                  <p className="mb-1 text-sm text-gray-500">路線數量</p>
                  <p className="font-semibold">{area.routes}+</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
