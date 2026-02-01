import { PostCategory } from '@/lib/types'

// 文章介面（用於前端顯示）
export interface Article {
  id: string
  title: string
  category: string // 分類顯示名稱
  categoryValue?: PostCategory // 分類英文值（用於封面產生器配色）
  date: string
  content: string
  imageUrl: string
  isFeature?: boolean
  description?: string
  author?: string // 作者名稱
  equipment?: {
    name: string
    usage: string
    commonTypes: string
    purchaseInfo: string
    recommendation: string
  }
  images?: string[]
}
