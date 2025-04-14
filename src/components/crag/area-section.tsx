"use client";

import React from "react";
import PlaceholderImage from "@/components/ui/placeholder-image";

interface CragAreaSectionProps {
  areas: Array<{
    name: string;
    description: string;
    difficulty: string;
    routes: number;
    image?: string;
  }>;
}

export const CragAreaSection: React.FC<CragAreaSectionProps> = ({ areas }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 border-l-4 border-[#FFE70C] pl-4">岩區詳情</h2>
      <div className="space-y-10">
        {areas.map((area, index) => (
          <div 
            key={index}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 border-b border-gray-200 last:border-0"
          >
            <div className="relative rounded-lg overflow-hidden h-60">
              <PlaceholderImage 
                text={`${area.name} 岩區`} 
                bgColor="#E0F2FE"
              />
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-3">{area.name}</h3>
              <p className="text-gray-700 mb-4">{area.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">難度範圍</p>
                  <p className="font-semibold">{area.difficulty}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">路線數量</p>
                  <p className="font-semibold">{area.routes}+</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};