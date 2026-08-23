---
name: mobile-pitfalls
description: 觀察到以下任一狀態時載入：要在 apps/mobile 新增/修改畫面或元件；mobile 測試綠但 app 行為不對；root typecheck 過但 mobile 型別炸；動到 babel.config、tokens、SafeAreaView、bottom sheet。
---

# Mobile 陷阱（Expo 54 + Expo Router 6 + RN 0.81）

查證日期：2026-07-13。標準作法見 `.claude/skills/add-mobile-screen`；本檔收「會炸的地方」。

## 驗證的三個結構性盲點

1. **root `pnpm typecheck` 靜默跳過 mobile**（無 typecheck script + `--if-present`）。
   改 mobile 的完成定義必含 `cd apps/mobile && npx tsc --noEmit` exit 0。
2. **Jest 與 Metro 模組解析不同**：Jest moduleNameMapper 把 `@nobodyclimb/*` 指到 packages **src**，
   Metro 跑 **dist**。測試全綠仍可能跑舊 code——改 shared package 後必 rebuild
   （`pnpm --filter "./packages/*" build`）。
   反例（觀察過的合理化）：「測試都過了，dist 一定沒問題」——測試根本沒碰 dist。
3. **`pnpm --filter @nobodyclimb/mobile test` 目前永遠 exit 1**（2026-07-13 實測）：
   `app/quiz/test.tsx` 是人格測驗的**路由畫面**（URL `/quiz/test`，內含 0 個 test），
   Jest 按檔名把它當測試檔載入 → AsyncStorage native module null → 1 suite fail。
   實際測試 20 suites / 100 tests 全過。判讀 mobile 測試結果要看 `Tests: ... passed` 行，
   不能只看 exit code；根治方式是 jest config 排除 `app/**` 或改路由檔名（另開任務處理）。

## UI 契約（review 會擋）

- `SafeAreaView` 一律 `react-native-safe-area-context`（conventions 規則 5 FAIL from `react-native`）。
- tokens 一律 `@nobodyclimb/constants`：`SEMANTIC_COLORS`/`SPACING`/`FONT_SIZE`/`BORDER_RADIUS`；
  硬編碼 hex 觸發 conventions 規則 6 WARN。
  **用 token 前確認它存在**：事故 `f83a5ef`/`94abd61` 抓到 `WB_COLORS[80]`（沒有 80 階）與
  `FONT_SIZE.md`（正確是 `.base`）——tokens 定義在 `packages/constants/src/theme.ts`，先查再用。
- Tamagui 雖有安裝與 `tamagui.config.ts`，但 UI kit 實際是純 RN StyleSheet 自建元件
  （`src/components/ui/`，~39 個）——照現況走，不要引入 Tamagui 元件。
- Icon 用 `lucide-react-native`；`ViewStyle` 與 `TextStyle` 不可混用（review 抓過）。
- UGC 表單 = `@gorhom/bottom-sheet` 模式：`forwardRef` + `useImperativeHandle` 暴露 `{open, close}`，
  mutation 在父層。範例：`src/components/crag/RouteStoryForm.tsx`。

## 行為契約

- 檔案即路由（`apps/mobile/app/`）；params 用 `useLocalSearchParams`；typedRoutes 開啟，
  特殊路徑必要時 `as never`。
- headerShown 全域關閉——畫面自組 header（`ui/PageHeader`）。
- refresh 必須真的 invalidate（`queryClient.invalidateQueries`），不是 `setTimeout` 假裝（事故 `94abd61`）。
- 信封雙層解包：`(await apiClient.get(...)).data?.data`。
- Token 存 `expo-secure-store`（`src/lib/tokenStorage.ts` singleton）；
  注意 `packages/api-client/src/native/` 的 token 層是 **stub**（TODO 未實作）——mobile 實際用 app 內的 tokenStorage。
- Env 用 `process.env.EXPO_PUBLIC_*`。
- `babel.config.js`：`react-native-reanimated/plugin` 必須是最後一個 plugin，不要動順序。
- 地圖 = `react-native-webview` 嵌 Google Maps（`GoogleMapsEmbed.tsx`），沒有原生地圖 SDK。
- 畫面 JSDoc 慣例：註明對應的 web 頁面（功能對齊）。

## 驗證組合

```bash
pnpm lint                                   # Biome（root）
cd apps/mobile && npx tsc --noEmit          # 必跑（root typecheck 不含 mobile）
pnpm --filter @nobodyclimb/mobile test      # jest-expo
```

## 重新驗證

```bash
grep -n "typecheck" apps/mobile/package.json; grep -n "reanimated/plugin" apps/mobile/babel.config.js
```
（第一條應無輸出＝typecheck script 仍不存在；若有輸出，本檔盲點 1 已過時。）
