<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Commit 規範

每次執行 git commit 時，必須使用 `.claude/skills/format-commit/SKILL.md` skill 的流程來產生 commit message。

流程：

1. 詢問使用者 commit 類型（feat / fix / refactor / perf / docs / style / test / chore）
2. 詢問影響範圍與簡短描述
3. 詢問 Why（原因）
4. 從 git diff 自動推導 How（做了什麼）
5. 產生 commit message 並請使用者確認後執行
