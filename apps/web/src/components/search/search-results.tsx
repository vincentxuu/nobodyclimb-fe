import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function SearchResults() {
  const t = useTranslations('SearchPage')
  const searchParams = useSearchParams()

  const type = searchParams.get('type') || t('tabAll')
  const query = searchParams.get('q') || ''

  // TODO: 實作搜尋 API 整合
  // 目前搜尋功能需要連接後端 API

  return (
    <div className="py-12 text-center">
      <div className="mb-6">
        <Search className="mx-auto h-12 w-12 text-muted-foreground" />
      </div>
      <p className="text-xl font-medium text-muted-foreground">
        {t('searchInProgress')}
      </p>
      {query && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t('searchKeyword', { query, type: type !== t('tabAll') ? ` (${type})` : '' })}
        </p>
      )}
    </div>
  )
}
