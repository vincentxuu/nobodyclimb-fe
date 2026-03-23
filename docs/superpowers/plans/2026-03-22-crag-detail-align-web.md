# Crag Detail Page — Align Mobile with Web

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 missing sections (Weather, Live Media, DataSource) to the mobile crag detail page and reorder sections to match the web.

**Architecture:** Create 3 new React Native components under `apps/mobile/src/components/crag/`, add them to the crag detail page in the correct order. All APIs already exist in the backend — no backend changes needed.

**Tech Stack:** React Native, react-native-webview (YouTube embed), Expo Linking, Tamagui, lucide-react-native

---

### Task 1: WeatherDisplay Component

**Files:**
- Create: `apps/mobile/src/components/crag/WeatherDisplay.tsx`

- [ ] **Step 1: Create WeatherDisplay component**

```tsx
// apps/mobile/src/components/crag/WeatherDisplay.tsx
import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Cloud, Droplets, ThermometerSun, AlertCircle } from 'lucide-react-native'
import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, WB_COLORS, BORDER_RADIUS } from '@nobodyclimb/constants'
import { apiClient } from '@/lib/api'

interface WeatherData {
  location: string
  temperature: number | null
  minTemp: number | null
  maxTemp: number | null
  condition: string | null
  precipitation: number | null
  humidity: number | null
  comfort: string | null
  updatedAt: string
  forecast: Array<{
    date: string
    minTemp: number | null
    maxTemp: number | null
    condition: string | null
    precipitation: number | null
  }>
}

interface WeatherDisplayProps {
  location: string
  latitude?: number
  longitude?: number
}

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

function formatTemp(value: number | null): string {
  return value !== null ? `${value}°` : '--'
}

function getWeatherColor(condition: string | null): string {
  if (!condition) return WB_COLORS[60]
  if (condition.includes('晴')) return '#EAB308'
  if (condition.includes('雨')) return '#3B82F6'
  if (condition.includes('雷')) return '#8B5CF6'
  return WB_COLORS[60]
}

function formatForecastLabel(dateString: string): string {
  const date = new Date(dateString)
  const hour = date.getHours()
  const period = hour < 12 ? '早' : '晚'
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  let dayLabel: string
  if (date.toDateString() === today.toDateString()) {
    dayLabel = '今天'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    dayLabel = '明天'
  } else {
    dayLabel = WEEKDAYS[date.getDay()]
  }
  return `${dayLabel}${period}`
}

export function WeatherDisplay({ location, latitude, longitude }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchWeather() {
      try {
        let response
        if (latitude && longitude) {
          response = await apiClient.get('/weather/coordinates', {
            params: { lat: latitude, lon: longitude },
          })
        } else {
          response = await apiClient.get('/weather', {
            params: { location },
          })
        }
        const data = response.data?.data ?? response.data
        if (data) setWeather(data)
      } catch (err) {
        console.error('[WeatherDisplay] Failed to fetch:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchWeather()
  }, [location, latitude, longitude])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={WB_COLORS[60]} />
      </View>
    )
  }

  if (error || !weather) return null

  const forecasts = (weather.forecast || []).slice(0, 14)

  return (
    <View style={styles.container}>
      {/* 目前天氣 */}
      <View style={styles.currentWeather}>
        <View style={styles.tempRow}>
          <Cloud size={24} color={getWeatherColor(weather.condition)} />
          <Text style={styles.tempText}>
            {formatTemp(weather.temperature)}
          </Text>
          <Text style={styles.conditionText}>
            {weather.condition || '未知'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <ThermometerSun size={14} color={WB_COLORS[60]} />
            <Text style={styles.detailText}>
              {formatTemp(weather.minTemp)} / {formatTemp(weather.maxTemp)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Droplets size={14} color={WB_COLORS[60]} />
            <Text style={styles.detailText}>
              {weather.precipitation !== null ? `${weather.precipitation}%` : '--%'}
            </Text>
          </View>
        </View>
      </View>

      {/* 預報 */}
      {forecasts.length > 0 && (
        <View style={styles.forecastGrid}>
          {forecasts.map((f, i) => (
            <View key={i} style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>{formatForecastLabel(f.date)}</Text>
              <Cloud size={16} color={getWeatherColor(f.condition)} />
              <Text style={styles.forecastTemp}>
                {formatTemp(f.minTemp)}/{formatTemp(f.maxTemp)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[0],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  currentWeather: { gap: SPACING[2] },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2] },
  tempText: { fontSize: 28, fontWeight: '700', color: WB_COLORS[100] },
  conditionText: { fontSize: 16, color: WB_COLORS[70] },
  detailRow: { flexDirection: 'row', gap: SPACING[4] },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: WB_COLORS[60] },
  forecastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING[4],
    gap: SPACING[2],
  },
  forecastItem: {
    alignItems: 'center',
    width: 70,
    gap: 2,
    paddingVertical: SPACING[1],
  },
  forecastLabel: { fontSize: 11, color: WB_COLORS[60] },
  forecastTemp: { fontSize: 11, color: WB_COLORS[70] },
})
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/src/components/crag/WeatherDisplay.tsx
git commit -m "feat(mobile/crag): add WeatherDisplay component"
```

---

### Task 2: YouTubeLiveCard Component

**Files:**
- Create: `apps/mobile/src/components/crag/YouTubeLiveCard.tsx`

- [ ] **Step 1: Create YouTubeLiveCard component**

Uses `react-native-webview` to embed YouTube iframe, matching web's implementation.

```tsx
// apps/mobile/src/components/crag/YouTubeLiveCard.tsx
import React from 'react'
import { StyleSheet, View, Pressable, Linking } from 'react-native'
import { WebView } from 'react-native-webview'
import { ExternalLink } from 'lucide-react-native'
import { Text } from '@/components/ui'
import { SPACING, WB_COLORS, BORDER_RADIUS } from '@nobodyclimb/constants'

interface YouTubeLiveCardProps {
  videoId: string
  title?: string
  description?: string
}

export function YouTubeLiveCard({ videoId, title, description }: YouTubeLiveCardProps) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`
  const displayTitle = title || '即時影像'

  const handleOpenYouTube = () => {
    Linking.openURL(youtubeUrl)
  }

  return (
    <View style={styles.container}>
      {/* 標題列 */}
      <View style={styles.header}>
        <Text style={styles.title}>{displayTitle}</Text>
        <Pressable onPress={handleOpenYouTube} style={styles.linkButton}>
          <Text style={styles.linkText}>在 YouTube 觀看</Text>
          <ExternalLink size={14} color={WB_COLORS[60]} />
        </Pressable>
      </View>

      {/* 影片嵌入 */}
      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          javaScriptEnabled
        />
      </View>

      {/* 說明文字 */}
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[0],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  title: { fontSize: 18, fontWeight: '700', color: WB_COLORS[100] },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 13, color: WB_COLORS[60] },
  videoContainer: {
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  webview: { flex: 1 },
  description: { fontSize: 13, color: WB_COLORS[60], marginTop: SPACING[3] },
})
```

- [ ] **Step 2: Check react-native-webview is installed**

Run: `grep "react-native-webview" apps/mobile/package.json`
If missing: `cd apps/mobile && pnpm add react-native-webview`

- [ ] **Step 3: Commit**
```bash
git add apps/mobile/src/components/crag/YouTubeLiveCard.tsx
git commit -m "feat(mobile/crag): add YouTubeLiveCard component"
```

---

### Task 3: TrafficCamerasCard Component

**Files:**
- Create: `apps/mobile/src/components/crag/TrafficCamerasCard.tsx`

- [ ] **Step 1: Create TrafficCamerasCard component**

Fetches nearby traffic cameras via `GET /traffic/cameras?lat={lat}&lon={lon}`. Shows selected camera image + thumbnail grid for switching.

```tsx
// apps/mobile/src/components/crag/TrafficCamerasCard.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, Pressable, Image, ActivityIndicator, Linking } from 'react-native'
import { Camera, ExternalLink, AlertCircle } from 'lucide-react-native'
import { Text } from '@/components/ui'
import { SPACING, WB_COLORS, BORDER_RADIUS } from '@nobodyclimb/constants'
import { apiClient } from '@/lib/api'

const MAX_CAMERAS = 6
const SERVICE_URL = 'https://www.1968services.tw/'

interface CameraData {
  camid: string
  camname: string
  camuri: string
  location: string
  direction?: string
}

interface TrafficCamerasCardProps {
  latitude: number
  longitude: number
}

export function TrafficCamerasCard({ latitude, longitude }: TrafficCamerasCardProps) {
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [selected, setSelected] = useState<CameraData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCameras = useCallback(async () => {
    try {
      const response = await apiClient.get('/traffic/cameras', {
        params: { lat: latitude, lon: longitude },
      })
      const data = response.data?.data ?? response.data?.results ?? []
      const list = (data as CameraData[]).slice(0, MAX_CAMERAS)
      setCameras(list)
      if (list.length > 0) setSelected(list[0])
    } catch (err) {
      console.error('[TrafficCamerasCard] Failed:', err)
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => { fetchCameras() }, [fetchCameras])

  const handleOpenService = () => Linking.openURL(SERVICE_URL)

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Camera size={18} color={WB_COLORS[100]} />
          <Text style={styles.title}>交通攝影機</Text>
        </View>
        <ActivityIndicator style={{ paddingVertical: SPACING[8] }} />
      </View>
    )
  }

  if (cameras.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Camera size={18} color={WB_COLORS[100]} />
          <Text style={styles.title}>交通攝影機</Text>
        </View>
        <View style={styles.emptyContainer}>
          <AlertCircle size={24} color={WB_COLORS[40]} />
          <Text style={styles.emptyText}>附近沒有找到交通攝影機</Text>
          <Pressable onPress={handleOpenService} style={styles.linkRow}>
            <Text style={styles.linkText}>前往 1968 查看</Text>
            <ExternalLink size={12} color="#3B82F6" />
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* 標題 */}
      <View style={[styles.header, { marginBottom: SPACING[3] }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
          <Camera size={18} color={WB_COLORS[100]} />
          <Text style={styles.title}>交通攝影機</Text>
        </View>
        <Pressable onPress={handleOpenService} style={styles.linkRow}>
          <Text style={styles.linkText}>1968 服務</Text>
          <ExternalLink size={12} color={WB_COLORS[60]} />
        </Pressable>
      </View>

      {/* 選中的攝影機 */}
      {selected && (
        <Pressable
          onPress={() => Linking.openURL(`${SERVICE_URL}cam/${selected.camid}`)}
          style={styles.mainImage}
        >
          <Image source={{ uri: selected.camuri }} style={styles.mainImageInner} resizeMode="cover" />
        </Pressable>
      )}
      {selected && (
        <Text style={styles.cameraName}>
          {selected.camname}{selected.direction ? ` - ${selected.direction}` : ''}
        </Text>
      )}

      {/* 縮圖列表 */}
      <View style={styles.thumbnailGrid}>
        {cameras.map((cam) => (
          <Pressable
            key={cam.camid}
            onPress={() => setSelected(cam)}
            style={[
              styles.thumbnail,
              selected?.camid === cam.camid && styles.thumbnailSelected,
            ]}
          >
            <Image source={{ uri: cam.camuri }} style={styles.thumbnailImage} resizeMode="cover" />
            <Text style={styles.thumbnailName} numberOfLines={1}>{cam.camname}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[0],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: WB_COLORS[100] },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 13, color: WB_COLORS[60] },
  emptyContainer: { alignItems: 'center', paddingVertical: SPACING[6], gap: SPACING[2] },
  emptyText: { fontSize: 14, color: WB_COLORS[60] },
  mainImage: {
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  mainImageInner: { width: '100%', height: '100%' },
  cameraName: { fontSize: 13, color: WB_COLORS[60], marginTop: SPACING[1], marginBottom: SPACING[3] },
  thumbnailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] },
  thumbnail: {
    width: '30%',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: { borderColor: '#FFE70C' },
  thumbnailImage: { aspectRatio: 16 / 9, width: '100%' },
  thumbnailName: {
    fontSize: 10,
    color: WB_COLORS[60],
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: WB_COLORS[10],
  },
})
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/src/components/crag/TrafficCamerasCard.tsx
git commit -m "feat(mobile/crag): add TrafficCamerasCard component"
```

---

### Task 4: DataSourceSection Component

**Files:**
- Create: `apps/mobile/src/components/crag/DataSourceSection.tsx`

- [ ] **Step 1: Create DataSourceSection component**

Matches web's `data-source-section.tsx` — shows source, maintainer, last updated, report error link.

```tsx
// apps/mobile/src/components/crag/DataSourceSection.tsx
import React from 'react'
import { StyleSheet, View, Pressable, Linking } from 'react-native'
import { Database, Clock, User, MessageSquare } from 'lucide-react-native'
import { Text } from '@/components/ui'
import { SPACING, WB_COLORS, BORDER_RADIUS } from '@nobodyclimb/constants'

export interface DataSourceInfo {
  source: string
  sourceUrl?: string
  lastUpdated?: string
  maintainer: string
  maintainerUrl?: string
  version?: string
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return '-' }
}

function InfoItem({
  icon,
  label,
  value,
  url,
}: {
  icon: React.ReactNode
  label: string
  value: string
  url?: string
}) {
  const handlePress = () => { if (url) Linking.openURL(url) }
  return (
    <View style={styles.infoItem}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        {url ? (
          <Pressable onPress={handlePress}>
            <Text style={styles.infoLink}>{value}</Text>
          </Pressable>
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    </View>
  )
}

export function DataSourceSection({ data }: { data: DataSourceInfo }) {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <InfoItem
          icon={<Database size={16} color={WB_COLORS[60]} />}
          label="資料來源"
          value={data.source}
          url={data.sourceUrl}
        />
        <InfoItem
          icon={<Clock size={16} color={WB_COLORS[60]} />}
          label="最後更新"
          value={formatDate(data.lastUpdated)}
        />
        <InfoItem
          icon={<User size={16} color={WB_COLORS[60]} />}
          label="資料維護"
          value={data.maintainer}
          url={data.maintainerUrl}
        />
        <InfoItem
          icon={<MessageSquare size={16} color={WB_COLORS[60]} />}
          label="回報錯誤"
          value="提交回報"
          url="https://forms.gle/Q1d4UXWpTUHVVCY88"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[5],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  grid: { gap: SPACING[4] },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING[2] },
  infoLabel: { fontSize: 12, color: WB_COLORS[60] },
  infoValue: { fontSize: 14, fontWeight: '500', color: WB_COLORS[100] },
  infoLink: { fontSize: 14, fontWeight: '500', color: '#F97316' },
})
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/src/components/crag/DataSourceSection.tsx
git commit -m "feat(mobile/crag): add DataSourceSection component"
```

---

### Task 5: Export New Components & Integrate into Crag Detail Page

**Files:**
- Modify: `apps/mobile/src/components/crag/index.ts`
- Modify: `apps/mobile/app/crag/[id]/index.tsx`

- [ ] **Step 1: Add exports to crag index**

Add to `apps/mobile/src/components/crag/index.ts`:
```ts
export { WeatherDisplay } from './WeatherDisplay'
export { YouTubeLiveCard } from './YouTubeLiveCard'
export { TrafficCamerasCard } from './TrafficCamerasCard'
export { DataSourceSection } from './DataSourceSection'
```

- [ ] **Step 2: Import new components in crag detail page**

In `apps/mobile/app/crag/[id]/index.tsx`, add to imports:
```ts
import { WeatherDisplay, YouTubeLiveCard, TrafficCamerasCard, DataSourceSection } from '@/components/crag'
```

- [ ] **Step 3: Add sections to crag detail page in correct order**

After the 岩場設施 section and before 攀岩區域, add:

```tsx
{/* 天氣預報 */}
{(crag.weatherLocation || crag.geoCoordinates) && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
        天氣預報
      </Text>
      <View style={styles.sectionDivider} />
    </View>
    <WeatherDisplay
      location={crag.weatherLocation || crag.location}
      latitude={crag.geoCoordinates?.latitude}
      longitude={crag.geoCoordinates?.longitude}
    />
  </View>
)}

{/* 即時影像 */}
{(crag.liveVideoId || crag.geoCoordinates) && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
        即時影像
      </Text>
      <View style={styles.sectionDivider} />
    </View>
    <View style={{ gap: SPACING[4] }}>
      {crag.geoCoordinates && (
        <TrafficCamerasCard
          latitude={crag.geoCoordinates.latitude}
          longitude={crag.geoCoordinates.longitude}
        />
      )}
      {crag.liveVideoId && (
        <YouTubeLiveCard
          videoId={crag.liveVideoId}
          title={crag.liveVideoTitle}
          description={crag.liveVideoDescription}
        />
      )}
    </View>
  </View>
)}
```

After 攀岩區域 section, replace the existing metadata section with:

```tsx
{/* 資料來源 */}
{crag.metadata && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
        資料來源
      </Text>
      <View style={styles.sectionDivider} />
    </View>
    <DataSourceSection data={crag.metadata} />
  </View>
)}
```

- [ ] **Step 4: Verify final section order matches web**

Expected order:
1. 封面/標題/位置
2. 快速資訊 + 導航按鈕
3. 岩場介紹（條件）
4. 岩場基本資訊
5. 交通方式（條件）
6. 岩場位置（條件）
7. 岩場設施（條件）
8. **天氣預報**（條件）← 新增
9. **即時影像**（條件）← 新增
10. 攀岩區域（條件）
11. **資料來源**（條件）← 升級

- [ ] **Step 5: Commit**
```bash
git add apps/mobile/src/components/crag/ apps/mobile/app/crag/[id]/index.tsx
git commit -m "feat(mobile/crag): integrate weather, live media, data source sections"
```

---

### Task 6: Verify TypeScript & Test

- [ ] **Step 1: Run TypeScript check**
```bash
npx tsc --noEmit --project apps/mobile/tsconfig.json 2>&1 | grep "crag/"
```
Expected: No new errors from our files

- [ ] **Step 2: Manual test on simulator**
- Open a crag detail page (e.g., 龍洞)
- Verify weather section loads
- Verify traffic cameras show images
- Verify YouTube live appears (if crag has live_video_id)
- Verify data source section shows metadata
- Verify section order matches web

- [ ] **Step 3: Final commit**
```bash
git commit -m "feat(mobile/crag): complete web alignment for crag detail page"
```
