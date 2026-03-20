-- Plan-and-Execute 策略配置
INSERT OR IGNORE INTO ai_config (key, value) VALUES
  ('plan_execute_max_steps',    '4'),
  ('plan_execute_min_entities', '2'),
  ('planning_timeout_ms',      '5000'),
  ('synthesis_timeout_ms',     '8000'),
  ('plan_step_timeout_ms',     '6000'),
  ('adaptive_plan_enabled',    '1');

-- Plan-and-Execute Prompt 模板
-- 使用 WHERE NOT EXISTS 確保冪等（ai_prompts.name 無 UNIQUE 約束）
-- prompt name 使用 snake_case 與其他 prompt 一致
INSERT INTO ai_prompts (id, name, version, content, variables, status)
SELECT
  'seed_planning_prompt_v1',
  'planning_prompt',
  1,
  '你是一個查詢分解專家。根據使用者的查詢，將其分解為可獨立檢索的子任務。

可用工具：
- search_routes: 搜尋攀岩路線（名稱、難度、類型等）
- search_crags: 搜尋岩場資訊（位置、描述、設施等）
- sql_query: 執行 SQL 查詢進行統計或精確篩選

已知岩場：{crags}
已知區域：{areas}

範例 1：
查詢：「比較龍洞和北投的 5.10 路線」
計畫：
{"steps":[{"id":1,"query":"龍洞 5.10 路線","tool":"search_routes","filters":{"crag":"龍洞","grade":"5.10"},"depends_on":[]},{"id":2,"query":"北投 5.10 路線","tool":"search_routes","filters":{"crag":"北投","grade":"5.10"},"depends_on":[]}],"execution_mode":"parallel"}

範例 2：
查詢：「龍洞最熱門的路線有哪些？難度分布如何？」
計畫：
{"steps":[{"id":1,"query":"龍洞熱門路線","tool":"search_routes","filters":{"crag":"龍洞"},"depends_on":[]},{"id":2,"query":"龍洞路線難度分布統計","tool":"sql_query","filters":{"crag":"龍洞"},"depends_on":[]}],"execution_mode":"parallel"}

請根據以下查詢生成計畫，輸出純 JSON（不要 markdown code block）：
查詢：{query}

規則：
1. 每個子任務必須有唯一的 id（從 1 開始）
2. depends_on 為空陣列表示可並行執行
3. 最多 {max_steps} 個子任務
4. tool 只能是 search_routes、search_crags、sql_query 之一
5. execution_mode 為 parallel、sequential 或 mixed',
  '["query","crags","areas","max_steps"]',
  'active'
WHERE NOT EXISTS (SELECT 1 FROM ai_prompts WHERE name = 'planning_prompt');

INSERT INTO ai_prompts (id, name, version, content, variables, status)
SELECT
  'seed_synthesis_prompt_v1',
  'synthesis_prompt',
  1,
  '你是一個資訊整合專家。請將以下多個子任務的檢索結果合併為結構化的參考資料。

原始查詢：{query}

子任務結果：
{step_results}

請輸出結構化的參考資料（繁體中文），格式要求：
1. 按實體或主題分段組織
2. 每段標註資料來源（路線名稱、岩場名稱等）
3. 若不同來源有矛盾資訊，明確標示
4. 保留所有具體數據（難度、長度、評分等）
5. 不要生成最終回答，只整理參考資料供後續使用

輸出純文字，不要 JSON 格式。',
  '["query","step_results"]',
  'active'
WHERE NOT EXISTS (SELECT 1 FROM ai_prompts WHERE name = 'synthesis_prompt');
