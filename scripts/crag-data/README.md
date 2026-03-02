# 岩場資料管理腳本

## 目錄結構

```
scripts/crag-data/
├── README.md                 # 本文件
├── package.json              # 依賴管理
├── tsconfig.json             # TypeScript 配置
├── sheets-template.md        # Google Sheets 欄位設定
├── src/
│   ├── config.ts             # 配置檔
│   ├── types.ts              # 類型定義
│   ├── validate-data.ts      # 資料驗證
│   ├── sync-from-sheets.ts   # Sheets → D1 同步
│   ├── migrate-json-to-db.ts # JSON → D1 遷移
│   └── utils/
│       ├── sheets.ts         # Google Sheets API 工具
│       └── d1.ts             # D1 資料庫工具
└── .env.example              # 環境變數範例
```

## 安裝

```bash
cd scripts/crag-data
pnpm install
```

## 環境變數

複製 `.env.example` 為 `.env` 並填入：

```bash
# Google Sheets
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
SPREADSHEET_ID=your-spreadsheet-id

# Cloudflare D1
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
D1_DATABASE_ID=your-database-id
```

## 指令

### 驗證 Sheets 資料

```bash
pnpm validate
```

### 從 JSON 遷移到 D1（一次性）

```bash
# Dry run（預覽）
pnpm migrate:json --dry-run

# 實際執行
pnpm migrate:json
```

### 從 Sheets 同步到 D1

```bash
# Dry run（預覽）
pnpm sync --dry-run

# 實際執行
pnpm sync

# 只同步岩場
pnpm sync --crags-only

# 只同步路線
pnpm sync --routes-only
```

## Google Sheets 設定

詳見 `sheets-template.md`

### 建立步驟

1. 建立新的 Google Spreadsheet
2. 建立 4 個工作表：`Crags`、`Areas`、`Routes`、`AuditLog`
3. 按照 `sheets-template.md` 設定欄位
4. 建立 Service Account 並分享試算表權限

### Service Account 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立專案或選擇現有專案
3. 啟用 Google Sheets API
4. 建立 Service Account
5. 下載 JSON 金鑰
6. 將試算表分享給 Service Account email
