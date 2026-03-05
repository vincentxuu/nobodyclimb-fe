-- Judge 驅動重生成設定
-- 用 Judge（獨立 Llama）的 quality 分數決定是否重生成，取代同模型 YES/NO 自評（盲點問題）
-- quality 量表：1=很差、2=差、3=好、4=優；低於或等於門檻時觸發重生成

INSERT OR IGNORE INTO ai_config (key, value) VALUES
  -- quality 分數等於或低於此值時觸發重生成（1–3，預設 2 = 差以下重試）
  ('judge_regen_quality_max', '2');
