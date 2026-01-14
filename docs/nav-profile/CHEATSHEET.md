# Navigation & Profile 快速參考

> ⚡ 快速查找組件、API、路由的速查表

**最後更新**: 2026-01-14

---

## 📂 組件路徑速查

### 主站導航

```bash
# Navbar 主組件
src/components/layout/navbar.tsx

# Logo
src/components/layout/navbar/Logo.tsx

# 導航連結 (人物誌、岩場等)
src/components/layout/navbar/UnifiedNav.tsx

# 用戶選單 (創作、頭像下拉)
src/components/layout/navbar/UserMenu.tsx

# 搜尋欄
src/components/layout/navbar/SearchBar.tsx
src/components/layout/navbar/DesktopSearchBar.tsx
```

### Profile 導航

```bash
# 底部導航 (手機版使用中)
src/app/profile/MobileNav.tsx

# 頂部導航 (未使用)
src/components/profile/MobileNavigationBar.tsx

# 導航 Context
src/components/profile/MobileNavContext.tsx
```

### Profile 頁面

```bash
# Layout
src/app/profile/layout.tsx

# 主頁
src/app/profile/page.tsx

# 子頁面
src/app/profile/articles/page.tsx
src/app/profile/bookmarks/page.tsx
src/app/profile/settings/page.tsx
src/app/profile/photos/page.tsx
src/app/profile/bucket-list/page.tsx
# src/app/profile/stats/page.tsx  ⚠️ 未實作

# 主容器
src/components/profile/ProfileContainer.tsx

# Context Provider
src/components/profile/ProfileContext.tsx
```

### Profile 內容區段

```bash
# 頁面標題
src/components/profile/ProfilePageHeader.tsx

# 操作按鈕
src/components/profile/ProfileActionButtons.tsx

# 分隔線
src/components/profile/ProfileDivider.tsx

# 各區段組件
src/components/profile/BasicInfoSection.tsx
src/components/profile/ClimbingInfoSection.tsx
src/components/profile/ClimbingExperienceSection.tsx
src/components/profile/AdvancedStoriesSection.tsx
src/components/profile/ClimbingFootprintsSection.tsx
src/components/profile/SocialLinksSection.tsx
src/components/profile/PublicSettingSection.tsx

# 圖片集
src/components/profile/image-gallery/ProfileImageSection.tsx
src/components/profile/image-gallery/ImageGalleryDisplay.tsx
```

---

## 🗺️ 路由速查

### 主站路由

```
/                         首頁
/biography                人物誌列表
/crag                     岩場
/gym                      岩館
/gallery                  攝影集
/videos                   影片
/blog                     部落格
/blog/create              撰寫文章
/upload                   上傳照片
/auth/login               登入
```

### Profile 路由

```
/profile                  我的人物誌 (主頁)
/profile/articles         我的文章
/profile/bookmarks        我的收藏
/profile/settings         帳號設定
/profile/photos           我的照片
/profile/bucket-list      人生清單
/profile/stats            ⚠️ 攀岩成就 (未實作)
```

---

## 📊 狀態管理速查

### Auth Store (Zustand)

```typescript
// 引入
import { useAuthStore } from '@/store/authStore'

// 使用
const isAuthenticated = useAuthStore(state => state.isAuthenticated)
const isLoading = useAuthStore(state => state.isLoading)
const user = useAuthStore(state => state.user)
const login = useAuthStore(state => state.login)
const logout = useAuthStore(state => state.logout)
const updateUser = useAuthStore(state => state.updateUser)

// User 型別
interface User {
  id: string
  username: string
  email: string
  name?: string
  avatar?: string
  avatarStyle?: string
}
```

### Profile Context

```typescript
// 引入
import { useProfile } from '@/components/profile/ProfileContext'

// 使用
const { profileData, setProfileData, isEditing, setIsEditing } = useProfile()

// ProfileData 型別
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

---

## 🔌 API 速查

### Biography Service

```typescript
// 引入
import { biographyService } from '@/lib/api/services'

// 取得我的人物誌
const response = await biographyService.getMyBiography()

// 創建/更新人物誌
const response = await biographyService.createBiography(data)

// 更新特定欄位
const response = await biographyService.updateMyBiography({ name: '新名稱' })

// 上傳圖片
const response = await biographyService.uploadImage(file)

// 取得公開人物誌
const response = await biographyService.getBiographyById(id)
```

### API Response 型別

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

---

## 🎨 常用 CSS Class

### 文字顏色

```css
text-text-main      /* #1B1A1A - 主要文字 */
text-text-subtle    /* #3F3D3D - 次要文字 */
text-text-light     /* #6D6C6C - 淺色文字 */
```

### 背景顏色

```css
bg-[#F5F5F5]        /* 主要背景 */
bg-white            /* 白色背景 */
bg-[#EBEAEA]        /* 次要背景 */
```

### 邊框顏色

```css
border-[#DBD8D8]    /* 預設邊框 */
border-[#1B1A1A]    /* 深色邊框 */
```

### 品牌色

```css
bg-[#FFE70C]        /* 黃色 (進度條) */
text-[#D94A4A]      /* 紅色 (登出、刪除) */
```

### 常用組合

```css
/* 按鈕 */
.btn-primary {
  @apply border border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#F5F5F5];
}

/* 卡片 */
.card {
  @apply rounded-sm bg-white p-4 md:p-6 lg:p-8 shadow-sm;
}

/* 輸入框 */
.input {
  @apply w-full rounded-md border border-[#DBD8D8] px-3 py-2
         focus:outline-none focus:ring-2 focus:ring-[#1B1A1A];
}
```

---

## 🧭 導航 Hooks

### useRouter

```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()

// 程式化導航
router.push('/profile')
router.push('/profile', { scroll: false })  // 不滾動
router.back()
router.refresh()
```

### usePathname

```typescript
import { usePathname } from 'next/navigation'

const pathname = usePathname()

// 判斷當前路由
const isActive = pathname === '/profile'
const isInSection = pathname.startsWith('/profile')
```

### useIsMobile

```typescript
import { useIsMobile } from '@/lib/hooks/useIsMobile'

const isMobile = useIsMobile()  // boolean
```

---

## 🔐 認證相關

### 檢查登入狀態

```typescript
const isAuthenticated = useAuthStore(state => state.isAuthenticated)
const isLoading = useAuthStore(state => state.isLoading)

if (!isAuthenticated && !isLoading) {
  router.push('/auth/login')
}
```

### 登出

```typescript
const logout = useAuthStore(state => state.logout)

logout()  // 清除 token 和 user 資料
```

### Token 管理

```typescript
import Cookies from 'js-cookie'
import { AUTH_COOKIE_NAME } from '@/lib/constants'

// 取得 token
const token = Cookies.get(AUTH_COOKIE_NAME)

// 設定 token
Cookies.set(AUTH_COOKIE_NAME, token, { expires: 7 })

// 刪除 token
Cookies.remove(AUTH_COOKIE_NAME)
```

---

## 🎯 導航配置

### 主站導航連結

```typescript
// src/lib/constants/index.ts
export const NAV_LINKS = [
  { href: '/biography', label: '人物誌' },
  { href: '/crag', label: '岩場' },
  { href: '/gym', label: '岩館' },
  { href: '/gallery', label: '攝影集' },
  { href: '/videos', label: '影片' },
  { href: '/blog', label: '部落格' },
]
```

### Profile MobileNav 項目

```typescript
// src/app/profile/MobileNav.tsx
const mainMenuItems = [
  { name: '人物誌', href: '/profile', icon: UserCircle },
  { name: '清單', href: '/profile/bucket-list', icon: Target },
  { name: '照片', href: '/profile/photos', icon: Image },
  { name: '文章', href: '/profile/articles', icon: FileText },
]

const moreMenuItems = [
  { name: '成就', href: '/profile/stats', icon: BarChart3 },
  { name: '收藏', href: '/profile/bookmarks', icon: Bookmark },
  { name: '設定', href: '/profile/settings', icon: Settings },
]
```

### UserMenu 選單項目

```typescript
// src/components/layout/navbar/UserMenu.tsx

// 創作選單
<DropdownMenuItem onClick={() => router.push('/blog/create')}>
  發表文章
</DropdownMenuItem>
<DropdownMenuItem onClick={() => router.push('/upload')}>
  上傳照片
</DropdownMenuItem>

// 用戶選單
<DropdownMenuItem onClick={() => router.push('/profile')}>
  我的人物誌
</DropdownMenuItem>
<DropdownMenuItem onClick={() => router.push('/profile/bucket-list')}>
  人生清單
</DropdownMenuItem>
<DropdownMenuItem onClick={() => router.push('/profile/photos')}>
  我的照片
</DropdownMenuItem>
<DropdownMenuItem onClick={() => router.push('/profile/articles')}>
  我的文章
</DropdownMenuItem>
<DropdownMenuItem onClick={() => router.push('/profile/bookmarks')}>
  我的收藏
</DropdownMenuItem>
<DropdownMenuItem onClick={() => router.push('/profile/settings')}>
  帳號設定
</DropdownMenuItem>
<DropdownMenuItem onClick={() => logout()}>
  登出
</DropdownMenuItem>
```

---

## 🎬 動畫效果

### Framer Motion 基本用法

```typescript
import { motion } from 'framer-motion'

// 淡入效果
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>

// 滑入效果
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>

// 退出動畫
<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

### 滾動進度條

```typescript
import { useScroll, useSpring } from 'framer-motion'

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

---

## 🖼️ 圖示 (Lucide)

```typescript
import {
  UserCircle,
  Target,
  Image,
  FileText,
  Bookmark,
  Settings,
  BarChart3,
  MoreHorizontal,
  // ... 更多圖示
} from 'lucide-react'

// 使用
<UserCircle size={20} className="text-gray-500" />
```

**常用圖示**:
- `UserCircle` - 人物誌
- `Target` - 清單、目標
- `Image` - 照片
- `FileText` - 文章
- `Bookmark` - 收藏
- `Settings` - 設定
- `BarChart3` - 統計、成就
- `MoreHorizontal` - 更多選單

---

## 🧪 測試相關

### 測試檔案位置

```bash
# 組件測試
src/components/layout/navbar/__tests__/navbar.test.tsx
src/components/profile/__tests__/ProfileContainer.test.tsx

# 整合測試
src/__tests__/integration/navigation.test.tsx

# E2E 測試
cypress/e2e/navigation.cy.ts
```

### 常用測試指令

```bash
# 執行所有測試
pnpm test

# 執行特定檔案
pnpm test navbar.test.tsx

# 監聽模式
pnpm test:watch

# 產生覆蓋率報告
pnpm test:coverage
```

---

## 📱 響應式斷點

```typescript
// Tailwind 預設斷點
sm: '640px'   // 小型手機
md: '768px'   // 平板
lg: '1024px'  // 桌機
xl: '1280px'  // 大螢幕
2xl: '1536px' // 超大螢幕

// 專案主要使用
default       // < 768px (手機)
md:          // >= 768px (桌機)
```

### 常用響應式模式

```typescript
// 手機顯示，桌機隱藏
className="block md:hidden"

// 手機隱藏，桌機顯示
className="hidden md:block"

// 響應式尺寸
className="text-sm md:text-base lg:text-lg"
className="p-4 md:p-6 lg:p-8"
className="w-full md:w-1/2 lg:w-1/3"
```

---

## 🐛 常見問題快速解決

### Q: 導航高亮不正確
```typescript
// 確認使用正確的路徑比對
const pathname = usePathname()
const isActive = pathname === item.href  // 精確比對
// 或
const isActive = pathname.startsWith(item.href)  // 前綴比對
```

### Q: 未登入時無法重導向
```typescript
// 確認 hydration 完成
const [isHydrated, setIsHydrated] = useState(false)

useEffect(() => {
  setIsHydrated(true)
}, [])

if (isHydrated && !isAuthenticated) {
  router.push('/auth/login')
}
```

### Q: 下拉選單無法關閉
```typescript
// 使用 useRef 和 useEffect 監聽外部點擊
const menuRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```

### Q: 圖片無法載入
```typescript
// 使用 AvatarWithFallback 組件
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback'

<AvatarWithFallback
  src={user?.avatar}
  alt="用戶頭像"
  fallback={<DefaultAvatar />}
/>
```

---

## 🔗 快速連結

- [完整文檔索引](./INDEX.md)
- [系統架構](./README.md)
- [技術細節](./technical-details.md)
- [改進建議](./improvement-proposals.md)

---

## 📝 備註

- 此速查表僅包含最常用的資訊
- 完整細節請參考對應的完整文檔
- 如有疑問，請查閱 [INDEX.md](./INDEX.md) 找到相關章節

---

**最後更新**: 2026-01-14
