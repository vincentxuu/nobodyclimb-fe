-- 新增攀岩者身體數據與年度目標欄位
-- height_cm: 身高（公分）
-- arm_span_cm: 臂展（公分）
-- grade_targets: 年度攀爬目標（JSON 陣列）

ALTER TABLE biographies ADD COLUMN height_cm INTEGER;
ALTER TABLE biographies ADD COLUMN arm_span_cm INTEGER;
ALTER TABLE biographies ADD COLUMN grade_targets TEXT;
