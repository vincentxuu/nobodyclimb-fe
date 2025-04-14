"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Filter } from "lucide-react";
import BackToTop from "@/components/ui/back-to-top";
import PlaceholderImage from "@/components/ui/placeholder-image";
import { Breadcrumb } from '@/components/ui/breadcrumb'

// 攀岩館資料（模擬資料，實際應用中可能來自API）
const gyms = [
  {
    id: 1,
    name: "小岩攀岩館",
    englishName: "", // 沒有英文名稱
    image: "/images/gym/xiaoya.jpg",
    location: "台北市 內湖區",
    type: "抱石",
    facilities: ["抱石區", "體能訓練區", "休息區"],
    rating: 4.5,
  },
  {
    id: 2,
    name: "市民抱石攀岩館",
    englishName: "Civic Bouldergym Taipei",
    image: "/images/gym/civic.jpg",
    location: "台北市 內湖區",
    type: "抱石",
    facilities: ["抱石區", "體能訓練區", "休息區", "淋浴設施"],
    rating: 4.8,
  },
  {
    id: 3,
    name: "原岩攀岩館",
    englishName: "T-UP Climbing-Zhonghe",
    image: "/images/gym/tup.jpg",
    location: "新北市 中和區",
    type: "上攀和抱石",
    facilities: ["抱石區", "先鋒攀登", "體能訓練區", "休息區"],
    rating: 4.7,
  },
  {
    id: 4,
    name: "POGO 攀岩館",
    englishName: "",
    image: "/images/gym/pogo.jpg",
    location: "台北市 松山區",
    type: "抱石",
    facilities: ["抱石區", "體能訓練區", "休息區", "咖啡廳"],
    rating: 4.6,
  },
  {
    id: 5,
    name: "攀吶攀岩館",
    englishName: "Pamoja Climbing Gym",
    image: "/images/gym/pamoja.jpg",
    location: "新北市 板橋區",
    type: "抱石",
    facilities: ["抱石區", "體能訓練區", "休息區", "淋浴設施"],
    rating: 4.4,
  },
  {
    id: 6,
    name: "奇岩攀岩館",
    englishName: "Wonder Climbing Gym",
    image: "/images/gym/wonder.jpg",
    location: "台北市 大安區",
    type: "上攀和抱石",
    facilities: ["抱石區", "先鋒攀登", "體能訓練區", "兒童區"],
    rating: 4.9,
  },
  {
    id: 7,
    name: "岩究所攀岩館",
    englishName: "Climbing Lab",
    image: "/images/gym/climbinglab.jpg",
    location: "台北市 信義區",
    type: "抱石",
    facilities: ["抱石區", "體能訓練區", "休息區"],
    rating: 4.5,
  },
  {
    id: 8,
    name: "Boulder Space 攀岩館",
    englishName: "",
    image: "/images/gym/boulderspace.jpg",
    location: "台北市 中山區",
    type: "抱石",
    facilities: ["抱石區", "體能訓練區", "休息區", "咖啡廳"],
    rating: 4.7,
  },
  {
    id: 9,
    name: "破舊二廠攀岩館",
    englishName: "Shabby Factory 2",
    image: "/images/gym/shabby2.jpg",
    location: "桃園市 中壢區",
    type: "抱石",
    facilities: ["抱石區", "體能訓練區", "休息區"],
    rating: 4.6,
  },
  {
    id: 10,
    name: "The Rock 原石攀岩館",
    englishName: "",
    image: "/images/gym/therock.jpg",
    location: "台中市 西區",
    type: "上攀和抱石",
    facilities: ["抱石區", "先鋒攀登", "體能訓練區", "休息區"],
    rating: 4.8,
  },
  {
    id: 11,
    name: "春天攀岩館",
    englishName: "Spring Climbing Gym",
    image: "/images/gym/spring.jpg",
    location: "台中市 北區",
    type: "抱石",
    facilities: ["抱石區", "體能訓練區", "休息區", "淋浴設施"],
    rating: 4.5,
  },
  {
    id: 12,
    name: "熊爪攀岩館",
    englishName: "Bear Claw Climbing Gym",
    image: "/images/gym/bearclaw.jpg",
    location: "高雄市 三民區",
    type: "上攀和抱石",
    facilities: ["抱石區", "先鋒攀登", "體能訓練區", "休息區"],
    rating: 4.7,
  },
];

// 區域篩選選項
const regions = ["所有地區", "大台北", "桃園", "新竹", "苗栗", "台中", "彰化", "南投", "雲林", "嘉義", "台南", "高雄", "屏東", "宜蘭", "花蓮", "台東"];

// 攀岩館類型篩選選項
const gymTypes = ["所有類型", "上攀", "抱石"];

export default function GymListPage() {
  const [selectedRegion, setSelectedRegion] = useState("所有地區");
  const [selectedType, setSelectedType] = useState("所有類型");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 篩選攀岩館
  const filteredGyms = gyms.filter((gym) => {
    const regionMatch = 
      selectedRegion === "所有地區" || 
      (selectedRegion === "大台北" && (gym.location.includes("台北") || gym.location.includes("新北"))) ||
      gym.location.includes(selectedRegion);
    
    const typeMatch = 
      selectedType === "所有類型" || 
      gym.type.toLowerCase().includes(selectedType.toLowerCase());
    
    return regionMatch && typeMatch;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="relative h-[30vh] md:h-[40vh] bg-gray-800 overflow-hidden">
        <PlaceholderImage 
          text="台灣攀岩館" 
          bgColor="#1f2937" 
          textColor="#f9fafb"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
        <div className="container mx-auto absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl md:text-5xl font-medium mb-4">岩館介紹</h1>
          <p className="text-base md:text-lg max-w-3xl">
            探索台灣各式各樣有趣的岩館
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '岩館' }
            ]}
          />
        </div>

        {/* 篩選區塊 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">篩選</h2>
        <button 
        className="md:hidden flex items-center text-blue-600 font-medium"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
        <Filter size={18} className="mr-1" />
        {isFilterOpen ? "收起篩選" : "展開篩選"}
        </button>
        </div>
        
        <div className={`${isFilterOpen ? 'block' : 'hidden md:block'}`}>
        <div className="space-y-6">
        <div>
        <h3 className="text-gray-900 font-medium mb-3">地區篩選</h3>
        <div className="flex flex-wrap gap-2">
        {regions.map((region) => (
        <button
        key={region}
        className={`px-4 py-2.5 rounded-lg text-sm transition ${
        selectedRegion === region
        ? "bg-white text-black border border-gray-300 font-medium"
        : "bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => setSelectedRegion(region)}
        >
        {region}
        </button>
        ))}
        </div>
        </div>

        <div>
        <h3 className="text-gray-900 font-medium mb-3">類型篩選</h3>
        <div className="flex flex-wrap gap-2">
        {gymTypes.map((type) => (
        <button
        key={type}
        className={`px-4 py-2.5 rounded-lg text-sm transition ${
        selectedType === type
        ? "bg-white text-black border border-gray-300 font-medium"
        : "bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => setSelectedType(type)}
        >
        {type}
        </button>
        ))}
        </div>
        </div>
        </div>
        </div>
        </div>

        {/* 搜尋結果 */}
        <div className="mb-4">
          <p className="text-gray-500 text-sm">
            找到 <span className="font-medium text-gray-900">{filteredGyms.length}</span> 個攀岩館
          </p>
        </div>

        {/* 攀岩館列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {filteredGyms.map((gym) => (
            <motion.div
              key={gym.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow"
              whileHover={{ y: -3 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/gym/${gym.id}`}>
                <div className="relative h-48 w-full bg-gray-100">
                  <PlaceholderImage 
                    text={gym.name} 
                    bgColor="#f8fafc"
                    textColor="#64748b"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-base font-bold text-gray-900">
                      {gym.name}
                    </h3>
                    {gym.englishName && (
                      <p className="text-sm text-gray-500">{gym.englishName}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin size={14} className="text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">{gym.location}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 查看更多按鈕 */}
        {filteredGyms.length > 0 && (
          <div className="flex justify-center mt-6 mb-8">
            <button className="px-8 py-2.5 border border-black rounded-md text-black text-sm font-medium hover:bg-gray-50 transition">
              看更多
            </button>
          </div>
        )}
        
        {/* 無結果提示 */}
        {filteredGyms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">沒有找到符合條件的攀岩館</p>
            <button 
              className="text-gray-900 border-b border-gray-900 pb-1 hover:text-gray-700 hover:border-gray-700 transition-colors"
              onClick={() => {
                setSelectedRegion("所有地區");
                setSelectedType("所有類型");
              }}
            >
              清除篩選條件
            </button>
          </div>
        )}
      </div>
      <BackToTop />
    </main>
  );
}
