'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const cragId = params.id as string | undefined
  const t = useTranslations('CragPage')

  useEffect(() => {
    console.error('路線頁面錯誤:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {t('routeErrorTitle')}
        </h2>

        <p className="mb-6 text-sm text-gray-600">
          {t('routeErrorDescription')}
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 rounded-lg bg-gray-100 p-3 text-left">
            <p className="text-xs font-mono text-gray-700 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B1A1A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <RefreshCw size={16} />
            {t('retryButton')}
          </button>

          <Link
            href={cragId ? `/crag/${cragId}` : '/crag'}
            prefetch={false}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            {t('backToCrag')}
          </Link>
        </div>
      </div>
    </div>
  )
}
