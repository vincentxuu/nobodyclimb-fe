# Toast 提示設計文件

## 概述

NobodyClimb 使用基於 Radix UI Toast 的提示系統，提供用戶操作反饋和通知功能。

## 技術架構

### 核心組件

1. **Toast 組件** (`src/components/ui/toast.tsx`)
   - 基於 `@radix-ui/react-toast`
   - 使用 CVA (class-variance-authority) 管理樣式變體
   - 支援動畫和手勢操作（滑動關閉）

2. **Toast Hook** (`src/components/ui/use-toast.ts`)
   - 提供 `useToast()` hook 和 `toast()` 函數
   - 管理全局 toast 狀態
   - 處理 toast 的生命週期

3. **Toaster 容器** (`src/components/ui/toaster.tsx`)
   - 渲染所有活躍的 toast
   - 掛載在應用的根布局中

## 配置參數

### 全局配置 (`use-toast.ts`)

```typescript
const TOAST_LIMIT = 3  // 同時顯示的 toast 數量上限

// 根據類型調整顯示時間
const TOAST_DURATIONS = {
  default: 3000,      // 一般訊息：3 秒
  destructive: 5000,  // 錯誤訊息：5 秒（給用戶更多時間閱讀）
  success: 3000,      // 成功訊息：3 秒
  warning: 4000,      // 警告訊息：4 秒
  info: 3000,         // 資訊提示：3 秒
}

const TOAST_REMOVE_DELAY = 1000  // 動畫移除延遲：1 秒
```

### Toast 變體

支援五種視覺樣式，使用品牌色系統：

| 變體 | 用途 | 顯示時間 | 樣式描述 | 顏色代碼 |
|------|------|---------|---------|----------|
| `default` | 一般訊息 | 3 秒 | 白色背景 + 左側黃色粗邊框 | 背景: #FFFFFF<br>左框: #FFE70C<br>文字: #1B1A1A |
| `success` | 成功操作 | 3 秒 | 白色背景 + 左側黃色粗邊框 | 背景: #FFFFFF<br>左框: #FFE70C<br>文字: #1B1A1A |
| `warning` | 警告訊息 | 4 秒 | 白色背景 + 左側橘黃色粗邊框 | 背景: #FFFFFF<br>左框: #FA9F17<br>文字: #1B1A1A |
| `destructive` | 錯誤訊息 | 5 秒 | 白色背景 + 左側紅色粗邊框 | 背景: #FFFFFF<br>左框: #DA3737<br>文字: #1B1A1A |
| `info` | 資訊提示 | 3 秒 | 白色背景 + 左側灰色粗邊框 | 背景: #FFFFFF<br>左框: #B6B3B3<br>文字: #1B1A1A |

**設計理念**：
- **柔和視覺**：使用白色背景取代高飽和度色塊，減少視覺衝擊
- **品牌識別**：左側 4px 粗邊框使用品牌色，保持識別度但不刺眼
- **清晰易讀**：深色文字 (#1B1A1A) 在白色背景上對比度高
- **統一風格**：所有變體使用相同的白色背景，僅左側邊框顏色不同
- **邊框設計**：
  - 左側：4px 粗邊框（品牌色強調）
  - 其他三邊：2px 細邊框 (#EBEAEA 淺灰色)

### 位置配置

```typescript
// 桌面裝置：右下角
// 手機裝置：上方（top-20）
className="fixed top-20 z-[9999] flex max-h-screen w-full flex-col-reverse p-4
           sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
```

## 使用方式

### 基本用法

```typescript
import { toast } from '@/components/ui/use-toast'

// 一般訊息（3 秒後自動消失）
toast({ title: '操作成功' })

// 成功訊息（3 秒後自動消失）
toast({
  title: '儲存成功',
  variant: 'success'
})

// 警告訊息（4 秒後自動消失）
toast({
  title: '注意',
  description: '此操作無法復原',
  variant: 'warning'
})

// 錯誤訊息（5 秒後自動消失，給用戶更多時間閱讀）
toast({
  title: '操作失敗',
  description: '請稍後再試',
  variant: 'destructive'
})

// 資訊提示（3 秒後自動消失）
toast({
  title: '提示',
  description: '您有一則新訊息',
  variant: 'info'
})
```

### 自定義顯示時間

```typescript
// 自定義 10 秒後消失（覆蓋預設時間）
toast({
  title: '重要通知',
  description: '請仔細閱讀以下內容',
  duration: 10000  // 10 秒
})

// 快速提示（1.5 秒）
toast({
  title: '已複製',
  duration: 1500
})
```

### 在組件中使用

```typescript
import { useToast } from '@/components/ui/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      await submitData()
      toast({ title: '儲存成功' })
    } catch (error) {
      toast({
        title: '儲存失敗',
        variant: 'destructive'
      })
    }
  }
}
```

### 進階用法

```typescript
// 帶操作按鈕的 toast
toast({
  title: '有新的留言',
  description: 'John 留言了您的動態',
  action: <ToastAction altText="查看">查看</ToastAction>
})

// 手動控制 toast
const { id, dismiss, update } = toast({ title: '處理中...' })

// 更新內容
update({ title: '完成！' })

// 手動關閉
dismiss()
```

## 實際使用案例

### 1. 成功操作反饋（使用 `success` 變體）

```typescript
// 檔案：src/app/profile/bucket-list/page.tsx
toast({
  title: '目標已新增',
  variant: 'success'  // 3 秒後自動消失
})

toast({
  title: '目標已更新',
  variant: 'success'
})

toast({
  title: '恭喜完成目標！',
  variant: 'success'
})
```

### 2. 錯誤處理（使用 `destructive` 變體）

```typescript
// 檔案：src/app/profile/bucket-list/page.tsx
toast({
  title: '新增失敗',
  description: '請稍後再試',
  variant: 'destructive'  // 5 秒後自動消失，給用戶更多時間閱讀
})
```

### 3. API 限流提示（使用 `warning` 變體）

```typescript
// 檔案：src/lib/constants.ts
export const RATE_LIMIT_TOAST = {
  title: '操作過於頻繁',
  description: '請稍後再試',
  variant: 'warning' as const  // 4 秒後自動消失
}

// 使用
toast(RATE_LIMIT_TOAST)
```

### 4. 表單提交反饋（使用 `success` 變體）

```typescript
// 檔案：src/app/auth/profile-setup/basic-info/page.tsx
toast({
  title: '個人資料已儲存',
  description: '正在前往下一步...',
  variant: 'success'
})
```

### 5. 一般資訊提示（使用 `info` 變體）

```typescript
// 新功能提示
toast({
  title: '新功能',
  description: '現在可以匯出您的攀岩記錄了',
  variant: 'info'  // 3 秒後自動消失
})

// 系統通知
toast({
  title: '系統維護通知',
  description: '今晚 23:00-01:00 進行系統升級',
  variant: 'info',
  duration: 8000  // 重要通知顯示 8 秒
})
```

### 6. 危險操作警告（使用 `warning` 變體）

```typescript
// 刪除前警告
toast({
  title: '注意',
  description: '刪除後無法復原，請確認',
  variant: 'warning'  // 4 秒後自動消失
})
```

### 7. 快速反饋（自定義短時間）

```typescript
// 複製成功
toast({
  title: '已複製',
  variant: 'success',
  duration: 1500  // 1.5 秒快速提示
})

// 儲存草稿
toast({
  title: '已自動儲存',
  variant: 'info',
  duration: 2000  // 2 秒
})
```

## 動畫效果

### 進入動畫
- 桌面：從下方滑入 (`slide-in-from-bottom-full`)
- 手機：從上方滑入 (`slide-in-from-top-full`)

### 退出動畫
- 淡出效果 (`fade-out-80`)
- 向右滑出 (`slide-out-to-right-full`)

### 手勢操作
- 支援滑動關閉 (swipe to dismiss)
- 動畫平滑過渡

## 無障礙設計

- 使用 Radix UI 的無障礙實作
- 支援鍵盤操作（關閉按鈕可聚焦）
- 適當的 ARIA 屬性
- 關閉按鈕有視覺反饋（hover/focus 狀態）

## 設計決策

### 為什麼選擇白色背景 + 左側邊框？

**問題背景**：
- 初版使用品牌色滿版背景（黃色 #FFE70C、紅色 #DA3737）
- 用戶反饋：黃色底視覺衝擊太強，容易造成視覺疲勞

**設計考量**：
1. **降低視覺衝擊** - 白色背景柔和不刺眼
2. **保持品牌識別** - 左側粗邊框仍使用品牌色
3. **提升可讀性** - 黑色文字在白底上對比度更高
4. **現代設計趨勢** - 側邊框設計是當前 Toast/Notification 的主流風格
5. **多次觸發友善** - 頻繁操作時不會造成視覺疲勞

**參考案例**：
- GitHub Notifications - 白底 + 左側彩色邊框
- Vercel Toast - 白底 + 左側強調色
- Linear Notifications - 白底 + 側邊框

## 品牌色整合

### 顏色系統

NobodyClimb 的 toast 設計整合品牌色彩系統，使用左側邊框作為品牌識別：

**品牌色定義** (來自 `tailwind.config.js` 和 `globals.css`)：
- **品牌黃色**: #FFE70C (`brand-yellow-100`) - 主要強調色
- **品牌紅色**: #DA3737 (`brand-red-100`) - 警示/錯誤色
- **深色文字**: #1B1A1A (`wb-100`) - 主要文字色
- **白色文字**: #FFFFFF - 用於深色背景

### 樣式細節

```typescript
// Toast 變體樣式（使用 CVA）
// 共同樣式：白色背景 + 左側 4px 粗邊框 + 其他三邊 2px 淺灰邊框
default: 'border-l-brand-yellow-100 border-t-wb-20 border-r-wb-20 border-b-wb-20 bg-white text-wb-100'
success: 'border-l-brand-yellow-100 border-t-wb-20 border-r-wb-20 border-b-wb-20 bg-white text-wb-100'
warning: 'border-l-brand-yellow-200 border-t-wb-20 border-r-wb-20 border-b-wb-20 bg-white text-wb-100'
destructive: 'border-l-brand-red-100 border-t-wb-20 border-r-wb-20 border-b-wb-20 bg-white text-wb-100'
info: 'border-l-wb-50 border-t-wb-20 border-r-wb-20 border-b-wb-20 bg-white text-wb-100'

// 關閉按鈕樣式（統一樣式，所有變體相同）
'text-wb-70 hover:text-wb-100 hover:bg-wb-10'
```

### 邊框結構

```
┌─────────────────────────────┐
│ ║                           │  ← 左側：4px 品牌色粗邊框
│ ║  Toast 標題               │  ← 上/右/下：2px 淺灰細邊框
│ ║  Toast 描述文字           │
└─────────────────────────────┘
```

### 顏色對照表

| Tailwind Class | 色碼 | 說明 |
|----------------|------|------|
| `brand-yellow-100` | #FFE70C | 品牌主黃色 |
| `brand-yellow-200` | #FA9F17 | 品牌橘黃色 |
| `brand-red-100` | #DA3737 | 品牌紅色 |
| `wb-100` | #1B1A1A | 深色文字 |
| `wb-70` | #6D6C6C | 次要文字 |
| `wb-30` | #DBD8D8 | 淺灰邊框 |
| `wb-10` | #F5F5F5 | 淺灰背景 |
| `wb-0` | #FFFFFF | 白色 |

### 視覺層級

1. **白色背景** - 乾淨柔和，不造成視覺疲勞
2. **左側彩色邊框** - 4px 粗邊框提供品牌識別和訊息分類
3. **深色文字** - #1B1A1A 在白底上清晰易讀
4. **關閉按鈕** - 灰色圖示，hover 時顯現淺灰背景

**優勢**：
- ✅ 視覺舒適，長時間使用不疲勞
- ✅ 保持品牌識別（左側邊框）
- ✅ 不同訊息類型清晰可辨
- ✅ 專業且現代的設計風格

## 已實現改進

### ✅ 1. Toast 顯示時間優化
   - **原問題**：`TOAST_REMOVE_DELAY = 1000000` (約 16.67 分鐘)
   - **解決方案**：根據訊息類型智能調整顯示時間
     - 一般/成功/資訊：3 秒
     - 警告訊息：4 秒
     - 錯誤訊息：5 秒（給用戶更多時間閱讀）
   - **位置**：`src/components/ui/use-toast.ts`
   - **效果**：Toast 自動消失，不干擾用戶體驗

### ✅ 2. 品牌色系整合（柔和設計）
   - **原問題**：使用通用的黑白配色 → 高飽和度色塊背景視覺衝擊太強
   - **解決方案**：採用左側粗邊框設計
     - 統一白色背景，減少視覺疲勞
     - 左側 4px 品牌色粗邊框作為識別
     - 預設/成功：黃色邊框 #FFE70C
     - 警告：橘黃色邊框 #FA9F17
     - 錯誤：紅色邊框 #DA3737
     - 資訊：灰色邊框 #B6B3B3
   - **效果**：保持品牌識別度，但更柔和舒適

### ✅ 3. 支援多個 Toast 同時顯示
   - **原問題**：`TOAST_LIMIT = 1`，同時只能顯示一個
   - **解決方案**：`TOAST_LIMIT = 3`，支援堆疊顯示
   - **效果**：多個操作的反饋不會互相覆蓋

### ✅ 4. 增加樣式變體
   - **原問題**：只有 default 和 destructive 兩種
   - **解決方案**：新增 success、warning、info 變體
   - **效果**：更精確的訊息分類和視覺回饋

### ✅ 5. 支援自定義顯示時間
   - **新功能**：支援 `duration` 參數
   - **用法**：`toast({ title: '訊息', duration: 5000 })`
   - **效果**：靈活控制重要訊息的顯示時間

### 未來改進建議

#### 1. 增加進度條指示器

在 toast 底部顯示倒數進度條，讓用戶直觀了解還剩多少時間：
```
┌─────────────────────┐
│ 操作成功            │
└─────────────────────┘
████░░░░░░░░░░  (40% 剩餘)
```

實現建議：
```typescript
// 在 Toast 組件中添加進度條
<div className="absolute bottom-0 left-0 right-0 h-1 bg-wb-100/20">
  <div
    className="h-full bg-wb-100 transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
```

#### 2. Toast 音效回饋

為不同類型的 toast 添加音效：
- 成功：輕快的「叮」聲
- 錯誤：警示音
- 警告：提示音

```typescript
toast({
  title: '上傳成功',
  variant: 'success',
  sound: true  // 啟用音效
})
```

#### 3. Toast 位置自定義

支援自定義 toast 顯示位置：
```typescript
toast({
  title: '訊息',
  position: 'top-center'  // top-left, top-center, top-right, bottom-left, etc.
})
```

#### 4. Toast 群組管理

支援 toast 分組，相同群組的 toast 可以批量關閉：
```typescript
toast({
  title: '上傳中 1/3',
  group: 'upload'
})

// 關閉整個群組
dismissGroup('upload')
```

#### 5. 持久化 Toast

支援不會自動消失的 toast，必須手動關閉：
```typescript
toast({
  title: '重要通知',
  persistent: true  // 不會自動消失
})
```

## 最佳實踐

### 1. 訊息內容
- ✅ **簡潔明確**：「檔案已上傳」
- ❌ **避免冗長**：「您的檔案已經成功上傳到伺服器，並且已經開始處理...」

### 2. 使用時機
- ✅ **即時反饋**：表單提交、資料更新、刪除操作
- ✅ **錯誤提示**：API 錯誤、驗證失敗
- ❌ **避免濫用**：不要用於每個小互動

### 3. 變體選擇指南

| 使用情境 | 推薦變體 | 範例 |
|----------|---------|------|
| 資料儲存成功 | `success` | 「個人資料已更新」 |
| 檔案上傳完成 | `success` | 「照片上傳成功」 |
| 一般操作完成 | `default` | 「已複製到剪貼簿」 |
| 警告用戶注意 | `warning` | 「此操作無法復原」 |
| 操作失敗 | `destructive` | 「網路連線失敗」 |
| API 錯誤 | `destructive` | 「請求失敗，請稍後再試」 |
| 一般資訊提示 | `info` | 「您有 3 則新訊息」 |
| 系統通知 | `info` | 「系統將於 5 分鐘後維護」 |

**選擇原則**：
- ✅ **成功** - 用戶期望的正向結果
- ⚠️ **警告** - 需要注意但不是錯誤
- ❌ **錯誤** - 操作失敗或系統問題
- ℹ️ **資訊** - 中性的通知或提示

### 4. 描述文字
- 僅在需要補充資訊時使用
- 保持在一行以內（約 50 字元）

## 相關檔案

- `src/components/ui/toast.tsx` - Toast 組件定義
- `src/components/ui/use-toast.ts` - Toast hook 和狀態管理
- `src/components/ui/toaster.tsx` - Toast 容器組件
- `src/components/layout/providers.tsx` - Toaster 掛載位置
- `src/lib/constants.ts` - 常用 toast 配置

## 參考資源

- [Radix UI Toast 文件](https://www.radix-ui.com/docs/primitives/components/toast)
- [shadcn/ui Toast 組件](https://ui.shadcn.com/docs/components/toast)
