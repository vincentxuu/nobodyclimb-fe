---
name: ci-and-delivery
description: 觀察到以下任一狀態時載入：CI 紅燈要診斷；準備 commit / 開 PR / push；要改 .github/workflows；本地綠但 CI 紅；需要知道哪些檢查是 merge 閘門、哪些只是 warning。
---

# CI 與交付流程

查證日期：2026-07-13。

## Workflow 一覽（.github/workflows/）

| 檔案 | 觸發 | 做什麼 |
|------|------|--------|
| `deploy.yml` | push develop/main、PR→main（路徑過濾 web/packages） | PR：只 Build Check（build:cf）；push：build + wrangler deploy + main 加 purge cache |
| `deploy-api.yml` | push、PR→main（路徑過濾 backend/packages）、dispatch | lint-and-typecheck job（`tsc --noEmit`）→ deploy → put secrets → **自動套 remote migrations** → develop 再觸發 RAG ci 評估 |
| `deploy-app.yml` | push main（mobile/packages）、dispatch | mobile typecheck + EAS build |
| `evaluate-rag.yml` | dispatch / 被 deploy-api 呼叫 | 黑箱打活 API 評估 golden/red-team set；**continue-on-error，門檻只發 warning** |
| `code-review.yml` | PR opened/synchronize | GPT-4o-mini 自動 review 留言（診斷輔助，非閘門） |
| `auto-pr-description.yml` | PR | 自動產 PR 描述 |
| `keep-alive.yml` | 每 5 分鐘 | ping production health |

**閘門認知**：真正擋 merge 的是 build/typecheck job；RAG 評估與 AI review 都不是閘門。
backend 的 vitest **不在任何 workflow 裡**——AI 單元測試靠本地自律跑。

## CI 紅燈分診（本 repo 的歷史成因排序）

1. **新檔沒 `git add`**（最常見，`2e6db07`、`4089f61`）→ 比對 CI 錯誤裡的 module 路徑與 `git ls-files`。
2. **伴生設定沒 commit**（`ab15022`：next.config wrapper）→ 功能 = 檔案＋設定＋依賴三件套。
3. **packages 依賴未宣告**（`a19c205`）→ DTS build 在 CI 炸、本地 typecheck 過。
4. **Worker bundle 超過 3072 KiB gzip**（`6e2500b`）→ 找死碼刪，不是調限制。
5. **workflow 本身的 secrets 引用**（`02a9ff9`）→ secrets 進 `env:` block。

## 交付紀律

**規則：commit 前照 repo 內建流程走。**
- 觸發：任何 commit。
- 步驟：(1) `pre-commit-check` skill（lint+typecheck+conventions，自動修可修的）；
  (2) `format-commit` skill 產生 Why/How 格式的繁中 commit message；(3) 使用者確認後才 commit。
- 完成定義：三步都走完；沒有繞過任何一步的 commit。
- 反例（觀察過的合理化）：「小改動，直接 commit 省時間」——這個 repo 的 gate 是制度不是建議；
  機械檢查 30 秒就跑完，跳過它省下的時間遠小於一次 CI 紅燈的成本。

**規則：push 前先問「要 review 嗎？」**（CLAUDE.md 明定）；Yes → `code-review` skill 跑完再 push。

**規則：分支紀律。**
- `develop` = default（preview）、`main` = production；禁直接 push 兩者，一律 feature branch → PR。
- diff base 用 `origin/develop`（`check-conventions.sh` 也以此為基準）。
- 接手他人工作先 `git log` 確認是否已有人修過同一批 review 意見
  （事故：`94abd61` 與 `122abe2` 兩個 session 重複修同四個問題）。

**規則：非平凡 feature 走 OpenSpec。**
- 觸發：新 feature、breaking change、schema/架構變更（bug fix/typo/設定不用）。
- 步驟：`openspec-new-change` → proposal 核准前不寫 code → 實作 → `openspec-verify-change` → archive。
- 現況：`openspec/specs/` 34 個 capability = 已建成的真相；`openspec/changes/` 21 個 active = 進行中。
- 教訓：quiz 大 feature 曾以單體 proposal 進場，最後 archive 後重拆成 10 個 `add-quiz-*` 細 changes——一開始就拆。

## 重新驗證

```bash
ls .github/workflows/ && bash scripts/check-conventions.sh; echo exit=$?
```
