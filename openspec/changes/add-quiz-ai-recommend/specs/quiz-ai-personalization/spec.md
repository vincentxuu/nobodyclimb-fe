## MODIFIED: user_profile tool 回傳性格類型

### Requirement: user_profile 包含 personality_type

`user_profile` tool 的 SQL 查詢與回傳結構需包含用戶的攀岩性格類型。

#### Scenario: 已完成測驗的登入用戶

- **WHEN** 已登入用戶呼叫 `user_profile` tool，且 `users.personality_type` 不為 NULL
- **THEN** 回傳資料包含 `personalityType` 物件：`{ code: "PGB", nameZh: "碎岩者", description: "力量型 + 目標導向 + 大膽冒險" }`
- **AND** `formatResult` 輸出包含「攀岩性格：碎岩者（PGB）— 力量型 + 目標導向 + 大膽冒險」

#### Scenario: 未完成測驗的登入用戶

- **WHEN** 已登入用戶呼叫 `user_profile` tool，且 `users.personality_type` 為 NULL
- **THEN** 回傳資料中 `personalityType` 為 null
- **AND** `formatResult` 不輸出性格相關行

#### Scenario: 未登入用戶

- **WHEN** 未登入用戶呼叫 `user_profile` tool
- **THEN** 行為不變，回傳 `{ error: '用戶未登入...' }`

### Requirement: 性格描述來自 @nobodyclimb/constants

性格類型的中文名稱與描述從 `@nobodyclimb/constants` 的 `PERSONALITY_TYPES` 查表取得，不在 tool 中硬編碼。

#### Scenario: 代碼對應查表

- **WHEN** `users.personality_type` 為 `"TGB"`
- **THEN** 查 `PERSONALITY_TYPES["TGB"]` 取得 `{ nameZh: "狙擊手", description: ... }`
- **AND** 若代碼不存在於常數表（資料異常），`personalityType` 回傳 null 並靜默處理

---

## MODIFIED: recommend tool 融入性格維度

### Requirement: 推薦結果混合順風格與反風格路線

`recommend` tool 在排序推薦路線時，需考慮用戶性格類型，混合「發揮優勢」與「挑戰弱項」的路線。

#### Scenario: 力量型用戶（P 軸）的推薦

- **WHEN** 用戶性格代碼首字為 `P`（力量型：PGB、PGS、PFB、PFS）
- **AND** 推薦結果包含技巧型路線（slab、face、技術性描述）
- **THEN** 推薦列表中至少保留 2 條反風格（技巧型）路線作為「反風格訓練」建議
- **AND** 反風格路線的難度降低 1~2 個子級（例如用戶最高 5.11a，反風格推薦 5.10c~5.10d）

#### Scenario: 技巧型用戶（T 軸）的推薦

- **WHEN** 用戶性格代碼首字為 `T`（技巧型：TGB、TGS、TFB、TFS）
- **AND** 推薦結果包含力量型路線（overhang、roof、動態動作描述）
- **THEN** 推薦列表中至少保留 2 條反風格（力量型）路線作為「反風格訓練」建議
- **AND** 反風格路線的難度降低 1~2 個子級

#### Scenario: 用戶未完成測驗

- **WHEN** 用戶 `personality_type` 為 NULL
- **THEN** 推薦行為與現行邏輯完全相同，不加入性格維度

#### Scenario: 推薦結果標註風格屬性

- **WHEN** 推薦結果含性格維度
- **THEN** 每條推薦在 metadata 中標註 `styleMatch: "strength" | "anti-style"`
- **AND** `formatResult` 在反風格路線後附加「🔄 反風格訓練」標記

---

## MODIFIED: react-agent system prompt 新增性格推薦指引

### Requirement: system prompt 包含性格感知推薦規則

在 `REACT_AGENT_SYSTEM_PROMPT_TEMPLATE` 中新增性格推薦段落，指導 LLM 如何結合性格類型產生回答。

#### Scenario: user_profile 回傳含性格類型

- **WHEN** LLM 收到的 user_profile 結果包含性格類型資訊
- **THEN** LLM 應在推薦回答中：
  1. 簡短提及用戶的攀岩風格（如「根據你的碎岩者風格」）
  2. 推薦中說明哪些路線適合發揮優勢、哪些適合反風格訓練
  3. 反風格建議以正面語氣呈現（「這條路線可以鍛鍊你的平衡技巧」而非「你的弱點是技巧」）

#### Scenario: user_profile 無性格類型

- **WHEN** LLM 收到的 user_profile 結果不含性格類型
- **THEN** LLM 不主動提及性格測驗，推薦行為不變

#### Scenario: 用戶主動詢問性格相關

- **WHEN** 用戶問「我的攀岩風格是什麼」或「根據我的性格推薦」
- **AND** user_profile 有性格類型
- **THEN** LLM 應先描述用戶風格特點，再據此推薦路線
