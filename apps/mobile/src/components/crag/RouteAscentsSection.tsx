/**
 * 路線攀爬記錄區塊
 *
 * 顯示路線的攀爬統計摘要與最近的攀爬記錄列表
 * 對應 apps/web/src/components/crag/RouteAscentsSection.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { LogIn, Mountain, Plus, Star, Users } from 'lucide-react-native'
import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import type { AscentType } from '@/lib/constants/ascent'
import { ASCENT_TYPE_COLORS, ASCENT_TYPE_LABELS } from '@/lib/constants/ascent'
import { useCreateAscent, useRouteAscents } from '@/lib/hooks/useRouteAscents'
import { useAuthStore } from '@/store/authStore'
import { AscentForm, type AscentFormRef } from './AscentForm'

interface RouteAscentsSectionProps {
  routeId: string
  routeName?: string
  routeGrade?: string
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

function renderStars(rating: number | null) {
  if (rating == null) return null
  const stars: React.ReactNode[] = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        size={12}
        color={i <= rating ? '#EAB308' : '#D1D5DB'}
        fill={i <= rating ? '#EAB308' : 'transparent'}
      />
    )
  }
  return <View style={styles.starsRow}>{stars}</View>
}

export function RouteAscentsSection({ routeId, routeName, routeGrade }: RouteAscentsSectionProps) {
  const router = useRouter()
  const { ascents, summary, isLoading } = useRouteAscents(routeId)
  const ascentFormRef = React.useRef<AscentFormRef>(null)
  const createAscent = useCreateAscent()
  const { status } = useAuthStore()
  const isLoggedIn = status === 'signIn'

  const handleCreateAscent = async (data: {
    ascent_type: string
    ascent_date: string
    rating?: number
    notes?: string
  }) => {
    await createAscent.mutateAsync({
      route_id: routeId,
      ...data,
    })
  }

  return (
    <>
      <View style={styles.container}>
        {/* 區塊標題 */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
            <View style={styles.sectionBar} />
            <Text variant="body" fontWeight="600">
              攀爬記錄
            </Text>
          </View>
          {isLoggedIn ? (
            <Pressable style={styles.addButton} onPress={() => ascentFormRef.current?.open()}>
              <Plus size={16} color="#2563EB" />
              <Text variant="caption" style={{ color: '#2563EB' }}>
                記錄
              </Text>
            </Pressable>
          ) : (
            <Pressable style={styles.addButton} onPress={() => router.push('/auth/login' as any)}>
              <LogIn size={16} color="#2563EB" />
              <Text variant="caption" style={{ color: '#2563EB' }}>
                登入記錄
              </Text>
            </Pressable>
          )}
        </View>

        {/* 統計摘要 */}
        {summary && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Users size={14} color={SEMANTIC_COLORS.textMuted} />
              </View>
              <Text variant="h3" fontWeight="700">
                {summary.total_ascents}
              </Text>
              <Text variant="caption" color="textMuted">
                總攀登次數
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Mountain size={14} color={SEMANTIC_COLORS.textMuted} />
              </View>
              <Text variant="h3" fontWeight="700">
                {summary.unique_climbers}
              </Text>
              <Text variant="caption" color="textMuted">
                攀登人數
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Star size={14} color={SEMANTIC_COLORS.textMuted} />
              </View>
              <Text variant="h3" fontWeight="700">
                {summary.avg_rating?.toFixed(1) || '-'}
              </Text>
              <Text variant="caption" color="textMuted">
                平均評分
              </Text>
            </View>
          </View>
        )}

        {/* 記錄列表 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
          </View>
        ) : ascents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Mountain size={36} color="#D1D5DB" />
            <Text variant="body" color="textMuted" style={styles.emptyText}>
              還沒有人攀登過這條路線
            </Text>
            <Text variant="small" color="textMuted">
              成為第一個留下紀錄的攀岩者吧！
            </Text>
            {isLoggedIn ? (
              <Pressable style={styles.emptyAction} onPress={() => ascentFormRef.current?.open()}>
                <Text variant="small" fontWeight="600" style={styles.emptyActionText}>
                  立即記錄
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.recordList}>
            {ascents.map((ascent) => {
              const typeLabel =
                ASCENT_TYPE_LABELS[ascent.ascent_type as AscentType] ?? ascent.ascent_type
              const typeColor = ASCENT_TYPE_COLORS[ascent.ascent_type as AscentType] ?? '#6B7280'
              const displayName = ascent.display_name || ascent.username || '匿名攀岩者'

              return (
                <View key={ascent.id} style={styles.recordCard}>
                  {/* 使用者資訊列 */}
                  <View style={styles.recordHeader}>
                    {ascent.avatar_url ? (
                      <Image
                        source={{ uri: ascent.avatar_url }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text variant="caption" fontWeight="600" color="textMuted">
                          {displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.recordMeta}>
                      <Text variant="body" fontWeight="500">
                        {displayName}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {formatDate(ascent.ascent_date)}
                      </Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18` }]}>
                      <Text variant="caption" fontWeight="600" style={{ color: typeColor }}>
                        {typeLabel}
                      </Text>
                    </View>
                  </View>

                  {/* 評分 & 筆記 */}
                  {(ascent.rating != null || ascent.notes) && (
                    <View style={styles.recordBody}>
                      {ascent.rating != null && renderStars(ascent.rating)}
                      {ascent.notes && (
                        <Text
                          variant="small"
                          color="textSubtle"
                          numberOfLines={3}
                          style={styles.notes}
                        >
                          {ascent.notes}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </View>
      {isLoggedIn && (
        <AscentForm
          ref={ascentFormRef}
          routeId={routeId}
          routeName={routeName || ''}
          routeGrade={routeGrade || ''}
          onSubmit={handleCreateAscent}
          isLoading={createAscent.isPending}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionBar: {
    width: 4,
    height: 18,
    backgroundColor: '#FFE70C',
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.sm,
  },
  emptyText: {
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  emptyAction: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  emptyActionText: {
    color: '#2563EB',
  },
  recordList: {
    gap: SPACING.sm,
  },
  recordCard: {
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordMeta: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recordBody: {
    marginTop: SPACING.xs,
    paddingLeft: 32 + SPACING.sm, // align with text after avatar
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  notes: {
    lineHeight: 18,
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
})
