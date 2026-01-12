// 文章分類類型
export type ArticleCategory =
  | '所有文章'
  | '新手入門'
  | '新聞動態'
  | '裝備評測'
  | '技巧教學'
  | '訓練計畫'
  | '路線攻略'
  | '岩場體驗'
  | '岩館評測'
  | '攀岩旅遊'
  | '賽事報導'
  | '活動紀錄'
  | '社群資源'
  | '傷害防護'

export interface Article {
  id: string
  title: string
  category: ArticleCategory
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
