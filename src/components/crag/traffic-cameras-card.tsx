'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Camera, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface CameraData {
  camid: string
  camname: string
  camuri: string
  location: string
  latitude: number
  longitude: number
  direction?: string
}

interface TrafficCamerasCardProps {
  latitude: number
  longitude: number
}

export const TrafficCamerasCard: React.FC<TrafficCamerasCardProps> = ({
  latitude,
  longitude,
}) => {
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCamera, setSelectedCamera] = useState<CameraData | null>(null)
  const [serviceMessage, setServiceMessage] = useState<string | null>(null)

  const fetchCameras = useCallback(async () => {
    setLoading(true)
    setServiceMessage(null)

    try {
      // 直接從瀏覽器呼叫 1968 API（繞過伺服器端代理避免被阻擋）
      const apiUrl = `https://www.1968services.tw/query-cam-list-by-coordinate/${latitude}/${longitude}`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error('無法取得攝影機資料')
      }

      // 檢查回應是否為 JSON
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error('API 回傳格式錯誤')
      }

      const cameraList = (await response.json()) as CameraData[]
      setCameras(cameraList.slice(0, 6)) // 最多顯示 6 個攝影機

      if (cameraList.length > 0) {
        setSelectedCamera(cameraList[0])
      }
    } catch (err) {
      console.error('Failed to fetch traffic cameras:', err)
      // 發生錯誤時設置服務訊息而非錯誤（更友善的使用者體驗）
      setServiceMessage('路況攝影機服務暫時無法使用')
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    fetchCameras()
  }, [fetchCameras])

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 flex items-center text-xl font-bold">
          <Camera size={20} className="mr-2 text-[#1B1A1A]" />
          即時路況攝影機
        </h3>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">載入中...</span>
        </div>
      </div>
    )
  }

  if (cameras.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 flex items-center text-xl font-bold">
          <Camera size={20} className="mr-2 text-[#1B1A1A]" />
          即時路況攝影機
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="mb-2 h-8 w-8 text-gray-400" />
          <p className="mb-2 text-gray-500">
            {serviceMessage || '附近沒有可用的路況攝影機'}
          </p>
          <a
            href="https://www.1968.gov.tw/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
          >
            前往 1968 路況服務查看
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center text-xl font-bold">
          <Camera size={20} className="mr-2 text-[#1B1A1A]" />
          即時路況攝影機
        </h3>
        <a
          href="https://www.1968.gov.tw/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          1968 路況服務
          <ExternalLink size={14} />
        </a>
      </div>

      {/* 選中的攝影機影像 */}
      {selectedCamera && (
        <div className="mb-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
            <img
              src={selectedCamera.camuri}
              alt={selectedCamera.camname}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle"%3E無法載入影像%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {selectedCamera.camname}
            {selectedCamera.direction && ` - ${selectedCamera.direction}`}
          </p>
        </div>
      )}

      {/* 攝影機列表 */}
      <div className="grid grid-cols-3 gap-2">
        {cameras.map((camera) => (
          <button
            key={camera.camid}
            onClick={() => setSelectedCamera(camera)}
            className={`overflow-hidden rounded-lg border-2 transition-all ${
              selectedCamera?.camid === camera.camid
                ? 'border-[#FFE70C]'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="relative aspect-video w-full bg-gray-800">
              <img
                src={camera.camuri}
                alt={camera.camname}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23333" width="200" height="150"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle"%3E無影像%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>
            <p className="truncate bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {camera.camname}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
