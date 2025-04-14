"use client";

import React from "react";
import { MapPin } from "lucide-react";

interface MapCardProps {
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export const CragMapCard: React.FC<MapCardProps> = ({ coordinates }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold flex items-center mb-4">
        <MapPin size={20} className="mr-2 text-[#1B1A1A]" />
        位置地圖
      </h3>
      <div className="relative h-64 w-full mb-4 bg-gray-200 rounded-lg">
        {/* 這裡實際使用時可以整合 Google Maps 或其他地圖服務 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-600">地圖載入中...</p>
          <p className="text-xs text-gray-400 absolute bottom-2 left-2">
            座標: {coordinates.latitude}, {coordinates.longitude}
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        <button className="bg-[#1B1A1A] hover:bg-black text-white px-4 py-2 rounded-md transition flex-1 mr-2">
          導航前往
        </button>
        <button className="bg-gray-100 hover:bg-gray-200 text-[#1B1A1A] px-4 py-2 rounded-md transition flex-1 ml-2">
          查看完整地圖
        </button>
      </div>
    </div>
  );
};