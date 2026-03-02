# Google Sheets 欄位設定

## Sheet 1: Crags（岩場）

| 欄位 | 欄位代號 | 資料類型 | 必填 | 說明 | 範例 |
|------|----------|----------|------|------|------|
| 狀態 | A | 下拉選單 | Y | draft/pending/approved/rejected | approved |
| ID | B | 文字 | N | 自動產生（審核後填入） | longdong |
| 名稱 | C | 文字 | Y | 岩場名稱（中文） | 龍洞 |
| 英文名稱 | D | 文字 | N | 岩場名稱（英文） | Longdong |
| URL Slug | E | 文字 | Y | 網址路徑（小寫英數+連字號） | longdong |
| 區域 | F | 下拉選單 | Y | 北部/中部/南部/東部/離島 | 北部 |
| 詳細地址 | G | 文字 | Y | 地址或位置描述 | 新北市貢寮區龍洞灣 |
| 緯度 | H | 數字 | Y | 21-26 之間 | 25.1085 |
| 經度 | I | 數字 | Y | 119-123 之間 | 121.9215 |
| 海拔 | J | 數字 | N | 公尺 | 100 |
| 岩石類型 | K | 文字 | N | 岩石種類 | 四稜砂岩 |
| 攀登類型 | L | 文字 | Y | 逗號分隔：sport,trad,boulder | sport,trad |
| 難度範圍 | M | 文字 | N | 最低-最高 | 5.3-5.14a |
| 描述 | N | 長文字 | N | 岩場介紹 | 台灣最著名的... |
| 交通方式 | O | 長文字 | N | 如何抵達 | 開車從台北... |
| 停車資訊 | P | 文字 | N | 停車位置 | 龍洞四季灣停車場 |
| 步行時間 | Q | 數字 | N | 分鐘 | 15 |
| 最佳季節 | R | 文字 | N | 逗號分隔：春,夏,秋,冬 | 春,秋,冬 |
| 限制事項 | S | 長文字 | N | 注意事項 | 落石風險、禁止... |
| 封面圖片 | T | URL | N | 圖片網址 | https://... |
| 精選 | U | 核取方塊 | N | 是否為精選岩場 | TRUE |
| 提交者 | V | Email | Y | 提交者信箱 | user@example.com |
| 提交時間 | W | 日期時間 | Y | 自動填入 | 2024-01-15 10:30 |
| 審核者 | X | Email | N | 審核者信箱 | admin@example.com |
| 審核時間 | Y | 日期時間 | N | 審核完成時間 | 2024-01-16 14:00 |
| 審核備註 | Z | 文字 | N | 審核意見 | 資料完整，通過 |

### 資料驗證規則

在 Google Sheets 中設定：

1. **狀態 (A欄)**：資料驗證 → 下拉選單
   - `draft, pending, approved, rejected`

2. **區域 (F欄)**：資料驗證 → 下拉選單
   - `北部, 中部, 南部, 東部, 離島`

3. **緯度 (H欄)**：資料驗證 → 數字介於
   - 21 到 26

4. **經度 (I欄)**：資料驗證 → 數字介於
   - 119 到 123

5. **URL Slug (E欄)**：自訂公式
   - `=REGEXMATCH(E2, "^[a-z0-9-]+$")`

---

## Sheet 2: Areas（區域）

| 欄位 | 欄位代號 | 資料類型 | 必填 | 說明 | 範例 |
|------|----------|----------|------|------|------|
| 狀態 | A | 下拉選單 | Y | draft/pending/approved/rejected | approved |
| ID | B | 文字 | N | 自動產生 | longdong-school-gate |
| 岩場 Slug | C | 文字 | Y | 對應岩場的 slug | longdong |
| 名稱 | D | 文字 | Y | 區域名稱 | 校門口 |
| 英文名稱 | E | 文字 | N | 英文名稱 | School Gate |
| 描述 | F | 長文字 | N | 區域介紹 | 位於龍洞岬... |
| 最低難度 | G | 文字 | N | | 5.6 |
| 最高難度 | H | 文字 | N | | 5.12a |
| Bolt 數量 | I | 數字 | N | 區域總 bolt 數 | 150 |
| 圖片 | J | URL | N | 區域圖片 | https://... |
| 提交者 | K | Email | Y | | user@example.com |
| 提交時間 | L | 日期時間 | Y | | 2024-01-15 |

---

## Sheet 3: Routes（路線）

| 欄位 | 欄位代號 | 資料類型 | 必填 | 說明 | 範例 |
|------|----------|----------|------|------|------|
| 狀態 | A | 下拉選單 | Y | draft/pending/approved/rejected | approved |
| ID | B | 文字 | N | 自動產生 | longdong-route-001 |
| 岩場 Slug | C | 文字 | Y | 對應岩場 | longdong |
| 區域 ID | D | 文字 | N | 對應區域（可選） | longdong-school-gate |
| 扇區 | E | 文字 | N | 扇區名稱 | A 區 |
| 路線名稱 | F | 文字 | Y | | 黃乙翔之死 |
| 難度 | G | 文字 | Y | | 5.10a |
| 難度系統 | H | 下拉選單 | Y | yds/french/v-scale | yds |
| 路線類型 | I | 下拉選單 | Y | sport/trad/boulder/mixed | sport |
| 長度 | J | 數字 | N | 公尺 | 25 |
| Bolt 數量 | K | 數字 | N | | 8 |
| Bolt 類型 | L | 文字 | N | | 不鏽鋼 |
| 固定點類型 | M | 文字 | N | | 雙 bolt 固定點 |
| 路線描述 | N | 長文字 | N | | 起攀後向左... |
| 首攀者 | O | 文字 | N | | 黃乙翔 |
| 首攀日期 | P | 日期 | N | | 1995-05-20 |
| 保護建議 | Q | 文字 | N | | 建議帶 #0.5-#2 |
| 攀爬提示 | R | 長文字 | N | | 關鍵動作在... |
| 提交者 | S | Email | Y | | user@example.com |
| 提交時間 | T | 日期時間 | Y | | 2024-01-15 |

### 資料驗證規則

1. **難度系統 (H欄)**：下拉選單
   - `yds, french, v-scale`

2. **路線類型 (I欄)**：下拉選單
   - `sport, trad, boulder, mixed`

---

## Sheet 4: AuditLog（審核記錄）

| 欄位 | 欄位代號 | 資料類型 | 說明 | 範例 |
|------|----------|----------|------|------|
| 時間戳 | A | 日期時間 | 操作時間 | 2024-01-16 14:00:00 |
| 操作類型 | B | 文字 | create/update/approve/reject/delete | approve |
| 實體類型 | C | 文字 | crag/area/route | crag |
| 實體 ID | D | 文字 | | longdong |
| 實體名稱 | E | 文字 | | 龍洞 |
| 操作者 | F | Email | | admin@example.com |
| 變更內容 | G | JSON | 變更前後對比 | {"name": {"old": "...", "new": "..."}} |
| 備註 | H | 文字 | | 資料完整，審核通過 |

---

## 條件格式設定

### 狀態欄位顏色

在每個 Sheet 的 A 欄設定條件格式：

| 狀態值 | 背景顏色 | 文字顏色 |
|--------|----------|----------|
| draft | 灰色 #E0E0E0 | 黑色 |
| pending | 黃色 #FFF9C4 | 深褐色 |
| approved | 綠色 #C8E6C9 | 深綠色 |
| rejected | 紅色 #FFCDD2 | 深紅色 |

---

## 建議的 Apps Script 自動化

可選擇性加入以下自動化：

```javascript
// 自動填入提交時間
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;

  // 當狀態從空白變為 draft 時，自動填入提交時間
  if (range.getColumn() === 1 && e.value === 'draft') {
    const timestampCol = sheet.getName() === 'Routes' ? 20 : 23; // T or W
    sheet.getRange(range.getRow(), timestampCol).setValue(new Date());
  }
}

// 自動產生 ID
function generateId(sheet, row) {
  const sheetName = sheet.getName();
  if (sheetName === 'Crags') {
    const slug = sheet.getRange(row, 5).getValue(); // E欄 slug
    return slug;
  } else if (sheetName === 'Areas') {
    const cragSlug = sheet.getRange(row, 3).getValue();
    const name = sheet.getRange(row, 4).getValue();
    return `${cragSlug}-${toSlug(name)}`;
  } else if (sheetName === 'Routes') {
    const cragSlug = sheet.getRange(row, 3).getValue();
    const timestamp = Date.now();
    return `${cragSlug}-route-${timestamp}`;
  }
}

function toSlug(str) {
  return str.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}
```
