# Navigation & Profile 技術實作細節

**版本**: 1.0
**日期**: 2026-01-14

---

## 目錄

1. [技術棧](#技術棧)
2. [狀態管理](#狀態管理)
3. [路由導航機制](#路由導航機制)
4. [認證流程](#認證流程)
5. [響應式設計實作](#響應式設計實作)
6. [效能優化](#效能優化)
7. [資料流向](#資料流向)

---

## 技術棧

### 核心框架
- **Next.js 15.5**: App Router 模式
- **React 19.2**: Client Components
- **TypeScript 5.9**: 型別系統

### UI 相關
- **Tailwind CSS 3.4**: 樣式系統
- **Framer Motion 12.23**: 動畫效果
- **Radix UI**: 無障礙 UI 組件 (Dropdown, HoverCard)
- **Lucide React**: 圖示系統

### 狀態管理
- **Zustand 4.5**: 全局狀態 (authStore)
- **React Context**: Profile 局部狀態
- **React Hooks**: 組件狀態管理

### 導航
- **next/navigation**: useRouter, usePathname, Link
- **next/link**: 客戶端路由

---

## 狀態管理

### Auth Store (Zustand)

**位置**: `src/store/authStore.ts`

#### State 結構
```typescript
interface AuthState {
  // 狀態
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null

  // Actions
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

interface User {
  id: string
  username: string
  email: string
  name?: string
  avatar?: string
  avatarStyle?: string
}
```

#### 使用方式
```typescript
// 在組件中使用
const isAuthenticated = useAuthStore(state => state.isAuthenticated)
const user = useAuthStore(state => state.user)
const logout = useAuthStore(state => state.logout)
```

#### 持久化
- 使用 Zustand persist middleware
- 儲存到 localStorage
- 需要處理 hydration (SSR → CSR)

### Profile Context

**位置**: `src/components/profile/ProfileContext.tsx`

#### Context 結構
```typescript
interface ProfileContextType {
  profileData: ProfileData
  setProfileData: (data: ProfileData) => void
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
}

interface ProfileData {
  name: string
  startYear: number
  frequentGyms: string
  favoriteRouteType: string
  climbingReason: string
  climbingMeaning: string
  climbingBucketList: string
  adviceForBeginners: string
  advancedStories: AdvancedStories
  climbingLocations: ClimbingLocation[]
  socialLinks: SocialLinks
  images: ProfileImage[]
  imageLayout: ImageLayout
  isPublic: boolean
}
```

#### Provider 範圍
- 包裹整個 `/profile/*` 路由
- 在 `src/app/profile/layout.tsx` 中使用
- 所有 Profile 子頁面共享狀態

#### 使用方式
```typescript
// 在 Profile 組件中使用
const { profileData, setProfileData, isEditing, setIsEditing } = useProfile()
```

### Mobile Nav Context

**位置**: `src/components/profile/MobileNavContext.tsx`

#### Context 結構
```typescript
interface MobileNavContextType {
  isMobile: boolean
}
```

#### 功能
- 偵測裝置是否為手機版
- 提供給 Profile 組件判斷顯示邏輯

---

## 路由導航機制

### Next.js App Router

#### 路由檔案結構
```
src/app/
├── layout.tsx                  # Root Layout (含 Navbar)
├── page.tsx                    # 首頁
├── profile/
│   ├── layout.tsx              # Profile Layout
│   ├── page.tsx                # Profile 主頁
│   ├── articles/page.tsx
│   ├── bookmarks/page.tsx
│   ├── settings/page.tsx
│   ├── photos/page.tsx
│   ├── bucket-list/page.tsx
│   └── MobileNav.tsx           # Profile 專用導航
└── ...
```

#### Layout 巢狀結構
```
RootLayout (全站)
└── Navbar (固定頂部)
    └── ProfileLayout (Profile 區域)
        ├── MobileNav (手機底部導航)
        └── Page Content
```

### 客戶端導航

#### Link 組件使用
```tsx
// 預取優化
<Link href="/profile" prefetch={true}>
  我的人物誌
</Link>
```

#### useRouter Hook
```tsx
const router = useRouter()

// 程式化導航
const handleNavigate = (href: string) => {
  if (pathname !== href) {
    router.push(href, { scroll: false })  // 不滾動到頂部
  }
}
```

#### usePathname Hook
```tsx
const pathname = usePathname()

// 判斷當前路由
const isActive = pathname === item.href
const isInSection = pathname.startsWith('/profile')
```

### 路由守衛 (Profile Layout)

#### 認證檢查流程
```tsx
// 1. 等待 Zustand hydration
const [isHydrated, setIsHydrated] = useState(false)
useEffect(() => {
  setIsHydrated(true)
}, [])

// 2. 檢查認證狀態
useEffect(() => {
  if (isHydrated && !isStoreLoading && !isAuthenticated) {
    router.push('/auth/login?callbackUrl=' + encodeURIComponent(pathname))
  }
}, [isAuthenticated, isStoreLoading, isHydrated])

// 3. 顯示載入或內容
if (!isHydrated || isStoreLoading) {
  return <LoadingSpinner />
}
```

---

## 認證流程

### 登入流程

```
1. 用戶在 /auth/login 輸入帳密
   ↓
2. 呼叫 API: POST /api/v1/auth/login
   ↓
3. 成功後獲得 JWT token 和 user 資料
   ↓
4. 儲存到 Cookie (js-cookie) 和 Zustand store
   ↓
5. 重導向到 callbackUrl 或 /profile
```

### Token 管理

#### Axios Interceptor
**位置**: `src/lib/api/client.ts`

```typescript
// Request Interceptor - 自動附加 Token
axiosInstance.interceptors.request.use(config => {
  const token = Cookies.get(AUTH_COOKIE_NAME)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor - 處理 Token 過期
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token 過期，嘗試刷新或登出
      authStore.getState().logout()
      router.push('/auth/login')
    }
    return Promise.reject(error)
  }
)
```

### 登出流程

```
1. 用戶點擊 UserMenu 的「登出」
   ↓
2. 呼叫 authStore.logout()
   ↓
3. 清除 Cookie 中的 token
   ↓
4. 清除 Zustand store 的 user 資料
   ↓
5. 重導向到首頁或登入頁
```

---

## 響應式設計實作

### 斷點定義

使用 Tailwind CSS 預設斷點:
```css
/* 手機版 (預設) */
/* < 768px */

/* 桌機版 */
md: @media (min-width: 768px)
lg: @media (min-width: 1024px)
```

### Navbar 響應式

#### UnifiedNav
```tsx
<nav className="relative flex-1 overflow-hidden">
  {/* 手機版: 右側漸層提示 */}
  <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent md:hidden" />

  {/* 導航連結容器 */}
  <div className="
    scrollbar-hide          // 隱藏滾動條
    flex items-center
    gap-4 md:gap-6 lg:gap-12
    overflow-x-auto         // 手機版可滾動
    px-2 md:px-4 lg:px-0
    lg:justify-center       // 桌機版居中
  ">
    {/* 導航項目 */}
  </div>
</nav>
```

#### UserMenu
```tsx
<div className="flex shrink-0 items-center px-2 md:px-4 lg:px-6">
  {/* 創作按鈕 */}
  <Button className="h-7 md:h-8 lg:h-9 px-2 md:px-3 lg:px-4">
    <span className="text-xs md:text-sm">創作</span>
  </Button>

  {/* 用戶頭像 */}
  <button className="h-7 w-7 md:h-8 md:w-8 lg:h-10 lg:w-10">
    {/* Avatar */}
  </button>
</div>
```

### Profile Layout 響應式

```tsx
<div className="min-h-screen bg-[#F5F5F5] pb-20 md:pb-0">
  {/* 內容區 */}
  <div className="pt-2 md:py-6">
    {children}
  </div>

  {/* 手機版底部導航 */}
  <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
    <MobileNav />
  </div>
</div>
```

### useIsMobile Hook

**位置**: `src/lib/hooks/useIsMobile.ts`

```typescript
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
```

---

## 效能優化

### 1. Link Prefetch

```tsx
// 預載入頁面
<Link href="/profile" prefetch={true}>
  我的人物誌
</Link>
```

### 2. 條件式導航

```tsx
// 避免重複導航
const handleNavigate = useCallback((href: string) => {
  if (pathname !== href) {
    router.push(href, { scroll: false })
  }
}, [pathname, router])
```

### 3. useCallback 優化

```tsx
// MobileNav.tsx
const handleNavigate = useCallback(
  (href: string) => {
    if (pathname !== href) {
      router.push(href, { scroll: false })
    }
    setIsMoreOpen(false)
  },
  [pathname, router]
)
```

### 4. 頁面轉場動畫節流

```tsx
// Profile Layout
const [isPageChanging, setIsPageChanging] = useState(false)

useEffect(() => {
  setIsPageChanging(true)
  setTimeout(() => {
    setIsPageChanging(false)
  }, 50)  // 短暫延遲避免閃爍
}, [pathname])

// 條件式渲染
<div className="pt-2 md:py-6">
  {!isPageChanging && children}
</div>
```

### 5. 事件監聽器優化

```tsx
// Navbar 滾動監聽
useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 20) {
      setIsScrolled(true)
    } else {
      setIsScrolled(false)
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}, [])
```

### 6. 點擊外部關閉選單

```tsx
// MobileNav 更多選單
const moreMenuRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
      setIsMoreOpen(false)
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```

---

## 資料流向

### Profile 頁面資料流

```
1. 用戶進入 /profile
   ↓
2. ProfileLayout 檢查認證
   ↓
3. ProfileProvider 初始化
   ↓
4. ProfileContainer 掛載
   ↓
5. 呼叫 API 獲取 Profile 資料
   GET /api/v1/biography/me
   ↓
6. 資料存入 ProfileContext
   ↓
7. 各區段組件從 Context 讀取資料
   - BasicInfoSection
   - ClimbingInfoSection
   - ...
   ↓
8. 用戶編輯資料
   ↓
9. 更新 Context 狀態 (本地)
   ↓
10. 用戶點擊儲存
    ↓
11. ProfileContainer 收集所有資料
    ↓
12. 呼叫 API 儲存
    POST /api/v1/biography/create (實際為 upsert)
    ↓
13. 成功後更新 Context 和 UI
```

### 導航互動流程

#### 主站導航
```
用戶點擊 UnifiedNav 項目
   ↓
<Link> 組件處理導航
   ↓
Next.js Router 客戶端路由
   ↓
目標頁面載入
   ↓
UnifiedNav 更新高亮狀態 (usePathname)
```

#### Profile MobileNav
```
用戶點擊導航項目
   ↓
handleNavigate() 函數
   ↓
檢查是否與當前路由相同
   ↓
router.push(href, { scroll: false })
   ↓
目標頁面載入 (不滾動到頂部)
   ↓
MobileNav 更新高亮狀態
```

#### UserMenu 下拉選單
```
用戶點擊頭像
   ↓
Radix DropdownMenu 打開
   ↓
用戶點擊選單項目
   ↓
onClick 事件觸發
   ↓
router.push() 導航
   ↓
DropdownMenu 自動關閉
```

---

## 動畫效果

### Framer Motion 使用

#### 頁面進場動畫
```tsx
// ProfileContainer.tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {/* 內容 */}
</motion.div>
```

#### 載入動畫
```tsx
// Profile Layout
<AnimatePresence>
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="animate-spin rounded-full border-t-2 border-[#1B1A1A]" />
    <p>載入中...</p>
  </motion.div>
</AnimatePresence>
```

#### MobileNavigationBar 進場
```tsx
<motion.div
  className="flex h-14 w-full items-center"
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* 導航項目 */}
</motion.div>
```

### CSS 動畫

#### 滾動進度條
```tsx
// Navbar
const { scrollYProgress } = useScroll()
const scaleX = useSpring(scrollYProgress, {
  stiffness: 200,
  damping: 30,
})

<motion.div
  className="fixed left-0 right-0 top-0 h-[3px] bg-[#FFE70C]"
  style={{ scaleX }}
/>
```

#### Hover 下劃線動畫
```tsx
// UnifiedNav
<Link className="group">
  <span className="relative">
    {/* 當前頁面下劃線 */}
    {pathname.startsWith(link.href) && (
      <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#1B1A1A]"></span>
    )}

    {/* Hover 動畫下劃線 */}
    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#1B1A1A] transition-all duration-300 group-hover:w-full"></span>

    {link.label}
  </span>
</Link>
```

---

## API 整合

### Biography Service

**位置**: `src/lib/api/services/biography.ts`

#### 主要 API 方法
```typescript
interface BiographyService {
  // 取得我的人物誌
  getMyBiography(): Promise<ApiResponse<Biography>>

  // 創建/更新人物誌 (upsert)
  createBiography(data: BiographyData): Promise<ApiResponse<Biography>>

  // 更新特定欄位
  updateMyBiography(data: Partial<BiographyData>): Promise<ApiResponse<Biography>>

  // 上傳圖片
  uploadImage(file: File): Promise<ApiResponse<{ url: string }>>

  // 取得公開人物誌 (其他用戶)
  getBiographyById(id: string): Promise<ApiResponse<Biography>>
}
```

#### 使用範例
```typescript
// ProfileContainer.tsx
const handleSave = async () => {
  try {
    const response = await biographyService.createBiography({
      name: profileData.name,
      climbing_start_year: profileData.startYear,
      // ...其他欄位
    })

    if (response.success) {
      toast({ title: '儲存成功' })
      setIsEditing(false)
    }
  } catch (error) {
    toast({ title: '儲存失敗', variant: 'destructive' })
  }
}
```

---

## 型別定義

### Navigation Types

```typescript
// NavLink
interface NavLink {
  href: string
  label: string
}

// MenuItem (Profile MobileNav)
interface MenuItem {
  name: string
  href: string
  icon: LucideIcon
}
```

### Profile Types

**位置**: `src/components/profile/types.ts`

```typescript
// Profile 圖片
interface ProfileImage {
  id: string
  url: string
  order: number
  caption?: string
}

// 圖片排版
type ImageLayout = 'grid' | 'masonry' | 'carousel'

// 社群連結
interface SocialLinks {
  instagram?: string
  facebook?: string
  youtube?: string
  website?: string
}

// 進階故事
interface AdvancedStories {
  [key: string]: string
}

// 攀岩地點
interface ClimbingLocation {
  id: string
  name: string
  type: 'crag' | 'gym'
  visitCount?: number
}
```

---

## 樣式系統

### Tailwind 配置

**自訂顏色**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // 文字顏色
        'text-main': '#1B1A1A',
        'text-subtle': '#3F3D3D',
        'text-light': '#6D6C6C',

        // 背景顏色
        'bg-primary': '#F5F5F5',
        'bg-secondary': '#EBEAEA',

        // 邊框顏色
        'border-default': '#DBD8D8',

        // 品牌色
        'brand-yellow': '#FFE70C',
        'brand-red': '#D94A4A',
      }
    }
  }
}
```

### 共用樣式類別

#### 按鈕樣式
```tsx
// 主要按鈕
className="
  border border-[#1B1A1A]
  text-[#1B1A1A]
  hover:bg-[#F5F5F5]
  transition-colors
"

// 危險按鈕 (登出)
className="
  text-[#D94A4A]
  hover:bg-red-50
"
```

#### 卡片樣式
```tsx
className="
  rounded-sm
  bg-white
  p-4 md:p-6 lg:p-8
  shadow-sm
"
```

#### 輸入框樣式
```tsx
className="
  w-full
  rounded-md
  border border-[#DBD8D8]
  px-3 py-2
  focus:outline-none
  focus:ring-2
  focus:ring-[#1B1A1A]
"
```

---

## 無障礙設計

### ARIA 標籤

```tsx
// 用戶頭像按鈕
<button aria-label="開啟用戶選單">
  <img src={avatar} alt="用戶頭像" />
</button>

// 導航連結
<Link href="/profile" aria-current={isActive ? 'page' : undefined}>
  我的人物誌
</Link>

// 圖示說明
<div role="img" aria-label="用戶頭像">
  {generateAvatarElement(avatarStyle)}
</div>
```

### 鍵盤導航

- 所有互動元素使用語義化 HTML (`<button>`, `<a>`)
- Radix UI 組件內建鍵盤導航支援
- Dropdown 可用 Tab, Enter, Escape 操作

### 顏色對比

- 主文字 `#1B1A1A` 在白色背景上符合 WCAG AA 標準
- 次要文字 `#3F3D3D` 在白色背景上符合 WCAG AA 標準

---

## 錯誤處理

### API 錯誤處理

```typescript
try {
  const response = await biographyService.createBiography(data)

  if (response.success) {
    // 成功處理
  } else {
    throw new Error(response.error || '未知錯誤')
  }
} catch (error) {
  console.error('API 錯誤:', error)
  toast({
    title: '操作失敗',
    description: error.message,
    variant: 'destructive'
  })
}
```

### 認證錯誤處理

```typescript
// Axios Interceptor
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // 未認證，清除狀態並重導向
      authStore.getState().logout()
      window.location.href = '/auth/login'
    }

    return Promise.reject(error)
  }
)
```

### 圖片上傳錯誤處理

```typescript
const handleImageUpload = async (file: File) => {
  // 檢查檔案大小
  if (file.size > MAX_IMAGE_SIZE) {
    toast({
      title: '圖片過大',
      description: '請上傳小於 5MB 的圖片',
      variant: 'destructive'
    })
    return
  }

  // 檢查檔案類型
  if (!IMAGE_FORMATS.some(format => file.name.endsWith(format))) {
    toast({
      title: '不支援的檔案格式',
      description: '請上傳 JPG, PNG 或 WebP 格式',
      variant: 'destructive'
    })
    return
  }

  try {
    // 上傳邏輯
  } catch (error) {
    toast({
      title: '上傳失敗',
      description: '請稍後再試',
      variant: 'destructive'
    })
  }
}
```

---

## 測試考量

### 單元測試重點

1. **導航邏輯**
   - 路由參數正確傳遞
   - 當前頁面高亮邏輯
   - 條件式導航防止重複

2. **認證守衛**
   - 未登入重導向
   - Token 過期處理
   - Hydration 狀態處理

3. **狀態管理**
   - Context 資料流
   - Zustand store 更新
   - 表單驗證邏輯

### 整合測試重點

1. **完整認證流程**
2. **導航切換流程**
3. **Profile 編輯儲存流程**
4. **圖片上傳流程**

### E2E 測試場景

1. 訪客瀏覽 → 點擊登入 → 登入後進入 Profile
2. 已登入用戶編輯 Profile → 儲存 → 驗證資料
3. 使用 MobileNav 切換不同 Profile 頁面
4. 從 UserMenu 導航到 Profile 各子頁面

---

## 相關文檔

- [主文檔](./README.md) - Navigation & Profile 系統架構
- [CLAUDE.md](../../CLAUDE.md) - 專案技術棧說明
- [API 整合指南](../backend/06-frontend-integration.md) - 前後端整合

---

## 更新記錄

| 日期 | 版本 | 更新內容 |
|------|------|---------|
| 2026-01-14 | 1.0 | 初始版本，技術實作細節 |
