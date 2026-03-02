'use client'

import React from 'react'
import { Car, MapPin, Info } from 'lucide-react'

interface Transportation {
  type: string
  description: string
}

interface CragData {
  rockType: string
  routes: number
  difficulty: string
  height: string
  approach: string
  description: string
  videoUrl: string
  seasons: string[]
  transportation: Transportation[]
  parking: string
  amenities: string[]
}

interface CragIntroSectionProps {
  cragData: CragData
}

export const CragIntroSection: React.FC<CragIntroSectionProps> = ({ cragData }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">岩場介紹</h2>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">岩石類型</p>
            <p className="font-medium">{cragData.rockType}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">路線數量</p>
            <p className="font-medium">{cragData.routes}+</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">難度範圍</p>
            <p className="font-medium">{cragData.difficulty}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">高度</p>
            <p className="font-medium">{cragData.height}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">接近時間</p>
            <p className="font-medium">{cragData.approach}</p>
          </div>
        </div>

        <div className="space-y-4 text-gray-700">
          <p>{cragData.description}</p>
          <p>
            這裡是岩場的詳細介紹。包含岩場的地理、地質、生態環境等特性，以及歷史與發展。這段文字包含了層岩的形成過程、地質特性、路線類型、適合攀岩的人群等資訊。
          </p>
        </div>
      </div>

      {/* YouTube 影片介紹 */}
      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">影片介紹</h2>
        <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg bg-gray-100">
          <iframe
            src={cragData.videoUrl}
            title="岩場介紹影片"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-[400px] w-full"
          ></iframe>
        </div>
      </div>

      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">最佳攀岩季節</h2>
        <div className="mb-6 grid grid-cols-4 gap-2">
          {['春', '夏', '秋', '冬'].map((season) => (
            <div
              key={season}
              className={`rounded-lg border p-4 text-center ${
                cragData.seasons.includes(season)
                  ? 'border-yellow-200 bg-yellow-50 text-[#1B1A1A]'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              {season}季
            </div>
          ))}
        </div>
        <div className="mb-6 text-gray-700">
          <p>
            龍洞最適合的攀岩季節是春季、秋季和冬季。夏季由於溫度較高且潮濕，岩壁容易有水氣，不太適合攀岩活動。
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">交通資訊</h2>
        <div className="mb-6 space-y-4">
          {cragData.transportation.map((transport, index) => (
            <div key={index} className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-start">
                <Car size={20} className="mr-3 mt-0.5 text-[#1B1A1A]" />
                <div>
                  <h4 className="mb-1 text-lg font-bold">{transport.type}</h4>
                  <p className="text-gray-700">{transport.description}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-start">
              <MapPin size={20} className="mr-3 mt-0.5 text-[#1B1A1A]" />
              <div>
                <h4 className="mb-1 text-lg font-bold">停車資訊</h4>
                <p className="text-gray-700">{cragData.parking}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">附近設施</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cragData.amenities.map((amenity, index) => (
            <div key={index} className="flex items-center rounded-lg bg-gray-50 p-4">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <Info size={20} className="text-[#1B1A1A]" />
              </div>
              <span className="text-gray-700">{amenity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
