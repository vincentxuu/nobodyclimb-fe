---
name: config-and-flags
description: 觀察到以下任一狀態時載入：功能在某環境開、另一環境關；環境變數/secret 看起來沒生效；要加新的 env var、binding 或 feature flag；analytics 在 preview 出現或在 production 消失；AI provider/模型行為與預期不符。
---

# 設定與旗標：誰在哪一層決定什麼

查證日期：2026-07-13。本 repo 的旗標分四層，debug 時先判斷值是在哪一層被決定的。

## 四層模型

| 層 | 何時固定 | 例子 | 改了怎麼生效 |
|----|----------|------|--------------|
| **Build-time（web）** | CI build 當下烘進 bundle | 所有 `NEXT_PUBLIC_*`（API_URL、ENABLE_ANALYTICS、ENABLE_AI_CHAT/STREAMING、GA/Clarity/PostHog/Sentry） | 重新 build+deploy；本地改 shell env 後重啟 dev server |
| **Wrangler vars（runtime）** | deploy 時 | backend `wrangler.toml` 各 env 的 `CORS_ORIGIN`、`R2_PUBLIC_URL`、`AI_GATEWAY_SLUG`、`ANALYTICS_DATASET`；web `wrangler.json` 的 `SERVER_API_URL` | 改檔 + deploy |
| **Wrangler secrets** | `wrangler secret put` | `JWT_SECRET`、`CWA_API_KEY`、`GOOGLE_CLIENT_ID`、`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`GOOGLE_AI_API_KEY`、`LANGFUSE_*`、`LLM_PROVIDER`/`EMBEDDING_PROVIDER` 若以 secret 設 | CI 的 deploy-api.yml 會在 deploy 後自動重新 put 主要 secrets |
| **DB `ai_config` 表（runtime, per-環境）** | admin UI / SQL 隨時 | `rag_strategy`、`use_langgraph_engine`、`react_models`、guard patterns、`pipeline_timeout_ms`、prompts | 立即生效，**不需 deploy**——AI 行為對不上 code 時先查這裡 |

## 已查證的旗標事實

- **Analytics 雙閘**：build-time `NEXT_PUBLIC_ENABLE_ANALYTICS`（CI：main→true，其他→false）
  ＋ runtime hostname 檢查（只有 `nobodyclimb.cc`/`www.` 啟用）。preview 看不到 analytics 是設計，不是 bug。
- **AI provider 選擇**：env `LLM_PROVIDER`/`EMBEDDING_PROVIDER` ∈ cloudflare|openai|anthropic|google
  （factory 另支援 github，用 `GITHUB_TOKEN`），default cloudflare（Workers AI binding，免 key）。
  選其他 provider 沒設對應 key → factory 直接 throw。Google 的 key 名是 **`GOOGLE_AI_API_KEY`**。
  wrangler.toml 內建警告：改 `EMBEDDING_PROVIDER` 需要全量重建 Vectorize index。
- **Bindings（backend 各環境）**：`DB`(D1)、`CACHE`(KV)、`STORAGE`(R2)、`AI`(Workers AI)、
  `VECTOR_INDEX`(Vectorize)、`ACCESS_LOGS`(Analytics Engine)。
  **本地 gap**：root（無 env）區塊沒有 Vectorize binding → 本地 `wrangler dev` 向量檢索必失敗（已知限制）。
- **web Worker bindings**：`VIDEOS`/`CACHE`(KV)、`ASSETS`、`BACKEND_API`（service binding 直連 backend worker）。
- **Env 檔**：repo 內**沒有** `.env.example` 或 `.dev.vars`（2026-07-13 查證）。本地要打 preview API
  就設 `NEXT_PUBLIC_API_URL`；backend 本地 secret 用 `backend/.dev.vars`（自行建立，勿 commit）`user-must-provide`。
- **mobile**：env 一律 `process.env.EXPO_PUBLIC_*`。
- **cron（backend）**：`wrangler.toml` 頂層 `[triggers]` crons（named env 繼承）：每日 UTC 16:00
  （台灣 00:00，重置）＋ 週一 UTC 00:00（人格演化）。

## 規則

**規則：加新 web 旗標前先判斷 build-time 或 runtime。**
- 觸發：需要一個「環境間不同」的值。
- 步驟：使用者瀏覽器要用 → `NEXT_PUBLIC_*`＋加進 `.github/workflows/deploy.yml` 兩個 job 的 env；
  只有 server component 要用 → wrangler vars ＋ `getCloudflareContext()`（抄 `server-fetch.ts`）。
- 完成定義：preview 與 production 兩個 deploy path 都有該值的來源；沒有「只在本地 .env 有」的孤兒設定。
- 反例（觀察過的合理化）：「頁面拿不到值，我在 component 裡讀 process.env 就好」——Workers 上
  runtime 讀不到 build-time 沒烘進去的值，這正是 `force-dynamic` + server-fetch 模式存在的原因。

**規則：workflow 內 secrets 一律經 `env:` block。**
- 事故 `02a9ff9`：shell script 內直接 `${{ secrets.* }}` 造成解析/安全問題。

**規則：AI 行為異常先 dump `ai_config`。**
- 完成定義：你知道當前 `rag_strategy` 與 `use_langgraph_engine` 的實際值，再開始讀 code。

## 重新驗證

```bash
grep -n "NEXT_PUBLIC_" .github/workflows/deploy.yml | head && grep -nE "^\[(env|triggers)|binding =" backend/wrangler.toml | head -20
```
