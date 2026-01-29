# NobodyClimb 技術棧文件

> 最後更新：2025-01-28

## 目錄

1. [技術架構總覽](#技術架構總覽)
2. [Frontend 技術棧](./frontend.md)
3. [Backend 技術棧](./backend.md)
4. [CI/CD Pipeline](./cicd.md)
5. [React Native 規劃](./react-native.md)

---

## 技術架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Web (Next.js 15)          │  Mobile (React Native) - 規劃中   │
│  - React 19                │  - Expo                           │
│  - TailwindCSS             │  - React Native Paper             │
│  - Zustand + TanStack Query│  - 共用狀態管理邏輯               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare Workers                                             │
│  - Hono Framework                                               │
│  - JWT Authentication                                           │
│  - Rate Limiting                                                │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  D1 (SQLite)    │  R2 (Object Storage)  │  KV (Key-Value Cache) │
│  - 主資料庫     │  - 圖片/檔案儲存      │  - 快取               │
└─────────────────────────────────────────────────────────────────┘
```

## 技術選型原則

1. **Edge-First**: 使用 Cloudflare 全球邊緣網路，降低延遲
2. **Type-Safe**: 全面使用 TypeScript，前後端共享型別
3. **Serverless**: 無伺服器架構，按需擴展，成本優化
4. **DX (Developer Experience)**: 優化開發者體驗，快速迭代

## 版本資訊

| 類別 | 技術 | 版本 |
|------|------|------|
| **Runtime** | Node.js | 20.x |
| **Package Manager** | pnpm | 9.x |
| **Frontend Framework** | Next.js | 15.5.x |
| **React** | React | 19.1.x |
| **Backend Framework** | Hono | 4.6.x |
| **Language** | TypeScript | 5.9.x |
| **Styling** | TailwindCSS | 3.4.x |
| **State Management** | Zustand | 4.5.x |
| **Server State** | TanStack Query | 5.85.x |
