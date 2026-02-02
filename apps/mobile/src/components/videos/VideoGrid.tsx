/**
 * VideoGrid 組件
 *
 * 影片網格列表，對應 apps/web/src/components/videos/video-grid.tsx
 */
import React, { useCallback } from 'react'
import { StyleSheet, FlatList, View, type ListRenderItem } from 'react-native'
import { SPACING } from '@nobodyclimb/constants'
import { VideoCard } from './VideoCard'
import type { Video } from './types'

export interface VideoGridProps {
  /** 影片列表 */
  videos: Video[]
  /** 影片點擊回調 */
  onVideoClick: (video: Video) => void
  /** 是否顯示為單欄 */
  singleColumn?: boolean
  /** 列表頭部組件 */
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null
  /** 列表底部組件 */
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null
  /** 空列表組件 */
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null
  /** 下拉刷新回調 */
  onRefresh?: () => void
  /** 是否正在刷新 */
  refreshing?: boolean
  /** 滾動到底部回調 */
  onEndReached?: () => void
  /** 觸發 onEndReached 的閾值 */
  onEndReachedThreshold?: number
}

/**
 * 影片網格列表
 *
 * @example
 * ```tsx
 * <VideoGrid
 *   videos={videos}
 *   onVideoClick={(video) => setSelectedVideo(video)}
 *   onRefresh={handleRefresh}
 *   refreshing={isRefreshing}
 * />
 * ```
 */
export function VideoGrid({
  videos,
  onVideoClick,
  singleColumn = false,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onRefresh,
  refreshing = false,
  onEndReached,
  onEndReachedThreshold = 0.5,
}: VideoGridProps) {
  const numColumns = singleColumn ? 1 : 2

  const renderItem: ListRenderItem<Video> = useCallback(
    ({ item, index }) => {
      // 雙欄佈局時，處理間距
      const isLeftColumn = index % 2 === 0
      const marginStyle = singleColumn
        ? { marginBottom: SPACING[4] }
        : {
            marginBottom: SPACING[4],
            marginLeft: isLeftColumn ? 0 : SPACING[2],
            marginRight: isLeftColumn ? SPACING[2] : 0,
          }

      return (
        <View style={[styles.itemContainer, marginStyle]}>
          <VideoCard
            video={item}
            onClick={onVideoClick}
            fullWidth={singleColumn}
          />
        </View>
      )
    },
    [onVideoClick, singleColumn]
  )

  const keyExtractor = useCallback((item: Video) => item.id, [])

  if (videos.length === 0 && !ListEmptyComponent) {
    return null
  }

  return (
    <FlatList
      data={videos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={numColumns} // 改變 numColumns 時強制重新渲染
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
  },
  itemContainer: {
    flex: 1,
  },
})

export default VideoGrid
