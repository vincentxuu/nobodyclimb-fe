'use client'

import { useState, useEffect } from 'react'
import { Cloud } from 'lucide-react'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  icon: string
}

export function WeatherInfo() {
  const [weather, setWeather] = useState<WeatherData>({
    location: '臺北市',
    temperature: 16,
    condition: '陰短暫雨 稍有寒意',
    icon: 'cloud-rain'
  })
  
  // 在實際應用中，這裡可以添加獲取真實天氣資料的邏輯
  // useEffect(() => {
  //   async function fetchWeather() {
  //     try {
  //       const response = await fetch('https://api.example.com/weather')
  //       const data = await response.json()
  //       setWeather(data)
  //     } catch (error) {
  //       console.error('Failed to fetch weather data:', error)
  //     }
  //   }
  //   
  //   fetchWeather()
  // }, [])
  
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-1">
        <Cloud className="h-5 w-5 text-white" />
        <span className="text-xl font-medium tracking-[0.02em] text-white">{weather.temperature}°C</span>
      </div>
      <div className="ml-2 flex flex-col">
        <span className="text-xs font-medium tracking-[0.01em] text-white">{weather.location}</span>
        <span className="text-xs font-light text-white">{weather.condition}</span>
      </div>
    </div>
  )
}
