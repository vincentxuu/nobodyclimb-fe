# CI/CD Pipeline

## 概覽

NobodyClimb 使用 GitHub Actions 實現 Monorepo 的自動化部署：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions Workflows                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                            │
│  │    Push      │                                                            │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Detect Changes (paths-filter)                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                                                                    │
│         ├─────────────────────┬─────────────────────┬──────────────────┐    │
│         ▼                     ▼                     ▼                  ▼    │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐   ┌──────────┐│
│  │  packages   │       │    web      │       │    app      │   │ backend  ││
│  │   changed   │       │   changed   │       │   changed   │   │ changed  ││
│  └──────┬──────┘       └──────┬──────┘       └──────┬──────┘   └────┬─────┘│
│         │                     │                     │                │      │
│         ▼                     ▼                     ▼                ▼      │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐   ┌──────────┐│
│  │ Test Shared │       │ Build & Test│       │ Build & Test│   │Build&Test││
│  │  Packages   │       │    Web      │       │    App      │   │ Backend  ││
│  └─────────────┘       └──────┬──────┘       └──────┬──────┘   └────┬─────┘│
│                               │                     │                │      │
│                               ▼                     ▼                ▼      │
│                        ┌─────────────┐       ┌─────────────┐   ┌──────────┐│
│                        │ Cloudflare  │       │  EAS Build  │   │Cloudflare││
│                        │  Workers    │       │  + Submit   │   │ Workers  ││
│                        └─────────────┘       └─────────────┘   └──────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow 檔案

### 1. 主要 CI (ci.yml)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ═══════════════════════════════════════════
  # 偵測變更的 packages
  # ═══════════════════════════════════════════
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.changes.outputs.web }}
      app: ${{ steps.changes.outputs.app }}
      backend: ${{ steps.changes.outputs.backend }}
      packages: ${{ steps.changes.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            web:
              - 'web/**'
              - 'packages/**'
            app:
              - 'app/**'
              - 'packages/**'
            backend:
              - 'backend/**'
            packages:
              - 'packages/**'

  # ═══════════════════════════════════════════
  # 共用套件測試
  # ═══════════════════════════════════════════
  test-packages:
    needs: detect-changes
    if: needs.detect-changes.outputs.packages == 'true'
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

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck packages
        run: pnpm --filter "./packages/**" typecheck

      - name: Test packages
        run: pnpm --filter "./packages/**" test

  # ═══════════════════════════════════════════
  # Web 測試與建置
  # ═══════════════════════════════════════════
  test-web:
    needs: [detect-changes, test-packages]
    if: |
      always() &&
      needs.detect-changes.outputs.web == 'true' &&
      (needs.test-packages.result == 'success' || needs.test-packages.result == 'skipped')
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

      - name: Turborepo Cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ github.sha }}
          restore-keys: |
            turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-
            turbo-${{ runner.os }}-

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web lint
      - run: pnpm --filter web typecheck
      - run: pnpm --filter web test
      - run: pnpm --filter web build

  # ═══════════════════════════════════════════
  # App 測試
  # ═══════════════════════════════════════════
  test-app:
    needs: [detect-changes, test-packages]
    if: |
      always() &&
      needs.detect-changes.outputs.app == 'true' &&
      (needs.test-packages.result == 'success' || needs.test-packages.result == 'skipped')
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

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter app lint
      - run: pnpm --filter app typecheck
      - run: pnpm --filter app test

  # ═══════════════════════════════════════════
  # Backend 測試
  # ═══════════════════════════════════════════
  test-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
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

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter backend lint
      - run: pnpm --filter backend typecheck
      - run: pnpm --filter backend test
```

---

### 2. Web 部署 (deploy-web.yml)

```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - 'packages/**'
  workflow_dispatch:

jobs:
  deploy:
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

      - name: Turborepo Cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ github.sha }}
          restore-keys: |
            turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-

      - run: pnpm install --frozen-lockfile

      - name: Build for Cloudflare
        run: pnpm --filter web build:cf
        env:
          NEXT_PUBLIC_API_URL: https://api.nobodyclimb.cc/api/v1
          NEXT_PUBLIC_ENABLE_ANALYTICS: 'true'
          NEXT_PUBLIC_GA_ID: ${{ secrets.GA_ID }}
          NEXT_PUBLIC_CLARITY_ID: ${{ secrets.CLARITY_ID }}
          NEXT_PUBLIC_POSTHOG_KEY: ${{ secrets.POSTHOG_KEY }}
          NEXT_PUBLIC_POSTHOG_HOST: ${{ secrets.POSTHOG_HOST }}

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: web
          command: deploy --env production

      - name: Purge Cloudflare Cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
```

---

### 3. Backend 部署 (deploy-backend.yml)

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        type: choice
        options: [preview, production]
        default: production

jobs:
  deploy:
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

      - run: pnpm install --frozen-lockfile

      - name: Determine environment
        id: env
        run: |
          if [ "${{ github.event.inputs.environment }}" != "" ]; then
            echo "env=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "env=production" >> $GITHUB_OUTPUT
          else
            echo "env=preview" >> $GITHUB_OUTPUT
          fi

      - name: Run D1 migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: backend
          command: d1 migrations apply nobodyclimb-db --remote --env ${{ steps.env.outputs.env }}

      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: backend
          command: deploy --env ${{ steps.env.outputs.env }}

      - name: Upload secrets
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: backend
          command: secret put JWT_SECRET --env ${{ steps.env.outputs.env }}
          secrets: |
            JWT_SECRET=${{ secrets.JWT_SECRET }}
```

---

### 4. App 建置與部署 (deploy-app.yml)

```yaml
# .github/workflows/deploy-app.yml
name: Deploy App

on:
  push:
    branches: [main]
    paths:
      - 'app/**'
      - 'packages/**'
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
      submit:
        description: 'Submit to stores after build'
        type: boolean
        default: false

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

      - run: pnpm install --frozen-lockfile

      - name: Build iOS
        if: github.event.inputs.platform != 'android'
        working-directory: app
        run: |
          eas build \
            --platform ios \
            --profile ${{ github.event.inputs.profile || 'production' }} \
            --non-interactive

      - name: Build Android
        if: github.event.inputs.platform != 'ios'
        working-directory: app
        run: |
          eas build \
            --platform android \
            --profile ${{ github.event.inputs.profile || 'production' }} \
            --non-interactive

  submit:
    needs: build
    if: github.event.inputs.submit == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Submit to App Store
        if: github.event.inputs.platform != 'android'
        working-directory: app
        run: eas submit --platform ios --latest --non-interactive

      - name: Submit to Google Play
        if: github.event.inputs.platform != 'ios'
        working-directory: app
        run: eas submit --platform android --latest --non-interactive
```

---

### 5. App OTA 更新 (app-ota-update.yml)

```yaml
# .github/workflows/app-ota-update.yml
name: App OTA Update

on:
  push:
    branches: [develop]
    paths:
      - 'app/src/**'
      - 'packages/**'
  workflow_dispatch:
    inputs:
      branch:
        description: 'Update channel'
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

      - run: pnpm install --frozen-lockfile

      - name: Publish OTA Update
        working-directory: app
        run: |
          eas update \
            --branch ${{ github.event.inputs.branch || 'preview' }} \
            --message "${{ github.event.inputs.message || github.event.head_commit.message }}" \
            --non-interactive
```

---

### 6. PR 預覽 (preview.yml)

```yaml
# .github/workflows/preview.yml
name: Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  # Web Preview
  preview-web:
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

      - run: pnpm install --frozen-lockfile

      - run: pnpm --filter web build:cf
        env:
          NEXT_PUBLIC_API_URL: https://api-preview.nobodyclimb.cc/api/v1

      - name: Deploy Preview
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: web
          command: deploy --env preview

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 **Web Preview deployed!**\n\nURL: https://preview.nobodyclimb.cc'
            })

  # App Preview (EAS Update)
  preview-app:
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

      - run: pnpm install --frozen-lockfile

      - name: Create EAS Update
        working-directory: app
        run: |
          eas update \
            --branch pr-${{ github.event.number }} \
            --message "${{ github.event.pull_request.title }}" \
            --non-interactive

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '📱 **App Preview ready!**\n\nOpen Expo Go and scan QR code for branch `pr-${{ github.event.number }}`'
            })
```

---

### 7. Keep-Alive (keep-alive.yml)

```yaml
# .github/workflows/keep-alive.yml
name: Keep Alive

on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Web
        run: curl -f https://nobodyclimb.cc/api/health || exit 0

      - name: Ping API
        run: curl -f https://api.nobodyclimb.cc/health || exit 0
```

---

## Turborepo 設定

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", ".open-next/**"]
    },
    "build:cf": {
      "dependsOn": ["^build"],
      "outputs": [".open-next/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## GitHub Secrets 清單

| Secret 名稱 | 用途 | 必要性 |
|-------------|------|--------|
| **Cloudflare** | | |
| `CLOUDFLARE_API_TOKEN` | Cloudflare 部署權限 | 必要 |
| `CLOUDFLARE_ZONE_ID` | 快取清除用 | Web 必要 |
| **Backend** | | |
| `JWT_SECRET` | API 認證 | 必要 |
| `GOOGLE_CLIENT_ID` | Google OAuth | 選填 |
| `CWA_API_KEY` | 天氣 API | 選填 |
| **App (EAS)** | | |
| `EXPO_TOKEN` | EAS 認證 | App 必要 |
| **Analytics** | | |
| `GA_ID` | Google Analytics | 選填 |
| `CLARITY_ID` | Microsoft Clarity | 選填 |
| `POSTHOG_KEY` | PostHog | 選填 |
| `POSTHOG_HOST` | PostHog Host | 選填 |
| **Error Tracking** | | |
| `SENTRY_DSN` | Sentry | 選填 |
| `SENTRY_AUTH_TOKEN` | Sentry 認證 | 選填 |

---

## 部署環境對應

| 分支 | Web | Backend | App |
|------|-----|---------|-----|
| `main` | nobodyclimb.cc | api.nobodyclimb.cc | Production (App Store) |
| `develop` | preview.nobodyclimb.cc | api-preview.nobodyclimb.cc | Preview (Internal) |
| PR | preview.nobodyclimb.cc | - | EAS Update (pr-{number}) |

---

## 手動部署指令

```bash
# Web
cd web
pnpm build:cf
wrangler deploy --env production

# Backend
cd backend
wrangler d1 migrations apply nobodyclimb-db --remote --env production
pnpm deploy:production

# App - Full Build
cd app
eas build --profile production --platform all
eas submit --platform all --latest

# App - OTA Update (無需審核)
cd app
eas update --branch production --message "v1.0.1 修復問題"
```

---

## 故障排除

### D1 Migration 失敗

```bash
# 手動執行 migration
cd backend
wrangler d1 migrations apply nobodyclimb-db --remote --env production
```

### EAS Build 失敗

```bash
# 查看 build 狀態
eas build:list

# 查看 build 日誌
eas build:view <build-id>
```

### Secrets 未設定

檢查 GitHub Repository Settings → Secrets and variables → Actions

### 快取問題

```bash
# 清除 Turborepo 快取
rm -rf .turbo

# 清除 Cloudflare 快取
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```
