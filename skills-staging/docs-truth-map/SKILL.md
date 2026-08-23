---
name: docs-truth-map
description: 觀察到以下任一狀態時載入：準備引用 docs/、CLAUDE.md 或任何 repo 內文件作為事實依據；兩份文件互相矛盾；文件描述與 code 現況對不上；要找某 feature 的規格或歷史脈絡。
---

# 文件信任地圖：哪些能信、哪些是屍體

查證日期：2026-07-13。本 repo 文件量大且新舊混雜；引用前先對照本表。

## 信任順位（衝突時上面贏）

1. **Code 與設定檔本身**（package.json、wrangler.toml、workflows、schema.sql）
2. **`.claude/skills/project-rules/SKILL.md`**（專案憲法，明定與舊 docs 衝突時以它為準）
3. **`openspec/specs/`**（34 個 capability spec = 已建成功能的現行真相，AI 子系統尤其完整）
4. **`docs/techstack/`**（正確反映 Hono/Workers/Biome 現況）
5. CLAUDE.md（大體正確但有漂移，見下）
6. 其餘 `docs/`（設計討論、規劃、研究筆記——當歷史脈絡讀，不當事實引）

## 已查證的文件陷阱

| 文件 | 問題 | 正確事實 |
|------|------|----------|
| **`docs/backend/`（整目錄 10 檔）** | 完整的 Django + DRF + PostgreSQL + Redis 教學——**該架構從未實作** | backend = Hono 4 + Cloudflare Workers + D1/R2/KV；看 `docs/techstack/backend.md` |
| `openspec/project.md` | 寫 "Prettier + ESLint" | lint/format = **Biome**（root/web/mobile 的 lint 都是 `biome check .`） |
| CLAUDE.md「品質檢查指令」節 | 寫 `pnpm run lint` — ESLint | 同上，是 Biome |
| CLAUDE.md StartMoving 節 | 說有 `.startmoving/AGENTS.md` 與 slash commands | `.startmoving/` **不存在**（2026-07-13）；別嘗試載入 |
| CLAUDE.md 技術棧 | 說 mobile 用 Tamagui UI | Tamagui 有裝但 UI 是純 RN StyleSheet 自建元件 |
| `docs/ai-agent/` 內的 `*-2026-rag.md`、`08-interview-prep.md` 等 | LLM 比較筆記 / 面試準備，非專案規格 | AI 現行規格看 `openspec/specs/ai-*` |
| `.specify/`（Spec Kit） | 第二套 spec 框架，實務上未使用 | 活的流程是 `openspec/` |
| `scripts/README.md` 內 `restore-prod-to-preview.sh` | 已標 DEPRECATED | 要用 rebuild 版（且需授權） |
| backend `package.json` 的 `db:migrate:preview`/`db:migrate:production`/`db:seed` | 指向不存在的檔案 | 見 `db-migrations-truth` skill |

## 值得挖的獨家知識（在 docs 裡、不在 skills 裡）

- `docs/ai-agent/README.md`、`01-architecture.md`：AI stack 的 **Cloudflare free-tier $0/月成本模型**
  與語料規模（5 岩場、946 路線、9,582 影片；岩館數 39 出自 `apps/web/public/data/stats.json`）——
  評估任何 AI 架構變更的成本前提。
- `openspec/changes/`（21 active）：目前**進行中/計畫中**的工作全貌（quiz 系列 10 個 + RAG 成熟化系列）。
  找「未完成的事」看這裡，不是 grep TODO（全 repo 實際只有 ~7 個 TODO 註解，backend 為零）。
- `openspec/changes/archive/`：16 個已完成 change 的 proposal/design——查「為什麼當初這樣設計」的第一站。
- `docs/plan.md`：admin 岩場匯入/匯出的現況。

## 規則：引用文件前先做新鮮度檢查

- 觸發：要把任何 docs/ 內容當成行動依據。
- 步驟：(1) 對照上面陷阱表；(2) 抽查該文件的關鍵宣稱是否與 code 一致（grep 一個提到的檔案/指令）；
  (3) 過時就以 code 為準並在回報中註明文件已漂移。
- 完成定義：你的行動依據能追溯到 code 或憲法層文件，不是單靠一份可能過時的 doc。
- 正例：想知道 backend 錯誤處理慣例 → 讀 `backend/src/routes/posts.ts` 現行寫法，而非 docs/backend 的 DRF 教學。
- 反例（觀察過的合理化）：「docs/backend/ 寫得這麼完整詳細，照著做就對了」——它描述的是一個
  從未存在的 Django backend；完整度不等於真實性。

## 重新驗證

```bash
ls .startmoving 2>&1; head -5 docs/backend/README.md 2>/dev/null; grep -n "ESLint\|Prettier" openspec/project.md | head -3
```
