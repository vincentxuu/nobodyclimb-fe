'use client'

import React from 'react'
import { MapPin, ExternalLink } from 'lucide-react'

interface MapCardProps {
  googleMapsUrl: string
  cragName?: string
}

export const CragMapCard: React.FC<MapCardProps> = ({ googleMapsUrl, cragName }) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 flex items-center text-xl font-bold">
        <MapPin size={20} className="mr-2 text-[#1B1A1A]" />
        位置地圖
      </h3>
      <div className="relative mb-4 h-64 w-full overflow-hidden rounded-lg bg-gray-100">
        {/* Google Maps 嵌入預覽 */}
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d121!3d25!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDEwJzAwLjAiTiAxMjHCsDEwJzAwLjAiRQ!5e0!3m2!1szh-TW!2stw!4v1600000000000!5m2!1szh-TW!2stw`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={cragName ? `${cragName} 位置地圖` : '位置地圖'}
          className="absolute inset-0"
        />
        {/* 覆蓋層，點擊時開啟 Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/10"
        >
          <span className="sr-only">在 Google Maps 中開啟</span>
        </a>
      </div>
      <div className="flex gap-3">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1B1A1A] px-4 py-2 text-white transition hover:bg-black"
        >
          <MapPin size={18} />
          導航前往
        </a>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-[#1B1A1A] transition hover:bg-gray-200"
        >
          <ExternalLink size={18} />
          查看完整地圖
        </a>
      </div>
    </div>
  )
}
