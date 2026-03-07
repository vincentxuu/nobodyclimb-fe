export interface PromptVariableInfo {
  label: string
  variables: string[]
}

export const PROMPT_VARIABLE_MAP: Record<string, PromptVariableInfo> = {
  system_prompt: {
    label: '系統提示詞',
    variables: [],
  },
  tool_selection_prompt: {
    label: 'Tool Calling 查詢解析',
    variables: ['query', 'crags', 'areas', 'regions'],
  },
  general_knowledge_system_prompt: {
    label: '通識知識提示詞',
    variables: [],
  },
  hyde_prompt: {
    label: 'HyDE 假設文件生成',
    variables: ['query'],
  },
  judge_prompt: {
    label: 'Judge 品質評估',
    variables: ['context', 'query', 'response'],
  },
  self_reflection_prompt: {
    label: 'Self-Reflection 自我反思',
    variables: ['query', 'answer'],
  },
  contextual_chunk_prompt: {
    label: 'Contextual RAG 語意摘要',
    variables: ['type', 'content'],
  },
  multi_query_expansion_prompt: {
    label: 'Multi-Query 查詢擴展',
    variables: ['query', 'count'],
  },
  agentic_decision_prompt: {
    label: 'Agentic 決策',
    variables: ['query', 'count', 'evidence_summary', 'min_docs', 'remaining_steps'],
  },
  query_template: {
    label: '查詢模板',
    variables: ['context', 'query'],
  },
}

export const PROMPT_NAMES = Object.keys(PROMPT_VARIABLE_MAP) as (keyof typeof PROMPT_VARIABLE_MAP)[]
