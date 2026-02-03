# NobodyClimb 設計系統參考

本文件記錄 NobodyClimb 的設計系統，供 Web 和 App 共用。

---

## 0. 共用套件

設計 tokens 已統一定義在 `@nobodyclimb/constants` 套件中：

**檔案位置**: `/packages/constants/src/theme.ts`

### 使用方式

```typescript
// Web (tailwind.config.js)
const { COLORS } = require('@nobodyclimb/constants')

module.exports = {
  theme: {
    extend: {
      colors: COLORS,
    },
  },
}

// App (React Native)
import {
  WB_COLORS,
  SEMANTIC_COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '@nobodyclimb/constants'

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.pageBg,
    padding: SPACING[4],
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  title: {
    color: SEMANTIC_COLORS.textMain,
  },
})
```

---

## 1. 顏色系統

### 1.1 灰階 (W&B Scale)

| Token | Hex | 用途 |
|-------|-----|------|
| `wb-0` | `#FFFFFF` | 純白背景、卡片背景 |
| `wb-10` | `#F5F5F5` | 頁面背景 |
| `wb-20` | `#EBEAEA` | 邊框、分隔線 |
| `wb-30` | `#DBD8D8` | 淺灰背景 |
| `wb-50` | `#B6B3B3` | 禁用狀態 |
| `wb-60` | `#8E8C8C` | 輔助文字 |
| `wb-70` | `#6D6C6C` | 次要文字 |
| `wb-90` | `#3F3D3D` | 深灰 |
| `wb-100` | `#1B1A1A` | 主要文字、按鈕 |

### 1.2 品牌色

| Token | Hex | 用途 |
|-------|-----|------|
| `brand-yellow-100` | `#FFE70C` | 主要強調色、進度條、高亮 |
| `brand-yellow-200` | `#FA9F17` | Hover 狀態 |
| `brand-red-100` | `#DA3737` | 錯誤、刪除 |

### 1.3 語意化別名

```typescript
export const semanticColors = {
  // 背景
  pageBg: '#F5F5F5',      // wb-10
  cardBg: '#FFFFFF',      // wb-0

  // 文字
  textMain: '#1B1A1A',    // wb-100
  textSubtle: '#6D6C6C',  // wb-70
  textMuted: '#8E8C8C',   // wb-60
  textDisabled: '#B6B3B3', // wb-50

  // 邊框
  border: '#EBEAEA',      // wb-20
  borderFocus: '#FFE70C', // brand-yellow-100
  borderError: '#DA3737', // brand-red-100

  // 按鈕
  buttonPrimary: '#1B1A1A',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#FFFFFF',
  buttonSecondaryText: '#1B1A1A',

  // 狀態
  success: '#10B981',     // emerald-500
  warning: '#F59E0B',     // amber-500
  error: '#DA3737',
  info: '#3B82F6',        // blue-500
}
```

---

## 2. 字體系統

### 2.1 字體家族

```typescript
export const fontFamily = {
  // 主要字體 (繁體中文)
  sans: 'Noto Sans TC',

  // 展示字體 (標題)
  display: 'Glow Sans TC',

  // 等寬字體 (數字、代碼)
  mono: 'Allerta Stencil',
}
```

### 2.2 字體尺寸

```typescript
export const fontSize = {
  // Headings
  h1: { size: 32, lineHeight: 40, weight: '700' },
  h2: { size: 24, lineHeight: 32, weight: '700' },
  h3: { size: 20, lineHeight: 28, weight: '600' },
  h4: { size: 18, lineHeight: 26, weight: '600' },

  // Body
  body: { size: 16, lineHeight: 24, weight: '400' },
  bodyBold: { size: 16, lineHeight: 24, weight: '600' },

  // Small
  caption: { size: 14, lineHeight: 20, weight: '400' },
  small: { size: 12, lineHeight: 16, weight: '400' },

  // Special
  display: { size: 48, lineHeight: 56, weight: '700' },
}
```

---

## 3. 間距系統

### 3.1 間距尺度 (基於 4px)

```typescript
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
}
```

### 3.2 圓角

```typescript
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
}
```

### 3.3 陰影

```typescript
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
}
```

---

## 4. 組件規格

### 4.1 Button

#### 變體

| 變體 | 背景 | 文字 | 邊框 |
|-----|------|------|------|
| `primary` | `#1B1A1A` | `#FFFFFF` | 無 |
| `secondary` | `#FFFFFF` | `#1B1A1A` | `#1B1A1A` |
| `outline` | 透明 | `#1B1A1A` | `#1B1A1A` |
| `ghost` | 透明 | `#1B1A1A` | 無 |
| `destructive` | `#DA3737` | `#FFFFFF` | 無 |

#### 尺寸

| 尺寸 | 高度 | Padding X | 字體大小 |
|-----|------|-----------|---------|
| `sm` | 32 | 12 | 14 |
| `md` | 40 | 16 | 16 |
| `lg` | 48 | 24 | 16 |

#### 狀態

- `hover`: 透明度降低或顏色加深
- `disabled`: 透明度 50%，不可點擊
- `loading`: 顯示 Spinner，禁用互動

### 4.2 Input

#### 狀態樣式

| 狀態 | 邊框顏色 | 背景 |
|-----|---------|------|
| `default` | `#EBEAEA` | `#FFFFFF` |
| `focused` | `#FFE70C` | `#FFFFFF` |
| `error` | `#DA3737` | `#FFFFFF` |
| `disabled` | `#EBEAEA` | `#F5F5F5` |

#### 規格

```typescript
const inputStyles = {
  height: 48,
  paddingHorizontal: 16,
  borderRadius: 8,
  borderWidth: 1,
  fontSize: 16,
}
```

### 4.3 Card

#### 樣式

```typescript
const cardStyles = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#EBEAEA',
  ...shadows.sm,
}
```

#### 子組件

- `CardMedia`: 圖片區域，圓角繼承
- `CardContent`: 內容區域，padding: 16
- `CardTitle`: 標題，fontSize: 18, fontWeight: 600
- `CardInfo`: 附加資訊，fontSize: 14, color: #6D6C6C

### 4.4 Avatar

#### 尺寸

| 尺寸 | 直徑 |
|-----|------|
| `xs` | 24 |
| `sm` | 32 |
| `md` | 40 |
| `lg` | 56 |
| `xl` | 80 |

#### 樣式

```typescript
const avatarStyles = {
  borderRadius: 9999, // 圓形
  backgroundColor: '#EBEAEA', // 預設背景
}
```

---

## 5. 動畫規格

### 5.1 時長

```typescript
export const duration = {
  fast: 150,
  normal: 300,
  slow: 500,
}
```

### 5.2 Easing

```typescript
import { Easing } from 'react-native-reanimated'

export const easing = {
  easeOut: Easing.bezier(0.0, 0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  easeInOut: Easing.bezier(0.4, 0, 0.2, 1),
  spring: { damping: 15, stiffness: 150 },
}
```

### 5.3 常用動畫

#### 淡入

```typescript
const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: duration.normal,
}
```

#### 向上滑入

```typescript
const slideUp = {
  from: { opacity: 0, translateY: 20 },
  to: { opacity: 1, translateY: 0 },
  duration: duration.normal,
}
```

#### 按壓縮放

```typescript
const pressScale = {
  pressed: { scale: 0.95 },
  released: { scale: 1 },
  duration: duration.fast,
}
```

---

## 6. 圖標規格

### 6.1 尺寸

| 尺寸 | 像素 | 用途 |
|-----|------|------|
| `xs` | 16 | 輔助文字旁 |
| `sm` | 20 | 按鈕內、列表項 |
| `md` | 24 | 導航、卡片 |
| `lg` | 32 | 空狀態 |
| `xl` | 48 | 大型展示 |

### 6.2 顏色

- 預設使用 `textSubtle` (#6D6C6C)
- 活躍狀態使用 `textMain` (#1B1A1A)
- 強調使用 `brand-yellow-100` (#FFE70C)

---

## 7. Tab Bar 規格

### 7.1 樣式

```typescript
const tabBarStyles = {
  height: 56,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#EBEAEA',
  paddingBottom: 8, // Safe area
}
```

### 7.2 Tab Item

```typescript
const tabItemStyles = {
  // 未選中
  inactive: {
    iconColor: '#8E8C8C',
    labelColor: '#8E8C8C',
  },
  // 選中
  active: {
    iconColor: '#1B1A1A',
    labelColor: '#1B1A1A',
  },

  labelSize: 12,
  iconSize: 24,
}
```

---

## 8. 響應式設計

### 8.1 斷點

```typescript
export const breakpoints = {
  sm: 375,   // iPhone SE
  md: 414,   // iPhone Plus
  lg: 768,   // iPad
  xl: 1024,  // iPad Pro
}
```

### 8.2 安全區域

使用 `react-native-safe-area-context` 處理：
- 頂部瀏海區域
- 底部 Home Indicator
- 側邊（橫向模式）

---

## 9. 實作範例

### 9.1 app/src/theme/index.ts

從共用套件重新導出：

```typescript
// app/src/theme/index.ts
// 從共用套件導出設計 tokens
export {
  // 顏色
  WB_COLORS,
  BRAND_YELLOW,
  BRAND_RED,
  SEMANTIC_COLORS,
  COLORS,
  // 字體
  FONT_FAMILY,
  FONT_SIZE,
  LINE_HEIGHT,
  FONT_WEIGHT,
  // 間距
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  // 動畫
  DURATION,
  // 組件規格
  BUTTON_SIZES,
  INPUT_SPECS,
  AVATAR_SIZES,
  // 類型
  type WBColorKey,
  type SpacingKey,
  type BorderRadiusKey,
  type FontSizeKey,
  type ButtonSize,
  type AvatarSize,
} from '@nobodyclimb/constants'
```

### 9.2 Button 組件範例

```typescript
// app/src/components/ui/Button.tsx

import React from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native'
import {
  WB_COLORS,
  BRAND_RED,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  BUTTON_SIZES,
  type ButtonSize,
} from '@nobodyclimb/constants'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'

interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onPress?: () => void
  style?: ViewStyle
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const sizeSpec = BUTTON_SIZES[size]

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        {
          height: sizeSpec.height,
          paddingHorizontal: sizeSpec.paddingHorizontal,
        },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? WB_COLORS[0] : WB_COLORS[100]}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            { fontSize: sizeSpec.fontSize },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
  },

  // Variants
  primary: {
    backgroundColor: WB_COLORS[100],
  },
  secondary: {
    backgroundColor: WB_COLORS[0],
    borderWidth: 1,
    borderColor: WB_COLORS[100],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: WB_COLORS[100],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: BRAND_RED[100],
  },

  // States
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },

  // Text
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: WB_COLORS[0],
  },
  text_secondary: {
    color: WB_COLORS[100],
  },
  text_outline: {
    color: WB_COLORS[100],
  },
  text_ghost: {
    color: WB_COLORS[100],
  },
  text_destructive: {
    color: WB_COLORS[0],
  },
})
```

---

## 10. 檢查清單

開發新頁面或組件時，請確認：

- [ ] 使用 theme 中定義的顏色，不要硬編碼
- [ ] 使用 theme 中定義的間距和圓角
- [ ] 文字使用 Text 組件或正確的字體設定
- [ ] 按鈕使用 Button 組件
- [ ] 卡片使用 Card 組件
- [ ] 輸入框使用 Input 組件
- [ ] 載入狀態使用品牌黃色 (#FFE70C)
- [ ] 錯誤狀態使用品牌紅色 (#DA3737)
- [ ] 處理 Safe Area
- [ ] 加入適當的動畫反饋
