## ADDED Requirements

### Requirement: Admin 成本 Dashboard
系統 SHALL 在 admin dashboard 新增成本分析頁面，聚合 ai_query_logs 的成本與品質數據。

#### Scenario: 每日成本趨勢
- **WHEN** admin 開啟成本 dashboard
- **THEN** 顯示每日/每週/每月成本趨勢圖（TWD 為主，USD 為輔）
- **THEN** 可按 strategy（baseline / agentic / react）篩選

#### Scenario: Provider 成本分佈
- **WHEN** admin 查看成本明細
- **THEN** 顯示按 provider 分的成本佔比（Workers AI / Anthropic / OpenAI / Google / GitHub）
- **THEN** 顯示按觸點分的成本佔比（orchestrator / hyde / judge / embedding 等）

#### Scenario: 單次查詢平均成本
- **WHEN** admin 比較 strategy 效益
- **THEN** 顯示各 strategy 的平均每次查詢成本（TWD）和平均品質分數
- **THEN** 可看出哪個 strategy 性價比最高

#### Scenario: Cache 與 Fallback 統計
- **WHEN** admin 查看系統健康度
- **THEN** 顯示 semantic cache hit rate、tool result cache hit rate
- **THEN** 顯示 fallback 觸發率（按 provider 分）

### Requirement: 異常告警
系統 SHALL 基於 ai_query_logs 數據定義告警規則，觸發時通知 admin。

#### Scenario: 成本超過閾值
- **WHEN** 單日 react strategy 的 totalCostTWD 加總超過 admin 設定的閾值（預設 NT$500）
- **THEN** 系統發送告警通知

#### Scenario: Provider 錯誤率飆升
- **WHEN** 某 provider 在 1 小時內的錯誤率超過 30%
- **THEN** 系統發送告警，包含 provider 名稱和錯誤率

#### Scenario: 品質分數驟降
- **WHEN** 1 小時內 judge groundedness 平均分數低於 2.0（滿分 4）
- **THEN** 系統發送告警

#### Scenario: Fallback 觸發率過高
- **WHEN** 1 小時內 fallback 觸發率超過 50%
- **THEN** 系統發送告警，提示主要 provider 可能不穩定

#### Scenario: 告警閾值可配置
- **WHEN** admin 調整告警設定
- **THEN** 所有閾值（成本上限、錯誤率、品質分數、fallback 率）可在 dashboard 修改
- **THEN** 閾值存於 DB（ai_config），即時生效

### Requirement: 告警 DB Schema
ai_config table SHALL 新增告警閾值欄位。

#### Scenario: 新增告警欄位
- **WHEN** migration 執行
- **THEN** ai_config table 新增：
  - `react_alert_daily_cost_twd`: REAL（單日成本上限，預設 500.0）
  - `react_alert_error_rate`: REAL（provider 錯誤率閾值，預設 0.3）
  - `react_alert_quality_min`: REAL（品質分數下限，預設 2.0）
  - `react_alert_fallback_rate`: REAL（fallback 觸發率閾值，預設 0.5）
