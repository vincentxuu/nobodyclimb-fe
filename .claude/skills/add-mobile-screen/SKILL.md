---
name: add-mobile-screen
description: 新增 mobile（Expo Router + React Native）畫面或功能的標準步驟 — 檔案路由、UI tokens、data hook、bottom-sheet 表單。做 apps/mobile 相關任務時使用
---

# 新增 Mobile 畫面 / 功能

Mobile 在 `apps/mobile/`，Expo 54 + Expo Router 6（檔案即路由）。
UI 元件是純 React Native `StyleSheet`（Tamagui 雖有安裝但 UI kit 沒用它，照現況走）。

## 步驟

### 1. Data hook：`apps/mobile/src/lib/hooks/useThing.ts`

範例照抄：`apps/mobile/src/lib/hooks/usePosts.ts`。

```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api'

export function useThing(id: string | undefined) {
  return useQuery<Thing | null>({
    queryKey: ['thing', id],
    queryFn: async () => (await apiClient.get(`/things/${id}`)).data?.data ?? null,
    enabled: !!id,
  })
}
```

注意信封解法：backend 回 `{ success, data, pagination }`，axios 再包一層，
所以是 `response.data?.data`。寫完從 `src/lib/hooks/index.ts` barrel export。

### 2. 畫面：`apps/mobile/app/<route>/[id].tsx`

檔案位置 = 路由。範例照抄：`apps/mobile/app/blog/[id].tsx`。

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'   // 一定是這個，不是 react-native
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

export default function ThingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useThing(id)
  // headerShown 全域關閉，畫面自組 header（用 ui/PageHeader）
}
```

導頁：`router.push('/thing/123')`、`router.back()`。typedRoutes 開啟中，
特殊路徑必要時 `as never`。

### 3. UI 組裝規則

- 元件從 `@/components/ui` barrel 取（Button、Card、Input、PageHeader、EmptyState、
  Skeleton、Toast…共 39 個，先看有沒有現成的再自己寫）。
- 顏色 / 間距 / 字級 / 圓角一律用 `@nobodyclimb/constants` 的
  `SEMANTIC_COLORS` / `SPACING` / `FONT_SIZE` / `BORDER_RADIUS`，**不硬編碼 hex**。
- Icon 用 `lucide-react-native`。

### 4. UGC 輸入表單 → bottom sheet 模式

範例照抄：`apps/mobile/src/components/crag/RouteStoryForm.tsx`。
`forwardRef` + `useImperativeHandle` 暴露 `{ open, close }`，內部用 `@gorhom/bottom-sheet`
（`BottomSheetModalProvider` 已在 providers 裡）。父層持 ref、傳 async `onSubmit`（mutation 在父層）。

### 5. 驗證

```bash
pnpm lint                                   # Biome（root）
cd apps/mobile && npx tsc --noEmit          # mobile 沒有 typecheck script，必須手動跑
pnpm --filter @nobodyclimb/mobile test      # Jest（jest-expo）
```

**注意**：root `pnpm typecheck` 會靜默跳過 mobile——改了 mobile 一定要手動跑 tsc。

## 陷阱

- Babel：`react-native-reanimated/plugin` 必須是最後一個 plugin，不要動 `babel.config.js` 的順序。
- 地圖用 `react-native-webview` 嵌 Google Maps（`GoogleMapsEmbed.tsx`），沒有原生地圖 SDK。
- Token 存 `expo-secure-store`（`src/lib/tokenStorage.ts` 的 singleton），不要另建儲存機制。
- Env 用 `process.env.EXPO_PUBLIC_*`。
- Jest 的 module mapper 把 `@nobodyclimb/*` 指到 packages **原始碼**（src），
  但 Metro 跑的是 dist——測試過了不代表沒 build；改 shared package 記得 rebuild。
- 畫面 JSDoc 慣例：註明對應的 web 頁面（功能對齊）。
