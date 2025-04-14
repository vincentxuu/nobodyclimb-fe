"use client";

import React from "react";
import Link from "next/link";
import { Info } from "lucide-react";

interface CragInfoCardProps {
  // 可以根據需要添加參數
}

export const CragInfoCard: React.FC<CragInfoCardProps> = () => {
  // 實用資訊列表
  const infoLinks = [
    { emoji: "👨‍🏫", label: "推薦嚮導服務", href: "#" },
    { emoji: "📖", label: "岩場地形指南", href: "#" },
    { emoji: "⚠️", label: "安全注意事項", href: "#" },
    { emoji: "🏨", label: "附近住宿選項", href: "#" },
    { emoji: "🍽️", label: "附近餐廳推薦", href: "#" },
    { emoji: "🧰", label: "裝備租借資訊", href: "#" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold flex items-center mb-4">
        <Info size={20} className="mr-2 text-[#1B1A1A]" />
        實用資訊
      </h3>
      <ul className="space-y-3">
        {infoLinks.map((link, index) => (
          <li key={index}>
            <Link href={link.href} className="text-[#1B1A1A] hover:text-gray-800 flex items-center">
              <span className="mr-2">{link.emoji}</span> {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};