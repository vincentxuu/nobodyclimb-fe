#!/usr/bin/env bash
# 專案慣例機械檢查（diff-aware：只檢查本次 branch 改到的檔案，不掃全 repo）
# 用法：bash scripts/check-conventions.sh
# 退出碼：0 = 通過（可有 WARN）；1 = 有 FAIL，必須修正後再 commit
# 規則依據：.claude/skills/project-rules/SKILL.md 的不變量；新增規則時兩邊要同步。
set -u

cd "$(git rev-parse --show-toplevel)" || exit 1

# 以 origin/develop 的 merge-base 為比較基準（fallback：develop → HEAD~1）
BASE=$(git merge-base origin/develop HEAD 2>/dev/null \
  || git merge-base develop HEAD 2>/dev/null \
  || git rev-parse HEAD~1 2>/dev/null)

if [ -z "${BASE:-}" ]; then
  echo "INFO: 找不到比較基準（可能是初始 commit），略過慣例檢查"
  exit 0
fi

# 變更檔案清單 = branch 上已 commit 的 + 工作區未 commit 的 + 未追蹤的新檔
CHANGED=$( { git diff --name-only "$BASE"; git diff --name-only --cached; \
             git ls-files --others --exclude-standard; } | sort -u )

if [ -z "$CHANGED" ]; then
  echo "INFO: 無變更檔案，略過慣例檢查"
  exit 0
fi

FAIL=0
WARN=0

fail() { echo "FAIL: $1"; echo "      修法：$2"; FAIL=1; }
warn() { echo "WARN: $1"; echo "      建議：$2"; WARN=1; }

# 取某檔案在此次變更中「新增的行」（含未 commit 的變更；未追蹤檔全檔視為新增）
added_lines() {
  if git ls-files --error-unmatch "$1" >/dev/null 2>&1; then
    git diff -U0 "$BASE" -- "$1" 2>/dev/null | grep '^+' | grep -v '^+++'
  else
    cat "$1" 2>/dev/null
  fi
}

has() { echo "$CHANGED" | grep -q "$1"; }

# ── 規則 1：改 schema.sql 必須同時新增 migration ──────────────────────────
if has '^backend/src/db/schema\.sql$'; then
  if ! echo "$CHANGED" | grep -q '^backend/migrations/[0-9]\{4\}_.*\.sql$'; then
    fail "backend/src/db/schema.sql 有變更，但沒有新增 backend/migrations/NNNN_*.sql" \
         "依 add-db-migration skill 補上對應的增量 migration（兩處必須同步改）"
  fi
fi

# ── 規則 2：新 migration 編號不得重複（歷史上發生過兩個 0071）──────────────
NEW_MIGRATIONS=$(echo "$CHANGED" | grep '^backend/migrations/[0-9]\{4\}_.*\.sql$' || true)
for f in $NEW_MIGRATIONS; do
  [ -f "$f" ] || continue
  num=$(basename "$f" | cut -c1-4)
  count=$(ls backend/migrations/ 2>/dev/null | grep -c "^${num}_")
  if [ "$count" -gt 1 ]; then
    fail "migration 編號 $num 重複（backend/migrations/ 內有 $count 個 ${num}_*）" \
         "ls backend/migrations/ | sort | tail 取最大編號 +1 重新命名"
  fi
done

# ── 規則 3：web 新 code 禁用 next/link（要用 @/i18n/navigation）────────────
for f in $(echo "$CHANGED" | grep -E '^apps/web/src/.*\.(ts|tsx)$' || true); do
  [ -f "$f" ] || continue
  if added_lines "$f" | grep -q "from 'next/link'"; then
    fail "$f 新增了 import next/link（會丟失 locale）" \
         "改用 import { Link } from '@/i18n/navigation'"
  fi
done

# ── 規則 4：web component 不得直接 import axios（要走 lib/api 層）──────────
for f in $(echo "$CHANGED" | grep -E '^apps/web/src/.*\.(ts|tsx)$' | grep -v '^apps/web/src/lib/api/' || true); do
  [ -f "$f" ] || continue
  if added_lines "$f" | grep -qE "from 'axios'"; then
    fail "$f 新增了直接 import axios" \
         "改走 src/lib/api/services.ts + TanStack Query hook（見 add-web-page skill）"
  fi
done

# ── 規則 5：mobile 的 SafeAreaView 必須來自 safe-area-context ──────────────
for f in $(echo "$CHANGED" | grep -E '^apps/mobile/(app|src)/.*\.(ts|tsx)$' || true); do
  [ -f "$f" ] || continue
  if added_lines "$f" | grep 'SafeAreaView' | grep -q "from 'react-native'$\|from 'react-native';" ; then
    fail "$f 從 react-native import SafeAreaView" \
         "改成 import { SafeAreaView } from 'react-native-safe-area-context'"
  fi
done

# ── 規則 6：mobile UI 新 code 避免硬編碼 hex 色碼 ──────────────────────────
for f in $(echo "$CHANGED" | grep -E '^apps/mobile/(app|src)/.*\.tsx$' || true); do
  [ -f "$f" ] || continue
  n=$(added_lines "$f" | grep -cE "['\"]#[0-9a-fA-F]{3,8}['\"]" || true)
  if [ "${n:-0}" -gt 0 ]; then
    warn "$f 新增了 $n 處硬編碼色碼" \
         "改用 @nobodyclimb/constants 的 SEMANTIC_COLORS / WB_COLORS（theme.ts）"
  fi
done

# ── 規則 7：不得 commit 產生物 ─────────────────────────────────────────────
GENERATED=$(echo "$CHANGED" | grep -E '(^|/)(dist|\.next|\.open-next)/|worker-configuration\.d\.ts$' || true)
if [ -n "$GENERATED" ]; then
  fail "變更包含產生物：$(echo "$GENERATED" | tr '\n' ' ')" \
       "從 commit 中移除（這些由 build 工具產生，不進版控）"
fi

# ── 規則 8：改了 packages 提醒 rebuild ─────────────────────────────────────
if has '^packages/.*/src/'; then
  echo "INFO: 本次變更包含 packages/*/src —— apps 消費的是 dist/，驗證前先執行："
  echo "      pnpm --filter \"./packages/*\" build"
fi

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo "❌ 慣例檢查未通過（見上方 FAIL），修正後再 commit。規則說明：.claude/skills/project-rules/SKILL.md"
  exit 1
elif [ "$WARN" -eq 1 ]; then
  echo "⚠️  慣例檢查通過，但有 WARN，請逐條確認。"
  exit 0
else
  echo "✅ 慣例檢查通過"
  exit 0
fi
