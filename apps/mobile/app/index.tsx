/**
 * 首頁
 *
 * 對應 apps/web/src/app/page.tsx
 * 內容導向型設計，展示攀岩社群的各種內容
 */

import { SPACING } from '@nobodyclimb/constants'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  AboutSection,
  BiographySection,
  ExploreCragSection,
  FeaturedStoriesSection,
  FunFactSection,
  HeroIntroSection,
} from '@/components/home'
import { ScrollLayout } from '@/components/layout'

export default function HomeScreen() {
  const [_refreshing, setRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    // 遞增 key 觸發子元件 remount，重新載入資料
    setRefreshKey((k) => k + 1)
    setRefreshing(false)
  }, [])

  return (
    <ScrollLayout enableRefresh onRefresh={onRefresh} padding={0}>
      {/* 趣味冷知識 */}
      <FunFactSection key={`fun-${refreshKey}`} />

      {/* 網站介紹 */}
      <HeroIntroSection />

      {/* 查路線 - 探索岩場（對應 Web 第 2 區塊） */}
      <ExploreCragSection key={`crag-${refreshKey}`} />

      {/* 看故事 - 精選故事（對應 Web 第 3 區塊） */}
      <FeaturedStoriesSection key={`stories-${refreshKey}`} />

      {/* 寫紀錄 - 人物誌精選 */}
      <BiographySection key={`bio-${refreshKey}`} />

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
