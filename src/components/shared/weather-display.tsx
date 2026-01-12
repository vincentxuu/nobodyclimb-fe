'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Cloud, Droplets, ThermometerSun, Loader2, AlertCircle } from 'lucide-react'
import { weatherService } from '@/lib/api/services'
import { Weather } from '@/lib/types'

interface WeatherDisplayProps {
  location: string
  latitude?: number
  longitude?: number
  compact?: boolean
  showForecast?: boolean
  className?: string
}

// 預報時段數常數（7天 × 2時段）
const FORECAST_PERIODS = 14

// 星期常數
const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

// 格式化數值顯示，null 時顯示 "--"
function formatTemp(value: number | null): string {
  return value !== null ? `${value}` : '--'
}

function formatPercent(value: number | null): string {
  return value !== null ? `${value}%` : '--%'
}

// 根據天氣狀況選擇圖標顏色
function getWeatherColor(condition: string | null): string {
  if (!condition) return 'text-gray-600'
  if (condition.includes('晴')) return 'text-yellow-500'
  if (condition.includes('雨')) return 'text-blue-500'
  if (condition.includes('陰') || condition.includes('雲')) return 'text-gray-500'
  if (condition.includes('雷')) return 'text-purple-500'
  return 'text-gray-600'
}

// 格式化日期顯示（含早晚時段）
function formatForecastDate(
  dateString: string,
  index: number,
  todayStr: string,
  tomorrowStr: string
): string {
  const date = new Date(dateString)
  const period = index % 2 === 0 ? '早' : '晚'

  let dayLabel: string
  if (date.toDateString() === todayStr) {
    dayLabel = '今天'
  } else if (date.toDateString() === tomorrowStr) {
    dayLabel = '明天'
  } else {
    dayLabel = WEEKDAYS[date.getDay()]
  }

  return `${dayLabel}${period}`
}

// 格式化天氣狀況顯示
function formatCondition(condition: string | null, maxLength?: number): string {
  if (!condition) return '未知'
  if (maxLength && condition.length > maxLength) {
    return condition.slice(0, maxLength)
  }
  return condition
}

export function WeatherDisplay({
  location,
  latitude,
  longitude,
  compact = false,
  showForecast = true,
  className = '',
}: WeatherDisplayProps) {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 預先計算今天和明天的日期字串，避免在每次迭代中重複計算
  const { todayStr, tomorrowStr } = useMemo(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return {
      todayStr: today.toDateString(),
      tomorrowStr: tomorrow.toDateString(),
    }
  }, [])

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        let response
        // 優先使用地址字串（若包含區域資訊如「區」、「鄉」、「鎮」）
        // 因為地址字串通常包含更精確的縣市區域資訊
        const hasDistrictInfo = location && /[區鄉鎮]/.test(location)
        if (hasDistrictInfo) {
          response = await weatherService.getWeatherByLocation(location)
        } else if (latitude && longitude) {
          response = await weatherService.getWeatherByCoordinates(latitude, longitude)
        } else {
          response = await weatherService.getWeatherByLocation(location)
        }

        if (response.success && response.data) {
          setWeather(response.data)
        } else {
          setError(response.message || '無法取得天氣資料')
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err)
        setError('無法連接天氣服務')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [location, latitude, longitude])

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">載入天氣資料...</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className={`flex items-center p-4 text-gray-500 ${className}`}>
        <AlertCircle className="h-5 w-5 text-gray-400" />
        <span className="ml-2 text-sm">{error || '無法取得天氣資料'}</span>
      </div>
    )
  }

  // 精簡模式
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 ${className}`}>
        <Cloud className={`h-5 w-5 ${getWeatherColor(weather.condition)}`} />
        <span className="text-lg font-medium">{formatTemp(weather.temperature)}°C</span>
        <div className="border-l border-gray-300 pl-2">
          <span className="text-sm text-gray-600">{formatCondition(weather.condition)}</span>
          <div className="flex items-center text-xs text-gray-500">
            <Droplets className="mr-1 h-3 w-3" />
            {formatPercent(weather.precipitation)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg bg-gray-100 p-6 ${className}`}>
      {/* 目前天氣 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-full bg-white p-2 ${getWeatherColor(weather.condition)}`}>
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{formatTemp(weather.temperature)}°C</p>
            <p className="text-sm text-gray-600">{weather.location}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium text-gray-700">{formatCondition(weather.condition)}</p>
          <div className="flex items-center justify-end gap-3 text-sm text-gray-500">
            <span className="flex items-center">
              <ThermometerSun className="mr-1 h-4 w-4" />
              {formatTemp(weather.minTemp)}° / {formatTemp(weather.maxTemp)}°
            </span>
            <span className="flex items-center">
              <Droplets className="mr-1 h-4 w-4" />
              {formatPercent(weather.precipitation)}
            </span>
          </div>
          {weather.comfort && (
            <p className="mt-1 text-xs text-gray-500">{weather.comfort}</p>
          )}
        </div>
      </div>

      {/* 天氣預報 */}
      {showForecast && weather.forecast.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">未來七天天氣</h4>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {weather.forecast.slice(0, FORECAST_PERIODS).map((day, index) => (
              <div
                key={`${day.date}-${index}`}
                className="rounded-lg bg-white p-2 text-center"
              >
                <p className="text-xs font-medium text-gray-600">
                  {formatForecastDate(day.date, index, todayStr, tomorrowStr)}
                </p>
                <p className={`my-1 text-xs ${getWeatherColor(day.condition)}`}>
                  {formatCondition(day.condition, 4)}
                </p>
                <p className="text-sm font-medium">
                  {formatTemp(day.minTemp)}° / {formatTemp(day.maxTemp)}°
                </p>
                <p className="flex items-center justify-center text-xs text-blue-500">
                  <Droplets className="mr-0.5 h-3 w-3" />
                  {formatPercent(day.precipitation)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
