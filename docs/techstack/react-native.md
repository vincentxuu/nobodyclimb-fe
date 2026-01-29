# React Native 技術規劃

> 狀態：規劃中

## 概覽

本文件規劃 NobodyClimb 的 React Native 行動應用開發策略，目標是最大化與現有 Web 專案的程式碼共用。

---

## 技術選型

### 核心框架

| 技術 | 版本建議 | 用途 |
|------|----------|------|
| **React Native** | 0.76+ | 跨平台行動應用框架 |
| **Expo** | SDK 52+ | 開發工具鏈與託管服務 |
| **TypeScript** | 5.x | 型別安全（與 Web 共用） |

### 路由導航

| 技術 | 說明 |
|------|------|
| **Expo Router** | 基於檔案的路由，類似 Next.js App Router |

### UI 元件庫

| 選項 | 優點 | 缺點 |
|------|------|------|
| **Tamagui** | 高效能，支援 Web + Native，完整設計系統 | 學習曲線較陡 |
| **NativeWind** | TailwindCSS 語法，與 Web 一致 | 部分功能受限 |
| **React Native Paper** | Material Design，完善的主題系統 | 風格偏 Material |

**建議**：使用 **Tamagui**，優點如下：
- **跨平台共用**：同一套元件可編譯至 Web 與 Native，真正實現 UI 層程式碼共用
- **高效能**：編譯時優化，產生原生樣式，執行效能優於 runtime 方案
- **完整設計系統**：內建主題、動畫、響應式設計
- **TypeScript 原生支援**：型別安全的樣式 API

### 狀態管理

| 技術 | 說明 |
|------|------|
| **Zustand** | 與 Web 共用相同的 Store 邏輯 |
| **TanStack Query** | 與 Web 共用相同的 API 快取邏輯 |

### 表單與驗證

| 技術 | 說明 |
|------|------|
| **React Hook Form** | 與 Web 共用 |
| **Zod** | 與 Web 共用 Schema |

---

## 程式碼共用策略

### Monorepo 結構

```
nobodyclimb/
├── apps/
│   ├── web/                    # Next.js 應用（現有）
│   └── mobile/                 # React Native 應用（新增）
├── packages/
│   ├── shared/                 # 共用邏輯
│   │   ├── api/                # API 客戶端
│   │   ├── stores/             # Zustand stores
│   │   ├── hooks/              # 共用 hooks
│   │   ├── types/              # TypeScript 型別
│   │   ├── utils/              # 工具函式
│   │   └── validation/         # Zod schemas
│   ├── ui/                     # Tamagui 共用 UI 元件
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   └── package.json
│   └── config/                 # Tamagui 主題配置
│       ├── src/
│       │   ├── tamagui.config.ts
│       │   ├── tokens.ts       # 色彩、間距、字型
│       │   └── themes.ts       # 明暗主題
│       └── package.json
└── package.json                # Workspace 配置
```

### 可共用模組

| 模組 | 共用程度 | 說明 |
|------|----------|------|
| **Tamagui UI Components** | 95% | Button, Card, Input 等基礎元件 (Web + Native) |
| **Tamagui Theme/Tokens** | 100% | 色彩、間距、字型統一配置 |
| **API Client** | 100% | Axios 設定、endpoints、interceptors |
| **Zustand Stores** | 100% | authStore, contentStore, uiStore |
| **TanStack Query Hooks** | 90% | useQueries、mutations |
| **Zod Schemas** | 100% | 表單驗證 schemas |
| **TypeScript Types** | 100% | 所有型別定義 |
| **Utility Functions** | 90% | date-fns 封裝、格式化函式 |
| **Constants** | 100% | API URLs、配置常數 |

### 平台特定模組

| 模組 | 說明 |
|------|------|
| **Navigation** | Web 用 Next.js Router，Mobile 用 Expo Router |
| **Storage** | Web 用 Cookie，Mobile 用 SecureStore |
| **Platform-specific UI** | 如 BottomSheet (Mobile only)、Modal 實作差異 |
| **Image Handling** | expo-image vs next/image |

---

## 架構設計

### API Layer 共用

```typescript
// packages/shared/api/client.ts
import axios from 'axios';

export const createApiClient = (config: {
  baseURL: string;
  getToken: () => Promise<string | null>;
  onUnauthorized: () => void;
}) => {
  const client = axios.create({ baseURL: config.baseURL });

  client.interceptors.request.use(async (req) => {
    const token = await config.getToken();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        config.onUnauthorized();
      }
      throw err;
    }
  );

  return client;
};
```

```typescript
// apps/web/lib/api.ts
import { createApiClient } from '@nobodyclimb/shared/api';
import Cookies from 'js-cookie';

export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  getToken: async () => Cookies.get('token'),
  onUnauthorized: () => window.location.href = '/auth/login',
});
```

```typescript
// apps/mobile/lib/api.ts
import { createApiClient } from '@nobodyclimb/shared/api';
import * as SecureStore from 'expo-secure-store';

export const api = createApiClient({
  baseURL: 'https://api.nobodyclimb.cc/api/v1',
  getToken: async () => SecureStore.getItemAsync('token'),
  onUnauthorized: () => router.replace('/auth/login'),
});
```

### Store 共用

```typescript
// packages/shared/stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const createAuthStore = () => create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### Tamagui 主題配置

```typescript
// packages/config/src/tokens.ts
import { createTokens } from '@tamagui/core';

export const tokens = createTokens({
  color: {
    // 品牌色彩 (與 TailwindCSS 對應)
    primary: '#10b981',        // emerald-500
    primaryDark: '#059669',    // emerald-600
    secondary: '#6366f1',      // indigo-500
    background: '#ffffff',
    backgroundDark: '#1f2937', // gray-800
    text: '#111827',           // gray-900
    textMuted: '#6b7280',      // gray-500
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  size: {
    sm: 32,
    md: 44,
    lg: 56,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
});
```

```typescript
// packages/config/src/tamagui.config.ts
import { createTamagui } from '@tamagui/core';
import { tokens } from './tokens';
import { themes } from './themes';

export const config = createTamagui({
  tokens,
  themes,
  fonts: {
    body: {
      family: 'Inter',
      weight: { normal: '400', bold: '700' },
    },
    heading: {
      family: 'Inter',
      weight: { normal: '600', bold: '700' },
    },
  },
});

export type AppConfig = typeof config;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}
```

```tsx
// packages/ui/src/Button.tsx
import { styled, Button as TamaguiButton } from 'tamagui';

export const Button = styled(TamaguiButton, {
  backgroundColor: '$primary',
  borderRadius: '$md',
  paddingHorizontal: '$lg',
  paddingVertical: '$sm',

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: 'white',
      },
      secondary: {
        backgroundColor: '$secondary',
        color: 'white',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$primary',
        color: '$primary',
      },
    },
    size: {
      sm: { height: '$sm', fontSize: 14 },
      md: { height: '$md', fontSize: 16 },
      lg: { height: '$lg', fontSize: 18 },
    },
  },

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
```

---

## 建議的依賴套件

### Core

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.x",
    "@tamagui/core": "^1.120.0",
    "@tamagui/config": "^1.120.0",
    "@tamagui/themes": "^1.120.0",
    "tamagui": "^1.120.0"
  }
}
```

### State & Data

```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.85.0",
    "axios": "^1.11.0",
    "zod": "^3.25.0",
    "react-hook-form": "^7.62.0",
    "@hookform/resolvers": "^3.10.0"
  }
}
```

### Auth & Storage

```json
{
  "dependencies": {
    "expo-secure-store": "~14.0.0",
    "expo-auth-session": "~6.0.0",
    "@react-native-google-signin/google-signin": "^13.0.0"
  }
}
```

### UI Enhancement

```json
{
  "dependencies": {
    "@tamagui/animations-react-native": "^1.120.0",
    "@tamagui/font-inter": "^1.120.0",
    "@tamagui/lucide-icons": "^1.120.0",
    "@tamagui/sheet": "^1.120.0",
    "expo-image": "~2.0.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "@gorhom/bottom-sheet": "^5.0.0"
  }
}
```

### Next.js 整合 (Web 端)

```json
{
  "devDependencies": {
    "@tamagui/next-plugin": "^1.120.0",
    "@tamagui/babel-plugin": "^1.120.0"
  }
}
```

---

## App 部署架構

### 部署流程總覽

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        App 部署流程                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  開發者  │───▶│  GitHub  │───▶│ EAS Build│───▶│  App Store /     │  │
│  │  Push    │    │  Actions │    │  Cloud   │    │  Google Play     │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    EAS Update (OTA 更新)                          │  │
│  │  JS Bundle 更新無需重新提交 App Store，用戶自動收到更新           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 兩種更新方式

| 更新類型 | 適用情況 | 審核時間 | 工具 |
|----------|----------|----------|------|
| **Full Build** | 原生程式碼變更、SDK 升級 | iOS 1-3 天, Android 數小時 | EAS Build + Submit |
| **OTA Update** | JS/TS 程式碼、樣式、資源 | 即時生效 | EAS Update |

### 部署環境

| 環境 | 用途 | 分發方式 |
|------|------|----------|
| **Development** | 開發測試 | Expo Go / Dev Client |
| **Preview** | 內部測試 (QA) | Internal Distribution / TestFlight |
| **Production** | 正式上架 | App Store / Google Play |

---

## 前置準備

### 1. Apple Developer 帳號

| 項目 | 說明 |
|------|------|
| **費用** | $99 USD / 年 |
| **申請** | https://developer.apple.com/programs/enroll/ |
| **所需資訊** | Apple ID、D-U-N-S 號碼 (公司)、身份驗證 |

### 2. Google Play Console 帳號

| 項目 | 說明 |
|------|------|
| **費用** | $25 USD (一次性) |
| **申請** | https://play.google.com/console/signup |
| **所需資訊** | Google 帳號、開發者資訊 |

### 3. Expo 帳號

```bash
# 安裝 EAS CLI
npm install -g eas-cli

# 登入 Expo
eas login

# 連結專案
cd apps/mobile
eas init
```

---

## 本地部署指令

### 開發建置

```bash
# iOS 模擬器
eas build --profile development --platform ios

# Android 模擬器
eas build --profile development --platform android

# 建置開發客戶端
eas build --profile development --platform all
```

### Preview 建置 (內部測試)

```bash
# 建置並分發給測試人員
eas build --profile preview --platform all

# 建置完成後會提供下載連結或 QR Code
```

### Production 建置與提交

```bash
# 建置 Production 版本
eas build --profile production --platform all

# 提交到 App Store
eas submit --platform ios --latest

# 提交到 Google Play
eas submit --platform android --latest

# 一次完成建置 + 提交
eas build --profile production --platform all --auto-submit
```

### OTA 更新 (無需重新提交)

```bash
# 發布 JS 更新到 Preview 頻道
eas update --branch preview --message "修復 bug"

# 發布 JS 更新到 Production 頻道
eas update --branch production --message "v1.0.1 修復登入問題"

# 查看更新歷史
eas update:list
```

---

## CI/CD 自動化

### Full Build Workflow (版本發布)

```yaml
# .github/workflows/mobile-build.yml
name: Mobile App Build & Submit

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'
      - 'packages/shared/**'
      - 'packages/ui/**'
  workflow_dispatch:
    inputs:
      platform:
        description: 'Target platform'
        type: choice
        options: [all, ios, android]
        default: all
      profile:
        description: 'Build profile'
        type: choice
        options: [production, preview]
        default: production

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build iOS
        if: github.event.inputs.platform != 'android'
        run: |
          cd apps/mobile
          eas build --platform ios \
            --profile ${{ github.event.inputs.profile || 'production' }} \
            --non-interactive

      - name: Build Android
        if: github.event.inputs.platform != 'ios'
        run: |
          cd apps/mobile
          eas build --platform android \
            --profile ${{ github.event.inputs.profile || 'production' }} \
            --non-interactive

      - name: Submit to App Store
        if: github.event.inputs.profile == 'production' && github.event.inputs.platform != 'android'
        run: |
          cd apps/mobile
          eas submit --platform ios --latest --non-interactive

      - name: Submit to Google Play
        if: github.event.inputs.profile == 'production' && github.event.inputs.platform != 'ios'
        run: |
          cd apps/mobile
          eas submit --platform android --latest --non-interactive
```

### OTA Update Workflow (熱更新)

```yaml
# .github/workflows/mobile-ota-update.yml
name: Mobile OTA Update

on:
  push:
    branches: [develop]
    paths:
      - 'apps/mobile/src/**'
      - 'packages/shared/**'
      - 'packages/ui/**'
  workflow_dispatch:
    inputs:
      branch:
        description: 'Update branch/channel'
        type: choice
        options: [preview, production]
        default: preview
      message:
        description: 'Update message'
        required: true

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Publish OTA Update
        run: |
          cd apps/mobile
          eas update \
            --branch ${{ github.event.inputs.branch || 'preview' }} \
            --message "${{ github.event.inputs.message || github.event.head_commit.message }}" \
            --non-interactive

      - name: Notify on Slack (optional)
        if: success()
        run: |
          echo "OTA Update published to ${{ github.event.inputs.branch || 'preview' }}"
```

---

### EAS 環境配置

```json
// apps/mobile/eas.json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "channel": "production",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### GitHub Secrets 配置

| Secret 名稱 | 說明 | 取得方式 |
|-------------|------|----------|
| `EXPO_TOKEN` | Expo/EAS 認證 | https://expo.dev/accounts/[user]/settings/access-tokens |
| `APPLE_ID` | Apple Developer 帳號 | Apple ID email |
| `ASC_APP_ID` | App Store Connect App ID | App Store Connect 後台 |
| `APPLE_TEAM_ID` | Apple Team ID | Apple Developer 後台 |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Play Console 服務帳號 | GCP Console 建立服務帳號 |

### App Store Connect 設定

```bash
# 1. 建立 App Store Connect API Key (推薦)
# App Store Connect → Users and Access → Keys → Generate API Key

# 2. 配置 EAS Credentials
eas credentials --platform ios
```

### Google Play Console 設定

```bash
# 1. 在 GCP Console 建立服務帳號
# 2. 授予 Google Play Console 存取權限
# 3. 下載 JSON 金鑰檔案

# 4. 上傳金鑰到 EAS Secrets
eas secret:create --name GOOGLE_SERVICE_ACCOUNT_KEY \
  --value "$(cat ./google-service-account.json)" \
  --type file
```

---

## 開發階段規劃

### Phase 1: 基礎建設

- [ ] 設定 Monorepo (Turborepo 或 Nx)
- [ ] 抽取共用模組到 `packages/shared`
- [ ] 建立 Expo 專案
- [ ] 整合 Tamagui 設計系統
- [ ] 建立共用主題配置 (支援 Web + Native)

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
- [ ] 深層連結 (Deep Linking)

---

## 注意事項

1. **React 版本相容性**：React Native 0.76 使用 React 18.3，而 Web 使用 React 19，需注意相容性
2. **Tamagui 學習曲線**：Tamagui 有獨特的樣式 API，團隊需要一定時間熟悉
3. **Web 整合**：若要在 Next.js 中使用 Tamagui，需額外配置 `@tamagui/next-plugin`
4. **測試策略**：共用模組可使用 Jest 測試，UI 需分別測試
5. **效能監控**：建議整合 Sentry for React Native
