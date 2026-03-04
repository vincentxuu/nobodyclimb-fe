## ADDED Requirements

### Requirement: 管理員查詢用戶等級詳情

系統 SHALL 提供管理員端點 `GET /api/v1/admin/ai/users/:userId/rank`，回傳用戶的等級狀態與各模組積分明細。

#### Scenario: 查詢特定用戶的等級

- **WHEN** 管理員 GET `/api/v1/admin/ai/users/abc123/rank`
- **THEN** 回傳 `{ "user_id": "abc123", "tier": "壁", "score": 38, "daily_used": 2, "daily_limit": 6, "rank_override": null, "score_breakdown": { "biography_fields": 9, "biography_public": 5, "core_stories": 16, "one_liners": 8, "stories": 0, "route_ascents": 0, "bucket_list": 0, "bucket_list_completed": 0 }, "last_score_calculated_at": "..." } }`

#### Scenario: 查詢不存在的用戶

- **WHEN** 管理員查詢不存在的 userId
- **THEN** 回傳 404

#### Scenario: 非管理員被拒絕

- **WHEN** 一般用戶呼叫管理員端點
- **THEN** 回傳 403

### Requirement: 管理員手動覆寫用戶等級

系統 SHALL 提供管理員端點 `PUT /api/v1/admin/ai/users/:userId/rank-override`，允許管理員手動指定用戶等級，覆寫自動計算結果。

#### Scenario: 設定用戶為巔等級

- **WHEN** 管理員 PUT `{ "rank": "summit" }` 到 `/api/v1/admin/ai/users/abc123/rank-override`
- **THEN** `user_ranks.rank_override_id` 更新為「巔」，`daily_ai_limit` 立即更新為 24，後續 Cron 不覆蓋此設定

#### Scenario: 清除覆寫，恢復自動計算

- **WHEN** 管理員 PUT `{ "rank": null }` 到 rank-override 端點
- **THEN** `rank_override_id` 清除為 null，下次 Cron 執行時恢復按積分自動計算等級

#### Scenario: 覆寫為無效等級

- **WHEN** 管理員 PUT `{ "rank": "diamond" }`（不存在的等級）
- **THEN** 回傳 400，錯誤訊息說明有效等級為 foothill / wall / ridge / summit

### Requirement: 管理員觸發積分重算

系統 SHALL 提供管理員端點 `POST /api/v1/admin/ai/recalculate-ranks`，允許管理員手動觸發積分重算，無需等待 Cron。

#### Scenario: 重算單一用戶

- **WHEN** 管理員 POST `{ "user_id": "abc123" }` 到重算端點
- **THEN** 立即重算該用戶積分與等級，回傳更新後的 rank 詳情

#### Scenario: 重算所有用戶

- **WHEN** 管理員 POST `{ "user_id": "all" }` 到重算端點
- **THEN** 觸發非同步批次重算所有用戶，回傳 `{ "success": true, "message": "已排程重算所有用戶等級" }`
