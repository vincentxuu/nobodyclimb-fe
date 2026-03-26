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

## Commit 流程

commit 時必須依序執行：

1. 先執行 `.claude/skills/pre-commit-check/SKILL.md` skill 跑品質檢查（lint + typecheck）
2. 檢查通過後，執行 `.claude/skills/format-commit/SKILL.md` skill 產生 commit message
3. 使用者確認後才執行 git commit

### 品質檢查指令

- `pnpm run lint` — ESLint（turbo 跑所有 packages）
- `pnpm run typecheck` — TypeScript 類型檢查（turbo 跑所有 packages）
- `pnpm run format` — Prettier 自動修復格式問題
