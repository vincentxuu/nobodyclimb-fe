import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { articles } from '@/lib/constants/articles';

// Define the type for the ID mapping
type IdMappingType = {
  [key: number]: string;
};

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
 
  const type = searchParams.get('type') || '全部';
  const query = searchParams.get('q') || '';

  const results = articles.filter(article => {
    const matchesType = type === '全部' || article.category === type;
    const matchesQuery = !query || 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.description.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Image
            src="/icon/icon_search.svg"
            width={48}
            height={48}
            alt="no results"
            className="mx-auto"
          />
        </div>
        <p className="text-xl font-medium text-[#B6B3B3]">搜尋不到任何結果</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {results.map((article) => {
        // 根據文章類別決定連結路徑
        let linkPath = '';
        
        // 由於系統內部資料格式不一致
        // 將數字型 ID 轉為字串型 ID (blog 詳細頁面需要)
        const articleId = String(article.id);
        
        // 根據收集到的映射資訊處理 ID
        // 搜尋頁面的 ID 是數字，而 blog 詳細頁面的 ID 是字串
        // 建立映射關係來解決不一致問題
        const idMapping: IdMappingType = {
          1: '2', // 確保器介紹 -> 攀岩確保器完整介紹：新手必讀指南
          4: '1', // 初次攀岩就上手 -> 初次攀岩就上手，攀岩新手應該知道的基礎技巧
          5: '10', // 如何選擇適合自己的攀岩鞋 -> 攀岩安全帽選購指南
          6: '12', // 自然岩場安全須知 -> 室內攀岩與戶外攀岩的技巧差異
          9: '3'  // 運動攀登比賽規則解析 -> 2023 台灣攀岩公開賽賽事回顧
        };
        
        const mappedId = idMapping[article.id] || articleId;
        
        switch(article.category) {
          case '裝備介紹':
          case '部落格':
          case '技巧介紹':
          case '技術研究':
          case '比賽介紹':
            linkPath = `/blog/${mappedId}`;
            break;
          case '人物誌':
            linkPath = `/biography/profile/${article.id}`;
            break;
          case '岩場介紹':
            // 判斷是岩館還是岩場
            if (article.location?.includes('區')) {
              linkPath = `/gym/1`; // 暫時都指向 ID 為 1 的岩館
            } else {
              linkPath = `/crag/1`; // 暫時都指向 ID 為 1 的岩場
            }
            break;
          default:
            linkPath = `/blog/${mappedId}`;
        }
        
        return (
          <Link href={linkPath} key={article.id}>
            <div className="flex gap-6 p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-[280px] h-[200px] relative">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <h2 className="text-[26px] font-medium text-[#1B1A1A] mb-3">{article.title}</h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 text-sm bg-[#3F3D3D] text-white rounded">
                    {article.category}
                  </span>
                  <span className="text-sm text-[#6D6C6C]">{article.date}</span>
                  {article.location && (
                    <div className="flex items-center gap-1">
                      <Image 
                        src="/icon/pin-alt.svg" 
                        width={16} 
                        height={16} 
                        alt="location" 
                      />
                      <span className="text-sm text-[#6D6C6C]">{article.location}</span>
                    </div>
                  )}
                </div>
                <p className="text-base text-[#1B1A1A] line-clamp-3">{article.description}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}