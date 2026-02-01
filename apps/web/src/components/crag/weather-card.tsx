'use client'

import React from 'react'
import { Cloud, Umbrella } from 'lucide-react'

interface WeatherType {
  current: {
    temp: number
    condition: string
    precipitation: string
    wind: string
  }
  forecast: Array<{
    day: string
    high: number
    low: number
    condition: string
    precipitation: string
  }>
}

interface CragWeatherCardProps {
  weather: WeatherType
}

export const CragWeatherCard: React.FC<CragWeatherCardProps> = ({ weather }) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 flex items-center text-xl font-bold">
        <Cloud size={20} className="mr-2 text-[#1B1A1A]" />
        即時天氣
      </h3>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold">{weather.current.temp}°C</p>
          <p className="text-gray-600">{weather.current.condition}</p>
        </div>
        <div className="text-right">
          <p className="flex items-center text-gray-700">
            <Umbrella size={16} className="mr-1" />
            降雨機率: {weather.current.precipitation}
          </p>
          <p className="text-gray-700">{weather.current.wind}</p>
        </div>
      </div>

      <h4 className="mb-3 font-medium">未來天氣預報</h4>
      <div className="space-y-3">
        {weather.forecast.map((day, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded p-2 hover:bg-gray-50"
          >
            <span>{day.day}</span>
            <div className="flex items-center">
              <span className="mr-3 text-gray-700">{day.condition}</span>
              <span>
                {day.low}° / {day.high}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
