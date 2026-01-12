import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchResults() {
  const searchParams = useSearchParams()

  const type = searchParams.get('type') || '全部'
  const query = searchParams.get('q') || ''

  // TODO: 實作搜尋 API 整合
  // 目前搜尋功能需要連接後端 API

  return (
    <div className="py-12 text-center">
      <div className="mb-6">
        <Search className="mx-auto h-12 w-12 text-muted-foreground" />
      </div>
      <p className="text-xl font-medium text-muted-foreground">
        搜尋功能開發中
      </p>
      {query && (
        <p className="mt-2 text-sm text-muted-foreground">
          搜尋關鍵字：{query} {type !== '全部' && `(${type})`}
        </p>
      )}
    </div>
  )
}
