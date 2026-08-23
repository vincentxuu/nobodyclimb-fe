---
name: add-web-page
description: 新增 web（Next.js 15 App Router）頁面或功能的標準步驟 — server/client 拆分、i18n 三語系、TanStack Query hook、API service。做 apps/web 相關任務時使用
---

# 新增 Web 頁面 / 功能

Web 在 `apps/web/`，Next.js 15 + React 19，部署在 Cloudflare Workers（OpenNext）。
路由都在 `apps/web/src/app/[locale]/` 底下。

## 標準結構：server page + client component 拆分

範例照抄：`apps/web/src/app/[locale]/crag/[id]/page.tsx` + 同目錄 `CragDetailClient.tsx`。

**Server page（`page.tsx`，不加 `'use client'`）**：負責 metadata / SEO / JSON-LD。

```tsx
export const dynamic = 'force-dynamic' // 需要 runtime 讀 API 的頁面要加（Cloudflare 上 env 是 runtime 才有）

// Next 15：params 是 Promise，必須 await
export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'MyPage' })
  // server 端抓資料用 src/lib/api/server-fetch.ts（native fetch），不是 axios
}

export default async function MyPage({ params }: { params: Promise<{ id: string }> }) {
  return <MyPageClient params={params} />
}
```

**Client component（`MyPageClient.tsx`，第一行 `'use client'`）**：互動與資料。

```tsx
'use client'
import { use } from 'react'
export default function MyPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)          // client 端用 use() 解 Promise
  const t = useTranslations('MyPage')
  const { data, isLoading } = useMyThing(id)
}
```

## 資料層（三件套，缺一不可）

1. **Service**：`apps/web/src/lib/api/services.ts` 加方法
   （`(await apiClient.get('/things/' + id)).data`）。
2. **Adapter**（API DTO → 前端 view model，需要時）：`apps/web/src/lib/adapters/`。
3. **Query hook**：`apps/web/src/hooks/api/useThings.ts`，並從該目錄的 `index.ts` barrel export：

```tsx
export function useThing(id: string) {
  return useQuery({
    queryKey: ['thing', id],
    queryFn: async () => { const r = await thingService.getById(id); return r.data ?? null },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,   // 專案慣例 5min
    gcTime: 30 * 60 * 1000,     // 30min
  })
}
```

Mutation 後 `queryClient.invalidateQueries({ queryKey: ['things'] })`。

## i18n（漏掉會直接爆在別的語系）

- 新 namespace 要同時加進 **三個檔案**：`apps/web/messages/zh.json`、`en.json`、`ja.json`
  （頂層 key = namespace，如 `MyPage`）。
- 站內連結 / 導頁一律 `import { Link, useRouter, usePathname } from '@/i18n/navigation'`，
  **禁用 `next/link`**（會掉 locale）。

## 其他慣例

- **表單**：React Hook Form + `zodResolver`，schema 放 `apps/web/src/lib/schemas/`，
  範例：`apps/web/src/components/bucket-list/bucket-list-form.tsx`。
- **UI 元件**：`apps/web/src/components/ui/`（CVA + Radix + `cn()`，`cn` 在
  `apps/web/src/lib/utils.ts`）。Radix 用統一套件 `radix-ui`，不是 `@radix-ui/*` 分包。
- **全域狀態**：Zustand，`apps/web/src/store/`；server state 一律 TanStack Query，不進 store。
- **瀏覽器限定的 lib**（editor 等）用 `next/dynamic` + `ssr: false`。
- **圖片**：`next/image`；新外部圖片網域要加進 `next.config.mjs` 的 `remotePatterns`。
- **測試**：Jest + RTL，colocate 在 `__tests__/`；跑單一測試：
  `pnpm --filter @nobodyclimb/web test -- <檔名關鍵字>`。

## 陷阱

- Cloudflare Workers runtime ≠ Node：server 端不能用 Node-only API；
  runtime env 透過 `getCloudflareContext()`（參考 `server-fetch.ts` 的寫法）。
- `NEXT_PUBLIC_*` 是 build time 烘進去的；需要 runtime 值的頁面用
  `dynamic = 'force-dynamic'` + server-fetch。
- 完成後照 `verify-changes` skill 驗證（typecheck + lint + 相關測試）。
