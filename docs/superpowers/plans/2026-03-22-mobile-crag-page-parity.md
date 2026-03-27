# Mobile 岩場頁面補齊 Web 功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 mobile 岩場詳細頁面缺少的 6 項功能補齊，使其與 web 版本一致。

**Architecture:** 所有新元件遵循現有 mobile crag 元件模式（React Native + StyleSheet + SEMANTIC_COLORS/SPACING/RADIUS），資料透過現有 API hooks（useCrags, useRouteStories, useRouteAscents）取得。表單使用 BottomSheet modal 呈現。

**Tech Stack:** React Native, Expo Router, @gorhom/bottom-sheet, expo-image, lucide-react-native, TanStack Query, Zustand (auth), react-native-webview (Google Maps)

---

## 已確認的 6 項差異

| # | 功能 | 現狀 |
|---|------|------|
| 1 | 岩場層級難度分佈圖 | Mobile 無，Web 有 GradeDistributionChart |
| 2 | Sector 篩選 | Mobile 傳 `sectors={[]}` 硬編碼空陣列 |
| 3 | Google Maps 嵌入地圖 | Mobile 僅外部連結，Web 有 iframe 嵌入 |
| 4 | UGC 表單（故事/照片/影片/IG/攀登紀錄） | Mobile 無任何建立表單 |
| 5 | 篩選結果 URL 分享 | Mobile 無 URL state |
| 6 | 故事留言互動 | Mobile 留言僅顯示數量，Web 也是僅顯示數量（確認一致，無需修改） |

> **注意：** 第 6 項經核實，Web 版 RouteStoriesSection 同樣僅顯示 comment_count 而無展開/撰寫留言功能（ContentCommentSheet 僅用於 biography）。故實際需補齊 **5 項**。

---

## File Structure

### 新增檔案
- `apps/mobile/src/components/crag/GradeDistributionChart.tsx` — 難度分佈水平長條圖
- `apps/mobile/src/components/crag/GoogleMapsEmbed.tsx` — WebView 嵌入 Google Maps
- `apps/mobile/src/components/crag/RouteStoryForm.tsx` — 故事建立表單（BottomSheet）
- `apps/mobile/src/components/crag/RouteMediaForm.tsx` — 媒體分享表單（照片/YouTube/IG）
- `apps/mobile/src/components/crag/AscentForm.tsx` — 攀登紀錄建立表單（BottomSheet）

### 修改檔案
- `apps/mobile/app/crag/[id]/index.tsx` — 加入 GradeDistributionChart、GoogleMapsEmbed、sectors 計算
- `apps/mobile/app/crag/[id]/route/[routeId].tsx` — 加入 UGC 表單按鈕、篩選 URL params
- `apps/mobile/src/components/crag/RouteStoriesSection.tsx` — 加入 RouteStoryForm 觸發按鈕
- `apps/mobile/src/components/crag/RouteAscentsSection.tsx` — 加入 AscentForm 觸發按鈕
- `apps/mobile/src/components/crag/RoutePhotosSection.tsx` — 加入 RouteMediaForm (photo) 觸發按鈕
- `apps/mobile/src/components/crag/index.ts` — 新增 exports
- `apps/mobile/src/lib/hooks/useRouteStories.ts` — 確認 useCreateRouteStory 可用
- `apps/mobile/src/lib/hooks/useRouteAscents.ts` — 新增 useCreateAscent mutation

---

### Task 1: GradeDistributionChart 元件

**Files:**
- Create: `apps/mobile/src/components/crag/GradeDistributionChart.tsx`
- Modify: `apps/mobile/src/components/crag/index.ts`
- Modify: `apps/mobile/app/crag/[id]/index.tsx`

**參考：** `apps/web/src/components/crag/grade-distribution-chart.tsx`

- [ ] **Step 1: 建立 GradeDistributionChart 元件**

```tsx
// apps/mobile/src/components/crag/GradeDistributionChart.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface GradeDistributionChartProps {
  gradeRanges: Record<string, number>
  totalRoutes: number
}

const gradeColors: Record<string, string> = {
  '5.6-5.9': '#4ade80',
  '5.10a-5.10d': '#facc15',
  '5.11a-5.11d': '#fb923c',
  '5.12a-5.12d': '#f87171',
  '5.13a-5.13d': '#c084fc',
  '5.14+': '#60a5fa',
}

const gradeLabels: Record<string, string> = {
  '5.6-5.9': '5.6 - 5.9',
  '5.10a-5.10d': '5.10a - 5.10d',
  '5.11a-5.11d': '5.11a - 5.11d',
  '5.12a-5.12d': '5.12a - 5.12d',
  '5.13a-5.13d': '5.13a - 5.13d',
  '5.14+': '5.14+',
}

const gradeRangeMapping = [
  { prefixes: ['5.6', '5.7', '5.8', '5.9'], label: '5.6-5.9' },
  { prefixes: ['5.10'], label: '5.10a-5.10d' },
  { prefixes: ['5.11'], label: '5.11a-5.11d' },
  { prefixes: ['5.12'], label: '5.12a-5.12d' },
  { prefixes: ['5.13'], label: '5.13a-5.13d' },
  { prefixes: ['5.14', '5.15'], label: '5.14+' },
]

/** 從路線 grade 陣列計算 gradeRanges */
export function computeGradeRanges(grades: string[]): Record<string, number> {
  const ranges: Record<string, number> = Object.fromEntries(
    gradeRangeMapping.map(({ label }) => [label, 0])
  )
  grades.forEach(grade => {
    const match = gradeRangeMapping.find(({ prefixes }) =>
      prefixes.some(p => grade.startsWith(p))
    )
    if (match) ranges[match.label]++
  })
  return ranges
}

export function GradeDistributionChart({ gradeRanges, totalRoutes }: GradeDistributionChartProps) {
  const maxCount = Math.max(...Object.values(gradeRanges), 1)
  const activeRanges = Object.entries(gradeRanges).filter(([, count]) => count > 0)

  if (activeRanges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color="textMuted">尚無難度資料</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {Object.entries(gradeRanges).map(([range, count]) => {
        const percentage = totalRoutes > 0 ? (count / totalRoutes) * 100 : 0
        const barWidth = (count / maxCount) * 100

        return (
          <View key={range} style={styles.row}>
            <View style={styles.labelRow}>
              <Text variant="small" fontWeight="500">{gradeLabels[range] || range}</Text>
              <Text variant="caption" color="textMuted">
                {count} 條 ({percentage.toFixed(0)}%)
              </Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${barWidth}%`,
                    backgroundColor: gradeColors[range] || '#94a3b8',
                    minWidth: count > 0 ? 8 : 0,
                  },
                ]}
              />
              {count > 0 && (
                <View style={styles.barLabel}>
                  <Text variant="caption" fontWeight="600" style={styles.barLabelText}>
                    {count}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )
      })}

      {/* 圖例 */}
      <View style={styles.legend}>
        {Object.entries(gradeColors).map(([range, color]) => (
          <View key={range} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text variant="caption" color="textSubtle">{gradeLabels[range]}</Text>
          </View>
        ))}
      </View>

      {/* 統計摘要 */}
      <View style={styles.summary}>
        <Text variant="small" color="textSubtle">共 {totalRoutes} 條路線</Text>
        <Text variant="small" color="textSubtle">涵蓋 {activeRanges.length} 個難度範圍</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  emptyContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
  },
  row: { gap: 4 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barBackground: {
    height: 28,
    backgroundColor: '#F0F0F0',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: RADIUS.sm,
  },
  barLabel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  barLabelText: { color: '#FFFFFF' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
})
```

- [ ] **Step 2: 加入 index.ts export**

在 `apps/mobile/src/components/crag/index.ts` 加入：
```ts
export { GradeDistributionChart, computeGradeRanges } from './GradeDistributionChart'
```

- [ ] **Step 3: 在岩場詳情頁加入 GradeDistributionChart**

在 `apps/mobile/app/crag/[id]/index.tsx`：

1. Import:
```tsx
import { ..., GradeDistributionChart, computeGradeRanges } from '@/components/crag'
```

2. 在 component 內計算 gradeRanges：
```tsx
const gradeRanges = useMemo(() => {
  return computeGradeRanges(routes.map(r => r.grade))
}, [routes])
```

3. 在「岩場設施」區塊之後、「天氣預報」之前插入：
```tsx
{/* 難度分佈 */}
{routes.length > 0 && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
        難度分佈
      </Text>
      <View style={styles.sectionDivider} />
    </View>
    <GradeDistributionChart gradeRanges={gradeRanges} totalRoutes={routes.length} />
  </View>
)}
```

- [ ] **Step 4: 驗證 build**

```bash
cd apps/mobile && npx expo export --platform ios --no-minify 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/crag/GradeDistributionChart.tsx apps/mobile/src/components/crag/index.ts apps/mobile/app/crag/\[id\]/index.tsx
git commit -m "feat(mobile): 岩場詳情頁加入難度分佈圖"
```

---

### Task 2: Sector 篩選啟用

**Files:**
- Modify: `apps/mobile/app/crag/[id]/index.tsx`

**參考：** `apps/web/src/app/[locale]/crag/[id]/CragDetailClient.tsx` (lines 48-56)

- [ ] **Step 1: 從 routes 動態計算 sectors**

在 `apps/mobile/app/crag/[id]/index.tsx`，在現有的 `areas` useMemo 之後加入：

```tsx
// 根據選取的區域從路線資料動態計算 sectors
const sectors = useMemo(() => {
  if (filterState.selectedArea === 'all') return []
  const sectorsSet = new Set<string>()
  routes
    .filter(route => route.areaId === filterState.selectedArea && route.sector)
    .forEach(route => sectorsSet.add(route.sector!))
  return Array.from(sectorsSet).map(sector => ({ id: sector, name: sector }))
}, [routes, filterState.selectedArea])
```

- [ ] **Step 2: 將 `sectors={[]}` 改為 `sectors={sectors}`**

將 RouteDrawer 的 props 從：
```tsx
sectors={[]}
```
改為：
```tsx
sectors={sectors}
```

- [ ] **Step 3: 過濾邏輯加入 sector**

在 `filteredRoutes` useMemo 內，在 area 過濾之後加入：

```tsx
if (filterState.selectedSector !== 'all') {
  result = result.filter((route) => route.sector === filterState.selectedSector)
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/crag/\[id\]/index.tsx
git commit -m "feat(mobile): 啟用岩場路線 Sector 篩選"
```

---

### Task 3: Google Maps 嵌入地圖

**Files:**
- Create: `apps/mobile/src/components/crag/GoogleMapsEmbed.tsx`
- Modify: `apps/mobile/src/components/crag/index.ts`
- Modify: `apps/mobile/app/crag/[id]/index.tsx`
- Modify: `apps/mobile/package.json` (install react-native-webview)

**參考：** Web 使用 iframe 嵌入 `https://maps.google.com/maps?q=...&output=embed`

- [ ] **Step 1: 安裝 react-native-webview**

```bash
cd apps/mobile && npx expo install react-native-webview
```

- [ ] **Step 2: 建立 GoogleMapsEmbed 元件**

```tsx
// apps/mobile/src/components/crag/GoogleMapsEmbed.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { RADIUS } from '@nobodyclimb/constants'

interface GoogleMapsEmbedProps {
  latitude: number
  longitude: number
  /** 地圖高度，預設 200 */
  height?: number
}

export function GoogleMapsEmbed({ latitude, longitude, height = 200 }: GoogleMapsEmbedProps) {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ uri: mapUrl }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
})
```

- [ ] **Step 3: 加入 index.ts export**

```ts
export { GoogleMapsEmbed } from './GoogleMapsEmbed'
```

- [ ] **Step 4: 在岩場詳情頁的「岩場位置」區塊加入地圖**

在 `apps/mobile/app/crag/[id]/index.tsx`，修改「岩場位置」section：

```tsx
import { ..., GoogleMapsEmbed } from '@/components/crag'
```

在現有的 Google Maps 連結之後加入嵌入地圖：

```tsx
{/* 岩場位置 */}
{crag.googleMapsUrl && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
        岩場位置
      </Text>
      <View style={styles.sectionDivider} />
    </View>
    <Pressable onPress={handleOpenMap} style={styles.mapLink}>
      <MapPin size={14} color="#2563EB" />
      <Text variant="small" style={styles.mapLinkText}>
        在 Google Maps 開啟
      </Text>
      <ExternalLink size={12} color="#2563EB" />
    </Pressable>
    {crag.geoCoordinates && (
      <View style={{ marginTop: SPACING.sm }}>
        <GoogleMapsEmbed
          latitude={crag.geoCoordinates.latitude}
          longitude={crag.geoCoordinates.longitude}
        />
      </View>
    )}
  </View>
)}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/crag/GoogleMapsEmbed.tsx apps/mobile/src/components/crag/index.ts apps/mobile/app/crag/\[id\]/index.tsx apps/mobile/package.json
git commit -m "feat(mobile): 岩場詳情頁嵌入 Google Maps 地圖"
```

---

### Task 4: UGC 表單 — RouteStoryForm

**Files:**
- Create: `apps/mobile/src/components/crag/RouteStoryForm.tsx`
- Modify: `apps/mobile/src/components/crag/RouteStoriesSection.tsx`
- Modify: `apps/mobile/src/components/crag/index.ts`
- Verify: `apps/mobile/src/lib/hooks/useRouteStories.ts` (useCreateRouteStory)

**參考：** `apps/web/src/components/route-story/RouteStoryForm.tsx`

- [ ] **Step 1: 確認 useCreateRouteStory hook 存在**

讀取 `apps/mobile/src/lib/hooks/useRouteStories.ts`，確認 `useCreateRouteStory` 已導出。如果不存在，需要新增。

- [ ] **Step 2: 建立 RouteStoryForm**

```tsx
// apps/mobile/src/components/crag/RouteStoryForm.tsx
import React, { useState, useCallback, useRef, useMemo } from 'react'
import { StyleSheet, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'

import { Text, IconButton, Button } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface RouteStoryFormProps {
  routeId: string
  routeName: string
  routeGrade: string
  onSubmit: (data: { title?: string; content: string }) => Promise<void>
  isLoading?: boolean
}

export interface RouteStoryFormRef {
  open: () => void
  close: () => void
}

export const RouteStoryForm = React.forwardRef<RouteStoryFormRef, RouteStoryFormProps>(
  ({ routeId, routeName, routeGrade, onSubmit, isLoading = false }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ['70%'], [])

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    React.useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.expand(),
      close: () => bottomSheetRef.current?.close(),
    }))

    const handleSubmit = async () => {
      if (!content.trim()) return
      await onSubmit({ title: title.trim() || undefined, content: content.trim() })
      setTitle('')
      setContent('')
      bottomSheetRef.current?.close()
    }

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      []
    )

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="h4" fontWeight="600">分享攀岩故事</Text>
              <Text variant="caption" color="textMuted">{routeName} ({routeGrade})</Text>
            </View>
            <IconButton
              icon={<X size={20} color={SEMANTIC_COLORS.textMain} />}
              onPress={() => bottomSheetRef.current?.close()}
              variant="ghost"
              size="sm"
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text variant="small" fontWeight="500" style={styles.label}>標題（選填）</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="為你的故事加個標題..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
              />
            </View>
            <View style={styles.field}>
              <Text variant="small" fontWeight="500" style={styles.label}>內容</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={content}
                onChangeText={setContent}
                placeholder="分享你的攀登體驗、beta、心得..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={!content.trim() || isLoading}
            style={styles.submitButton}
          >
            <Text fontWeight="600" style={{ color: '#FFFFFF' }}>
              {isLoading ? '送出中...' : '分享故事'}
            </Text>
          </Button>
        </BottomSheetScrollView>
      </BottomSheet>
    )
  }
)

RouteStoryForm.displayName = 'RouteStoryForm'

const styles = StyleSheet.create({
  container: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  background: { backgroundColor: SEMANTIC_COLORS.cardBg, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  indicator: { backgroundColor: '#D4D4D4', width: 36, height: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  form: { gap: SPACING.md },
  field: { gap: 4 },
  label: { marginLeft: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    fontSize: 14,
    color: SEMANTIC_COLORS.textMain,
  },
  textarea: { height: 120 },
  submitButton: { marginTop: SPACING.md },
})
```

- [ ] **Step 3: 在 RouteStoriesSection 加入「分享故事」按鈕**

修改 `apps/mobile/src/components/crag/RouteStoriesSection.tsx`：

1. Import RouteStoryForm 和相關 hooks：
```tsx
import { RouteStoryForm, type RouteStoryFormRef } from './RouteStoryForm'
import { useCreateRouteStory } from '@/lib/hooks/useRouteStories'
import { Plus } from 'lucide-react-native'
import { Button } from '@/components/ui'
```

2. 在 RouteStoriesSection 內加入 ref 和 mutation：
```tsx
const storyFormRef = React.useRef<RouteStoryFormRef>(null)
const createStory = useCreateRouteStory()
const { status } = useAuthStore()
const isLoggedIn = status === 'signIn'

const handleCreateStory = async (data: { title?: string; content: string }) => {
  await createStory.mutateAsync({
    route_id: routeId,
    title: data.title,
    content: data.content,
    visibility: 'public',
  })
}
```

3. 在 section header 旁加入按鈕：
```tsx
<View style={styles.sectionHeader}>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
    <View style={styles.sectionBar} />
    <BookOpen size={18} color={SEMANTIC_COLORS.textMain} />
    <Text variant="body" fontWeight="600">攀岩故事</Text>
  </View>
  {isLoggedIn && (
    <Pressable
      style={styles.addButton}
      onPress={() => storyFormRef.current?.open()}
    >
      <Plus size={16} color="#2563EB" />
      <Text variant="caption" style={{ color: '#2563EB' }}>分享</Text>
    </Pressable>
  )}
</View>
```

4. 在 component return 最後加入 RouteStoryForm：
```tsx
{isLoggedIn && (
  <RouteStoryForm
    ref={storyFormRef}
    routeId={routeId}
    routeName="" // 從 props 傳入
    routeGrade="" // 從 props 傳入
    onSubmit={handleCreateStory}
    isLoading={createStory.isPending}
  />
)}
```

5. 需要在 RouteStoriesSection props 加入 routeName, routeGrade：
```tsx
interface RouteStoriesSectionProps {
  cragId: string
  routeId: string
  routeName?: string
  routeGrade?: string
}
```

6. 加入 addButton style：
```tsx
addButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 2,
},
```

- [ ] **Step 4: 更新路線詳情頁傳入 routeName/routeGrade**

在 `apps/mobile/app/crag/[id]/route/[routeId].tsx`，RouteStoriesSection 改為：
```tsx
<RouteStoriesSection
  cragId={id}
  routeId={routeId}
  routeName={routeData.route.name}
  routeGrade={routeData.route.grade}
/>
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/crag/RouteStoryForm.tsx apps/mobile/src/components/crag/RouteStoriesSection.tsx apps/mobile/src/components/crag/index.ts apps/mobile/app/crag/\[id\]/route/\[routeId\].tsx
git commit -m "feat(mobile): 路線故事分享表單"
```

---

### Task 5: UGC 表單 — AscentForm

**Files:**
- Create: `apps/mobile/src/components/crag/AscentForm.tsx`
- Modify: `apps/mobile/src/components/crag/RouteAscentsSection.tsx`
- Modify: `apps/mobile/src/lib/hooks/useRouteAscents.ts` (新增 useCreateAscent)
- Modify: `apps/mobile/src/components/crag/index.ts`

**參考：** `apps/web/src/components/ascent/AscentForm.tsx`

- [ ] **Step 1: 在 useRouteAscents.ts 加入 useCreateAscent**

```tsx
export function useCreateAscent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      route_id: string
      ascent_type: string
      ascent_date: string
      rating?: number
      notes?: string
    }) => {
      const response = await apiClient.post('/ascents', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routeAscents', variables.route_id] })
    },
  })
}
```

- [ ] **Step 2: 建立 AscentForm 元件**

```tsx
// apps/mobile/src/components/crag/AscentForm.tsx
// BottomSheet 表單，包含：
// - ascent_type 選擇（Pressable chips：redpoint, flash, onsight, attempt, toprope, lead, seconding, repeat）
// - ascent_date（TextInput 預設今天日期 YYYY-MM-DD）
// - rating 星級（1-5 星用 Star icons 的 Pressable 列）
// - notes（TextInput multiline）
// - 送出按鈕
```

完整元件使用與 RouteStoryForm 相同的 BottomSheet pattern。

使用 `ASCENT_TYPE_LABELS` 和 `ASCENT_TYPE_COLORS` 來渲染 type 選項。

- [ ] **Step 3: 在 RouteAscentsSection 加入「記錄攀登」按鈕**

與 RouteStoriesSection 相同 pattern — header 右側加 Plus 按鈕，觸發 AscentForm BottomSheet。

需要在 RouteAscentsSection props 加入 routeName, routeGrade：
```tsx
interface RouteAscentsSectionProps {
  routeId: string
  routeName?: string
  routeGrade?: string
}
```

- [ ] **Step 4: 更新路線詳情頁傳入 props**

```tsx
<RouteAscentsSection
  routeId={routeId}
  routeName={routeData.route.name}
  routeGrade={routeData.route.grade}
/>
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/crag/AscentForm.tsx apps/mobile/src/components/crag/RouteAscentsSection.tsx apps/mobile/src/lib/hooks/useRouteAscents.ts apps/mobile/src/components/crag/index.ts apps/mobile/app/crag/\[id\]/route/\[routeId\].tsx
git commit -m "feat(mobile): 攀登紀錄建立表單"
```

---

### Task 6: UGC 表單 — RouteMediaForm（照片/YouTube/IG）

**Files:**
- Create: `apps/mobile/src/components/crag/RouteMediaForm.tsx`
- Modify: `apps/mobile/src/components/crag/RoutePhotosSection.tsx`
- Modify: `apps/mobile/src/components/crag/index.ts`
- Modify: `apps/mobile/app/crag/[id]/route/[routeId].tsx` (YouTube/IG sections)

**參考：** `apps/web/src/components/crag/RouteMediaForm.tsx`

- [ ] **Step 1: 建立 RouteMediaForm**

BottomSheet 表單支援三種 mediaType：
- `photo`：使用 `expo-image-picker` 選擇照片（如已安裝），否則 TextInput 輸入 URL
- `youtube`：TextInput 輸入 YouTube URL
- `instagram`：TextInput 輸入 Instagram URL

每種模式都有 description TextInput。

提交時呼叫 `useCreateRouteStory` 並帶入對應的 media 欄位。

- [ ] **Step 2: 在 RoutePhotosSection 加入「分享照片」按鈕**

header 右側加按鈕，觸發 RouteMediaForm(photo)。

- [ ] **Step 3: 在路線詳情頁 YouTube/Instagram sections 加入「分享」按鈕**

在 `apps/mobile/app/crag/[id]/route/[routeId].tsx` 的 YouTube 和 Instagram sections 加入分享按鈕和 RouteMediaForm。

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/crag/RouteMediaForm.tsx apps/mobile/src/components/crag/RoutePhotosSection.tsx apps/mobile/src/components/crag/index.ts apps/mobile/app/crag/\[id\]/route/\[routeId\].tsx
git commit -m "feat(mobile): 媒體分享表單（照片/YouTube/IG）"
```

---

### Task 7: 篩選結果 URL 分享

**Files:**
- Modify: `apps/mobile/app/crag/[id]/index.tsx`
- Modify: `apps/mobile/app/crag/[id]/route/[routeId].tsx`

**參考：** Web 使用 URL query params `?area=xxx&sector=yyy&grade=zzz&type=www&q=search`

- [ ] **Step 1: 從 URL params 初始化 filterState**

在 `apps/mobile/app/crag/[id]/index.tsx`：

```tsx
const { id, area, sector, grade, type, q } = useLocalSearchParams<{
  id: string
  area?: string
  sector?: string
  grade?: string
  type?: string
  q?: string
}>()

const [filterState, setFilterState] = useState({
  searchQuery: q || '',
  selectedArea: area || 'all',
  selectedSector: sector || 'all',
  selectedGrade: grade || 'all',
  selectedType: type || 'all',
})
```

- [ ] **Step 2: 路線導航時攜帶篩選 params**

修改 `handleRoutePress`：
```tsx
const handleRoutePress = (routeId: string) => {
  const params = new URLSearchParams()
  if (filterState.selectedArea !== 'all') params.set('area', filterState.selectedArea)
  if (filterState.selectedSector !== 'all') params.set('sector', filterState.selectedSector)
  if (filterState.selectedGrade !== 'all') params.set('grade', filterState.selectedGrade)
  if (filterState.selectedType !== 'all') params.set('type', filterState.selectedType)
  if (filterState.searchQuery) params.set('q', filterState.searchQuery)
  const qs = params.toString()
  router.push(`/crag/${id}/route/${routeId}${qs ? '?' + qs : ''}` as any)
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/crag/\[id\]/index.tsx apps/mobile/app/crag/\[id\]/route/\[routeId\].tsx
git commit -m "feat(mobile): 篩選狀態透過 URL params 攜帶"
```

---

## 執行順序

Tasks 1-3 互相獨立，可以平行執行。
Tasks 4-6（UGC 表單）最好按順序：4 → 5 → 6（建立 pattern 後複用）。
Task 7 獨立，可最後執行。
