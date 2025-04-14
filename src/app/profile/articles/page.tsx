'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ProfileSidebar from '@/components/ProfileSidebar';

// 暫時性的假資料
const articlesMock = [
  {
    id: 1,
    title: '我的攀岩初體驗',
    excerpt: '分享第一次攀岩的經歷，以及對這項運動的初步認識...',
    coverImage: '/api/placeholder/400/250',
    createdAt: '2023-12-15',
    category: '心得分享',
    viewCount: 245,
    commentCount: 12
  },
  {
    id: 2,
    title: '攀岩裝備選購指南：初學者必看',
    excerpt: '分享如何選購適合初學者的攀岩裝備，包括攀岩鞋、粉袋等基本設備...',
    coverImage: '/api/placeholder/400/250',
    createdAt: '2024-01-24',
    category: '裝備介紹',
    viewCount: 387,
    commentCount: 23
  },
  {
    id: 3,
    title: '台灣北部值得一去的五個攀岩場地',
    excerpt: '推薦台灣北部的五個攀岩場地，包括室內和戶外，適合不同程度的攀岩愛好者...',
    coverImage: '/api/placeholder/400/250',
    createdAt: '2024-02-10',
    category: '場地推薦',
    viewCount: 532,
    commentCount: 31
  }
];

// 頁面標題元件
interface PageHeaderProps {
  title: string;
  actionButton?: React.ReactNode;
  isMobile?: boolean;
}

const PageHeader = ({ title, actionButton, isMobile }: PageHeaderProps) => (
  <div className="flex justify-between items-center mb-8">
    <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-medium text-[#1B1A1A]`}>{title}</h1>
    {actionButton}
  </div>
);

// 文章卡片元件
interface ArticleCardProps {
  article: {
    id: number;
    title: string;
    excerpt: string;
    coverImage: string;
    createdAt: string;
    category: string;
    viewCount: number;
    commentCount: number;
  };
}

const ArticleCard = ({ article }: ArticleCardProps) => (
  <div className="border border-[#DBD8D8] p-5 rounded-sm">
    <div className="flex gap-6">
      <div className="relative w-[200px] h-[120px]">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-[#6D6C6C]">{article.category}</span>
          <span className="text-sm text-[#6D6C6C]">{article.createdAt}</span>
        </div>
        <h2 className="text-xl font-medium mb-2">{article.title}</h2>
        <p className="text-[#3F3D3D] mb-3 line-clamp-2">{article.excerpt}</p>
        <div className="flex justify-between">
          <div className="flex gap-4 text-sm text-[#8E8C8C]">
            <span>瀏覽 {article.viewCount}</span>
            <span>留言 {article.commentCount}</span>
          </div>
          <div className="flex gap-3">
            <Link href={`/blog/${article.id}/edit`}>
              <Button variant="outline" className="text-[#3F3D3D] border-[#B6B3B3] hover:bg-[#F5F5F5]">
                編輯
              </Button>
            </Link>
            <Link href={`/blog/${article.id}`}>
              <Button variant="outline" className="text-[#3F3D3D] border-[#B6B3B3] hover:bg-[#F5F5F5]">
                查看
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 空狀態元件
const EmptyState = () => (
  <div className="py-12 text-center">
    <p className="text-[#6D6C6C] mb-4">你還沒有發表任何文章</p>
    <Link href="/blog/create">
      <Button className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]">
        開始撰寫第一篇文章
      </Button>
    </Link>
  </div>
);

// 新增文章按鈕元件
const NewArticleButton = () => (
  <Link href="/blog/create">
    <Button 
      className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D] flex items-center gap-2"
    >
      <Edit2 size={18} />
      發表文章
    </Button>
  </Link>
);

export default function ArticlesPage() {
  const [isMobile, setIsMobile] = useState(false);

  // 檢測是否為手機版
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    
    window.addEventListener('resize', checkIfMobile);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <div className={`container mx-auto ${isMobile ? 'pt-16 pb-6' : 'py-12'} ${isMobile ? 'block px-4' : 'flex'}`}>
      {/* 側邊選單 - 在桌面版才顯示 */}
      <div className="hidden md:block">
        <ProfileSidebar />
      </div>

      {/* 主要內容區域 */}
      <motion.div 
        className={`flex-1 ${isMobile ? 'mx-0' : 'ml-8'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`bg-white ${isMobile ? 'p-4 md:p-6' : 'p-12'} rounded-sm`}>
          <PageHeader 
            title="我的文章" 
            actionButton={<NewArticleButton />} 
            isMobile={isMobile}
          />
          
          {articlesMock.length > 0 ? (
            <div className="space-y-6">
              {articlesMock.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </motion.div>
    </div>
  );
}
