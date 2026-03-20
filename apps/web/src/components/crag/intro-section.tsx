'use client'

import React from 'react'
import { Car, MapPin, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('CragPage')

  const seasons = [
    { key: '春', label: t('seasonSpring'), suffix: t('seasonSuffix') },
    { key: '夏', label: t('seasonSummer'), suffix: t('seasonSuffix') },
    { key: '秋', label: t('seasonAutumn'), suffix: t('seasonSuffix') },
    { key: '冬', label: t('seasonWinter'), suffix: t('seasonSuffix') },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">{t('cragIntro')}</h2>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">{t('introRockType')}</p>
            <p className="font-medium">{cragData.rockType}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">{t('introRouteCount')}</p>
            <p className="font-medium">{cragData.routes}+</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">{t('introDifficultyRange')}</p>
            <p className="font-medium">{cragData.difficulty}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">{t('introHeight')}</p>
            <p className="font-medium">{cragData.height}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-1 text-sm text-gray-500">{t('introApproachTime')}</p>
            <p className="font-medium">{cragData.approach}</p>
          </div>
        </div>

        <div className="space-y-4 text-gray-700">
          <p>{cragData.description}</p>
        </div>
      </div>

      {/* YouTube 影片介紹 */}
      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">{t('videoIntroTitle')}</h2>
        <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg bg-gray-100">
          <iframe
            src={cragData.videoUrl}
            title={t('videoIntroIframeTitle')}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-[400px] w-full"
          ></iframe>
        </div>
      </div>

      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">{t('bestSeasonTitle')}</h2>
        <div className="mb-6 grid grid-cols-4 gap-2">
          {seasons.map(({ key, label, suffix }) => (
            <div
              key={key}
              className={`rounded-lg border p-4 text-center ${
                cragData.seasons.includes(key)
                  ? 'border-yellow-200 bg-yellow-50 text-[#1B1A1A]'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              {label}{suffix}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">{t('transportInfoTitle')}</h2>
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
                <h4 className="mb-1 text-lg font-bold">{t('parkingInfoTitle')}</h4>
                <p className="text-gray-700">{cragData.parking}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">{t('nearbyFacilitiesTitle')}</h2>
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
