# 訪問日誌問題排查指南

## 問題現象
管理後台的訪問日誌頁面 (`/admin/logs`) 沒有顯示任何資料。

## 架構說明

訪問日誌功能使用 **Cloudflare Analytics Engine**：

1. **寫入層** (`backend/src/middleware/accessLog.ts`)
   - 使用 Analytics Engine Binding (`ACCESS_LOGS`) 寫入日誌
   - 每個 API 請求都會自動記錄

2. **讀取層** (`backend/src/routes/access-logs.ts`)
   - 使用 Analytics Engine SQL API 讀取日誌
   - 需要 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN` 環境變數

## 診斷步驟

### 1. 檢查 Analytics Engine Binding

```bash
cd backend

# 檢查 wrangler.toml 配置
cat wrangler.toml | grep -A 3 "analytics_engine_datasets"
```

應該看到：
```toml
[[env.production.analytics_engine_datasets]]
binding = "ACCESS_LOGS"
dataset = "nobodyclimb_access_logs"
```

### 2. 檢查環境變數設定

```bash
# 檢查 production 環境的 secrets
wrangler secret list --env production
```

應該要有：
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `JWT_SECRET`
- 其他 secrets

### 3. 測試寫入功能

如果環境變數未設定，請先設定：

```bash
# 設定 Account ID（從 Cloudflare 儀表板取得）
wrangler secret put CLOUDFLARE_ACCOUNT_ID --env production
# 輸入你的 Account ID：1ff43f0d4c3ad3bd98ce5ab767546a68

# 設定 API Token（需要有 Analytics 權限）
wrangler secret put CLOUDFLARE_API_TOKEN --env production
# 輸入你的 API Token
```

### 4. 建立 API Token

如果還沒有 API Token：

1. 前往 Cloudflare Dashboard: https://dash.cloudflare.com/
2. 點選右上角個人資料 → **My Profile**
3. 左側選單 → **API Tokens**
4. 點選 **Create Token**
5. 選擇 **Custom token**
6. 設定權限：
   - **Account** → **Analytics** → **Read**
   - **Account** → **Workers Scripts** → **Edit**（可選，用於部署）
7. **Account Resources** → 選擇你的帳戶
8. 建立並複製 Token

### 5. 驗證 Analytics Engine Dataset

使用診斷腳本測試：

```bash
# 部署診斷腳本（暫時）
# 在 wrangler.toml 中暫時修改 main = "scripts/diagnose-analytics.ts"

# 或直接使用 wrangler dev
cd backend
wrangler dev --env production

# 訪問診斷端點
curl http://localhost:8787/
curl http://localhost:8787/test-write
# 等待 1-2 分鐘
curl http://localhost:8787/test-read
```

### 6. 檢查 Cloudflare 儀表板

1. 前往 Cloudflare Dashboard
2. 選擇你的帳戶
3. 左側選單 → **Analytics & Logs** → **Workers Analytics Engine**
4. 檢查是否有 `nobodyclimb_access_logs` dataset
5. 檢查是否有最近的資料點

## 常見問題

### Q1: 顯示「Analytics Engine 尚未設定」

**原因**：`CLOUDFLARE_ACCOUNT_ID` 或 `CLOUDFLARE_API_TOKEN` 未設定

**解決方案**：
```bash
# 設定環境變數
wrangler secret put CLOUDFLARE_ACCOUNT_ID --env production
wrangler secret put CLOUDFLARE_API_TOKEN --env production

# 重新部署
pnpm deploy:production
```

### Q2: 錯誤「Authorization failed」

**原因**：API Token 權限不足或已過期

**解決方案**：
1. 檢查 Token 是否有 **Analytics Read** 權限
2. 檢查 Token 是否已過期
3. 重新建立 Token 並更新

### Q3: 資料延遲

**原因**：Analytics Engine 有 1-2 分鐘的資料延遲

**解決方案**：
- 等待幾分鐘後重新整理
- 這是正常的行為

### Q4: Dataset 不存在

**原因**：Analytics Engine dataset 尚未建立

**解決方案**：
1. 寫入資料會自動建立 dataset
2. 確保 `accessLogMiddleware` 有在執行
3. 檢查 console 是否有錯誤訊息

### Q5: 寫入失敗但沒有錯誤訊息

**原因**：寫入錯誤被 try-catch 捕獲但只輸出到 console

**解決方案**：
```bash
# 查看 Worker 日誌
wrangler tail --env production

# 發送幾個測試請求
curl https://api.nobodyclimb.cc/api/v1/health

# 檢查日誌輸出
```

## 驗證修復

修復後，驗證功能是否正常：

1. **發送測試請求**：
   ```bash
   # 發送幾個 API 請求
   for i in {1..5}; do
     curl https://api.nobodyclimb.cc/api/v1/health
     sleep 1
   done
   ```

2. **等待 1-2 分鐘**（資料延遲）

3. **檢查管理後台**：
   - 前往 https://nobodyclimb.cc/admin/logs
   - 檢查「統計總覽」是否顯示資料
   - 檢查「請求日誌」是否有記錄

4. **使用 wrangler tail 即時監控**：
   ```bash
   wrangler tail --env production
   ```

## 手動測試 SQL API

如果需要手動測試 Analytics Engine SQL API：

```bash
# 替換為你的 Account ID 和 API Token
ACCOUNT_ID="1ff43f0d4c3ad3bd98ce5ab767546a68"
API_TOKEN="your-api-token"

# 查詢最近 24 小時的請求數
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: text/plain" \
  -d "SELECT COUNT(*) as count FROM nobodyclimb_access_logs WHERE timestamp >= NOW() - INTERVAL '24' HOUR"
```

## 相關檔案

- **寫入 Middleware**：`backend/src/middleware/accessLog.ts`
- **讀取 API**：`backend/src/routes/access-logs.ts`
- **類型定義**：`backend/src/types.ts`
- **前端元件**：`src/components/admin/AdminAccessLogs.tsx`
- **配置檔**：`backend/wrangler.toml`

## Analytics Engine 文件

- [Analytics Engine 官方文件](https://developers.cloudflare.com/analytics/analytics-engine/)
- [SQL API 文件](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/)
- [Workers Bindings](https://developers.cloudflare.com/workers/configuration/bindings/)
