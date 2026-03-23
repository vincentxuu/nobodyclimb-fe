/**
 * 首頁
 *
 * 對應 apps/web/src/app/page.tsx
 * 內容導向型設計，展示攀岩社群的各種內容
 */
import React, { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { YStack } from 'tamagui'

import { SPACING } from '@nobodyclimb/constants'
import { ScrollLayout } from '@/components/layout'
import {
  FunFactSection,
  BiographySection,
  FeaturedStoriesSection,
  ExploreCragSection,
  AboutSection,
} from '@/components/home'

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    // TODO: 實作資料刷新邏輯
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }, [])

  return (
    <ScrollLayout enableRefresh onRefresh={onRefresh} padding={0}>
      {/* 趣味冷知識 */}
      <FunFactSection />

      {/* 查路線 - 探索岩場（對應 Web 第 2 區塊） */}
      <ExploreCragSection />

      {/* 看故事 - 精選故事（對應 Web 第 3 區塊） */}
      <FeaturedStoriesSection />

      {/* 寫紀錄 - 人物誌精選 */}
      <BiographySection />

      {/* 關於小人物攀岩 */}
      <AboutSection />

      {/* 底部間距 */}
      <View style={styles.bottomSpacer} />
    </ScrollLayout>
  )
}

const styles = StyleSheet.create({
  bottomSpacer: {
    height: SPACING[8],
  },
})
