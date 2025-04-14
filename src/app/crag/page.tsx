"use client";

import React, { useState } from "react";
import PlaceholderImage from "@/components/ui/placeholder-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Filter, MapPin, Calendar, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Breadcrumb } from '@/components/ui/breadcrumb'

// 岩場資料（這裡使用模擬資料，實際應用中可能來自API）
const crags = [
  {
    id: 1,
    name: "龍洞",
    englishName: "Long Dong",
    image: "/images/crag/longdong.jpg",
    location: "新北市貢寮區",
    type: "海蝕岩場",
    routes: 500,
    difficulty: "5.6 - 5.13a",
    seasons: ["春", "秋", "冬"],
  },
  {
    id: 2,
    name: "大砲岩",
    englishName: "Cannon Rock",
    image: "/images/crag/cannon.jpg",
    location: "新北市景美區",
    type: "砂岩岩場",
    routes: 120,
    difficulty: "5.8 - 5.12c",
    seasons: ["秋", "冬"],
  },
  {
    id: 3,
    name: "慈母峰",
    englishName: "Queen Peak",
    image: "/images/crag/queen.jpg",
    location: "新北市三峽區",
    type: "砂岩岩場",
    routes: 80,
    difficulty: "5.7 - 5.11b",
    seasons: ["秋", "冬"],
  },
  {
    id: 4,
    name: "小粗坑",
    englishName: "Xiao Cu Keng",
    image: "/images/crag/xiaocukeng.jpg",
    location: "新北市新店區",
    type: "砂岩岩場",
    routes: 65,
    difficulty: "5.9 - 5.12a",
    seasons: ["秋", "冬"],
  },
  {
    id: 5,
    name: "獅頭山",
    englishName: "Lion Head",
    image: "/images/crag/lionhead.jpg",
    location: "桃園市龍潭區",
    type: "砂岩岩場",
    routes: 45,
    difficulty: "5.7 - 5.11c",
    seasons: ["秋", "冬"],
  },
  {
    id: 6,
    name: "鼻頭角",
    englishName: "Bitou Cape",
    image: "/images/crag/bitou.jpg",
    location: "新北市瑞芳區",
    type: "海蝕岩場",
    routes: 30,
    difficulty: "5.8 - 5.12a",
    seasons: ["春", "秋"],
  },
];

// 區域篩選選項
const regions = ["全部", "台北", "新北", "桃園", "宜蘭", "花蓮", "台東", "高雄"];

// 岩石類型篩選選項
const rockTypes = ["全部", "砂岩", "石灰岩", "海蝕岩", "花崗岩"];

// 難度篩選選項
const difficultyLevels = ["全部", "入門 (5.5-5.8)", "初級 (5.9-5.10c)", "中級 (5.10d-5.11c)", "高級 (5.11d+)"];

// 季節篩選選項
const seasonOptions = ["全部", "春", "夏", "秋", "冬"];

export default function CragListPage() {
  const [selectedRegion, setSelectedRegion] = useState("全部");
  const [selectedRockType, setSelectedRockType] = useState("全部");
  const [selectedDifficulty, setSelectedDifficulty] = useState("全部");
  const [selectedSeason, setSelectedSeason] = useState("全部");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    region: true,
    rockType: true,
    difficulty: false,
    season: false
  });

  // 切換篩選展開狀態
  const toggleFilter = (filter: 'region' | 'rockType' | 'difficulty' | 'season') => {
    setExpandedFilters({
      ...expandedFilters,
      [filter]: !expandedFilters[filter]
    });
  };

  // 篩選岩場
  const filteredCrags = crags.filter((crag) => {
    const regionMatch = selectedRegion === "全部" || crag.location.includes(selectedRegion);
    const typeMatch = selectedRockType === "全部" || crag.type.includes(selectedRockType);
    const seasonMatch = selectedSeason === "全部" || crag.seasons.includes(selectedSeason);
    // 由於難度比較複雜，這裡簡化處理
    const difficultyMatch = selectedDifficulty === "全部"; // 實際應用中需要更複雜的邏輯
    
    return regionMatch && typeMatch && seasonMatch && difficultyMatch;
  });

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* 頂部橫幅 */}
      <div className="relative h-[40vh] md:h-[50vh] bg-gray-900 overflow-hidden">
        <PlaceholderImage 
          text="台灣岩場探索" 
          bgColor="#242424" 
          textColor="#fff"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
        <div className="container mx-auto absolute bottom-0 left-0 right-0 p-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">探索岩場</h1>
            <p className="text-lg md:text-xl max-w-3xl opacity-90">
              發現台灣各地最佳攀岩地點，從海蝕岩場到山區砂岩，適合各級攀岩者的完美岩點。
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '岩場' }
            ]}
          />
        </div>

        {/* 篩選區塊 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <Filter size={20} className="mr-2 text-[#1B1A1A]" />
              篩選岩場
            </h2>
            <button 
              className="md:hidden flex items-center text-[#1B1A1A] font-medium px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              {isFilterOpen ? "收起篩選" : "展開篩選"}
            </button>
          </div>
          
          <div className={`${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="space-y-6">
              {/* 地區篩選 */}
              <div className="border-b pb-4">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFilter('region')}
                >
                  <h3 className="text-gray-800 font-medium">地區</h3>
                  {expandedFilters.region ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </div>
                
                {expandedFilters.region && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {regions.map((region) => (
                      <button
                        key={region}
                        className={`px-4 py-1.5 text-sm transition border-b-2 ${
                          selectedRegion === region
                            ? "border-[#1B1A1A] text-[#1B1A1A] font-medium"
                            : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => setSelectedRegion(region)}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 岩石類型篩選 */}
              <div className="border-b pb-4">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFilter('rockType')}
                >
                  <h3 className="text-gray-800 font-medium">岩石類型</h3>
                  {expandedFilters.rockType ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </div>
                
                {expandedFilters.rockType && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {rockTypes.map((type) => (
                      <button
                        key={type}
                        className={`px-4 py-1.5 text-sm transition border-b-2 ${
                          selectedRockType === type
                            ? "border-[#1B1A1A] text-[#1B1A1A] font-medium"
                            : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => setSelectedRockType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 難度範圍篩選 */}
              <div className="border-b pb-4">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFilter('difficulty')}
                >
                  <h3 className="text-gray-800 font-medium">難度範圍</h3>
                  {expandedFilters.difficulty ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </div>
                
                {expandedFilters.difficulty && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {difficultyLevels.map((level) => (
                      <button
                        key={level}
                        className={`px-4 py-1.5 text-sm transition border-b-2 ${
                          selectedDifficulty === level
                            ? "border-[#1B1A1A] text-[#1B1A1A] font-medium"
                            : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => setSelectedDifficulty(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 季節篩選 */}
              <div>
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFilter('season')}
                >
                  <h3 className="text-gray-800 font-medium">季節</h3>
                  {expandedFilters.season ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </div>
                
                {expandedFilters.season && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {seasonOptions.map((season) => (
                      <button
                        key={season}
                        className={`px-4 py-1.5 text-sm transition border-b-2 ${
                          selectedSeason === season
                            ? "border-[#1B1A1A] text-[#1B1A1A] font-medium"
                            : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => setSelectedSeason(season)}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 清除篩選按鈕 */}
            <div className="mt-6 text-center">
              <button 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-[#1B1A1A] font-medium px-4 py-2 rounded-md transition"
                onClick={() => {
                  setSelectedRegion("全部");
                  setSelectedRockType("全部");
                  setSelectedDifficulty("全部");
                  setSelectedSeason("全部");
                }}
              >
                清除所有篩選
              </button>
            </div>
          </div>
        </div>

        {/* 搜尋結果 */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            找到 <span className="font-medium text-gray-900">{filteredCrags.length}</span> 個岩場
          </p>
          <div className="flex items-center space-x-4">
            <select className="p-2 border border-gray-200 rounded-md text-sm text-gray-600 bg-white">
              <option value="recommend">推薦排序</option>
              <option value="name">名稱排序</option>
              <option value="routes-high">路線數量 (高到低)</option>
              <option value="routes-low">路線數量 (低到高)</option>
            </select>
          </div>
        </div>

        {/* 岩場列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrags.map((crag) => (
            <motion.div
              key={crag.id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link href={`/crag/${crag.id}`} className="block h-full">
                <div className="relative h-48 w-full">
                  <PlaceholderImage 
                    text={crag.name} 
                    bgColor="#E0F2FE"
                  />
                  <div className="absolute top-4 right-4 bg-[#FFE70C] text-black text-xs font-bold px-2.5 py-1 rounded">
                    {crag.type}
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">{crag.name}</h3>
                    <p className="text-gray-500">{crag.englishName}</p>
                  </div>
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center text-gray-700">
                      <MapPin size={16} className="mr-2 text-gray-400" />
                      <span>{crag.location}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      <span>最佳季節: {crag.seasons.join(", ")}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock size={16} className="mr-2 text-gray-400" />
                      <span>接近時間: 15-30分鐘</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">難度範圍</p>
                      <p className="font-medium">{crag.difficulty}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">路線數量</p>
                      <p className="font-medium">{crag.routes}+</p>
                    </div>
                  </div>
                  
                  <button className="w-full bg-[#1B1A1A] hover:bg-black text-white py-2 rounded-md transition font-medium">
                    查看詳情
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        
        {/* 無結果提示 */}
        {filteredCrags.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm my-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#FFE70C] rounded-full flex items-center justify-center">
                <Filter size={24} className="text-[#1B1A1A]" />
              </div>
            </div>
            <p className="text-gray-600 text-xl mb-3">沒有找到符合條件的岩場</p>
            <p className="text-gray-500 mb-6">請嘗試調整篩選條件</p>
            <button 
              className="px-6 py-2 bg-[#1B1A1A] hover:bg-black text-white font-medium rounded-md transition"
              onClick={() => {
                setSelectedRegion("全部");
                setSelectedRockType("全部");
                setSelectedDifficulty("全部");
                setSelectedSeason("全部");
              }}
            >
              清除篩選條件
            </button>
          </div>
        )}

        {/* 加載更多按鈕 */}
        {filteredCrags.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-[#1B1A1A] font-medium rounded-md transition">
              載入更多岩場
            </button>
          </div>
        )}
      </div>
      
      {/* 使用自定義的回到頂部按鈕，調整顏色 */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="p-3 bg-[#1B1A1A] text-white rounded-full shadow-lg hover:bg-black transition-all duration-300"
          aria-label="回到頂部"
        >
          <ChevronUp size={24} />
        </button>
      </div>
    </main>
  );
}