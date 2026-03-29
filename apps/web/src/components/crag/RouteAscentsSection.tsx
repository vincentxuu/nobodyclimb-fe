'use client'

import { LogIn, MountainSnow, Plus, Star, Users } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { AscentCard, AscentForm } from '@/components/ascent'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/hooks'
import { useAscents } from '@/lib/hooks/useAscents'
import type { RouteAscentSummary, UserRouteAscent } from '@/lib/types/ascent'

interface RouteAscentsSectionProps {
  routeId: string
  routeName: string
  routeGrade?: string
}

export function RouteAscentsSection({ routeId, routeName, routeGrade }: RouteAscentsSectionProps) {
  const t = useTranslations('CragPage')
  const { isSignedIn } = useAuth()
  const { getRouteAscents, getRouteAscentSummary, createAscent } = useAscents()
  const { toast } = useToast()

  const [ascents, setAscents] = useState<UserRouteAscent[]>([])
  const [ascentSummary, setAscentSummary] = useState<RouteAscentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAscentFormOpen, setIsAscentFormOpen] = useState(false)
  const [isAscentSubmitting, setIsAscentSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [ascentsRes, summaryRes] = await Promise.all([
          getRouteAscents(routeId, { limit: 5 }),
          getRouteAscentSummary(routeId),
        ])
        if (isMounted) {
          setAscents(ascentsRes.data)
          setAscentSummary(summaryRes)
        }
      } catch (error) {
        console.error('Error loading ascents:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  const handleCreateAscent = async (data: Parameters<typeof createAscent>[0]) => {
    setIsAscentSubmitting(true)
    try {
      const newAscent = await createAscent(data)
      setAscents((prev) => [newAscent, ...prev])
      const summaryRes = await getRouteAscentSummary(routeId)
      setAscentSummary(summaryRes)
      toast({
        title: t('ascentSuccess'),
        description: t('ascentSuccessDesc'),
      })
    } catch (error) {
      console.error('Error creating ascent:', error)
      toast({
        title: t('ascentFailed'),
        description: t('ascentFailedDesc'),
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsAscentSubmitting(false)
    }
  }

  return (
    <>
      <div className="mt-12 border-t pt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
            {t('ascentsTitle')}
          </h2>
          {isSignedIn ? (
            <Button size="sm" onClick={() => setIsAscentFormOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />
              {t('logAscent')}
            </Button>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="gap-1">
                <LogIn className="h-4 w-4" />
                {t('loginToLog')}
              </Button>
            </Link>
          )}
        </div>

        {/* 統計摘要 */}
        {ascentSummary && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                {t('totalAscents')}
              </div>
              <div className="mt-1 text-xl font-bold text-[#1B1A1A]">
                {ascentSummary.total_ascents}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <MountainSnow className="h-3 w-3" />
                {t('uniqueClimbers')}
              </div>
              <div className="mt-1 text-xl font-bold text-[#1B1A1A]">
                {ascentSummary.unique_climbers}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Star className="h-3 w-3" />
                {t('avgRating')}
              </div>
              <div className="mt-1 text-xl font-bold text-[#1B1A1A]">
                {ascentSummary.avg_rating?.toFixed(1) || '-'}
              </div>
            </div>
          </div>
        )}

        {/* 攀爬記錄列表 */}
        {isLoading ? (
          <div className="py-6 text-center text-gray-500">{t('storiesLoading')}</div>
        ) : ascents.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-6 text-center text-gray-500">
            <MountainSnow className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm">{t('noAscents')}</p>
            {isSignedIn && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsAscentFormOpen(true)}
                className="mt-2"
              >
                {t('beFirstToLog')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {ascents.map((ascent) => (
              <AscentCard key={ascent.id} ascent={ascent} showRoute={false} />
            ))}
          </div>
        )}
      </div>

      <AscentForm
        routeId={routeId}
        routeName={routeName}
        routeGrade={routeGrade}
        open={isAscentFormOpen}
        onOpenChange={setIsAscentFormOpen}
        onSubmit={handleCreateAscent}
        isLoading={isAscentSubmitting}
      />
    </>
  )
}
