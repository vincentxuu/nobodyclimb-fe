# NobodyClimb - Cloudflare Workers 完整部署指南

本專案採用 **pnpm workspaces + Turborepo** monorepo 架構，前後端均部署於 Cloudflare Workers。

## 📋 目錄

- [系統架構](#系統架構)
- [前置需求](#前置需求)
- [部署環境說明](#部署環境說明)
- [手動部署步驟](#手動部署步驟)
  - [後端 API 部署](#後端-api-部署)
  - [前端部署](#前端部署)
- [自動化 CI/CD 部署](#自動化-cicd-部署)
- [環境變數設定](#環境變數設定)
- [資料庫管理](#資料庫管理)
- [常見問題](#常見問題)
- [驗證部署](#驗證部署)

---

## 系統架構

```
nobodyclimb/
├── apps/web/          # Next.js 15 前端 → Cloudflare Workers
├── backend/           # Hono API 後端 → Cloudflare Workers + D1 + R2
└── packages/          # 共用套件
```

**技術棧：**
- **前端**: Next.js 15 + React 19 + TailwindCSS + Zustand
- **後端**: Hono + Cloudflare D1 (SQLite) + R2 (儲存) + KV (快取)
- **認證**: JWT (jose 函式庫)
- **API 文檔**: OpenAPI 3.1 + Scalar UI

---

## 前置需求

### 1. 開發環境
- Node.js 18+ (支援 React 19)
- pnpm 8+ 套件管理器
  ```bash
  npm install -g pnpm
  ```

### 2. Cloudflare 帳號設置
- 註冊 [Cloudflare 帳號](https://dash.cloudflare.com/sign-up)
- 取得 Cloudflare Account ID
- 創建 API Token（權限需求見下方）

### 3. GitHub 儲存庫
- 專案已推送到 GitHub
- 設置 Repository Secrets（用於 CI/CD）

---

## 部署環境說明

### 前端環境

| 環境 | 網域 | Worker 名稱 | KV 綁定 |
|------|------|------------|---------|
| **Production** | nobodyclimb.cc<br/>www.nobodyclimb.cc | nobodyclimb-fe-production | VIDEOS, CACHE |
| **Preview** | preview.nobodyclimb.cc | nobodyclimb-fe-preview | VIDEOS, CACHE |

### 後端環境

| 環境 | 網域 | Worker 名稱 | D1 資料庫 | R2 儲存 |
|------|------|------------|-----------|---------|
| **Production** | api.nobodyclimb.cc | nobodyclimb-api-production | nobodyclimb-db | nobodyclimb-storage |
| **Preview** | - | nobodyclimb-api-preview | nobodyclimb-db-preview | nobodyclimb-storage-preview |

---

## 手動部署步驟

### 後端 API 部署

#### 1. 安裝依賴

```bash
# 從專案根目錄
pnpm install
```

#### 2. 登入 Cloudflare

```bash
# 使用 wrangler 登入
npx wrangler login
```

#### 3. 創建 Cloudflare 資源（僅首次）

**創建 D1 資料庫：**

```bash
# Production 資料庫
npx wrangler d1 create nobodyclimb-db

# Preview 資料庫
npx wrangler d1 create nobodyclimb-db-preview
```

記下資料庫 ID，更新 `backend/wrangler.toml` 中的 `database_id`。

**創建 R2 儲存桶：**

```bash
# Production 儲存
npx wrangler r2 bucket create nobodyclimb-storage

# Preview 儲存
npx wrangler r2 bucket create nobodyclimb-storage-preview
```

**創建 KV 命名空間：**

```bash
# Production KV
npx wrangler kv:namespace create CACHE

# Preview KV
npx wrangler kv:namespace create CACHE --preview
```

記下 KV ID，更新 `backend/wrangler.toml` 中的 `id`。

**創建 Analytics Engine Dataset：**

```bash
# Production
npx wrangler d1 create-analytics-engine-dataset nobodyclimb_access_logs

# Preview
npx wrangler d1 create-analytics-engine-dataset nobodyclimb_access_logs_preview
```

#### 4. 設定 Secrets（僅首次）

```bash
cd backend

# 設定 JWT Secret（必需）
echo "your-super-secret-jwt-key-here" | npx wrangler secret put JWT_SECRET --env production
echo "your-super-secret-jwt-key-here" | npx wrangler secret put JWT_SECRET --env preview

# 設定 Google OAuth Client ID（選用）
echo "your-google-client-id.apps.googleusercontent.com" | npx wrangler secret put GOOGLE_CLIENT_ID --env production

# 設定氣象 API Key（選用）
echo "your-cwa-api-key" | npx wrangler secret put CWA_API_KEY --env production
```

#### 5. 執行資料庫遷移

```bash
cd backend

# 本地測試遷移
pnpm db:migrate

# 部署到遠端 D1（Production）
npx wrangler d1 migrations apply nobodyclimb-db --remote --config wrangler.toml --env production

# 部署到遠端 D1（Preview）
npx wrangler d1 migrations apply nobodyclimb-db-preview --remote --config wrangler.toml --env preview
```

#### 6. 部署後端 Worker

```bash
cd backend

# 部署到 Production
pnpm deploy:production

# 或部署到 Preview
pnpm deploy:preview
```

#### 7. 驗證後端部署

```bash
# 查看即時日誌（Production）
npx wrangler tail --env production

# 測試 API
curl https://api.nobodyclimb.cc/api/v1/health
```

**檢查 API 文檔：**
- OpenAPI JSON: https://api.nobodyclimb.cc/api/v1/openapi.json
- Scalar 互動式文檔: https://api.nobodyclimb.cc/api/v1/docs

---

### 前端部署

#### 1. 安裝依賴

```bash
# 從專案根目錄
pnpm install
```

#### 2. 創建 KV 命名空間（僅首次）

```bash
# 創建 VIDEOS KV（用於影片資料）
npx wrangler kv:namespace create VIDEOS

# 創建 CACHE KV
npx wrangler kv:namespace create CACHE
```

記下 KV ID，更新 `apps/web/wrangler.json` 中的 `id`。

#### 3. 建構專案

```bash
# 從專案根目錄建構 Cloudflare 版本
pnpm build:cf

# 或從 apps/web 目錄
cd apps/web
pnpm build:cf
```

#### 4. 部署前端 Worker

```bash
cd apps/web

# 部署到 Production
npx wrangler deploy --env production

# 或部署到 Preview
npx wrangler deploy --env preview
```

#### 5. 驗證前端部署

```bash
# 查看即時日誌
cd apps/web
npx wrangler tail --env production

# 訪問網站
open https://nobodyclimb.cc
```

#### 6. 清除 Cloudflare 快取（選用）

```bash
# 需要 CLOUDFLARE_ZONE_ID 和 CLOUDFLARE_API_TOKEN
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

## 自動化 CI/CD 部署

本專案已配置 GitHub Actions，可自動化部署流程。

### 1. 設置 GitHub Secrets

在 GitHub 儲存庫中設置以下 Secrets：

**Settings → Secrets and variables → Actions → New repository secret**

#### 必需的 Secrets

| Secret 名稱 | 說明 | 取得方式 |
|------------|------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | Dashboard → My Profile → API Tokens → Create Token |
| `JWT_SECRET` | JWT 簽名金鑰 | 自行生成強密碼 |

#### 選用的 Secrets

| Secret 名稱 | 說明 |
|------------|------|
| `CLOUDFLARE_ZONE_ID` | Cloudflare Zone ID（用於清除快取） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `CWA_API_KEY` | 中央氣象署 API Key |
| `GA_ID` | Google Analytics ID |
| `CLARITY_ID` | Microsoft Clarity ID |
| `POSTHOG_KEY` | PostHog API Key |
| `POSTHOG_HOST` | PostHog Host URL |
| `SENTRY_DSN` | Sentry DSN |
| `SENTRY_ORG` | Sentry Organization |
| `SENTRY_PROJECT` | Sentry Project |
| `SENTRY_AUTH_TOKEN` | Sentry Auth Token |

### 2. 創建 Cloudflare API Token

**權限需求：**
1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. My Profile → API Tokens → Create Token
3. 使用 "Edit Cloudflare Workers" 模板或自訂權限：
   - **Account - Cloudflare Workers Scripts**: Edit
   - **Account - D1**: Edit
   - **Account - Workers KV Storage**: Edit
   - **Account - Workers R2 Storage**: Edit
   - **Zone - Workers Routes**: Edit
4. 複製生成的 Token

### 3. 自動部署觸發條件

#### 後端部署 (.github/workflows/deploy-api.yml)

**自動觸發：**
- 推送到 `main` 分支 → 部署到 **production**
- 推送到 `develop` 分支 → 部署到 **preview**
- 修改 `backend/`, `packages/`, `pnpm-lock.yaml`, `.github/workflows/deploy-api.yml`

**流程：**
1. Lint & Type Check
2. 建構專案和套件
3. 部署到 Cloudflare Workers
4. 上傳 Secrets
5. 執行 D1 資料庫遷移

#### 前端部署 (.github/workflows/deploy.yml)

**自動觸發：**
- 推送到 `main` 分支 → 部署到 **production**
- 推送到 `develop` 分支 → 部署到 **preview**
- 修改 `apps/web/`, `packages/`, `pnpm-lock.yaml`, `.github/workflows/deploy.yml`

**流程：**
1. 建構專案（根據環境設定環境變數）
2. 部署到 Cloudflare Workers
3. 清除 Cloudflare 快取（僅 production）

### 4. 手動觸發部署

1. 進入 GitHub 儲存庫
2. 點擊 **Actions** 標籤
3. 選擇對應的 workflow：
   - "Deploy API to Cloudflare Workers" (後端)
   - "Deploy Web to Cloudflare Workers" (前端)
4. 點擊 **Run workflow**
5. 選擇環境（preview 或 production）
6. 點擊 **Run workflow** 確認

---

## 環境變數設定

### 後端環境變數

**在 `backend/wrangler.toml` 中設定：**

```toml
[env.production.vars]
CORS_ORIGIN = "https://nobodyclimb.cc"
JWT_ISSUER = "nobodyclimb-api"
R2_PUBLIC_URL = "https://storage.nobodyclimb.cc"
```

**使用 wrangler secret 設定敏感資訊：**

```bash
cd backend

# JWT Secret（必需）
echo "your-secret-key" | npx wrangler secret put JWT_SECRET --env production

# Google OAuth Client ID
echo "your-client-id" | npx wrangler secret put GOOGLE_CLIENT_ID --env production

# 氣象 API Key
echo "your-api-key" | npx wrangler secret put CWA_API_KEY --env production
```

### 前端環境變數

**在 `apps/web/wrangler.json` 中設定：**

```json
{
  "env": {
    "production": {
      "vars": {
        "NEXT_PUBLIC_API_URL": "https://api.nobodyclimb.cc/api/v1",
        "SERVER_API_URL": "https://api.nobodyclimb.cc/api/v1"
      }
    }
  }
}
```

**在 GitHub Actions 中設定：**

編輯 `.github/workflows/deploy.yml`：

```yaml
- name: Build packages and web
  run: pnpm turbo run build:cf --filter=@nobodyclimb/web
  env:
    NEXT_PUBLIC_API_URL: ${{ github.ref == 'refs/heads/main' && 'https://api.nobodyclimb.cc/api/v1' || 'https://api-preview.nobodyclimb.cc/api/v1' }}
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
    NEXT_PUBLIC_GA_ID: ${{ secrets.GA_ID }}
    # ... 其他環境變數
```

---

## 資料庫管理

### D1 資料庫遷移

#### 創建新遷移

```bash
cd backend

# 創建遷移檔案
npx wrangler d1 migrations create nobodyclimb-db "migration_name"
```

遷移檔案會在 `backend/migrations/` 目錄中創建。

#### 執行遷移

```bash
cd backend

# 本地測試
pnpm db:migrate

# 遠端 Production
npx wrangler d1 migrations apply nobodyclimb-db --remote --env production

# 遠端 Preview
npx wrangler d1 migrations apply nobodyclimb-db-preview --remote --env preview
```

### D1 資料庫查詢

```bash
cd backend

# 本地查詢
npx wrangler d1 execute nobodyclimb-db --local --command "SELECT * FROM users LIMIT 10"

# 遠端查詢（Production）
npx wrangler d1 execute nobodyclimb-db --remote --env production --command "SELECT COUNT(*) FROM users"
```

### R2 儲存管理

```bash
# 上傳檔案
npx wrangler r2 object put nobodyclimb-storage/path/to/file.jpg --file ./local/file.jpg

# 列出檔案
npx wrangler r2 object list nobodyclimb-storage

# 下載檔案
npx wrangler r2 object get nobodyclimb-storage/path/to/file.jpg --file ./output.jpg

# 刪除檔案
npx wrangler r2 object delete nobodyclimb-storage/path/to/file.jpg
```

### KV 儲存管理

```bash
# 寫入資料
npx wrangler kv:key put --binding=VIDEOS "videos" --path="./data/videos.json"

# 讀取資料
npx wrangler kv:key get --binding=VIDEOS "videos"

# 列出所有 keys
npx wrangler kv:key list --binding=VIDEOS

# 刪除資料
npx wrangler kv:key delete --binding=VIDEOS "videos"
```

---

## 常見問題

### Q1: 部署後 API 無法訪問？

**檢查清單：**
1. 確認 Worker 已成功部署：`npx wrangler tail --env production`
2. 檢查 `wrangler.toml` 中的 routes 設定
3. 確認網域 DNS 記錄正確指向 Cloudflare
4. 檢查 Cloudflare Dashboard 中的 Worker 狀態

### Q2: D1 資料庫遷移失敗？

**解決方案：**
1. 檢查 `wrangler.toml` 中的 `database_id` 是否正確
2. 確認 Cloudflare API Token 有 D1 編輯權限
3. 使用 `--local` 先在本地測試遷移
4. 查看遷移錯誤訊息，檢查 SQL 語法

### Q3: GitHub Actions 部署失敗？

**常見原因：**
1. **Secrets 未設定**：檢查 `CLOUDFLARE_API_TOKEN`, `JWT_SECRET` 是否存在
2. **API Token 權限不足**：重新創建 Token，確認權限
3. **建構錯誤**：查看 Actions 日誌，檢查程式碼錯誤
4. **依賴問題**：確保 `pnpm-lock.yaml` 已提交

### Q4: 前端無法連接後端 API？

**檢查清單：**
1. 確認後端已部署並正常運行
2. 檢查前端環境變數 `NEXT_PUBLIC_API_URL` 是否正確
3. 檢查 CORS 設定：`backend/wrangler.toml` 中的 `CORS_ORIGIN`
4. 使用瀏覽器開發者工具檢查網路請求

### Q5: 如何回滾到之前的版本？

**方式一：Cloudflare Dashboard**
1. 登入 Cloudflare Dashboard
2. Workers & Pages → 選擇 Worker
3. Deployments 標籤
4. 找到之前的部署版本，點擊 **Rollback**

**方式二：Git**
1. 回到之前的 commit：`git revert <commit-hash>`
2. 推送到 GitHub，觸發自動部署

### Q6: 如何查看 Worker 日誌？

```bash
# 即時日誌（後端）
cd backend
npx wrangler tail --env production

# 即時日誌（前端）
cd apps/web
npx wrangler tail --env production

# 查看歷史日誌（Cloudflare Dashboard）
# Workers & Pages → 選擇 Worker → Logs 標籤
```

---

## 驗證部署

### 後端驗證

```bash
# 健康檢查
curl https://api.nobodyclimb.cc/api/v1/health

# 查看 API 文檔
open https://api.nobodyclimb.cc/api/v1/docs

# 測試認證（應返回 401）
curl https://api.nobodyclimb.cc/api/v1/users/me
```

### 前端驗證

```bash
# 訪問網站
open https://nobodyclimb.cc

# 檢查頁面載入
curl -I https://nobodyclimb.cc

# 驗證 API 連接（在瀏覽器開發者工具 Console）
fetch('https://nobodyclimb.cc/api/crags').then(r => r.json()).then(console.log)
```

### 監控和分析

**Cloudflare Analytics：**
1. 登入 Cloudflare Dashboard
2. Workers & Pages → 選擇 Worker
3. 查看 Metrics 標籤：
   - 請求數量
   - 錯誤率
   - CPU 時間
   - 請求延遲

**應用日誌：**
- 使用 `wrangler tail` 查看即時日誌
- 在 Cloudflare Dashboard 查看歷史日誌

---

## 部署檢查清單

### 後端部署前

- [ ] 已創建 D1 資料庫（production 和 preview）
- [ ] 已創建 R2 儲存桶（production 和 preview）
- [ ] 已創建 KV 命名空間（CACHE）
- [ ] 已設定 JWT_SECRET
- [ ] 已更新 `wrangler.toml` 中的資源 ID
- [ ] 已執行資料庫遷移（本地測試）
- [ ] 已測試本地開發環境（`pnpm dev`）

### 前端部署前

- [ ] 後端 API 已部署並正常運行
- [ ] 已創建 KV 命名空間（VIDEOS, CACHE）
- [ ] 已更新 `wrangler.json` 中的 KV ID
- [ ] 已設定環境變數（`NEXT_PUBLIC_API_URL`）
- [ ] 已測試本地建構（`pnpm build:cf`）
- [ ] 已測試本地開發環境（`pnpm dev`）

### GitHub Actions 設置

- [ ] 已設定 `CLOUDFLARE_API_TOKEN` Secret
- [ ] 已設定 `JWT_SECRET` Secret
- [ ] 已設定其他必要的 Secrets
- [ ] 已測試 GitHub Actions workflow
- [ ] 已設定網域 DNS 記錄

---

## 快速指令參考

### 開發環境

```bash
# 安裝依賴
pnpm install

# 啟動所有開發伺服器
pnpm dev

# 僅前端
pnpm dev:web

# 僅後端
pnpm dev:backend
```

### 建構

```bash
# 建構所有
pnpm build

# 建構前端（Cloudflare）
pnpm build:cf
```

### 部署

```bash
# 後端 Production
cd backend && pnpm deploy:production

# 後端 Preview
cd backend && pnpm deploy:preview

# 前端 Production
cd apps/web && npx wrangler deploy --env production

# 前端 Preview
cd apps/web && npx wrangler deploy --env preview
```

### 資料庫

```bash
# 本地遷移
cd backend && pnpm db:migrate

# 遠端遷移（Production）
cd backend && pnpm db:migrate:remote
```

### 日誌

```bash
# 後端日誌
cd backend && npx wrangler tail --env production

# 前端日誌
cd apps/web && npx wrangler tail --env production
```

---

## 聯絡資訊

- **網站**: https://nobodyclimb.cc
- **API**: https://api.nobodyclimb.cc
- **API 文檔**: https://api.nobodyclimb.cc/api/v1/docs

---

**祝部署順利！🚀**

如果遇到問題，請參考本指南的「常見問題」章節或查看專案的 README.md。
