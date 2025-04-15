'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Article, ArticleCategory, mockArticles } from '@/mocks/articles';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { motion } from 'framer-motion';

function BlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  // 為URL category參數映射到顯示類別
  const categoryMapping: Record<string, ArticleCategory> = {
    'equipment': '裝備介紹',
    'technique': '技巧介紹',
    'research': '技術研究',
    'competition': '比賽介紹'
  };

  // 類別和 URL 參數的反向映射
  const categoryToUrlParam: Record<ArticleCategory, string | null> = {
    '所有文章': null,
    '裝備介紹': 'equipment',
    '技巧介紹': 'technique',
    '技術研究': 'research',
    '比賽介紹': 'competition'
  };

  // 根據URL參數設置默認選中的類別
  const defaultCategory = categoryParam ? categoryMapping[categoryParam] ?? '所有文章' : '所有文章';

  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 處理類別選擇變更
  const handleCategoryChange = (category: ArticleCategory) => {
    setSelectedCategory(category);

    // 更新 URL 路徑
    const urlParam = categoryToUrlParam[category];
    if (urlParam) {
      router.push(`/blog?category=${urlParam}`);
    } else {
      router.push('/blog');
    }
  };

  // 同步URL參數和選定類別
  useEffect(() => {
    if (categoryParam) {
      const mappedCategory = categoryMapping[categoryParam];
      if (mappedCategory && mappedCategory !== selectedCategory) {
        setSelectedCategory(mappedCategory);
      }
    }
  }, [categoryParam, categoryMapping, selectedCategory]);

  const featuredArticles = mockArticles.filter(article => article.isFeature);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
  }, [featuredArticles.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + featuredArticles.length) % featuredArticles.length);
  }, [featuredArticles.length]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAutoPlaying) {
      intervalId = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoPlaying, nextSlide]);

  const categories: ArticleCategory[] = [
    '所有文章',
    '裝備介紹',
    '技巧介紹',
    '技術研究',
    '比賽介紹'
  ];

  const filteredArticles = mockArticles.filter(article => {
    const matchesCategory = selectedCategory === '所有文章' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#f5f5f5]"
    >
      {/* Header Section */}
      <div
        className="relative w-full h-[480px] group"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {featuredArticles.map((article, index) => (
          <div
            key={article.id}
            className={`absolute inset-0 transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
          >
            <Link href={`/blog/${article.id}`} className="block relative h-full">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-12 left-12 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 text-sm bg-[#3F3D3D] rounded">{article.category}</span>
                  <span className="text-sm">{article.date}</span>
                </div>
                <h1 className="text-4xl font-medium max-w-[800px]">
                  {article.title}
                </h1>
              </div>
            </Link>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
          {featuredArticles.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                  ? 'bg-white w-6'
                  : 'bg-white/50'
                }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={prevSlide}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={nextSlide}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '部落格' }
            ]}
          />
        </div>

        {/* Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 md:gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                className={`rounded-full px-8 ${selectedCategory === category
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'border-gray-300 hover:bg-gray-100'
                  }`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-[240px]">
            <Input
              placeholder="搜尋文章關鍵字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] border border-[#1B1A1A] bg-white rounded-[4px] text-sm font-light placeholder:text-[#6D6C6C] focus:outline-none focus:ring-2 focus:ring-[#1B1A1A] focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search
                className="h-5 w-5 text-[#1B1A1A] stroke-[1.5px]"
              />
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.id}`}
              className="bg-white rounded-none overflow-hidden h-[416px] hover:shadow-lg transition-shadow"
            >
              <div className="relative h-[208px]">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-sm bg-[#3F3D3D] text-white rounded">
                    {article.category}
                  </span>
                  <span className="text-sm text-[#6D6C6C]">{article.date}</span>
                </div>
                <h2 className="text-xl font-medium">{article.title}</h2>
                <p className="text-sm text-gray-700 line-clamp-3">{article.content}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-10 mb-16">
          <Button
            variant="outline"
            className="h-11 border border-[#1B1A1A] text-[#1B1A1A] px-8 hover:bg-[#dbd8d8] hover:text-[#1B1A1A]"
          >
            看更多
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        Loading...
      </div>
    }>
      <BlogContent />
    </Suspense>
  );
}