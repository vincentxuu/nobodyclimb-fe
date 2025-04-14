"use client";

import React from "react";
import { Cloud, Umbrella } from "lucide-react";

interface WeatherType {
  current: {
    temp: number;
    condition: string;
    precipitation: string;
    wind: string;
  };
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    precipitation: string;
  }>;
}

interface CragWeatherCardProps {
  weather: WeatherType;
}

export const CragWeatherCard: React.FC<CragWeatherCardProps> = ({ weather }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold flex items-center mb-4">
        <Cloud size={20} className="mr-2 text-[#1B1A1A]" />
        即時天氣
      </h3>
      
      <div className="flex justify-between items-center mb-6">
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
      
      <h4 className="font-medium mb-3">未來天氣預報</h4>
      <div className="space-y-3">
        {weather.forecast.map((day, index) => (
          <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
            <span>{day.day}</span>
            <div className="flex items-center">
              <span className="text-gray-700 mr-3">{day.condition}</span>
              <span>{day.low}° / {day.high}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};