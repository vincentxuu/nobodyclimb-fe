'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, Save, ArrowLeft, Eye } from 'lucide-react'
import { ArticleCategory } from '@/mocks/articles'
import { ProtectedRoute } from '@/components/shared/protected-route'
import { RichTextEditor, TagSelector, ImageUploader } from '@/components/editor'
import { postService } from '@/lib/api/services'
import { sanitizeHtml } from '@/lib/utils/sanitize'

type ArticleStatus = 'draft' | 'published'

function CreateBlogPageContent() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<ArticleCategory | ''>('')
  const [tags, setTags] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // 分類選項
  const categoryOptions: ArticleCategory[] = ['裝備介紹', '技巧介紹', '技術研究', '比賽介紹']

  // 處理封面圖片選擇
  const handleCoverFileSelect = async (file: File) => {
    setIsUploading(true)

    try {
      const response = await postService.uploadImage(file)
      if (response.success && response.data) {
        setCoverImage(response.data.url)
      }
    } catch (error) {
      console.error('上傳封面圖片失敗:', error)
      alert('上傳圖片失敗，請稍後再試')
    } finally {
      setIsUploading(false)
    }
  }

  // 處理表單提交
  const handleSubmit = async (status: ArticleStatus) => {
    // 驗證表單
    if (!title.trim()) {
      alert('請輸入文章標題')
      return
    }

    if (!content.trim() || content === '<p><br></p>') {
      alert('請輸入文章內容')
      return
    }

    if (!category) {
      alert('請選擇文章分類')
      return
    }

    setIsSubmitting(true)

    try {
      // 自動產生摘要（如果沒有手動輸入）
      const autoSummary =
        summary.trim() ||
        content
          .replace(/<[^>]*>/g, '')
          .substring(0, 150)
          .trim() + '...'

      // 產生 slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/^-|-$/g, '')

      // 合併分類和標籤（分類作為第一個標籤）
      const allTags = category ? [category, ...tags.filter((t) => t !== category)] : tags

      const postData = {
        title: title.trim(),
        slug,
        content: sanitizeHtml(content),
        summary: autoSummary,
        coverImage: coverImage || '',
        tags: allTags,
        status,
      }

      await postService.createPost(postData)

      alert(status === 'published' ? '文章發布成功！' : '草稿儲存成功！')
      router.push('/profile/articles')
    } catch (error) {
      console.error('發布文章時出錯:', error)
      alert('發布文章時出錯，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 處理返回
  const handleBack = () => {
    if (title || content || coverImage) {
      if (confirm('確定要離開嗎？未儲存的內容將會遺失。')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  // 預覽模式
  if (showPreview) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <div className="sticky top-0 z-10 border-b bg-white">
          <div className="mx-auto flex max-w-[930px] items-center justify-between px-4 py-3">
            <Button variant="ghost" onClick={() => setShowPreview(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回編輯
            </Button>
            <span className="text-sm text-gray-500">預覽模式</span>
          </div>
        </div>

        <main className="mx-auto max-w-[930px] px-4 py-8">
          <article className="bg-white p-6 md:p-10">
            {coverImage && (
              <img
                src={coverImage}
                alt={title}
                className="mb-6 h-[300px] w-full rounded-lg object-cover"
              />
            )}
            <div className="mb-4 flex flex-wrap gap-2">
              {category && (
                <span className="rounded-full bg-[#1B1A1A] px-3 py-1 text-sm text-white">
                  {category}
                </span>
              )}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="mb-6 text-3xl font-bold text-[#1B1A1A]">{title || '未命名文章'}</h1>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) || '<p>尚無內容</p>' }}
            />
          </article>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* 頂部工具列 */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={isSubmitting}
            >
              <Eye className="mr-2 h-4 w-4" />
              預覽
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting || isUploading}
            >
              <Save className="mr-2 h-4 w-4" />
              儲存草稿
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={isSubmitting || isUploading}
              className="bg-[#1B1A1A] text-white hover:bg-[#2B2A2A]"
            >
              <Send className="mr-2 h-4 w-4" />
              發布文章
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 主要編輯區 */}
          <div className="space-y-6 lg:col-span-2">
            {/* 標題 */}
            <div className="bg-white p-6">
              <Input
                placeholder="請輸入文章標題"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-0 p-0 text-2xl font-medium shadow-none focus-visible:ring-0 md:text-3xl"
              />
            </div>

            {/* 內容編輯器 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-[#3F3D3D]">文章內容</label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="開始撰寫你的攀岩故事..."
              />
            </div>
          </div>

          {/* 側邊欄設定 */}
          <div className="space-y-6">
            {/* 封面圖片 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-[#3F3D3D]">封面圖片</label>
              <ImageUploader
                value={coverImage}
                onChange={setCoverImage}
                onFileSelect={handleCoverFileSelect}
                uploading={isUploading}
              />
            </div>

            {/* 分類 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-[#3F3D3D]">文章分類</label>
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

            {/* 標籤 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-[#3F3D3D]">文章標籤</label>
              <TagSelector tags={tags} onChange={setTags} maxTags={5} />
            </div>

            {/* 摘要 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-[#3F3D3D]">
                文章摘要
                <span className="ml-2 text-sm font-normal text-gray-400">(選填)</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="簡短描述文章內容，留空將自動擷取..."
                className="h-24 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-[#1B1A1A] focus:outline-none"
                maxLength={200}
              />
              <p className="mt-1 text-right text-xs text-gray-400">{summary.length}/200</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CreateBlogPage() {
  return (
    <ProtectedRoute>
      <CreateBlogPageContent />
    </ProtectedRoute>
  )
}
