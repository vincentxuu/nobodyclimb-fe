## ADDED Requirements

### Requirement: Cross-Encoder Reranking 後相關性閾值過濾
系統 SHALL 在 Cross-Encoder Reranking 完成後，根據 reranker score 過濾低相關性文件，從源頭減少進入 LLM 生成階段的雜訊 context。

#### Scenario: Reranker score 高於閾值的文件保留
- **WHEN** 候選文件的 reranker score >= `reranker_relevance_threshold`（預設 0.3）
- **THEN** 該文件保留在 `scoredCandidates` 中，進入後續 MMR 和 LLM 生成階段

#### Scenario: Reranker score 低於閾值的文件丟棄
- **WHEN** 候選文件的 reranker score < `reranker_relevance_threshold`
- **THEN** 該文件從 `scoredCandidates` 中移除，不進入後續步驟

#### Scenario: 最低保留數量保護
- **WHEN** 所有候選文件的 reranker score 均低於閾值
- **THEN** 系統保留 reranker score 最高的前 `reranker_min_keep`（預設 2）筆文件，確保 context 不為空

#### Scenario: 過濾結果記錄至 trace
- **WHEN** Cross-Encoder Reranking 後執行閾值過濾
- **THEN** `pipelineTrace.retrieval.reranker` 記錄 `filtered_count`（被過濾的文件數）和 `threshold_used`（使用的閾值）

### Requirement: 相關性閾值可配置
系統 SHALL 透過 `ai_config` 表提供 `reranker_relevance_threshold` 和 `reranker_min_keep` 兩個可配置參數，管理員可即時調整。

#### Scenario: 管理員調整閾值
- **WHEN** 管理員將 `reranker_relevance_threshold` 從 0.3 調整為 0.5
- **THEN** 後續查詢立即使用新閾值 0.5 過濾低分文件，無需重新部署

#### Scenario: 管理員調整最低保留數
- **WHEN** 管理員將 `reranker_min_keep` 從 2 調整為 3
- **THEN** 後續查詢在全部低於閾值時保留前 3 筆文件
