-- AI Pipeline 完整可設定參數
-- 將所有 query.ts 中的 hardcode 閾值移入 ai_config，讓 admin 可即時調整

INSERT OR IGNORE INTO ai_config (key, value) VALUES
  -- ── 品質閾值（Groundedness） ──────────────────────────
  -- Groundedness 低於此值時，在回答前注入 ❓ 強警示
  ('groundedness_disclaimer_low',    '0.6'),
  -- Groundedness 低於此值時，在回答前注入 ⚠️ 輕警示
  ('groundedness_disclaimer_mid',    '0.8'),
  -- Groundedness 低於此值時，自動送審（寫入 ai_flagged_responses）
  ('groundedness_flag_threshold',    '0.5'),
  -- Token 超過此數時，日誌標記 is_high_consumption = 1
  ('high_consumption_threshold',     '1000'),

  -- ── 排名與多樣性 ─────────────────────────────────────
  -- MMR lambda：λ 越高越重視相關性，越低越多樣（0.0–1.0）
  ('mmr_lambda',                     '0.6'),
  -- 熱門度加權：兩者自動歸一化，總和不須恰好為 1
  ('reranker_weight',                '0.7'),
  ('popularity_weight',              '0.3'),
  -- RRF 分數門檻（無 metadata filter 時）
  ('min_rrf_score',                  '0.005'),
  -- RRF 分數門檻（有 grade/crag filter 時放寬）
  ('min_rrf_score_filtered',         '0.002'),

  -- ── Judge 設定 ────────────────────────────────────────
  -- Judge LLM 呼叫逾時（毫秒），逾時時跳過評分
  ('judge_timeout_ms',               '8000'),
  -- 傳給 Judge 的 context 截斷字元數（避免超出輸入限制）
  ('judge_context_truncate',         '800'),

  -- ── Self-Reflection 設定 ──────────────────────────────
  -- 回答字元數低於此值時跳過 self-reflection（太短無意義）
  ('self_reflection_min_length',     '50'),

  -- ── 對話設定 ─────────────────────────────────────────
  -- 帶入 LLM 的最近對話訊息數（1 輪 = 2 則，預設 3 輪）
  ('chat_history_depth',             '6'),
  -- 多輪對話中 assistant 歷史訊息截斷字元數（與 judge_context_truncate 是不同關注點）
  ('assistant_history_truncate',     '500');
