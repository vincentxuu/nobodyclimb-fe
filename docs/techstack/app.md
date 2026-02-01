# App 技術棧 (React Native)

> 狀態：規劃中

## 概覽

NobodyClimb App 使用 React Native + Expo 開發，與 Web 共用業務邏輯但使用獨立的 UI 框架。

---

## 核心框架

| 技術 | 版本 | 用途 |
|------|------|------|
| **React Native** | 0.81.x | 跨平台行動應用框架 |
| **Expo** | SDK 54 | 開發工具鏈與託管服務 |
| **TypeScript** | 5.x | 型別安全 |
| **React** | 19.1.x | UI 函式庫 (與 Web 版本一致) |
| **Tamagui** | 1.x | 跨平台 UI 框架 |

## 路由導航

| 技術 | 版本 | 用途 |
|------|------|------|
| **Expo Router** | 4.x | 基於檔案的路由 (類似 Next.js) |
| **React Navigation** | 7.x | 底層導航庫 (Expo Router 依賴) |

## UI 元件庫：Tamagui

React Native App 採用 Tamagui 作為 UI 框架。

> **注意**：Web 前端繼續使用 TailwindCSS + Radix UI，因為需要部署到 Cloudflare Workers Edge Runtime。

### 為什麼 App 選擇 Tamagui？

| 特性 | 說明 |
|------|------|
| **優化編譯器** | 編譯時期處理樣式，減少執行時開銷 |
| **效能優異** | Tree Shaking、原生元件渲染 |
| **完整主題系統** | 支援 tokens、themes、sub-themes |
| **TypeScript 優先** | 完整的型別支援 |
| **Expo 整合良好** | 官方支援 Expo SDK 54 |

### 核心套件

| 套件 | 用途 |
|------|------|
| `tamagui` | 完整 UI Kit (Button, Card, Input, etc.) |
| `@tamagui/core` | 核心樣式系統 |
| `@tamagui/config` | 預設配置 |
| `@tamagui/babel-plugin` | Babel 優化插件 |

### 與其他方案比較

| 選項 | 優化編譯器 | 主題系統 | Expo 支援 | 備註 |
|------|:----------:|:--------:|:---------:|------|
| **Tamagui** | ✅ | ✅ | ✅ | 選用方案 |
| NativeWind | ❌ | ⚠️ | ✅ | TailwindCSS 語法 |
| React Native Paper | ❌ | ✅ | ✅ | Material Design |
| Gluestack UI | ⚠️ | ✅ | ✅ | 較新，社群較小 |

## Tamagui 設定

### Babel 設定

```javascript
// apps/app/babel.config.js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
```

### Metro 設定 (Monorepo)

```javascript
// apps/app/metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot, {
  isCSSEnabled: true,
})

// 監控 monorepo 中的所有套件
config.watchFolders = [monorepoRoot]

// 確保 node_modules 解析正確
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Expo 49+ 需要包含 mjs
config.resolver.sourceExts.push('mjs')

module.exports = config
```

---

## 狀態管理 (與 Web 共用)

| 技術 | 版本 | 用途 |
|------|------|------|
| **Zustand** | 4.5.x | 全域客戶端狀態 |
| **TanStack Query** | 5.85.x | 伺服器狀態管理與快取 |

## 表單與驗證 (與 Web 共用)

| 技術 | 版本 | 用途 |
|------|------|------|
| **React Hook Form** | 7.62.x | 表單狀態管理 |
| **Zod** | 3.25.x | Schema 驗證 (來自 @nobodyclimb/schemas) |
| **@hookform/resolvers** | 3.10.x | Zod 整合 |

## 認證與儲存

| 技術 | 版本 | 用途 |
|------|------|------|
| **expo-secure-store** | 14.x | 安全儲存 (Token) |
| **expo-auth-session** | 6.x | OAuth 流程 |
| **@react-native-google-signin/google-signin** | 13.x | Google 登入 |

## 圖片與媒體

| 技術 | 版本 | 用途 |
|------|------|------|
| **expo-image** | 2.x | 高效能圖片載入 |
| **expo-image-picker** | 16.x | 圖片選擇 |
| **expo-camera** | 16.x | 相機功能 |

## Tamagui 套件

| 技術 | 版本 | 用途 |
|------|------|------|
| **tamagui** | 1.x | 完整 UI Kit (Button, Card, Input, etc.) |
| **@tamagui/core** | 1.x | 核心樣式引擎 |
| **@tamagui/config** | 1.x | 預設配置 |
| **@tamagui/babel-plugin** | 1.x | 編譯時優化 |
| **@tamagui/shorthands** | 1.x | 樣式簡寫 |
| **@tamagui/themes** | 1.x | 預設主題 |
| **@tamagui/font-inter** | 1.x | Inter 字型 |

## 動畫

| 技術 | 版本 | 用途 |
|------|------|------|
| **react-native-reanimated** | 3.16.x | 高效能動畫 (Tamagui 支援) |
| **react-native-gesture-handler** | 2.20.x | 手勢處理 |
| **@gorhom/bottom-sheet** | 5.x | Bottom Sheet 元件 |

## 其他功能

| 技術 | 版本 | 用途 |
|------|------|------|
| **expo-notifications** | 0.29.x | 推播通知 |
| **expo-location** | 18.x | 定位服務 |
| **expo-linking** | 7.x | Deep Linking |
| **@sentry/react-native** | 6.x | 錯誤追蹤 |

---

## 專案結構

```
apps/app/                       # React Native App (位於 apps/ 目錄下)
├── app/                        # Expo Router 頁面 (檔案路由)
│   ├── (tabs)/                 # Tab Navigator
│   │   ├── index.tsx           # 首頁
│   │   ├── explore.tsx         # 探索
│   │   ├── biography.tsx       # 傳記
│   │   ├── profile.tsx         # 個人頁
│   │   └── _layout.tsx         # Tab 配置
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── biography/
│   │   └── [id].tsx            # 傳記詳情
│   ├── crag/
│   │   └── [id].tsx
│   ├── _layout.tsx             # Root Layout
│   └── +not-found.tsx          # 404 頁面
│
├── src/
│   ├── components/             # React Native 元件 (Tamagui)
│   │   ├── ui/                 # 基礎 UI 元件
│   │   ├── shared/             # 共用元件
│   │   ├── biography/          # 傳記相關元件
│   │   └── profile/            # 個人頁元件
│   │
│   ├── lib/
│   │   ├── api.ts              # API 客戶端初始化
│   │   └── storage.ts          # 儲存封裝
│   │
│   ├── hooks/                  # App 專用 hooks
│   │   └── useNotifications.ts # 推播 hook
│   │
│   └── store/                  # Zustand stores 初始化
│
├── assets/                     # 靜態資源
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── __tests__/                  # 測試
├── app.json                    # Expo 設定
├── eas.json                    # EAS Build 設定
├── babel.config.js             # Babel 設定 (含 Tamagui plugin)
├── metro.config.js             # Metro 設定 (Monorepo 支援)
├── tamagui.config.ts           # Tamagui 主題與 tokens 設定
└── package.json
```

---

## API Client 初始化

```typescript
// app/src/lib/api.ts
import { createNativeApiClient } from '@nobodyclimb/api-client/native';
import { router } from 'expo-router';

export const api = createNativeApiClient(
  'https://api.nobodyclimb.cc/api/v1',
  () => router.replace('/auth/login')
);
```

## 使用共用套件

```typescript
// 使用共用型別
import type { User, Biography } from '@nobodyclimb/types';

// 使用共用 schemas
import { loginSchema } from '@nobodyclimb/schemas';

// 使用共用 hooks
import { createUseAuth } from '@nobodyclimb/hooks';
import { api } from '../lib/api';
import * as SecureStore from 'expo-secure-store';

export const useAuth = createUseAuth({
  fetchUser: async () => {
    const { data } = await api.get('/users/me');
    return data;
  },
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('token', data.token);
    return data.user;
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('token');
  },
});

// 使用共用工具
import { formatDate } from '@nobodyclimb/utils';
```

---

## 主題設定 (Tamagui + 共用 Design Tokens)

App 使用 `@nobodyclimb/constants` 的共用設計系統，確保與 Web 品牌一致。

```typescript
// apps/app/tamagui.config.ts
import { createTamagui, createTokens } from '@tamagui/core'
import { shorthands } from '@tamagui/shorthands'
import { createFont } from '@tamagui/font-inter'

// 從共用套件導入設計 tokens
import {
  WB_COLORS,
  BRAND_YELLOW,
  BRAND_RED,
  SEMANTIC_COLORS,
  FONT_FAMILY,
  FONT_SIZE,
  SPACING,
  BORDER_RADIUS,
} from '@nobodyclimb/constants'

// 使用共用的設計 tokens
const tokens = createTokens({
  color: {
    // W&B 灰階
    ...Object.fromEntries(
      Object.entries(WB_COLORS).map(([k, v]) => [`wb${k}`, v])
    ),
    // 品牌色
    brandYellow: BRAND_YELLOW[100],
    brandYellowHover: BRAND_YELLOW[200],
    brandRed: BRAND_RED[100],
    // 語意化顏色
    ...SEMANTIC_COLORS,
  },
  space: SPACING,
  size: SPACING,
  radius: BORDER_RADIUS,
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
})

// 字體設定
const headingFont = createFont({
  family: FONT_FAMILY.display,
  size: FONT_SIZE,
  weight: { normal: '400', bold: '700' },
})

const bodyFont = createFont({
  family: FONT_FAMILY.sans,
  size: FONT_SIZE,
  weight: { normal: '400', medium: '500', bold: '700' },
})

export const config = createTamagui({
  tokens,
  themes: {
    light: {
      background: SEMANTIC_COLORS.pageBg,
      color: SEMANTIC_COLORS.textMain,
      colorSubtle: SEMANTIC_COLORS.textSubtle,
      borderColor: SEMANTIC_COLORS.border,
      accent: BRAND_YELLOW[100],
      accentHover: BRAND_YELLOW[200],
    },
    dark: {
      background: WB_COLORS[100],
      color: WB_COLORS[0],
      colorSubtle: WB_COLORS[50],
      borderColor: WB_COLORS[90],
      accent: BRAND_YELLOW[100],
      accentHover: BRAND_YELLOW[200],
    },
    // Button sub-theme (使用品牌深色)
    light_Button: {
      background: WB_COLORS[100],
      backgroundPress: WB_COLORS[90],
      backgroundHover: WB_COLORS[90],
      color: WB_COLORS[0],
    },
    // Accent Button (黃色強調)
    light_AccentButton: {
      background: BRAND_YELLOW[100],
      backgroundPress: BRAND_YELLOW[200],
      backgroundHover: BRAND_YELLOW[200],
      color: WB_COLORS[100],
    },
  },
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
})

export default config

// TypeScript 型別支援
export type AppConfig = typeof config
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}
```

### 在 App 中使用

```typescript
// apps/app/app/_layout.tsx
import { TamaguiProvider } from '@tamagui/core'
import { useColorScheme } from 'react-native'
import config from '../tamagui.config'

export default function RootLayout({ children }) {
  const colorScheme = useColorScheme()

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
      {children}
    </TamaguiProvider>
  )
}
```

---

## 部署

### EAS Build 設定

```json
// app/eas.json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": { "buildType": "apk" }
    },
    "production": {
      "channel": "production",
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 部署環境

| 環境 | 用途 | 分發方式 |
|------|------|----------|
| **Development** | 開發測試 | Expo Go / Dev Client |
| **Preview** | 內部測試 | Internal Distribution / TestFlight |
| **Production** | 正式上架 | App Store / Google Play |

### 常用指令

```bash
cd apps/app

# 開發
pnpm start                    # 啟動 Expo Dev Server
pnpm ios                      # iOS 模擬器
pnpm android                  # Android 模擬器

# 建置
eas build --profile development --platform ios
eas build --profile preview --platform all
eas build --profile production --platform all

# OTA 更新 (無需重新審核)
eas update --branch preview --message "修復 bug"
eas update --branch production --message "v1.0.1"

# 提交到商店
eas submit --platform ios --latest
eas submit --platform android --latest

# 測試
pnpm test
pnpm lint
```

或從根目錄執行：

```bash
# 從根目錄
pnpm dev:app                  # 啟動 Expo Dev Server
```

---

## 開發階段規劃

### Phase 1: 基礎建設

- [ ] 建立 Expo 專案 (Expo Router)
- [ ] 整合共用套件 (@nobodyclimb/*)
- [ ] 設定主題 (colors, spacing)
- [ ] 建立基礎 UI 元件

### Phase 2: 核心功能

- [ ] 認證流程 (Google OAuth)
- [ ] 首頁瀏覽
- [ ] 攀岩者傳記列表與詳情
- [ ] 岩場/岩館資訊

### Phase 3: 互動功能

- [ ] 使用者個人檔案
- [ ] 按讚、留言
- [ ] 推播通知 (Expo Push)

### Phase 4: 進階功能

- [ ] 離線支援
- [ ] 圖片上傳與裁切
- [ ] Deep Linking

---

## 注意事項

1. **React 版本**：Expo SDK 54 已支援 React 19.1，與 Web 版本一致
2. **Tamagui 編譯優化**：生產環境務必啟用 `disableExtraction: false` 以獲得最佳效能
3. **UI 分離策略**：App 使用 Tamagui，Web 使用 TailwindCSS（Edge Runtime 相容性考量）
4. **平台特定程式碼**：使用 `.ios.tsx` / `.android.tsx` 或 `Platform.select()` 處理
5. **效能監控**：建議整合 Sentry for React Native
6. **測試策略**：共用模組用 Jest，UI 測試用 React Native Testing Library
