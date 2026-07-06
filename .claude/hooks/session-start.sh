#!/bin/bash
# SessionStart hook：讓遠端（Claude Code on the web）session 一啟動就有可用的工具鏈。
# 冪等：node_modules 與 packages dist 都在時幾乎零成本。
set -euo pipefail

# 只在遠端環境執行（本機開發者自己管理環境）
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# 1. 安裝依賴（container 快取後 node_modules 會保留，此步驟變 no-op）
if [ ! -d node_modules ]; then
  pnpm install --frozen-lockfile
fi

# 2. Build shared packages（apps 消費 dist/；缺任何一個 dist 就全部重建）
NEED_BUILD=false
for pkg in packages/*/; do
  if [ -f "${pkg}package.json" ] && [ ! -f "${pkg}dist/index.js" ]; then
    NEED_BUILD=true
    break
  fi
done

if [ "$NEED_BUILD" = "true" ]; then
  pnpm --filter "./packages/*" build
fi

echo "session-start: 環境就緒（node_modules + packages dist）"
