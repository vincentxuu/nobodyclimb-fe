import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { articles } from '@/lib/constants/articles'

// Define the type for the ID mapping
type IdMappingType = {
  [key: number]: string
}

export default function SearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const type = searchParams.get('type') || '全部'
  const query = searchParams.get('q') || ''

  const results = articles.filter((article) => {
    const matchesType = type === '全部' || article.category === type
    const matchesQuery =
      !query ||
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.description.toLowerCase().includes(query.toLowerCase())
    return matchesType && matchesQuery
  })

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-6">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
        </div>
        <p className="text-xl font-medium text-muted-foreground">搜尋不到任何結果</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {results.map((article) => {
        // 根據文章類別決定連結路徑
        let linkPath = ''

        // 由於系統內部資料格式不一致
        // 將數字型 ID 轉為字串型 ID (blog 詳細頁面需要)
        const articleId = String(article.id)

        // 根據收集到的映射資訊處理 ID
        // 搜尋頁面的 ID 是數字，而 blog 詳細頁面的 ID 是字串
        // 建立映射關係來解決不一致問題
        const idMapping: IdMappingType = {
          1: '2', // 確保器介紹 -> 攀岩確保器完整介紹：新手必讀指南
          4: '1', // 初次攀岩就上手 -> 初次攀岩就上手，攀岩新手應該知道的基礎技巧
          5: '10', // 如何選擇適合自己的攀岩鞋 -> 攀岩安全帽選購指南
          6: '12', // 自然岩場安全須知 -> 室內攀岩與戶外攀岩的技巧差異
          9: '3', // 運動攀登比賽規則解析 -> 2023 台灣攀岩公開賽賽事回顧
        }

        const mappedId = idMapping[article.id] || articleId

        switch (article.category) {
          case '裝備介紹':
          case '部落格':
          case '技巧介紹':
          case '技術研究':
          case '比賽介紹':
            linkPath = `/blog/${mappedId}`
            break
          case '人物誌':
            linkPath = `/biography/profile/${article.id}`
            break
          case '岩場介紹':
            // 判斷是岩館還是岩場
            if (article.location?.includes('區')) {
              linkPath = `/gym/1` // 暫時都指向 ID 為 1 的岩館
            } else {
              linkPath = `/crag/1` // 暫時都指向 ID 為 1 的岩場
            }
            break
          default:
            linkPath = `/blog/${mappedId}`
        }

        return (
          <Link href={linkPath} key={article.id}>
            <div className="flex cursor-pointer gap-6 p-4 transition-colors hover:bg-gray-50">
              <div className="relative h-[200px] w-[280px]">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <h2 className="mb-3 text-[26px] font-medium text-foreground">{article.title}</h2>
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded bg-foreground px-3 py-1 text-sm text-white">
                    {article.category}
                  </span>
                  <span className="text-sm text-muted-foreground">{article.date}</span>
                  {article.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{article.location}</span>
                    </div>
                  )}
                </div>
                <p className="line-clamp-3 text-base text-foreground">{article.description}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
