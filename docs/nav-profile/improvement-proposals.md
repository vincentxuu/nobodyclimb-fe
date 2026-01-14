# Navigation & Profile 改進建議

**版本**: 1.0
**日期**: 2026-01-14
**狀態**: 提案中

---

## 目錄

1. [優先級分類](#優先級分類)
2. [高優先級改進](#高優先級改進)
3. [中優先級改進](#中優先級改進)
4. [低優先級改進](#低優先級改進)
5. [長期規劃](#長期規劃)

---

## 優先級分類

### 評估標準

| 優先級 | 標準 | 預估工時 |
|--------|------|----------|
| 🔴 高 | 影響用戶體驗 / 程式碼維護性問題 | 立即處理 |
| 🟡 中 | 優化體驗 / 提升一致性 | 1-2 週內 |
| 🟢 低 | 增強功能 / 長期優化 | 視情況排程 |

---

## 高優先級改進

### 1. 清理未使用的 MobileNavigationBar 組件

**問題描述**:
- `src/components/profile/MobileNavigationBar.tsx` 存在但未被使用
- 與實際使用的 `MobileNav.tsx` 功能重複
- 造成程式碼冗余和維護困擾

**影響**:
- ❌ 增加程式碼庫大小
- ❌ 可能造成開發人員混淆
- ❌ 維護成本增加

**建議方案**:

#### 方案 A: 直接刪除 (推薦)
```bash
# 刪除未使用的組件
rm src/components/profile/MobileNavigationBar.tsx
rm src/components/profile/MobileNavContext.tsx  # 如果只被該組件使用
```

**優點**:
- 簡單快速
- 減少程式碼複雜度

**風險**: 無

#### 方案 B: 保留作為備用
如果未來可能需要頂部導航設計:
```typescript
// 重新命名並移至 archive
mv src/components/profile/MobileNavigationBar.tsx \
   src/components/profile/archive/MobileNavigationBar.backup.tsx
```

**預估工時**: 0.5 小時
**建議優先級**: 🔴 立即處理

---

### 2. 統一 Profile 導航項目

**問題描述**:
- `MobileNav` 和 `UserMenu` 的 Profile 項目部分重複
- 導航路徑不一致，可能造成用戶混淆

**當前狀況**:

| 頁面 | UserMenu | MobileNav | 是否重複 |
|------|----------|-----------|----------|
| 我的人物誌 | ✅ | ✅ (人物誌) | ✅ |
| 人生清單 | ✅ | ✅ (清單) | ✅ |
| 我的照片 | ✅ | ✅ (照片) | ✅ |
| 我的文章 | ✅ | ✅ (文章) | ✅ |
| 我的收藏 | ✅ | ✅ (在更多選單) | ✅ |
| 帳號設定 | ✅ | ✅ (在更多選單) | ✅ |
| 攀岩成就 | ❌ | ✅ (在更多選單) | ❌ |

**建議方案**:

#### 方案 A: 簡化 UserMenu (推薦)
只保留「我的人物誌」入口，其他項目在 Profile 內部導航

```typescript
// UserMenu.tsx
<DropdownMenu>
  <DropdownMenuItem onClick={() => router.push('/profile')}>
    我的人物誌
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => router.push('/profile/settings')}>
    帳號設定
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => logout()}>
    登出
  </DropdownMenuItem>
</DropdownMenu>
```

**優點**:
- 清晰的資訊架構
- 減少重複項目
- 用戶更容易理解導航結構

#### 方案 B: 桌機版使用側邊欄導航
在 Profile 頁面桌機版使用側邊欄，而非 UserMenu 下拉

```
┌─────────────────────────────────────┐
│          Navbar                     │
└─────────────────────────────────────┘
┌─────────┬───────────────────────────┐
│ 側邊欄  │   Profile 內容             │
│         │                           │
│ 人物誌  │   ProfileContainer        │
│ 清單    │                           │
│ 照片    │                           │
│ 文章    │                           │
│ 收藏    │                           │
│ 成就    │                           │
│ 設定    │                           │
└─────────┴───────────────────────────┘
```

**預估工時**: 2-4 小時
**建議優先級**: 🔴 高

---

### 3. 實作 /profile/stats 頁面

**問題描述**:
- MobileNav 有「成就」導航項目
- 但 `/profile/stats` 頁面未實作
- 點擊會導致 404 錯誤

**建議方案**:

#### 方案 A: 快速實作基本版本 (推薦)
```typescript
// src/app/profile/stats/page.tsx
export default function ProfileStatsPage() {
  return (
    <ProfilePageLayout>
      <div className="rounded-sm bg-white p-6">
        <h1 className="text-2xl font-medium mb-6">攀岩成就</h1>

        {/* 基本統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="攀岩天數" value={120} />
          <StatCard title="完攀路線" value={85} />
          <StatCard title="最高難度" value="5.11a" />
          <StatCard title="文章發表" value={12} />
        </div>

        {/* 徽章區域 (可選) */}
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">成就徽章</h2>
          <div className="text-gray-500">
            即將推出...
          </div>
        </div>
      </div>
    </ProfilePageLayout>
  )
}
```

#### 方案 B: 暫時移除導航項目
如果短期內無法實作，先從 MobileNav 移除

```typescript
// src/app/profile/MobileNav.tsx
const moreMenuItems = [
  // { name: '成就', href: '/profile/stats', icon: BarChart3 },  // 暫時移除
  { name: '收藏', href: '/profile/bookmarks', icon: Bookmark },
  { name: '設定', href: '/profile/settings', icon: Settings },
]
```

**預估工時**:
- 方案 A: 4-8 小時
- 方案 B: 0.5 小時

**建議優先級**: 🔴 高 (先採用方案 B，再規劃方案 A)

---

## 中優先級改進

### 4. 優化認證流程

**問題描述**:
- Profile Layout 每次都進行認證檢查
- 載入狀態可能造成閃爍

**建議方案**:

#### 使用 Next.js Middleware 進行路由守衛
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('nobodyclimb_token')

  // 檢查是否訪問需要認證的路由
  if (request.nextUrl.pathname.startsWith('/profile')) {
    if (!token) {
      // 重導向到登入頁
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*']
}
```

**優點**:
- 在伺服器端檢查，更快速
- 減少客戶端狀態管理複雜度
- 避免載入閃爍

**預估工時**: 2-3 小時
**建議優先級**: 🟡 中

---

### 5. 改善手機版導航體驗

**問題描述**:
- 手機版同時有頂部 Navbar 和底部 MobileNav
- 空間佔用較多 (頂部 70px + 底部 80px)

**建議方案**:

#### 方案 A: 簡化主站 Navbar (推薦)
手機版進入 Profile 後，簡化主站 Navbar

```typescript
// Navbar.tsx
const pathname = usePathname()
const isInProfile = pathname.startsWith('/profile')

return (
  <header className={`
    ${isInProfile ? 'md:block hidden' : 'block'}  // Profile 頁面手機版隱藏
  `}>
    {/* Navbar 內容 */}
  </header>
)
```

同時調整 Profile Layout:
```typescript
// Profile Layout
<div className="pt-0 md:pt-[70px]">  // 手機版不需要頂部空間
  {children}
</div>
```

**優點**:
- 增加內容顯示空間
- 減少視覺負擔

**缺點**:
- 需要返回主站功能 (可在 Logo 位置加入)

#### 方案 B: 使用漢堡選單整合
將 MobileNav 改為抽屜式選單

```
┌─────────────────────────────────────┐
│ [☰] NobodyClimb         [創作] [👤] │
└─────────────────────────────────────┘
│                                     │
│     Profile 內容區                   │
│                                     │
```

點擊 [☰] 打開側邊抽屜顯示 Profile 導航

**預估工時**: 4-6 小時
**建議優先級**: 🟡 中

---

### 6. 增強桌機版 Profile 導航

**問題描述**:
- 桌機版 Profile 頁面沒有明確的內部導航
- 用戶需要回到 UserMenu 才能切換 Profile 子頁面

**建議方案**:

#### 在 Profile 頁面加入側邊欄或標籤頁導航

```
桌機版 Profile Layout:

┌─────────────────────────────────────────────────────┐
│                    Navbar                           │
└─────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────┐
│              │                                      │
│ 側邊欄導航   │   Profile 內容區                      │
│              │                                      │
│ [✓] 人物誌   │   ProfileContainer                   │
│ [ ] 清單     │                                      │
│ [ ] 照片     │                                      │
│ [ ] 文章     │                                      │
│ [ ] 收藏     │                                      │
│ [ ] 成就     │                                      │
│ [ ] 設定     │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

**實作範例**:
```typescript
// src/components/profile/layout/ProfileSidebar.tsx
export function ProfileSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:block w-48 pr-6">
      <nav className="space-y-2">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-2 rounded-md
              ${pathname === item.href
                ? 'bg-gray-100 font-medium'
                : 'hover:bg-gray-50'}
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

**預估工時**: 4-6 小時
**建議優先級**: 🟡 中

---

### 7. 優化 Profile 資料載入

**問題描述**:
- ProfileContainer 在掛載時才載入資料
- 可能造成載入延遲

**建議方案**:

#### 使用 React Suspense 和 Loading UI
```typescript
// src/app/profile/loading.tsx
export default function ProfileLoading() {
  return (
    <div className="rounded-sm bg-white p-6">
      <div className="space-y-6">
        {/* Skeleton UI */}
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
```

#### 使用 TanStack Query 優化快取
```typescript
// src/components/profile/ProfileContainer.tsx
import { useQuery } from '@tanstack/react-query'

const { data: profileData, isLoading } = useQuery({
  queryKey: ['profile', 'me'],
  queryFn: () => biographyService.getMyBiography(),
  staleTime: 5 * 60 * 1000,  // 5 分鐘內不重新載入
})
```

**優點**:
- 更好的載入體驗
- 自動快取和背景更新
- 減少不必要的 API 請求

**預估工時**: 3-4 小時
**建議優先級**: 🟡 中

---

## 低優先級改進

### 8. 導航項目圖示統一

**問題描述**:
- MobileNav 和 UserMenu 使用不同的圖示風格
- 部分文字描述不一致

**建議方案**:

#### 統一圖示和文字
```typescript
// 建立統一的導航配置
// src/lib/constants/navigation.ts
export const PROFILE_NAV_ITEMS = [
  {
    id: 'profile',
    label: '人物誌',
    mobileLebel: '人物誌',
    href: '/profile',
    icon: UserCircle
  },
  {
    id: 'bucket-list',
    label: '人生清單',
    mobileLabel: '清單',
    href: '/profile/bucket-list',
    icon: Target
  },
  // ...
] as const
```

**預估工時**: 1-2 小時
**建議優先級**: 🟢 低

---

### 9. 增加導航搜尋功能

**功能描述**:
- 在主站 Navbar 加入搜尋欄
- 快速搜尋文章、岩場、岩館、用戶

**實作範例**:
```typescript
// src/components/layout/navbar/GlobalSearch.tsx
export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  return (
    <div className="relative">
      <input
        type="search"
        placeholder="搜尋文章、岩場、用戶..."
        className="w-64 px-4 py-2 rounded-md border"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* 搜尋結果下拉 */}
      {query && (
        <div className="absolute top-full mt-2 w-full bg-white shadow-lg rounded-md">
          {results.map(result => (
            <SearchResultItem key={result.id} item={result} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**預估工時**: 8-12 小時
**建議優先級**: 🟢 低

---

### 10. 導航項目動態顯示

**功能描述**:
- 根據用戶權限或完成度動態顯示導航項目
- 例如：未建立人物誌時，提示「建立人物誌」

**實作範例**:
```typescript
// MobileNav.tsx
const menuItems = useMemo(() => {
  const items = [...]

  // 根據條件調整項目
  if (!user.hasBiography) {
    items[0].label = '建立人物誌'
    items[0].badge = 'new'
  }

  return items
}, [user])
```

**預估工時**: 2-3 小時
**建議優先級**: 🟢 低

---

## 長期規劃

### 11. 整合通知系統

**功能描述**:
- 在 Navbar 加入通知圖示
- 顯示新留言、按讚、追蹤等通知

**設計草圖**:
```
Navbar:
[Logo] [導航連結...] [🔔(3)] [創作] [👤]
                      ↓
                  通知下拉選單
```

**技術方案**:
- WebSocket 即時通知
- Server-Sent Events (SSE)
- 輪詢 (Polling) 備選方案

**預估工時**: 20-30 小時
**建議優先級**: 長期規劃

---

### 12. 導航個人化

**功能描述**:
- 根據用戶使用習慣調整導航順序
- 顯示最常訪問的頁面

**實作方向**:
```typescript
// 追蹤用戶導航行為
const trackNavigation = (path: string) => {
  const history = getNavigationHistory()
  history.push({ path, timestamp: Date.now() })
  saveNavigationHistory(history)
}

// 根據頻率排序導航項目
const sortedNavItems = useMemo(() => {
  const history = getNavigationHistory()
  const frequency = calculateFrequency(history)
  return navItems.sort((a, b) => frequency[b.href] - frequency[a.href])
}, [])
```

**預估工時**: 12-16 小時
**建議優先級**: 長期規劃

---

### 13. 多語系支援

**功能描述**:
- 導航項目支援多語系
- 繁體中文 / 英文切換

**實作方向**:
- 使用 `next-intl` 或 `i18next`
- 建立語系檔案

```typescript
// locales/zh-TW/navigation.json
{
  "nav": {
    "biography": "人物誌",
    "crag": "岩場",
    "gym": "岩館"
  }
}

// locales/en/navigation.json
{
  "nav": {
    "biography": "Profiles",
    "crag": "Crags",
    "gym": "Gyms"
  }
}
```

**預估工時**: 40-60 小時 (整個專案)
**建議優先級**: 長期規劃

---

## 實作優先順序建議

### 第一階段 (1-2 週)
1. ✅ 清理 MobileNavigationBar 組件
2. ✅ 統一 Profile 導航項目
3. ✅ 實作或移除 /profile/stats

### 第二階段 (2-4 週)
4. ✅ 優化認證流程 (Middleware)
5. ✅ 改善手機版導航體驗
6. ✅ 增強桌機版 Profile 導航

### 第三階段 (1-2 個月)
7. ✅ 優化 Profile 資料載入
8. ✅ 導航項目圖示統一
9. ✅ 增加導航搜尋功能

### 長期規劃 (3-6 個月)
10. ✅ 整合通知系統
11. ✅ 導航個人化
12. ✅ 多語系支援

---

## 評估指標

### 完成後預期改善

| 指標 | 改善前 | 改善後 | 目標 |
|------|--------|--------|------|
| 程式碼重複率 | ~30% | <10% | 減少維護成本 |
| 導航一致性 | 中等 | 高 | 提升用戶體驗 |
| 手機版空間利用 | 60% | 80% | 增加內容顯示 |
| 頁面載入時間 | 1.5s | <1s | 提升效能 |
| 用戶滿意度 | - | - | 問卷調查 |

---

## 相關文檔

- [主文檔](./README.md) - Navigation & Profile 系統架構
- [技術細節](./technical-details.md) - 技術實作說明

---

## 更新記錄

| 日期 | 版本 | 更新內容 |
|------|------|---------|
| 2026-01-14 | 1.0 | 初始版本，改進建議整理 |
