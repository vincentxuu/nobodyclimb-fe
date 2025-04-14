'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, Send } from 'lucide-react';
import { ArticleCategory } from '@/mocks/articles';

export default function CreateBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ArticleCategory | ''>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 分類選項
  const categoryOptions: ArticleCategory[] = [
    '裝備介紹',
    '技巧介紹',
    '技術研究',
    '比賽介紹'
  ];

  // 處理圖片上傳
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證表單
    if (!title || !content || !category || !image) {
      alert('請填寫所有必填欄位');
      return;
    }

    setIsSubmitting(true);

    try {
      // 在這裡實現實際的提交邏輯
      // 例如: 將資料傳送到API或處理資料
      console.log({
        title,
        content,
        category,
        image
      });

      // 模擬API請求延遲
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 成功提交後可以重定向到博客列表頁面
      alert('文章發布成功！');
      router.push('/blog');
    } catch (error) {
      console.error('發布文章時出錯:', error);
      alert('發布文章時出錯，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理取消按鈕
  const handleCancel = () => {
    if (confirm('確定要取消編輯嗎？未保存的內容將會丟失。')) {
      router.push('/blog');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <main className="max-w-[930px] mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-medium mb-6 text-[#1B1A1A]">發表文章</h1>

        <form onSubmit={handleSubmit} className="bg-white p-4 md:p-10 space-y-6">
          {/* 標題 */}
          <div className="space-y-2">
            <Input 
              placeholder="請輸入標題" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-medium p-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* 上傳圖片 */}
            <div className="space-y-2">
              <label className="block text-xl font-medium text-[#3F3D3D]">上傳圖片</label>
              <div 
                className={`
                  border border-dashed border-[#B6B3B3] rounded-lg
                  flex items-center justify-center p-8
                  h-[300px] cursor-pointer
                  ${imagePreview ? 'relative' : ''}
                `}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="w-full h-full">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-12 h-12 text-[#B6B3B3] mb-2" />
                  </div>
                )}
              </div>
            </div>

            {/* 分類 */}
            <div className="space-y-2">
              <label className="block text-xl font-medium text-[#3F3D3D]">分類</label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as ArticleCategory)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="請選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 內容 */}
          <div className="space-y-2">
            <label className="block text-xl font-medium text-[#3F3D3D]">內容</label>
            <Textarea 
              placeholder="請輸入文章內容" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] p-6"
            />
          </div>

          {/* 按鈕組 */}
          <div className="flex flex-col-reverse sm:flex-row justify-end sm:space-x-6 space-y-4 space-y-reverse sm:space-y-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="px-8 py-2 border-[#1B1A1A] text-[#1B1A1A] w-full sm:w-auto"
            >
              取消
            </Button>
            <Button 
              type="submit" 
              className="px-8 py-2 bg-[#1B1A1A] text-white flex items-center justify-center gap-2 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4" />
              發布文章
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
