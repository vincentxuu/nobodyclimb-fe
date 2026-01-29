# CI/CD Pipeline

## 概覽

NobodyClimb 使用 GitHub Actions 實現自動化部署，分為三個主要 Workflow：

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   deploy.yml    │  │  deploy-api.yml │  │  keep-alive.yml │ │
│  │                 │  │                 │  │                 │ │
│  │  Frontend 部署  │  │  Backend 部署   │  │  Worker 保活    │ │
│  │  (Next.js)      │  │  (Hono API)     │  │  (每 5 分鐘)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend 部署 (deploy.yml)

### 觸發條件

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

### 部署流程

```
Push to main/develop
        │
        ▼
┌───────────────────┐
│  Checkout Code    │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Setup pnpm 9     │
│  Setup Node.js 20 │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  pnpm install     │
│  --frozen-lockfile│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  pnpm build:cf    │
│  (OpenNext Build) │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Wrangler Deploy  │
│  to Cloudflare    │
└───────────────────┘
        │
        ▼ (main branch only)
┌───────────────────┐
│  Purge Cloudflare │
│  Cache            │
└───────────────────┘
```

### 環境變數配置

| 變數 | main 分支 | 其他分支 |
|------|-----------|----------|
| `NEXT_PUBLIC_API_URL` | `https://api.nobodyclimb.cc/api/v1` | `https://api-preview.nobodyclimb.cc/api/v1` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` | `false` |

### Analytics 環境變數

```yaml
NEXT_PUBLIC_GA_ID: ${{ secrets.GA_ID }}
NEXT_PUBLIC_CLARITY_ID: ${{ secrets.CLARITY_ID }}
NEXT_PUBLIC_POSTHOG_KEY: ${{ secrets.POSTHOG_KEY }}
NEXT_PUBLIC_POSTHOG_HOST: ${{ secrets.POSTHOG_HOST }}
NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
```

---

## 2. Backend API 部署 (deploy-api.yml)

### 觸發條件

```yaml
on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-api.yml'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [preview, production]
```

### 部署流程

```
Push to backend/**
        │
        ▼
┌─────────────────────────────────────────┐
│           Job: lint-and-typecheck       │
├─────────────────────────────────────────┤
│  1. Checkout                            │
│  2. Setup pnpm 9 + Node.js 20           │
│  3. pnpm install --frozen-lockfile      │
│  4. tsc --noEmit (Type Check)           │
└─────────────────────────────────────────┘
        │
        ▼ (on push/workflow_dispatch only)
┌─────────────────────────────────────────┐
│              Job: deploy                │
├─────────────────────────────────────────┤
│  1. Determine Environment               │
│     - main → production                 │
│     - develop → preview                 │
│     - workflow_dispatch → user choice   │
│                                         │
│  2. Check Required Secrets              │
│     - JWT_SECRET (required)             │
│     - CWA_API_KEY (optional)            │
│     - GOOGLE_CLIENT_ID (optional)       │
│                                         │
│  3. Wrangler Deploy                     │
│                                         │
│  4. Upload Secrets to Workers           │
│                                         │
│  5. Apply D1 Migrations                 │
│     - 最多重試 3 次                     │
│     - 重試間隔 10 秒                    │
└─────────────────────────────────────────┘
```

### 環境判斷邏輯

```bash
if [ workflow_dispatch ]; then
  environment = user_input
elif [ main branch ]; then
  environment = production
else
  environment = preview
fi
```

### Secrets 配置

| Secret 名稱 | 必要性 | 說明 |
|-------------|--------|------|
| `CLOUDFLARE_API_TOKEN` | 必要 | Cloudflare API Token |
| `JWT_SECRET` | 必要 | JWT 簽名密鑰 |
| `GOOGLE_CLIENT_ID` | 選填 | Google OAuth |
| `CWA_API_KEY` | 選填 | 天氣 API |
| `CLOUDFLARE_ACCOUNT_ID` | 選填 | Analytics Engine |
| `CF_ANALYTICS_TOKEN` | 選填 | Analytics Engine |

---

## 3. Worker Keep-Alive (keep-alive.yml)

### 用途

定期 ping Cloudflare Workers，保持 Worker 溫暖，減少冷啟動延遲。

### 觸發條件

```yaml
on:
  schedule:
    - cron: '*/5 * * * *'  # 每 5 分鐘
  workflow_dispatch:        # 手動觸發
```

### 健康檢查端點

| 端點 | 說明 |
|------|------|
| `https://nobodyclimb.cc/api/health` | Frontend Worker |
| `https://api.nobodyclimb.cc/health` | API Worker |

---

## GitHub Secrets 完整清單

| Secret 名稱 | 用途 | 必要性 |
|-------------|------|--------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare 部署權限 | 必要 |
| `CLOUDFLARE_ZONE_ID` | 快取清除用 | Frontend 必要 |
| `JWT_SECRET` | API 認證 | Backend 必要 |
| `GOOGLE_CLIENT_ID` | Google OAuth | 選填 |
| `GA_ID` | Google Analytics | 選填 |
| `CLARITY_ID` | Microsoft Clarity | 選填 |
| `POSTHOG_KEY` | PostHog Analytics | 選填 |
| `POSTHOG_HOST` | PostHog Host | 選填 |
| `SENTRY_DSN` | Sentry 錯誤追蹤 | 選填 |
| `SENTRY_ORG` | Sentry 組織 | 選填 |
| `SENTRY_PROJECT` | Sentry 專案 | 選填 |
| `SENTRY_AUTH_TOKEN` | Sentry 認證 | 選填 |
| `CWA_API_KEY` | 中央氣象署 API | 選填 |
| `CLOUDFLARE_ACCOUNT_ID` | Analytics Engine | 選填 |
| `CF_ANALYTICS_TOKEN` | Analytics Engine | 選填 |

---

## 部署環境對應

| 分支 | Frontend Worker | Backend Worker | Domain |
|------|-----------------|----------------|--------|
| `main` | nobodyclimb-fe-production | nobodyclimb-api-production | nobodyclimb.cc |
| `develop` | nobodyclimb-fe-preview | nobodyclimb-api-preview | preview.nobodyclimb.cc |

---

## 手動部署指令

```bash
# Frontend
pnpm build:cf
wrangler deploy --env production    # 或 --env preview

# Backend
cd backend
pnpm deploy:production              # 或 pnpm deploy:preview
```

---

## 故障排除

### D1 Migration 失敗

Migration 會自動重試 3 次，間隔 10 秒。如仍失敗：

1. 檢查 migration 檔案語法
2. 手動執行：`wrangler d1 migrations apply nobodyclimb-db --remote --env production`

### Secrets 未設定

檢查 GitHub Repository Settings → Secrets and variables → Actions

### 快取問題

Production 部署後會自動清除 Cloudflare 快取。如需手動清除：

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```
