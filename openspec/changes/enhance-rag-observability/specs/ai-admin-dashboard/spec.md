## ADDED Requirements

### Requirement: Admin AI 導覽新增趨勢分析入口

系統 SHALL 在 Admin AI 頁面的分頁導覽列中新增「趨勢分析」tab，連結至 `/admin/ai/metrics`。

#### Scenario: 導覽列顯示趨勢分析 tab

- **WHEN** 管理員造訪任何 `/admin/ai/*` 頁面
- **THEN** 導覽列 SHALL 顯示「趨勢分析」tab，位於「費用估算」之後、「設定」之前

#### Scenario: 趨勢分析 tab active 狀態

- **WHEN** 管理員造訪 `/admin/ai/metrics`
- **THEN** 「趨勢分析」tab SHALL 顯示 active 狀態（底線高亮）

### Requirement: Metrics API 路由註冊

系統 SHALL 在 `admin-ai.ts` 路由檔案中註冊 `GET /metrics` 端點，路由至 Metrics 聚合邏輯。

#### Scenario: 路由正確掛載

- **WHEN** 後端啟動
- **THEN** `GET /api/v1/admin/ai/metrics` SHALL 可存取，回傳 200 狀態碼與 JSON 回應

#### Scenario: 路由受 Admin 中間件保護

- **WHEN** 非 Admin 使用者呼叫 `GET /api/v1/admin/ai/metrics`
- **THEN** 系統 SHALL 回傳 401 或 403 錯誤
