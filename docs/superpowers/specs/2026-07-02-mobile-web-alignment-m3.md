# Mobile ↔ Web 功能對齊 M3 分析與計畫

**日期**：2026-07-02
**範圍**：`apps/mobile` 對齊 `apps/web` 的第三輪功能補齊（M3）
**前一輪**：[2026-03-16 Mobile ↔ Web 對齊設計文件](./2026-03-16-mobile-web-alignment-design.md)（PR-1 ~ PR-5 已全部完成）

---

## 背景

2026-03 的對齊計畫完成後，mobile 與 web 的路由層級已幾乎 1:1（crag、gym、biography、blog、quiz、games、admin 全套皆有對應）。本次分析針對三月後 web 新增的功能，以及先前輪次未涵蓋的互動深度差異，盤點出新一輪需要對齊的缺口。

### 分析方法

1. 比對兩端完整路由樹（web `src/app/[locale]/**/page.tsx` vs mobile `app/**/*.tsx`）
2. 比對 components domain 分組與互動元件深度
3. 查驗 2026-03-16 之後兩端的 commit 差異
4. 逐項驗證疑似缺口（grep 元件與 API 使用），排除誤報

---

## 現狀分析

### 路由層級差異

| 分類 | 路由 | 判定 |
|------|------|------|
| Web 獨有 | `/quiz/training/[type]` | 🔴 實質缺口（PR-6） |
| Web 獨有 | `/quiz/collection` | 🔴 實質缺口（PR-6） |
| Web 獨有 | `/ig-final-comparison`、`/profile/editor-demo` | ⚪ 開發展示頁，不移植 |
| Mobile 獨有 | `/gym/add`、`/profile/edit`、`/profile/ascents/create`、`/biography/explore/category/[value]`、`/biography/explore/topic/[id]` 等 | ⚪ 平台慣例差異（web 用 modal / query params），不需處理 |

### 元件與能力層級差異

| 功能 | Web 狀態 | Mobile 狀態 | 判定 |
|------|---------|------------|------|
| Quiz 訓練計畫 | `ResultTraining` + `/quiz/training/[type]` 完整週次追蹤 | ✅ 已完成（PR-6） | ✅ PR-6 |
| Quiz 人格收藏集 | `/quiz/collection` | ✅ 已完成（PR-6） | ✅ PR-6 |
| 原生推播 | 後台廣播系統已就緒（`/admin/broadcast`） | ✅ 已完成（PR-7） | ✅ PR-7 |
| 按讚者列表 | `ContentInteractorsPanel`（點讚數展開） | ✅ 已存在（內建於 `ContentLikeButton`） | ⚪ 誤判，PR-8 取消 |
| Bucket list 引用 | `ReferenceButton`（引用他人清單項目） | ✅ 已存在（內建於 `BucketListCardActions`） | ⚪ 誤判，PR-8 取消 |
| i18n 多語系 | next-intl，zh / en / ja | ❌ 純繁中硬編碼 | 🟡 待評估 |
| 繩索遊戲深度 | 16 個遊戲元件（GameCanvas、角色動畫、音效等） | 簡化版內嵌於 2 個頁面（有分數 / 生命機制，無角色動畫） | 🟡 待產品決策 |
| 分享封面產生器 | `ArticleCoverGenerator`、`CragCoverGenerator`、`GymCoverGenerator` | 僅 `QuizShareCard` | 🟡 待產品決策 |

### 查證後排除的項目（非缺口）

- **人格測驗本體、風格演進（evolution）**：同一 commit 已同步實作到 mobile
- **Bucket list 完成表單照片上傳**：兩端皆顯示「即將推出」，屬共同未完成
- **搜尋部分類型「開發中」**：兩端一致
- **Admin 後台**：mobile 已有全套（含 `ai/react-agent`、`logs/[logId]`），且多出 `admin/crags/[cragId]` 獨立路由 — 已超越原「admin 不移植」決策

---

## 實作計畫

### 執行順序

```
PR-6 (Quiz Training + Collection) → PR-7 (原生推播) → PR-8 (Biography 互動補齊，查證後取消)
```

i18n 與繩索遊戲深度、封面產生器另行評估，不排入本輪。

---

## PR-6：Quiz 訓練計畫 + 人格收藏集 ✅ 已完成

**優先序最高**：quiz 已上線，但 mobile 體驗斷在結果頁 — web 用戶測驗後有專屬訓練計畫與進度追蹤，mobile 沒有。

### 新增路由

| 路由 | 說明 |
|------|------|
| `apps/mobile/app/quiz/training/[type].tsx` | 訓練計畫頁（週次 tabs + 每日卡片 + 進度環） |
| `apps/mobile/app/quiz/collection.tsx` | 8 種人格收藏集 |

### 訓練計畫元件（`apps/mobile/src/components/quiz/training/`）

對照 web `apps/web/src/components/quiz/training/`（共約 720 行）移植為 React Native 版本：

| 元件 | Web 行數 | 說明 |
|------|---------|------|
| `TrainingPageClient` | 124 | 頁面主體，組合以下元件 |
| `TrainingHeader` | 38 | 人格類型標題區 |
| `WeekTabs` | 61 | 週次切換 tabs |
| `DayCard` | 152 | 每日訓練卡片（勾選完成、筆記） |
| `ProgressRing` | 57 | 圓形進度環（可重用 PR-2 已移植的 `CircularProgress`） |
| `GraduationBadge` | 84 | 完訓徽章 |
| `StartGuide` | 48 | 開始指引 |

另需在結果頁 `apps/mobile/app/quiz/result/[type].tsx` 加入 `ResultTraining` 區塊（web `ResultTraining.tsx`，79 行）：顯示訓練計畫摘要 + 前往訓練頁的 CTA。

### 收藏集

- 資料來源：`@nobodyclimb/constants` 的 `PERSONALITY_TYPES`（純前端，無 API）
- 移植 web `CollectionCard.tsx`，quiz 入口頁加上「探索 8 種人格」連結

### API（後端已存在，僅需 mobile 前端接上）

| 端點 | 說明 |
|------|------|
| `GET /training/plan/:type` | 取得人格類型的訓練計畫 |
| `GET /training/progress/me?type=` | 取得個人進度記錄 |
| `POST /training/progress` | 更新單日進度（`personality_type` / `week` / `day` / `completed` / `notes`） |

- 後端路由：`backend/src/routes/training.ts`（已完成）
- 型別：`@nobodyclimb/types` 的 `TrainingPlan`、`TrainingProgressRecord`（已存在）
- Mobile 新增 `src/lib/api/training.ts` + `src/lib/hooks/useTraining.ts`（對照 web `useTrainingPlan` / `useTrainingProgress` / `useUpdateProgress`）

---

## PR-7：原生推播通知 ✅ 已完成

> **部署備註**：需在 EAS 設定 projectId（`app.json` 的 `extra.eas.projectId`）後，`getExpoPushTokenAsync` 才能取得 token；缺 projectId 時 app 會靜默降級不影響使用。Migration `0073_device_tokens.sql` 需跑 `pnpm db:migrate:remote`。

**Mobile 獨有價值**：web 端廣播後台（`/admin/broadcast`）已就緒，但 mobile 收不到原生 push，通知僅存在於 App 內 `NotificationCenter`。

### Mobile 端

| 項目 | 說明 |
|------|------|
| 安裝 `expo-notifications` | 需確認 Expo SDK 54 對應版本 |
| 權限請求流程 | 首次登入後請求，設定頁可查看狀態 |
| Push token 註冊 | 登入後取得 Expo push token，上報後端；登出時解除 |
| 通知點擊導向 | 依 payload 導向對應頁面（deep link 至 crag / blog / biography 等） |
| 偏好整合 | 與現有 `NotificationPreferences` 元件整合 |

### 後端（目前完全沒有 device token 支援，需新增）

| 項目 | 說明 |
|------|------|
| Migration | 新增 `device_tokens` 表（`user_id`、`token`、`platform`、`created_at`） |
| `POST /notifications/device-token` | 註冊 / 更新 token |
| `DELETE /notifications/device-token` | 登出時解除 |
| 廣播整合 | `adminBroadcastService` 發送時同步呼叫 Expo Push API（批次、失效 token 清理） |

---

## PR-8：Biography 互動元件補齊 ⚪ 查證後取消（功能已存在）

實作前逐項查證發現，兩個子項目在 mobile **皆已實作**，只是以 inline 方式寫在既有元件內，未沿用 web 的獨立元件名，導致最初以元件名 grep 的分析誤判為缺口：

### 8-1 按讚者列表 ✅ 已存在

- Mobile `ContentLikeButton`（`src/components/biography/display/ContentLikeButton.tsx`）已內建 `onFetchLikers` prop 與 inline 按讚者 panel（頭像 chip 列表、載入與空狀態）
- `ContentInteractionBar` 已接上 `GET /content/{contentType}/{contentId}/likers`

### 8-2 Bucket list 引用 ✅ 已存在

- `BucketListCardActions`（`src/components/bucket-list/BucketListItem.tsx`）已內建引用按鈕：`POST/DELETE /bucket-list/:id/reference`、樂觀更新 + 失敗回滾、未登入導向登入頁
- `BiographyBucketList` 重用 `BucketListCardActions`；`TrendingGoals` 也有獨立的 reference 呼叫

> **教訓**：跨平台功能盤點不能只用元件名比對，需以「行為 + API 呼叫」查證。

---

## PR-7.5：個人互動通知推播 + deep-link ✅ 已完成

PR-7 完成後發現一個實質限制：原生推播**只有 admin 廣播會發**，個人互動通知（按讚/留言/追蹤/引用）僅寫 in-app、不推播，且廣播 payload 沒帶 deep-link。這使推播無法發揮「提升互動回訪」的核心價值，故補做本 PR。

### 後端

| 項目 | 說明 |
|------|------|
| `createNotification` / 聚合按讚流程 | 寫入通知後發送個人推播，payload 帶 `type` + deep-link `url` |
| `utils/notification-url.ts` | 依通知類型組前端路徑，與 mobile `getNotificationRoute`、web `getNotificationLink` 對齊 |
| Repository | 新增 `findDeviceTokensByUserId`、`findBiographySlugByUserId`、`findBiographySlugById`（後兩者供 new_follower / biography_commented 組 slug 連結） |
| 派發策略 | `executionCtx.waitUntil` 於回應後執行，不拖慢按讚/留言；posts / bucket-list / biographies 傳入 `c.executionCtx`，無 ctx 的路徑（content-interactions service）則 await 確保 Workers 不中斷 |
| 失效清理 | Expo 回報 `DeviceNotRegistered` 的 token 自動移除 |

### Mobile

- 無需改動：`PushNotificationManager`（PR-7）已讀 `data.url` 導頁，deep-link 直接生效

### 已知既有 quirk（非本 PR 引入）

- biography 按讚以 `goal_liked` 型別、target 為 biography id，導向 `/bucket-list/{id}` 與 in-app 路由對照一致但可能非預期；屬既有資料模型議題，另案處理

---

## 待評估項目（不排入本輪）

| 項目 | 評估重點 |
|------|---------|
| i18n 多語系 | 工程量最大（全 app 文案抽取 + i18n 框架導入），先確認 mobile 是否有 en / ja 需求 |
| 繩索遊戲完整版 | web 有 16 個遊戲元件（GameCanvas、ClimberCharacter、FallAnimation、音效），mobile 為簡化版；屬平台體驗取捨，需產品決策 |
| 分享封面產生器 | 視 mobile 原生分享流程（share sheet）設計而定 |

## 不在此次範圍內

- `/ig-final-comparison`、`/profile/editor-demo`（web 開發展示頁）
- AI Chat Widget UX 重新設計（mobile 已有 `ChatWidget`，功能對齊）
- Bucket list 照片上傳（兩端共同未完成，屬另一議題）

---

## 元件重用策略

| 元件類別 | 策略 |
|---------|------|
| 圓形進度（PR-6 ProgressRing） | 重用 PR-2 已移植的 `CircularProgress`（react-native-svg） |
| 週次 tabs | 重用現有 tab 元件模式 |
| 按讚 / 互動列 | 擴充現有 `ContentInteractionBar` / `ContentLikeButton`，不另建 |
| Toast / ConfirmDialog / BottomSheet | 重用 Track 1（2026-03）已補齊的 UI 元件 |
