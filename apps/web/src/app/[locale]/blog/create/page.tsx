'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { PostCategory, POST_CATEGORIES, getCategoryLabel } from '@/lib/types'
import { ProtectedRoute } from '@/components/shared/protected-route'
import { RichTextEditor, TagSelector, ImageUploader } from '@/components/editor'
import { postService } from '@/lib/api/services'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import { generateSummary } from '@/lib/utils/article'

type ArticleStatus = 'draft' | 'published'

function CreateBlogPageContent() {
  const t = useTranslations('BlogPage')
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory | ''>('')
  const [tags, setTags] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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
      alert(t('uploadImageFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  // 處理表單提交
  const handleSubmit = async (status: ArticleStatus) => {
    // 驗證表單
    if (!title.trim()) {
      alert(t('titleRequired'))
      return
    }

    if (!content.trim() || content === '<p><br></p>') {
      alert(t('contentRequired'))
      return
    }

    if (!category) {
      alert(t('categoryRequired'))
      return
    }

    setIsSubmitting(true)

    try {
      // 自動產生摘要（如果沒有手動輸入）
      const autoSummary = generateSummary(content, summary)

      // 產生 slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/^-|-$/g, '')

      const postData = {
        title: title.trim(),
        slug,
        content: sanitizeHtml(content),
        summary: autoSummary,
        coverImage: coverImage || '',
        category: category || undefined,
        tags,
        status,
      }

      const response = await postService.createPost(postData)

      if (response.success) {
        alert(status === 'published' ? t('publishSuccess') : t('draftSuccess'))
        router.push('/profile/articles')
      } else {
        throw new Error(response.message || t('publishFallbackError'))
      }
    } catch (error) {
      console.error('發布文章時出錯:', error)
      const errorMessage = error instanceof Error ? error.message : t('unknownError')
      alert(t('publishError', { error: errorMessage }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 處理返回
  const handleBack = () => {
    if (title || content || coverImage) {
      if (confirm(t('leaveConfirm'))) {
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
              {t('backToEdit')}
            </Button>
            <span className="text-sm text-gray-500">{t('previewMode')}</span>
          </div>
        </div>

        <main className="mx-auto max-w-[930px] px-4 py-8">
          <article className="bg-white p-6 md:p-10">
            {coverImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverImage}
                alt={title}
                className="mb-6 h-[300px] w-full rounded-lg object-cover"
              />
            )}
            <div className="mb-4 flex flex-wrap gap-2">
              {category && (
                <span className="rounded-full bg-brand-dark px-3 py-1 text-sm text-white">
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
            <h1 className="mb-6 text-3xl font-bold text-brand-dark">{title || t('unnamedArticle')}</h1>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) || `<p>${t('noContent')}</p>` }}
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
            <span className="hidden md:inline">{t('back')}</span>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={isSubmitting}
              className="h-9 px-2 md:px-4"
            >
              <Eye className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">{t('preview')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting || isUploading}
              className="h-9 px-2 md:px-4"
            >
              <Save className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">{t('saveDraft')}</span>
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={isSubmitting || isUploading}
              className="h-9 bg-brand-dark px-2 text-white hover:bg-brand-dark-hover md:px-4"
            >
              <Send className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">{t('publishArticle')}</span>
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
                placeholder={t('createTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-0 p-0 text-2xl font-medium shadow-none focus-visible:ring-0 md:text-3xl"
              />
            </div>

            {/* 內容編輯器 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-strong">{t('createContentLabel')}</label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder={t('createContentPlaceholder')}
              />
            </div>
          </div>

          {/* 側邊欄設定 */}
          <div className="space-y-6">
            {/* 封面圖片 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-strong">{t('createCoverLabel')}</label>
              <ImageUploader
                value={coverImage}
                onChange={setCoverImage}
                onFileSelect={handleCoverFileSelect}
                uploading={isUploading}
              />
            </div>

            {/* 分類 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-strong">{t('createCategoryLabel')}</label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as PostCategory)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t('createCategoryPlaceholder')} />
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
              <label className="mb-3 block text-lg font-medium text-strong">{t('createTagsLabel')}</label>
              <TagSelector tags={tags} onChange={setTags} maxTags={5} />
            </div>

            {/* 摘要 */}
            <div className="bg-white p-6">
              <label className="mb-3 block text-lg font-medium text-strong">
                {t('createSummaryLabel')}
                <span className="ml-2 text-sm font-normal text-gray-400">{t('createSummaryOptional')}</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={t('createSummaryPlaceholder')}
                className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-brand-dark placeholder:text-gray-400 focus:border-brand-dark focus:outline-none"
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
