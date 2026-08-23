# UNCERTAINTY.md — 審查後仍未定案的事項

建立日期：2026-07-13。三輪 fresh-context 審查（factual / doctrine / usability）後，
BLOCKING 與 IMPORTANT 發現均已修入各 skill；以下是**無法由本 session 單方面裁決**、
或證據不足以下定論的事項，留給維護者。

## 需要維護者決策

1. **schema.sql 的定位**（最重要）：憲法（`.claude/skills/project-rules` 不變量 4、
   `add-db-migration`）稱 `backend/src/db/schema.sql` 為「全量快照」，實際凍結在最初 15 張表；
   0046 之後的所有表（AI/quiz/rank/chat）只存在於 migrations。選項：(a) 回填 schema.sql 至完整狀態
   （並確認回填後「舊快照建庫＋重放歷史」的衝突如何處理）；(b) 正式宣告 schema.sql 僅涵蓋基礎表、
   修改憲法措辭。本庫的 `db-migrations-truth` 目前如實描述現況，但「兩處同步」規則對
   「只存在於 migrations 的表」該如何執行，仍是開放問題。
2. **兩個已知破損測試設定的修復授權**：web Jest（next-intl transform）與 mobile Jest
   （`app/quiz/test.tsx` 誤認）都是既有破損。本庫依「不順手重構」原則指示先回報再修——
   但兩者都該排入正式任務。
3. **`backend/package.json` 壞 script 的清理**（`db:migrate` 雙因壞損、`db:migrate:preview/production`、
   `db:seed` 死引用）：修 script 或刪除，需維護者決定保留哪些語意。
4. **backend vitest（83 tests）是否接入 CI**：目前不在任何 workflow；接入 turbo `test` 只需加
   test script + vitest config，但屬流程變更。

## 證據不足、標記為 unverified 的宣稱（已在各 skill 內標注）

- `web-frontend-pitfalls`：新頂層動態 route 需加進 `wrangler.json` 的 `run_worker_first`
  ——推論自設定結構，未實測反例。
- `run-and-operate`：YouTube 資料更新腳本鏈（`update-videos.sh` 等）未實跑（需 `yt-dlp`）。
- `run-and-operate`：`wrangler tail` 需 Cloudflare 認證（`user-must-provide`），本 session 無法驗證。
- `config-and-flags`：backend 本地 secrets 走 `.dev.vars` 是 wrangler 慣例，repo 內無範例檔佐證
  （標 `user-must-provide`）。

## 已知會腐化最快的內容

- 各 skill 引用的**原始碼行號**（`ai.ts:84`、`config.ts:17`、`engine.ts:159` 等）在 2026-07-13 正確，
  但會隨重構漂移；每檔檔尾的「重新驗證」指令是對策。
- migration 數量（75）、openspec counts（34 specs / 21 active / 16 archive）、admin-ai endpoints（25）
  等計數為當日快照。

## 審查中曾懷疑、最終確認非問題

- 「AI 三引擎並存」的描述與 `query/index.ts` 選擇順序一致（react → langgraph → baseline）。
- `too_short` guard 語意（guards 回 `passed:false` 但 caller 不封鎖）已按原始碼精確化。
- 唯讀 `--remote SELECT` 分診例外：與憲法「不跑 --remote」的張力已在 `architecture-contract`
  明文開洞（僅 SELECT、僅分診）；若維護者不接受此例外，刪去該段並改走 admin UI 即可。
