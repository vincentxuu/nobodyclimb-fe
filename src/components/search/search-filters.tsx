import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
 
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || '全部');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set('q', query);
    else params.delete('q');
    if (activeTab !== '全部') params.set('type', activeTab);
    router.push(`/search?${params.toString()}`);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) params.set('q', searchQuery);
    if (tab !== '全部') params.set('type', tab);
    else params.delete('type');
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="mb-8">
      <div className="mb-8">
        <h1 className="text-[40px] font-medium text-[#1B1A1A] mb-2">
          {searchQuery ? `${searchQuery} 的搜尋結果` : "搜尋結果"}
        </h1>
      </div>

      <div className="relative w-[240px] mb-8">
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜尋..."
            className="h-[40px] w-full border border-[#1B1A1A] bg-white rounded-[4px] text-sm font-light placeholder:text-[#6D6C6C] focus:outline-none focus:ring-2 focus:ring-[#1B1A1A] focus:border-transparent"
          />
          <Search 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#1B1A1A] stroke-[1.5px] pointer-events-none"
          />
        </div>
      </div>

      <div className="border-b border-[#E5E5E5]">
        <div className="flex">
          {["全部", "人物誌", "岩場介紹", "專欄文章"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-8 py-3 text-base font-medium relative ${
                activeTab === tab 
                ? "text-[#1B1A1A] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#1B1A1A]" 
                : "text-[#1B1A1A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 