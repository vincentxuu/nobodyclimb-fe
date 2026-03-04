## MODIFIED Requirements

### Requirement: 建議按鈕（輪播）
系統 SHALL 在對話為空時顯示快速建議按鈕，每次開啟從題庫隨機取樣，而非固定 3 題。

#### Scenario: 空白狀態顯示隨機建議
- **WHEN** 對話視窗開啟且沒有訊息
- **THEN** 從至少 12 題的題庫中隨機取 3 題顯示，每次開啟可能不同

#### Scenario: 點擊建議
- **WHEN** 使用者點擊建議問題
- **THEN** 直接送出該查詢（等同填入後立即提交）

## ADDED Requirements

### Requirement: 標題列操作按鈕
系統 SHALL 在標題列提供「歷史」與「清除」快捷按鈕（已登入用戶）。

#### Scenario: 已登入用戶顯示操作按鈕
- **WHEN** 已登入用戶開啟 ChatWidget
- **THEN** 標題列右側顯示「歷史」圖示按鈕與「清除」圖示按鈕

#### Scenario: 未登入用戶不顯示歷史按鈕
- **WHEN** 未登入用戶開啟 ChatWidget
- **THEN** 標題列不顯示「歷史」與「清除」按鈕
