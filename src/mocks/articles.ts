// 文章介面（用於前端顯示）
export interface Article {
  id: string
  title: string
  category: string // 分類顯示名稱
  date: string
  content: string
  imageUrl: string
  isFeature?: boolean
  description?: string
  equipment?: {
    name: string
    usage: string
    commonTypes: string
    purchaseInfo: string
    recommendation: string
  }
  images?: string[]
}
