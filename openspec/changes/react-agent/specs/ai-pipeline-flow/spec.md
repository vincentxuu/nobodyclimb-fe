## MODIFIED Requirements

### Requirement: RAG strategy 路由
系統 SHALL 根據 pipelineConfig.rag_strategy 設定路由到對應的 AI engine，新增 `react` 選項。

#### Scenario: Strategy 為 react
- **WHEN** pipelineConfig.rag_strategy = 'react'
- **THEN** 系統將 query 路由到 react-agent engine（runReactAgent）

#### Scenario: Strategy 為 baseline
- **WHEN** pipelineConfig.rag_strategy = 'baseline'
- **THEN** 系統將 query 路由到現有 pipeline engine（不受影響）

#### Scenario: Strategy 為 agentic
- **WHEN** pipelineConfig.rag_strategy = 'agentic'
- **THEN** 系統將 query 路由到現有 ai-graph agentic engine（不受影響）

#### Scenario: Strategy 為 plan-execute
- **WHEN** pipelineConfig.rag_strategy = 'plan-execute'
- **THEN** 系統將 query 路由到現有 ai-graph plan-execute engine（不受影響）
