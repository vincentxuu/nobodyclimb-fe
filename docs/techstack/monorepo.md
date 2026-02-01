# Monorepo 結構

> ⚠️ **規劃文件**：本文件描述的是規劃中的 monorepo 結構，尚未實作。

## 概覽

NobodyClimb 採用 pnpm workspaces 管理 monorepo，將 Web、App、Backend 和共用套件整合在同一個 repository。

### 技術版本

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 19.x | Web + App |
| React Native | 0.81.x | App |
| Expo SDK | 54 | App |
| Next.js | 15.x | Web |
| TailwindCSS | 3.4.x | Web UI |
| Tamagui | 1.x | App UI |
| pnpm | 9.x | 套件管理 |
| Turborepo | 2.x | Monorepo 工具 |

### 設計原則

1. **共用邏輯，分離 UI**：型別、驗證、API 客戶端共用；UI 各平台獨立實作
2. **嚴格依賴隔離**：避免 shamefully-hoist，確保套件邊界清晰
3. **統一錯誤處理**：跨平台一致的錯誤邊界與日誌策略
4. **漸進式遷移**：分階段遷移，每階段可獨立驗證

---

## 專案結構

```
nobodyclimb/
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── ci.yml              # 主要 CI (lint, test, typecheck)
│       ├── deploy-web.yml      # Web 部署
│       ├── deploy-app.yml      # App 建置與提交
│       └── deploy-backend.yml  # Backend 部署
│
├── docs/                       # 專案文件
│   ├── techstack/              # 技術棧文件
│   ├── prd/                    # 產品需求文件
│   └── design/                 # 設計文件
│
├── apps/                       # 應用程式
│   ├── web/                    # Next.js Web 應用
│   │   ├── src/
│   │   │   ├── app/            # App Router 頁面
│   │   │   ├── components/     # React 元件
│   │   │   ├── lib/            # Web 專用工具
│   │   │   └── store/          # Zustand stores
│   │   ├── public/
│   │   ├── package.json
│   │   └── wrangler.json       # Cloudflare Workers 設定
│   │
│   └── app/                    # React Native App (Expo + Tamagui)
│       ├── app/                # Expo Router 頁面 (檔案路由)
│       │   ├── (tabs)/         # Tab Navigator
│       │   ├── auth/           # 認證頁面
│       │   └── _layout.tsx     # Root Layout
│       ├── src/
│       │   ├── components/     # RN 元件
│       │   ├── lib/            # App 專用工具
│       │   └── store/          # Zustand stores
│       ├── assets/             # 圖片、字型
│       ├── tamagui.config.ts   # Tamagui 主題設定
│       ├── app.json            # Expo 設定
│       ├── eas.json            # EAS Build 設定
│       └── package.json
│
├── backend/                    # Hono API
│   ├── src/
│   │   ├── routes/             # API 路由
│   │   ├── middleware/         # 中介軟體
│   │   ├── repositories/       # 資料存取層
│   │   ├── services/           # 業務邏輯層
│   │   └── utils/              # 工具函式
│   ├── migrations/             # D1 資料庫遷移
│   ├── __tests__/              # 測試
│   ├── wrangler.toml
│   └── package.json
│
├── packages/                   # 共用套件
│   ├── types/                  # @nobodyclimb/types
│   ├── schemas/                # @nobodyclimb/schemas
│   ├── constants/              # @nobodyclimb/constants
│   ├── utils/                  # @nobodyclimb/utils
│   ├── hooks/                  # @nobodyclimb/hooks
│   └── api-client/             # @nobodyclimb/api-client
│
├── package.json                # 根 package.json
├── pnpm-workspace.yaml         # pnpm workspaces 設定
└── turbo.json                  # Turborepo 設定
```

---

## Workspace 設定

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'backend'
  - 'packages/*'
```

### .npmrc

```ini
# 嚴格依賴隔離，確保套件邊界
shamefully-hoist=false

# 確保 peer dependencies 正確安裝
auto-install-peers=true
strict-peer-dependencies=false

# 使用 workspace 協定
link-workspace-packages=true
```

### 根 package.json

```json
{
  "name": "nobodyclimb",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "pnpm --filter @nobodyclimb/web dev",
    "dev:app": "pnpm --filter @nobodyclimb/app start",
    "dev:backend": "pnpm --filter @nobodyclimb/api dev",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=@nobodyclimb/web",
    "build:cf": "turbo run build:cf --filter=@nobodyclimb/web",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.9.0",
    "prettier": "^3.6.0"
  }
}
```

---

## 共用套件 (packages/)

### 套件清單

| 套件 | 用途 | Web | App | Backend |
|------|------|-----|-----|---------|
| `@nobodyclimb/types` | TypeScript 型別定義 | ✅ | ✅ | ✅ |
| `@nobodyclimb/schemas` | Zod 驗證 schemas | ✅ | ✅ | ✅ |
| `@nobodyclimb/constants` | 常數、設計系統 (Design Tokens) | ✅ | ✅ | ✅ |
| `@nobodyclimb/utils` | 工具函式 | ✅ | ✅ | ✅ |
| `@nobodyclimb/hooks` | 共用 React hooks | ✅ | ✅ | - |
| `@nobodyclimb/api-client` | API 客戶端 | ✅ | ✅ | - |

> **設計系統**：`@nobodyclimb/constants` 包含共用的品牌色、字體、間距等 Design Tokens，Web (TailwindCSS) 和 App (Tamagui) 都從此套件導入。

### packages/types

```
packages/types/
├── src/
│   ├── user.ts           # User, Profile 等型別
│   ├── biography.ts      # Biography 相關型別
│   ├── crag.ts           # Crag, Route 型別
│   ├── blog.ts           # Blog, Comment 型別
│   ├── api.ts            # API Response 型別
│   └── index.ts          # 匯出所有型別
├── tsconfig.json
└── package.json
```

```json
{
  "name": "@nobodyclimb/types",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --clean && tsc --emitDeclarationOnly --declaration --outDir dist",
    "dev": "tsup src/index.ts --format esm,cjs --watch",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

### packages/schemas

```
packages/schemas/
├── src/
│   ├── auth.ts           # 登入、註冊驗證
│   ├── user.ts           # 使用者資料驗證
│   ├── biography.ts      # Biography 驗證
│   ├── blog.ts           # Blog 驗證
│   └── index.ts
└── package.json
```

```json
{
  "name": "@nobodyclimb/schemas",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --clean && tsc --emitDeclarationOnly --declaration --outDir dist",
    "dev": "tsup src/index.ts --format esm,cjs --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.25.0"
  },
  "peerDependencies": {
    "@nobodyclimb/types": "workspace:^"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

```typescript
// packages/schemas/src/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('請輸入有效的 Email'),
  password: z.string().min(8, '密碼至少 8 個字元'),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, '姓名至少 2 個字元'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼不一致',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

### packages/constants

```
packages/constants/
├── src/
│   ├── routes.ts         # API 路由常數
│   ├── config.ts         # 應用設定
│   ├── climbing.ts       # 攀岩相關常數（難度等級等）
│   └── index.ts
└── package.json
```

```json
{
  "name": "@nobodyclimb/constants",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --clean && tsc --emitDeclarationOnly --declaration --outDir dist",
    "dev": "tsup src/index.ts --format esm,cjs --watch",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

```typescript
// packages/constants/src/climbing.ts
export const CLIMBING_GRADES = {
  BOULDERING: ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10+'],
  SPORT: ['5.6', '5.7', '5.8', '5.9', '5.10a', '5.10b', '5.10c', '5.10d', '5.11a', '5.11b', '5.11c', '5.11d', '5.12+'],
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  USERS: '/users',
  BIOGRAPHIES: '/biographies',
} as const;

// packages/constants/src/routes.ts
// 跨平台路由定義，確保深連結一致性
export const SCREEN_ROUTES = {
  HOME: { web: '/', native: '/' },
  BIOGRAPHY_LIST: { web: '/biography', native: 'biography' },
  BIOGRAPHY_DETAIL: { web: '/biography/[id]', native: 'biography/[id]' },
  PROFILE: { web: '/profile/[username]', native: 'profile/[username]' },
  CRAG_DETAIL: { web: '/crag/[id]', native: 'crag/[id]' },
  GYM_DETAIL: { web: '/gym/[id]', native: 'gym/[id]' },
} as const;
```

### packages/utils

```
packages/utils/
├── src/
│   ├── date.ts           # 日期處理 (date-fns 封裝)
│   ├── format.ts         # 格式化函式
│   ├── validation.ts     # 通用驗證
│   └── index.ts
└── package.json
```

```json
{
  "name": "@nobodyclimb/utils",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --clean && tsc --emitDeclarationOnly --declaration --outDir dist",
    "dev": "tsup src/index.ts --format esm,cjs --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

### packages/hooks

```
packages/hooks/
├── src/
│   ├── useAuth.ts        # 認證狀態 hook
│   ├── useBiography.ts   # Biography 資料 hook
│   ├── useDebounce.ts    # Debounce hook
│   └── index.ts
└── package.json
```

```json
{
  "name": "@nobodyclimb/hooks",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --clean && tsc --emitDeclarationOnly --declaration --outDir dist",
    "dev": "tsup src/index.ts --format esm,cjs --watch",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "@tanstack/react-query": "^5.0.0",
    "@nobodyclimb/types": "workspace:^",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

```typescript
// packages/hooks/src/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@nobodyclimb/types';
import { useApiClient } from './useApiClient';

/**
 * 認證狀態 hook
 * API client 由平台層透過 ApiClientProvider 注入
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  const userQuery = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.get<User>('/auth/me').then((res) => res.data),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiClient.post<{ user: User; token: string }>('/auth/login', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => queryClient.setQueryData(['user', 'me'], null),
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userQuery.data,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
  };
}

// packages/hooks/src/useApiClient.ts
import { createContext, useContext } from 'react';
import type { AxiosInstance } from 'axios';

const ApiClientContext = createContext<AxiosInstance | null>(null);

export const ApiClientProvider = ApiClientContext.Provider;

export function useApiClient(): AxiosInstance {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within ApiClientProvider');
  }
  return client;
}
```

### packages/api-client

API 客戶端需要處理平台差異（Token 儲存方式不同）：

```
packages/api-client/
├── src/
│   ├── core/
│   │   ├── client.ts     # 核心 Axios 設定
│   │   └── endpoints.ts  # API endpoints 定義
│   ├── web/
│   │   └── index.ts      # Web 專用 (Cookie)
│   ├── native/
│   │   └── index.ts      # RN 專用 (SecureStore)
│   └── index.ts
└── package.json
```

```json
{
  "name": "@nobodyclimb/api-client",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./web": {
      "types": "./dist/web/index.d.ts",
      "import": "./dist/web/index.js",
      "require": "./dist/web/index.cjs"
    },
    "./native": {
      "types": "./dist/native/index.d.ts",
      "import": "./dist/native/index.js",
      "require": "./dist/native/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts src/web/index.ts src/native/index.ts --format esm,cjs --clean && tsc --emitDeclarationOnly --declaration --outDir dist",
    "dev": "tsup src/index.ts src/web/index.ts src/native/index.ts --format esm,cjs --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "axios": "^1.7.0"
  },
  "peerDependencies": {
    "@nobodyclimb/types": "workspace:^"
  },
  "peerDependenciesMeta": {
    "js-cookie": {
      "optional": true
    },
    "expo-secure-store": {
      "optional": true
    }
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

```typescript
// packages/api-client/src/core/client.ts
import axios, { AxiosInstance } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  getToken: () => Promise<string | null>;
  setToken: (token: string) => Promise<void>;
  removeToken: () => Promise<void>;
  onUnauthorized: () => void;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: 10000,
  });

  // Request interceptor: 加入 Token
  client.interceptors.request.use(async (req) => {
    const token = await config.getToken();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  });

  // Response interceptor: 處理 401
  client.interceptors.response.use(
    (res) => res,
    async (err) => {
      if (err.response?.status === 401) {
        await config.removeToken();
        config.onUnauthorized();
      }
      throw err;
    }
  );

  return client;
}
```

```typescript
// packages/api-client/src/web/index.ts
import Cookies from 'js-cookie';
import { createApiClient } from '../core/client';

export const createWebApiClient = (baseURL: string) => {
  return createApiClient({
    baseURL,
    getToken: async () => Cookies.get('token') || null,
    setToken: async (token) => {
      Cookies.set('token', token, { expires: 7, secure: true });
    },
    removeToken: async () => {
      Cookies.remove('token');
    },
    onUnauthorized: () => {
      window.location.href = '/auth/login';
    },
  });
};
```

```typescript
// packages/api-client/src/native/index.ts
import * as SecureStore from 'expo-secure-store';
import { createApiClient } from '../core/client';

export const createNativeApiClient = (
  baseURL: string,
  onUnauthorized: () => void
) => {
  return createApiClient({
    baseURL,
    getToken: async () => SecureStore.getItemAsync('token'),
    setToken: async (token) => {
      await SecureStore.setItemAsync('token', token);
    },
    removeToken: async () => {
      await SecureStore.deleteItemAsync('token');
    },
    onUnauthorized,
  });
};
```

---

## 平台專用程式碼

### UI 分離策略

各平台使用最適合的 UI 解決方案，確保部署穩定性與最佳效能：

| 層級 | Web | App |
|------|-----|-----|
| **UI Framework** | TailwindCSS + Radix UI | Tamagui |
| **Styling** | TailwindCSS | Tamagui Tokens + Theme |
| **Animation** | Framer Motion | React Native Reanimated |
| **Navigation** | Next.js App Router | Expo Router |
| **Image** | next/image | expo-image |
| **Storage** | Cookie (js-cookie) | SecureStore |
| **部署** | Cloudflare Workers | EAS / App Store |

### 為什麼 UI 分離？

1. **部署穩定性**：Web 使用 TailwindCSS 在 Cloudflare Workers Edge Runtime 上穩定運作
2. **效能最佳化**：各平台使用原生最佳方案
3. **避免相容性問題**：Tamagui 依賴 `react-native-web`，在 Edge Runtime 可能有問題
4. **靈活性**：可針對各平台最佳化 UX

### 為什麼 App 選擇 Tamagui？

1. **優化編譯器**：自動 Tree Shaking，減少 bundle size
2. **效能優異**：編譯時期處理樣式，執行時期開銷低
3. **完整主題系統**：支援 tokens、themes、sub-themes
4. **原生效能**：使用原生元件渲染，非 WebView

### 共用設計系統 (Design Tokens)

Web 和 App 共用 `@nobodyclimb/constants` 的設計 tokens：

```typescript
// packages/constants/src/theme.ts 導出：
import {
  WB_COLORS,        // 灰階系列
  BRAND_YELLOW,     // 品牌黃色
  BRAND_RED,        // 品牌紅色
  SEMANTIC_COLORS,  // 語意化顏色
  FONT_FAMILY,      // 字體家族
  FONT_SIZE,        // 字體尺寸
  SPACING,          // 間距
  BORDER_RADIUS,    // 圓角
  SHADOWS,          // 陰影 (RN 格式)
  BUTTON_SIZES,     // 按鈕規格
} from '@nobodyclimb/constants'
```

| 平台 | 使用方式 |
|------|----------|
| **Web** | TailwindCSS extend colors (從 constants 導入) |
| **App** | Tamagui createTokens (從 constants 導入) |

### 共用邏輯層優點

- **設計一致**：品牌色、間距、字體只需定義一次
- **型別一致**：API 型別、驗證 schema 只需定義一次
- **業務邏輯**：useAuth、useBiography 等 hook 邏輯共用
- **減少 bug**：修改一處，全平台生效

---

## Turborepo 設定

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV", "CI"],
  "remoteCache": {
    "signature": true
  },
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", ".open-next/**"],
      "env": ["NEXT_PUBLIC_*", "EXPO_PUBLIC_*"]
    },
    "lint": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "**/*.test.ts", "**/*.test.tsx", "jest.config.*"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Remote Cache 設定

啟用 Turborepo Remote Cache 加速 CI/CD：

```bash
# 登入 Vercel（Turborepo 官方）
pnpm dlx turbo login

# 連結專案
pnpm dlx turbo link
```

或使用環境變數（CI/CD）：

```bash
TURBO_TOKEN=your-token
TURBO_TEAM=your-team
```

---

## 使用方式

### 安裝依賴

```bash
# 安裝所有 workspace 依賴
pnpm install

# 只安裝特定 workspace
pnpm --filter web install
pnpm --filter app install
```

### 新增共用套件依賴

```bash
# 在 web 中使用 @nobodyclimb/types
pnpm --filter web add @nobodyclimb/types --workspace

# 在 app 中使用 @nobodyclimb/schemas
pnpm --filter app add @nobodyclimb/schemas --workspace
```

### 開發

```bash
# 同時啟動 Web 和 Backend（使用 Turborepo）
turbo run dev --filter=web --filter=backend --parallel

# 或使用 concurrently（需先安裝）
pnpm add -D concurrently -w
pnpm exec concurrently "pnpm dev:web" "pnpm dev:backend"
```

### 建置

```bash
# 建置所有專案
turbo run build

# 只建置 Web
turbo run build --filter=web
```

---

## 環境變數管理

### 結構

```
nobodyclimb/
├── .env.example              # 共用環境變數範本
├── web/
│   ├── .env.local            # Web 本地環境變數 (git ignored)
│   └── .env.example          # Web 環境變數範本
├── app/
│   ├── .env.local            # App 本地環境變數 (git ignored)
│   └── .env.example          # App 環境變數範本
└── backend/
    ├── .env.local            # Backend 本地環境變數 (git ignored)
    └── .env.example          # Backend 環境變數範本
```

### 共用變數

```bash
# .env.example（根目錄）
API_BASE_URL=https://api.nobodyclimb.cc
```

### 平台專用變數

```bash
# web/.env.example
NEXT_PUBLIC_API_URL=https://api.nobodyclimb.cc/api/v1
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_CLARITY_ID=

# app/.env.example
EXPO_PUBLIC_API_URL=https://api.nobodyclimb.cc/api/v1

# backend/.env.example
JWT_SECRET=your-jwt-secret
```

### Turborepo 環境變數

在 `turbo.json` 中設定全域環境變數依賴：

```json
{
  "globalEnv": ["NODE_ENV"],
  "globalDependencies": ["**/.env.*local"]
}
```

---

## 遷移計畫

### 現有結構

```
nobodyclimb-fe/           # 目前的 repository
├── src/                  # Next.js 前端
├── backend/              # Hono API
└── ...
```

### 遷移步驟

#### Phase 1：建立 Monorepo 基礎

1. **建立新的 repository 結構**

   ```bash
   mkdir nobodyclimb
   cd nobodyclimb
   pnpm init
   ```

2. **設定 pnpm workspaces**

   ```bash
   # 建立 pnpm-workspace.yaml
   echo "packages:\n  - 'web'\n  - 'app'\n  - 'backend'\n  - 'packages/*'" > pnpm-workspace.yaml
   ```

3. **遷移現有程式碼**

   ```bash
   # 將現有前端移至 web/
   git mv src web/src
   git mv public web/public
   git mv next.config.js web/
   git mv tsconfig.json web/
   git mv wrangler.toml web/

   # 將 backend 移至根目錄層級（已在正確位置）
   ```

#### Phase 2：抽離共用套件

1. **建立 packages/types**
   - 從 `web/src/lib/types.ts` 和 `backend/src/types.ts` 抽離共用型別

2. **建立 packages/schemas**
   - 整合 Zod schemas

3. **建立 packages/constants**
   - 抽離共用常數

#### Phase 3：整合 API Client

1. **建立 packages/api-client**
   - 將 `web/src/lib/api/client.ts` 重構為可共用版本

2. **更新 Web 使用共用 API Client**

#### Phase 4：加入 React Native App

1. **初始化 Expo 專案（SDK 54）**

   ```bash
   # 使用 Expo SDK 54（React Native 0.81 + React 19.1）
   npx create-expo-app@latest app --template blank-typescript

   # 確認 SDK 版本
   cd app && npx expo --version
   ```

2. **設定 Metro 支援 monorepo**

   ```javascript
   // app/metro.config.js
   const { getDefaultConfig } = require('expo/metro-config');
   const path = require('path');

   const projectRoot = __dirname;
   const monorepoRoot = path.resolve(projectRoot, '..');

   const config = getDefaultConfig(projectRoot);

   // 監控 monorepo 中的所有套件
   config.watchFolders = [monorepoRoot];

   // 確保 node_modules 解析正確
   config.resolver.nodeModulesPaths = [
     path.resolve(projectRoot, 'node_modules'),
     path.resolve(monorepoRoot, 'node_modules'),
   ];

   module.exports = config;
   ```

3. **設定使用共用套件**

   ```bash
   pnpm --filter app add @nobodyclimb/types @nobodyclimb/schemas @nobodyclimb/hooks @nobodyclimb/api-client --workspace
   ```

4. **設定 ApiClientProvider**

   ```typescript
   // app/src/providers/ApiClientProvider.tsx
   import { ApiClientProvider } from '@nobodyclimb/hooks';
   import { createNativeApiClient } from '@nobodyclimb/api-client/native';
   import { useRouter } from 'expo-router';

   const apiClient = createNativeApiClient(
     process.env.EXPO_PUBLIC_API_URL!,
     () => router.replace('/auth/login')
   );

   export function AppApiClientProvider({ children }: { children: React.ReactNode }) {
     const router = useRouter();
     return <ApiClientProvider value={apiClient}>{children}</ApiClientProvider>;
   }
   ```

#### Phase 5：CI/CD 調整

1. **更新 GitHub Actions workflows**
2. **設定 Turborepo cache**

### 預計時程

| Phase | 內容 | 建議順序 |
|-------|------|----------|
| Phase 1 | Monorepo 基礎設定 | 第一步 |
| Phase 2 | 抽離共用套件 | 第二步 |
| Phase 3 | API Client 整合 | 第三步 |
| Phase 4 | React Native App | 可獨立進行 |
| Phase 5 | CI/CD 調整 | 最後 |

---

## 跨平台策略

### 錯誤邊界（Error Boundary）

統一的錯誤處理策略，確保 Web 和 App 行為一致：

```
packages/
├── error-boundary/           # @nobodyclimb/error-boundary
│   ├── src/
│   │   ├── ErrorBoundary.tsx    # React Error Boundary 基礎元件
│   │   ├── useErrorHandler.ts   # 錯誤處理 hook
│   │   ├── types.ts             # 錯誤型別定義
│   │   └── index.ts
│   └── package.json
```

```typescript
// packages/error-boundary/src/types.ts
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ErrorReporter {
  captureException: (error: Error, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, level: 'info' | 'warning' | 'error') => void;
}

// packages/error-boundary/src/useErrorHandler.ts
import { useCallback } from 'react';

export function useErrorHandler(reporter?: ErrorReporter) {
  const handleError = useCallback((error: Error, context?: Record<string, unknown>) => {
    console.error('[App Error]', error);
    reporter?.captureException(error, context);
  }, [reporter]);

  return { handleError };
}
```

### 日誌套件（Logger）

```
packages/
├── logger/                   # @nobodyclimb/logger
│   ├── src/
│   │   ├── logger.ts            # 核心 logger
│   │   ├── transports/
│   │   │   ├── console.ts       # Console transport
│   │   │   └── remote.ts        # Remote logging transport
│   │   └── index.ts
│   └── package.json
```

```typescript
// packages/logger/src/logger.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface Transport {
  log: (entry: LogEntry) => void;
}

export function createLogger(transports: Transport[]) {
  const log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    transports.forEach((t) => t.log(entry));
  };

  return {
    debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
    info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
    warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
    error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
  };
}
```

---

## 測試策略

### 單元測試

各 workspace 使用 Vitest：

```json
// packages/*/package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### E2E 測試

| 平台 | 工具 | 說明 |
|------|------|------|
| Web | Playwright | 瀏覽器自動化測試 |
| App | Maestro | React Native E2E 測試（推薦）|

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  web-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm --filter web exec playwright install --with-deps
      - run: pnpm --filter web test:e2e

  app-e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: brew install maestro
      - run: pnpm --filter app build:ios
      - run: maestro test app/.maestro/
```

---

## Bundle Size 監控

使用 `size-limit` 防止套件膨脹：

```json
// package.json (root)
{
  "devDependencies": {
    "@size-limit/preset-small-lib": "^11.0.0",
    "size-limit": "^11.0.0"
  },
  "size-limit": [
    { "path": "packages/types/dist/index.js", "limit": "5 KB" },
    { "path": "packages/schemas/dist/index.js", "limit": "15 KB" },
    { "path": "packages/utils/dist/index.js", "limit": "10 KB" },
    { "path": "packages/hooks/dist/index.js", "limit": "8 KB" },
    { "path": "packages/api-client/dist/index.js", "limit": "12 KB" }
  ]
}
```

```yaml
# .github/workflows/ci.yml (加入 size-limit 檢查)
- name: Check bundle size
  run: pnpm size-limit
```

---

## 參考資源

- [Turborepo 官方文件](https://turborepo.dev/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Expo Monorepo 指南](https://docs.expo.dev/guides/monorepos/)
- [tsup 文件](https://tsup.egoist.dev/)
