'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, Save, ArrowLeft, Eye, Loader2 } from 'lucide-react'
import { PostCategory, POST_CATEGORIES } from '@/lib/types'
import { ProtectedRoute } from '@/components/shared/protected-route'
import { RichTextEditor, TagSelector, ImageUploader } from '@/components/editor'
import { postService } from '@/lib/api/services'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import { generateSummary } from '@/lib/utils/article'

type ArticleStatus = 'draft' | 'published' | 'archived'

function EditBlogPageContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory | ''>('')
  const [tags, setTags] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState<ArticleStatus>('draft')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  // 取得分類顯示名稱
  const getCategoryLabel = (value: PostCategory) => {
    return POST_CATEGORIES.find((c) => c.value === value)?.label || value
  }

  // 載入文章資料
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const response = await postService.getPostById(id)

        if (!response.success || !response.data) {
          alert('找不到該文章')
          router.push('/profile/articles')
          return
        }

        const article = response.data
        setTitle(article.title)
        setContent(article.content)
        setSummary(article.excerpt || '')
        setCoverImage(article.cover_image)
        setTags(article.tags || [])
        setStatus(article.status)

        // 設定分類
        if (article.category) {
          setCategory(article.category)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('載入文章時出錯:', error)
        alert('載入文章時出錯，請稍後再試')
        router.push('/profile/articles')
      }
    }

    loadArticle()
  }, [id, router])

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
  const handleSubmit = async (newStatus: ArticleStatus) => {
    // 驗證表單
    if (!title.trim()) {
      alert('請輸入文章標題')
      return
    }

    if (!content.trim() || content === '<p><br></p>') {
      alert('請輸入文章內容')
      return
    }

    setIsSubmitting(true)

    try {
      // 自動產生摘要（如果沒有手動輸入）
      const autoSummary = generateSummary(content, summary)

      const postData = {
        title: title.trim(),
        content: sanitizeHtml(content),
        summary: autoSummary,
        coverImage: coverImage || '',
        category: category || undefined,
        tags,
        status: newStatus,
      }

      const response = await postService.updatePost(id, postData)

      if (response.success) {
        alert(newStatus === 'published' ? '文章更新成功！' : '草稿儲存成功！')
        router.push('/profile/articles')
      } else {
        throw new Error(response.message || '更新失敗')
      }
    } catch (error) {
      console.error('更新文章時出錯:', error)
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      alert(`更新文章時出錯：${errorMessage}。請檢查網路連線後再試。`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 處理返回
  const handleBack = () => {
    if (confirm('確定要離開嗎？未儲存的修改將會遺失。')) {
      router.back()
    }
  }

  // 載入中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
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
                  {getCategoryLabel(category)}
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
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-4 py-3">
          <Button variant="ghost" onClick={handleBack} className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">返回</span>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {status === 'draft' && (
              <span className="hidden rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800 sm:inline-block">
                草稿
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={isSubmitting}
              className="h-9 px-2 md:px-4"
            >
              <Eye className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">預覽</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting || isUploading}
              className="h-9 px-2 md:px-4"
            >
              <Save className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">儲存草稿</span>
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={isSubmitting || isUploading}
              className="h-9 bg-[#1B1A1A] px-2 text-white hover:bg-[#2B2A2A] md:px-4"
            >
              <Send className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">{status === 'published' ? '更新文章' : '發布文章'}</span>
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
                onValueChange={(value) => setCategory(value as PostCategory)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="請選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {POST_CATEGORIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-[#1B1A1A] placeholder:text-gray-400 focus:border-[#1B1A1A] focus:outline-none"
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

export default function EditBlogPage() {
  return (
    <ProtectedRoute>
      <EditBlogPageContent />
    </ProtectedRoute>
  )
}
