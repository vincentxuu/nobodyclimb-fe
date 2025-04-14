"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import PlaceholderImage from "@/components/ui/placeholder-image";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, ThermometerSun, Cloud, Umbrella, Car, Info, Clock, Heart, ChevronUp, Youtube, Facebook, Twitter, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CragIntroSection } from "@/components/crag/intro-section";
import { CragAreaSection } from "@/components/crag/area-section";
import { CragRouteSection } from "@/components/crag/route-section";
import { CragWeatherCard } from "@/components/crag/weather-card";
import { CragMapCard } from "@/components/crag/map-card";
import { CragInfoCard } from "@/components/crag/info-card";
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useRouter } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";

// 模擬岩場資料
const cragData = [
  {
    id: 1,
    name: "龍洞",
    englishName: "Long Dong",
    location: "新北市貢寮區",
    description: "龍洞岩場是台灣最知名的海蝕岩場，擁有超過500條路線，從初學者到高階攀岩者皆能找到適合的路線。岩壁沿著海岸線延伸數公里，擁有多種不同風格的路線，包括裂縫、岩板、垂直壁等。",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // 示例影片，實際使用時請替換為真實的龍洞岩場介紹影片
    images: [
      "/images/crag/longdong-1.jpg",
      "/images/crag/longdong-2.jpg",
      "/images/crag/longdong-3.jpg",
      "/images/crag/longdong-4.jpg",
    ],
    type: "海蝕岩場",
    rockType: "砂岩、石灰岩混合",
    routes: 500,
    difficulty: "5.6 - 5.13a",
    height: "5-30m",
    approach: "15-40分鐘徒步",
    seasons: ["春", "秋", "冬"],
    transportation: [
      { type: "公車", description: "台北市搭乘國光客運1812到福隆站，轉乘台灣好行福隆-龍洞線到龍洞南口站" },
      { type: "開車", description: "走國道5號下雪山隧道後接台2線濱海公路，往龍洞方向行駛約30分鐘" },
    ],
    parking: "岩場附近有多處小型停車場，假日較為擁擠",
    amenities: ["附近有便利商店", "海邊浴室", "當地餐廳"],
    geoCoordinates: {
      latitude: 25.1078,
      longitude: 121.9188,
    },
    weather: {
      current: {
        temp: 23,
        condition: "晴時多雲",
        precipitation: "10%",
        wind: "東北風 3級",
      },
      forecast: [
        { day: "今天", high: 24, low: 19, condition: "晴時多雲", precipitation: "10%" },
        { day: "明天", high: 25, low: 20, condition: "多雲", precipitation: "20%" },
        { day: "後天", high: 23, low: 18, condition: "陰有雨", precipitation: "60%" },
      ],
    },
    areas: [
      {
        name: "第一長岬",
        description: "龍洞最北側的岩區，有多條中高難度路線，以裂隙攀登為主",
        difficulty: "5.9 - 5.12",
        routes: 80,
        image: "/images/crag/longdong-area1.jpg",
      },
      {
        name: "音樂廳",
        description: "擁有良好的岩質和各種難度的路線，是初學者的理想場地",
        difficulty: "5.6 - 5.10",
        routes: 120,
        image: "/images/crag/longdong-area2.jpg",
      },
      {
        name: "皇后岩",
        description: "高度較高，有許多技術性路線，適合有經驗的攀岩者",
        difficulty: "5.10 - 5.13",
        routes: 60,
        image: "/images/crag/longdong-area3.jpg",
      },
      {
        name: "南岬",
        description: "龍洞最南側的岩區，風景優美，路線多樣",
        difficulty: "5.7 - 5.11",
        routes: 90,
        image: "/images/crag/longdong-area4.jpg",
      },
    ],
    // 新增路線資料
    routes_details: [
      {
        id: "LD001",
        name: "海神",
        englishName: "Poseidon",
        grade: "5.11c",
        length: "25m",
        type: "運動攀登",
        firstAscent: "李智強, 2001",
        area: "第一長岬",
        description: "這條線路需要良好的體力和耐力，中間有一個關鍵的側拉動作需要配合腳步的精準踩點。頂部有一段輕微的懸空，完攀後視野絕佳。",
        protection: "固定保護點，頂部有確保站",
        popularity: 4.5,
        views: 1245,
        images: [
          "/images/routes/poseidon-1.jpg",
          "/images/routes/poseidon-2.jpg",
          "/images/routes/poseidon-3.jpg"
        ],
        videos: [
          "https://www.youtube.com/embed/AbCdEfGhIjK",
          "https://www.youtube.com/embed/LmNoPqRsTuV"
        ],
        tips: "攀爬此路線時，建議在上方第三個確保點處多加注意，岩石有些鬆動。最佳攀登時間是冬季下午，陽光不會直射岩壁。攀爬前先熱身足部和手臂，以應對中段的技術性動作。"
      },
      {
        id: "LD002",
        name: "藍色海洋",
        englishName: "Blue Ocean",
        grade: "5.9+",
        length: "18m",
        type: "傳統攀登",
        firstAscent: "張明德, 1995",
        area: "音樂廳",
        description: "經典的中等難度路線，適合初學傳統攀登的攀岩者。岩壁有良好的裂縫系統，容易放置保護，但需注意頂部風化區域。",
        protection: "需自備裝備，有裂縫適合放置快掛和機械塞",
        popularity: 4.8,
        views: 2345,
        images: [
          "/images/routes/blue-ocean-1.jpg",
          "/images/routes/blue-ocean-2.jpg"
        ],
        videos: [
          "https://www.youtube.com/embed/WxYzAbCdEfG"
        ],
        tips: "攀爬前檢查所有傳統裝備，特別是中小號的機械塞。在第二段裂縫處，建議使用較大尺寸的凸輪。留意頂部的風化區域，靠右側攀爬較為安全。"
      },
      {
        id: "LD003",
        name: "雷神",
        englishName: "Thor",
        grade: "5.12b",
        length: "30m",
        type: "運動攀登",
        firstAscent: "劉大偉, 2010",
        area: "皇后岩",
        description: "這是龍洞最具挑戰性的路線之一，需要精準的技術動作和爆發力。中段有一個困難的懸垂問題，需要精確的重心控制和強大的指力。",
        protection: "固定保護點，間距較大",
        popularity: 4.3,
        views: 980,
        images: [
          "/images/routes/thor-1.jpg",
          "/images/routes/thor-2.jpg",
          "/images/routes/thor-3.jpg",
          "/images/routes/thor-4.jpg"
        ],
        videos: [
          "https://www.youtube.com/embed/HiJkLmNoPqR",
          "https://www.youtube.com/embed/StUvWxYzAbC"
        ],
        tips: "攀爬前需充分熱身指力和核心肌群。中段懸垂處可考慮使用膝蓋卡入技巧。建議只在溫度適中、濕度低的天氣嘗試，以獲得最佳摩擦力。第四個確保點後的休息點是恢復體力的關鍵。"
      },
      {
        id: "LD004",
        name: "微風輕拂",
        englishName: "Gentle Breeze",
        grade: "5.7",
        length: "15m",
        type: "運動攀登",
        firstAscent: "陳小華, 1998",
        area: "音樂廳",
        description: "完美的入門級路線，握點大且舒適，適合初學者建立信心。全程都有良好的握點和踏點，攀爬流暢且有趣。",
        protection: "密集的固定保護點，非常安全",
        popularity: 4.9,
        views: 3450,
        images: [
          "/images/routes/gentle-breeze-1.jpg",
          "/images/routes/gentle-breeze-2.jpg"
        ],
        videos: [
          "https://www.youtube.com/embed/DeFgHiJkLmN"
        ],
        tips: "適合初學者的第一條戶外路線。保持身體靠近岩壁，善用腿部力量而非手臂。在頂部向左側看，可以欣賞到絕美的海景。適合作為熱身路線，或用於練習確保技術。"
      },
      {
        id: "LD005",
        name: "黑色閃電",
        englishName: "Black Lightning",
        grade: "5.10a",
        length: "22m",
        type: "運動攀登",
        firstAscent: "王建國, 2005",
        area: "南岬",
        description: "中等難度的路線，特點是中段有一個技術性的橫移，需要良好的平衡感和協調性。風景優美，可以看到整個海灣。",
        protection: "固定保護點，間距適中",
        popularity: 4.6,
        views: 1820,
        images: [
          "/images/routes/black-lightning-1.jpg",
          "/images/routes/black-lightning-2.jpg",
          "/images/routes/black-lightning-3.jpg"
        ],
        videos: [
          "https://www.youtube.com/embed/oPqRsTuVwXy",
          "https://www.youtube.com/embed/ZaBcDeFgHiJ"
        ],
        tips: "橫移段落是關鍵，保持重心低並尋找小的側拉點。過橫移後不要急著往上，右側有個不明顯但很好的休息點。在乾燥天氣攀爬效果最佳，雨後岩石會變得光滑。"
      },
    ]
  }
];

export default function CragDetailPage({ params }: { params: { id: string } }) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const cragId = parseInt(params.id);
  // 監聽滾動事件
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // 回到頂部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const currentCrag = cragData.find(crag => crag.id === cragId);
  if (!currentCrag) {
    return <div>Crag not found</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 relative pt-20">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '岩場', href: '/crag' },
              { label: currentCrag.name }
            ]}
          />
        </div>
        <div className="sticky top-0 left-0 w-full z-30 bg-gray-50 py-3 mb-4">
          <motion.div
            className="w-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/crag">
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-200 bg-white shadow-sm">
                <ArrowLeft size={16} />
                <span>岩場列表</span>
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* 主要內容區 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12 mt-4">
          {/* 照片展示區 */}
          <div className="mb-8">
            {/* 大圖 */}
            <div className="w-full h-96 relative mb-2 rounded-lg overflow-hidden">
              <PlaceholderImage
                text={`${currentCrag.name} 大型場景圖`}
                bgColor="#333"
                textColor="#fff"
              />
            </div>

            {/* 照片縮略圖區 */}
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2">
              {currentCrag.images.map((photo, index) => (
                <div key={index} className="w-24 h-24 flex-shrink-0 relative rounded-md overflow-hidden">
                  <PlaceholderImage
                    text={`照片 ${index + 1}`}
                    bgColor="#444"
                    textColor="#fff"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 標題與位置 */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-medium">{currentCrag.name}</h1>
              <p className="text-lg text-gray-600 mb-2">{currentCrag.englishName}</p>
              <div className="flex items-center text-gray-500">
                <MapPin size={16} className="mr-1" />
                <span>{currentCrag.location}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-[#FFE70C] hover:bg-yellow-400 text-[#1B1A1A] py-2 px-4 rounded-full flex items-center font-medium transition-colors">
                <Heart size={18} className="mr-2" />
                收藏岩場
              </button>
              <button className="bg-white border border-gray-200 text-[#1B1A1A] hover:bg-gray-100 py-2 px-4 rounded-full flex items-center font-medium transition-colors">
                分享
              </button>
            </div>
          </div>

          {/* 天氣資訊 */}
          <div className="bg-gray-100 rounded-lg p-6 mb-8 inline-block">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-gray-700 text-2xl font-medium">{currentCrag.weather.current.temp}°C</span>
              </div>
              <div>
                <p className="text-xs text-gray-700">{currentCrag.location}</p>
                <p className="text-xs text-gray-700">{currentCrag.weather.current.condition}</p>
              </div>
            </div>
            <div className="flex items-center mt-1">
              <Cloud size={14} className="text-gray-700 mr-1" />
              <span className="text-xs text-gray-700">降雨機率: {currentCrag.weather.current.precipitation}</span>
              <span className="ml-2 text-xs text-gray-700">{currentCrag.weather.current.wind}</span>
            </div>
          </div>

          {/* 岩場介紹 - 使用標籤頁 */}
          <div className="mb-8">
            <Tabs.Root defaultValue="intro" className="w-full">
              <Tabs.List className="flex border-b border-gray-200 mb-6">
                <Tabs.Trigger
                  value="intro"
                  className="py-3 px-8 text-sm font-medium outline-none transition-colors relative data-[state=active]:text-[#1B1A1A] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#FFE70C] data-[state=active]:after:rounded-t-full"
                >
                  岩場介紹
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="areas"
                  className="py-3 px-8 text-sm font-medium outline-none transition-colors relative data-[state=active]:text-[#1B1A1A] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#FFE70C] data-[state=active]:after:rounded-t-full"
                >
                  岩區詳情
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="routes"
                  className="py-3 px-8 text-sm font-medium outline-none transition-colors relative data-[state=active]:text-[#1B1A1A] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#FFE70C] data-[state=active]:after:rounded-t-full"
                >
                  路線資訊
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="intro">
                <div className="mb-6">
                  <div className="mb-1">
                    <h2 className="text-lg font-medium text-orange-500">岩場介紹</h2>
                    <div className="w-full h-px bg-gray-200"></div>
                  </div>
                  <div className="whitespace-pre-line text-base mt-4">
                    {currentCrag.description}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    {/* 岩場基本資訊 */}
                    <div className="mb-6">
                      <div className="mb-1">
                        <h2 className="text-lg font-medium text-orange-500">岩場基本資訊</h2>
                        <div className="w-full h-px bg-gray-200"></div>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="flex">
                          <span className="w-28 text-gray-500">岩場類型：</span>
                          <span>{currentCrag.type}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">岩石類型：</span>
                          <span>{currentCrag.rockType}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">路線數量：</span>
                          <span>~{currentCrag.routes}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">難度範圍：</span>
                          <span>{currentCrag.difficulty}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">岩壁高度：</span>
                          <span>{currentCrag.height}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">步行時間：</span>
                          <span>{currentCrag.approach}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* 交通方式 */}
                    <div className="mb-6">
                      <div className="mb-1">
                        <h2 className="text-lg font-medium text-orange-500">交通方式</h2>
                        <div className="w-full h-px bg-gray-200"></div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {currentCrag.transportation.map((item, index) => (
                          <div key={index} className="flex">
                            <span className="w-20 text-gray-500">{item.type}：</span>
                            <span className="flex-1">{item.description}</span>
                          </div>
                        ))}
                        <div className="flex pt-2">
                          <span className="w-20 text-gray-500">停車：</span>
                          <span className="flex-1">{currentCrag.parking}</span>
                        </div>
                      </div>
                    </div>

                    {/* 已從展示的地圖肉移到這裡 */}
                    <div className="mb-6">
                      <div className="mb-1">
                        <h2 className="text-lg font-medium text-orange-500">岩場位置</h2>
                        <div className="w-full h-px bg-gray-200"></div>
                      </div>
                      <div className="mt-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <PlaceholderImage
                          text="岩場地圖"
                          bgColor="#e5e7eb"
                          textColor="#6b7280"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 山場設施 */}
                <div className="mb-6">
                  <div className="mb-1">
                    <h2 className="text-lg font-medium text-orange-500">山場設施</h2>
                    <div className="w-full h-px bg-gray-200"></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentCrag.amenities.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value="areas">
                <CragAreaSection areas={currentCrag.areas} />
              </Tabs.Content>

              <Tabs.Content value="routes">
                <CragRouteSection routes={currentCrag.routes_details} />
              </Tabs.Content>
            </Tabs.Root>
          </div>

          {/* 使用相關岩場元件來替代上一篇/下一篇功能 */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-2xl font-medium mb-6">相關岩場</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {currentCrag.areas.slice(0, 3).map((area, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow transition-shadow">
                  <div className="h-48 relative">
                    <PlaceholderImage
                      text={area.name}
                      bgColor="#f8f9fa"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-base">{area.name}</h3>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-500">{area.difficulty} · {area.routes}條路線</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 回到頂部按鈕 */}
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-4 md:bottom-10 md:right-8 p-2 md:p-3 bg-[#1B1A1A] text-white rounded-full shadow-lg hover:bg-black transition-all duration-300 z-40"
          aria-label="回到頂部"
        >
          <ChevronUp size={20} className="md:w-6 md:h-6" />
        </button>
      )}
    </main>
  );
}