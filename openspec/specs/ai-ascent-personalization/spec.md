## ADDED Requirements

### Requirement: 完攀紀錄注入 RAG Context
系統 SHALL 在執行 RAG 查詢前，從 `route_ascents` 取出當前用戶最近 10 條完攀紀錄（含路線名稱與 YDS 難度），組成文字描述注入 LLM context。僅對已登入用戶執行；若用戶無完攀紀錄，則跳過此步驟。

#### Scenario: 有完攀紀錄的用戶查詢
- **WHEN** 已登入用戶發送 AI 查詢，且有至少 1 條完攀紀錄
- **THEN** LLM context 包含「此用戶已完攀路線：XX（5.10a）、YY（5.11b）...」

#### Scenario: 無完攀紀錄的用戶查詢
- **WHEN** 已登入用戶發送 AI 查詢，但 `route_ascents` 中無紀錄
- **THEN** 不加入完攀 context，正常執行 RAG 流程

#### Scenario: 匿名用戶查詢
- **WHEN** 未登入用戶發送 AI 查詢
- **THEN** 不加入完攀 context，正常執行 RAG 流程

#### Scenario: 完攀紀錄最多取 10 條
- **WHEN** 用戶有 25 條完攀紀錄
- **THEN** 僅取最近 10 條（依 `ascended_at` 倒序），以控制 token 消耗

### Requirement: 個人化難度推薦
系統 SHALL 根據用戶完攀紀錄推算其目前能力區間，在生成推薦路線時優先推薦「比目前能力略難一級」的路線。能力推算邏輯：取最近 10 條完攀紀錄中 grade_numeric 的 75 百分位數作為目前能力基準。

#### Scenario: 推算能力並調整推薦
- **WHEN** 用戶有完攀紀錄，LLM context 包含能力推算結果「約 5.11a，建議挑戰 5.11b-5.12a」
- **THEN** LLM 回應的推薦路線以 5.11b-5.12a 為主

#### Scenario: 能力不足以推算時跳過
- **WHEN** 用戶完攀紀錄少於 3 條
- **THEN** 不進行能力推算，正常提供推薦（無個人化調整）
