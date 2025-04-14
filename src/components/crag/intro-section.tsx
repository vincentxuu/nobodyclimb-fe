"use client";

import React from "react";
import { Facebook, Twitter, Youtube, Car, MapPin, Info } from "lucide-react";

interface Transportation {
  type: string;
  description: string;
}

interface CragData {
  rockType: string;
  routes: number;
  difficulty: string;
  height: string;
  approach: string;
  description: string;
  videoUrl: string;
  seasons: string[];
  transportation: Transportation[];
  parking: string;
  amenities: string[];
}

interface CragIntroSectionProps {
  cragData: CragData;
}

export const CragIntroSection: React.FC<CragIntroSectionProps> = ({ cragData }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6 border-l-4 border-[#FFE70C] pl-4">岩場介紹</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">岩石類型</p>
            <p className="font-medium">{cragData.rockType}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">路線數量</p>
            <p className="font-medium">{cragData.routes}+</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">難度範圍</p>
            <p className="font-medium">{cragData.difficulty}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">高度</p>
            <p className="font-medium">{cragData.height}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">接近時間</p>
            <p className="font-medium">{cragData.approach}</p>
          </div>
        </div>

        <div className="text-gray-700 space-y-4">
          <p>{cragData.description}</p>
          <p>這裡是岩場的詳細介紹。包含岩場的地理、地質、生態環境等特性，以及歷史與發展。這段文字包含了層岩的形成過程、地質特性、路線類型、適合攀岩的人群等資訊。</p>
        </div>
      </div>
      
      {/* YouTube 影片介紹 */}
      <div>
        <h2 className="text-2xl font-bold mb-6 border-l-4 border-[#FFE70C] pl-4">影片介紹</h2>
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
          <iframe 
            src={cragData.videoUrl}
            title="岩場介紹影片"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-[400px]"
          ></iframe>
        </div>
        <div className="flex justify-end space-x-4 mt-4">
          <button className="flex items-center text-gray-700 hover:text-[#1B1A1A]">
            <Facebook size={18} className="mr-1" />
            分享
          </button>
          <button className="flex items-center text-gray-700 hover:text-[#1B1A1A]">
            <Twitter size={18} className="mr-1" />
            推文
          </button>
          <button className="flex items-center text-gray-700 hover:text-[#1B1A1A]">
            <Youtube size={18} className="mr-1" />
            YouTube
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6 border-l-4 border-[#FFE70C] pl-4">最佳攀岩季節</h2>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {["春", "夏", "秋", "冬"].map((season) => (
            <div 
              key={season}
              className={`p-4 text-center rounded-lg border ${
                cragData.seasons.includes(season) 
                  ? "bg-yellow-50 border-yellow-200 text-[#1B1A1A]" 
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}
            >
              {season}季
            </div>
          ))}
        </div>
        <div className="text-gray-700 mb-6">
          <p>龍洞最適合的攀岩季節是春季、秋季和冬季。夏季由於溫度較高且潮濕，岩壁容易有水氣，不太適合攀岩活動。</p>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6 border-l-4 border-[#FFE70C] pl-4">交通資訊</h2>
        <div className="space-y-4 mb-6">
          {cragData.transportation.map((transport, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Car size={20} className="text-[#1B1A1A] mt-0.5 mr-3" />
                <div>
                  <h4 className="font-bold text-lg mb-1">{transport.type}</h4>
                  <p className="text-gray-700">{transport.description}</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <MapPin size={20} className="text-[#1B1A1A] mt-0.5 mr-3" />
              <div>
                <h4 className="font-bold text-lg mb-1">停車資訊</h4>
                <p className="text-gray-700">{cragData.parking}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6 border-l-4 border-[#FFE70C] pl-4">附近設施</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cragData.amenities.map((amenity, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <Info size={20} className="text-[#1B1A1A]" />
              </div>
              <span className="text-gray-700">{amenity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};