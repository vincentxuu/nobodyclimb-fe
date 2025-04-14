"use client";

import React, { useState } from "react";
import { Eye, ExternalLink, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";

interface RouteType {
  id: string;
  name: string;
  englishName: string;
  grade: string;
  length: string;
  type: string;
  firstAscent: string;
  area: string;
  description: string;
  protection: string;
  popularity: number;
  views: number;
  // 新增欄位
  images?: string[];
  videos?: string[];
  tips?: string;
}

interface CragRouteSectionProps {
  routes: RouteType[];
}

export const CragRouteSection: React.FC<CragRouteSectionProps> = ({ routes }) => {
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // 路線點擊處理
  const handleRouteClick = (route: RouteType) => {
    setSelectedRoute(route);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 border-l-4 border-[#FFE70C] pl-4">路線資訊</h2>
      
      <div className="bg-yellow-50 p-4 rounded-lg mb-6 flex items-center border-l-4 border-[#FFE70C]">
        <div className="text-[#1B1A1A] mr-2">
          <Info size={20} />
        </div>
        <p className="text-[#1B1A1A] text-sm">
          點擊路線名稱或「查看詳情」按鈕可展開路線內容，包含路線描述、保護裝備、路線照片和攀登攻略。
        </p>
      </div>
      
      {/* 路線表格 */}
      <div className="mb-8 overflow-x-auto">
        <table className="min-w-full border-collapse border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-white">
            <tr className="border-b border-t border-gray-200">
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                路線名稱
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                難度
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                長度
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                類型
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                區域
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                人氣
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {routes.map((route) => (
              <tr 
                key={route.id} 
                className={`transition-colors relative border-b border-gray-200 ${selectedRoute?.id === route.id ? 'bg-yellow-50' : 'hover:bg-gray-100'} cursor-pointer`}
                onClick={() => handleRouteClick(route)}
                role="button"
                aria-label={`查看 ${route.name} 路線詳情`}
              >
                <td className="pl-6 py-4 whitespace-nowrap relative">
                  {selectedRoute?.id === route.id && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#FFE70C]"></div>
                  )}
                  <div className="flex items-center">
                    <div className="text-sm font-medium group">
                      <span className="flex items-center text-[#1B1A1A] group-hover:text-[#FFE70C] transition-colors">
                        {route.name}
                        <ExternalLink size={14} className="ml-1 text-gray-400 group-hover:text-[#FFE70C] transition-colors" />
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{route.englishName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-yellow-100 text-[#1B1A1A]">
                    {route.grade}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.area}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye size={16} className="text-gray-400 mr-1" />
                    <span>{route.views}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    className="px-4 py-1 bg-[#FFE70C] hover:bg-[#FFE70C]/80 text-[#1B1A1A] rounded-full transition-colors text-xs font-medium flex items-center shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation(); // 防止觸發行點擊事件
                      handleRouteClick(route);
                    }}
                  >
                    <Eye size={14} className="mr-1" />
                    查看詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 路線詳細資訊 */}
      {selectedRoute && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">{selectedRoute.name}</h3>
              <p className="text-gray-500">{selectedRoute.englishName}</p>
            </div>
            <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-yellow-100 text-[#1B1A1A]">
              {selectedRoute.grade}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2 border-l-2 border-[#FFE70C] pl-2">路線資訊</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">長度:</span>
                  <span className="font-medium">{selectedRoute.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">類型:</span>
                  <span className="font-medium">{selectedRoute.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">首登:</span>
                  <span className="font-medium">{selectedRoute.firstAscent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">區域:</span>
                  <span className="font-medium">{selectedRoute.area}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2 border-l-2 border-[#FFE70C] pl-2">保護裝備</h4>
              <p className="text-gray-700">{selectedRoute.protection}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2 border-l-2 border-[#FFE70C] pl-2">路線描述</h4>
            <p className="text-gray-700">{selectedRoute.description}</p>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button 
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-[#1B1A1A] rounded-md transition flex items-center"
              onClick={() => setShowPhotos(true)}
              disabled={!selectedRoute?.images?.length}
            >
              <ExternalLink size={16} className="mr-2" />
              查看路線照片
            </button>
            <button 
              className="px-4 py-2 bg-[#1B1A1A] hover:bg-black text-white rounded-md transition flex items-center"
              onClick={() => setShowTips(true)}
              disabled={!selectedRoute?.tips}
            >
              <ExternalLink size={16} className="mr-2" />
              查看攀登攻略
            </button>
          </div>
        </div>
      )}
      
      {/* 路線照片彈窗 */}
      {selectedRoute && (
        <Dialog.Root open={showPhotos} onOpenChange={setShowPhotos}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70" />
            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b">
                  <Dialog.Title className="text-lg font-bold text-[#1B1A1A]">
                    {selectedRoute.name} 路線照片
                  </Dialog.Title>
                  <Dialog.Close className="text-gray-500 hover:text-[#1B1A1A] p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={20} />
                  </Dialog.Close>
                </div>
                
                {selectedRoute.images && selectedRoute.images.length > 0 ? (
                  <div className="relative">
                    <div className="relative h-[60vh] w-full">
                      <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                        <div className="text-gray-600 text-center p-8">
                          [{selectedRoute.name} 路線照片 {currentPhotoIndex + 1}/{selectedRoute.images.length}]
                        </div>
                      </div>
                    </div>
                    
                    {/* 導航按鈕 */}
                    {selectedRoute.images.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <button 
                          onClick={() => setCurrentPhotoIndex(prev => (prev === 0 ? selectedRoute.images!.length - 1 : prev - 1))}
                          className="bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={() => setCurrentPhotoIndex(prev => (prev === selectedRoute.images!.length - 1 ? 0 : prev + 1))}
                          className="bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}
                    
                    {/* 縮圖導航 */}
                    {selectedRoute.images.length > 1 && (
                      <div className="flex justify-center space-x-2 p-4 bg-gray-100">
                        {selectedRoute.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-3 h-3 rounded-full ${currentPhotoIndex === index ? 'bg-[#FFE70C]' : 'bg-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    暫無路線照片
                  </div>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      
      {/* 攀登攻略彈窗 */}
      {selectedRoute && (
        <Dialog.Root open={showTips} onOpenChange={setShowTips}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70" />
            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
                <div className="p-4 flex justify-between items-center border-b">
                  <Dialog.Title className="text-lg font-bold text-[#1B1A1A]">
                    {selectedRoute.name} 攀登攻略
                  </Dialog.Title>
                  <Dialog.Close className="text-gray-500 hover:text-[#1B1A1A] p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={20} />
                  </Dialog.Close>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 border-l-4 border-[#FFE70C] pl-3">
                    攀登技巧
                  </h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {selectedRoute.tips || '暫無攀登攻略'}
                  </p>
                  
                  <h3 className="text-xl font-bold mb-4 border-l-4 border-[#FFE70C] pl-3">
                    攀登影片
                  </h3>
                  
                  {selectedRoute.videos && selectedRoute.videos.length > 0 ? (
                    <div className="space-y-6">
                      {selectedRoute.videos.map((videoUrl, index) => (
                        <div key={index} className="aspect-video w-full">
                          <iframe
                            src={videoUrl}
                            className="w-full h-full rounded-lg"
                            title={`${selectedRoute.name} 攀登影片 ${index + 1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      暫無攀登影片
                    </div>
                  )}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
};