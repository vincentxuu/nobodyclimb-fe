'use client'

import Link from 'next/link'
import { MapPin, ExternalLink } from 'lucide-react'
import PlaceholderImage from '@/components/ui/placeholder-image'
import { WeatherDisplay } from '@/components/shared/weather-display'
import { TrafficCamerasCard } from '@/components/crag/traffic-cameras-card'
import { YouTubeLiveCard } from '@/components/crag/youtube-live-card'

export interface CragInfoData {
  id: string
  name: string
  englishName: string
  location: string
  description: string
  type: string
  rockType: string
  routes: number
  difficulty: string
  height: string
  approach: string
  transportation: Array<{ type: string; description: string }>
  parking: string
  amenities: string[]
  geoCoordinates: { latitude: number; longitude: number }
  weatherLocation: string
  liveVideoId?: string
  liveVideoTitle?: string
  liveVideoDescription?: string
  images: string[]
  areas: Array<{
    id: string
    name: string
    difficulty: string
    routes: number
  }>
}

interface CragInfoPanelProps {
  crag: CragInfoData
}

export function CragInfoPanel({ crag }: CragInfoPanelProps) {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-6 lg:p-8">
        {/* 照片展示區 */}
        <div className="mb-8">
          <div className="relative mb-2 h-64 w-full overflow-hidden rounded-lg lg:h-80">
            <PlaceholderImage
              text={`${crag.name} 場景圖`}
              bgColor="#333"
              textColor="#fff"
            />
          </div>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
            {crag.images.slice(0, 5).map((photo, index) => (
              <div
                key={index}
                className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md lg:h-20 lg:w-20"
              >
                <PlaceholderImage text={`${index + 1}`} bgColor="#444" textColor="#fff" />
              </div>
            ))}
          </div>
        </div>

        {/* 岩場介紹 */}
        <div className="mb-8">
          <div className="mb-1">
            <h2 className="text-lg font-medium text-orange-500">岩場介紹</h2>
            <div className="h-px w-full bg-gray-200"></div>
          </div>
          <div className="mt-4 whitespace-pre-line text-base text-gray-700">
            {crag.description}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 岩場基本資訊 */}
          <div className="mb-6">
            <div className="mb-1">
              <h2 className="text-lg font-medium text-orange-500">岩場基本資訊</h2>
              <div className="h-px w-full bg-gray-200"></div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex">
                <span className="w-28 text-gray-500">岩場類型：</span>
                <span>{crag.type}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-gray-500">岩石類型：</span>
                <span>{crag.rockType}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-gray-500">路線數量：</span>
                <span>~{crag.routes}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-gray-500">難度範圍：</span>
                <span>{crag.difficulty}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-gray-500">岩壁高度：</span>
                <span>{crag.height}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-gray-500">步行時間：</span>
                <span>{crag.approach}</span>
              </div>
            </div>
          </div>

          {/* 交通方式 */}
          <div className="mb-6">
            <div className="mb-1">
              <h2 className="text-lg font-medium text-orange-500">交通方式</h2>
              <div className="h-px w-full bg-gray-200"></div>
            </div>
            <div className="mt-4 space-y-3">
              {crag.transportation.map((item, index) => (
                <div key={index} className="flex">
                  <span className="w-20 flex-shrink-0 text-gray-500">{item.type}：</span>
                  <span className="flex-1">{item.description}</span>
                </div>
              ))}
              <div className="flex pt-2">
                <span className="w-20 flex-shrink-0 text-gray-500">停車：</span>
                <span className="flex-1">{crag.parking}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 岩場位置地圖 */}
        <div className="mb-6">
          <div className="mb-1">
            <h2 className="text-lg font-medium text-orange-500">岩場位置</h2>
            <div className="h-px w-full bg-gray-200"></div>
          </div>
          {crag.geoCoordinates.latitude && crag.geoCoordinates.longitude ? (
            <div className="mt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${crag.geoCoordinates.latitude},${crag.geoCoordinates.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <MapPin size={14} />
                在 Google Maps 開啟
                <ExternalLink size={12} />
              </a>
              <div className="overflow-hidden rounded-lg">
                <iframe
                  src={`https://www.google.com/maps?q=${crag.geoCoordinates.latitude},${crag.geoCoordinates.longitude}&z=15&output=embed`}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${crag.name} 地圖`}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-gray-200">
              <span className="text-gray-500">地圖資訊不可用</span>
            </div>
          )}
        </div>

        {/* 岩場設施 */}
        <div className="mb-6">
          <div className="mb-1">
            <h2 className="text-lg font-medium text-orange-500">岩場設施</h2>
            <div className="h-px w-full bg-gray-200"></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {crag.amenities.map((item, index) => (
              <span
                key={index}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* 天氣預報資訊 */}
        <div className="mb-6">
          <div className="mb-1">
            <h2 className="text-lg font-medium text-orange-500">天氣預報</h2>
            <div className="h-px w-full bg-gray-200"></div>
          </div>
          <div className="mt-4">
            <WeatherDisplay
              location={crag.weatherLocation}
              latitude={crag.geoCoordinates.latitude}
              longitude={crag.geoCoordinates.longitude}
              showForecast={true}
            />
          </div>
        </div>

        {/* 即時路況與影像 */}
        <div className="mb-6">
          <div className="mb-1">
            <h2 className="text-lg font-medium text-orange-500">即時路況與影像</h2>
            <div className="h-px w-full bg-gray-200"></div>
          </div>
          <div className={`mt-4 grid grid-cols-1 gap-6 ${crag.liveVideoId ? 'lg:grid-cols-2' : ''}`}>
            <TrafficCamerasCard
              latitude={crag.geoCoordinates.latitude}
              longitude={crag.geoCoordinates.longitude}
            />
            {crag.liveVideoId && (
              <YouTubeLiveCard
                videoId={crag.liveVideoId}
                title={crag.liveVideoTitle}
                description={crag.liveVideoDescription}
              />
            )}
          </div>
        </div>

        {/* 相關區域 */}
        {crag.areas.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="mb-6 text-xl font-medium">攀岩區域</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {crag.areas.map((area, index) => (
                <Link
                  key={area.id || index}
                  href={`/crag/${crag.id}/area/${area.id}`}
                  prefetch={false}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-[#FFE70C] hover:shadow"
                >
                  <div className="relative h-32">
                    <PlaceholderImage text={area.name} bgColor="#f8f9fa" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium group-hover:text-[#1B1A1A]">
                      {area.name}
                    </h3>
                    <div className="mt-1 text-xs text-gray-500">
                      {area.difficulty} · {area.routes}條路線
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
