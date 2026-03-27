# Python AI Service (LangGraph + Langfuse) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以 Python 實作獨立的 AI 微服務，複現 TypeScript RAG pipeline 的全部功能（Baseline / Agentic / Plan-and-Execute 三種策略），使用 LangGraph Python（原生版，功能更完整）+ Langfuse Python SDK，部署為 Docker 容器，與 TS 後端並行運行。

**Architecture:** FastAPI 服務，暴露與現有 TS 服務相同的 API 端點（`POST /ask`, `GET /search`）；TS backend 透過 `use_python_ai_service` feature flag 將請求 proxy 至此 Python 服務。Python 服務透過 REST API 呼叫 Cloudflare Workers AI（LLM）、Cloudflare Vectorize（向量搜尋）及 Cloudflare D1（SQL）。

**Tech Stack:** Python 3.12, FastAPI, `langgraph` 0.2+, `langfuse` Python SDK 2+, `httpx` (Cloudflare REST API calls), `pydantic` v2, `pytest` + `pytest-asyncio`, Docker, uv (package manager)

---

## File Structure

```
backend-python/
├── pyproject.toml              # uv/poetry project config
├── Dockerfile
├── .env.example
├── src/
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Settings via pydantic-settings
│   ├── state.py                # LangGraph TypedDict state
│   ├── langfuse_utils.py       # Langfuse client + @observe decorators
│   ├── routing.py              # Conditional edge functions (pure functions)
│   ├── cf_client.py            # Cloudflare AI / Vectorize / D1 REST clients
│   ├── graphs/
│   │   ├── baseline.py
│   │   ├── agentic.py
│   │   └── plan_execute.py
│   └── nodes/
│       ├── semantic_cache.py
│       ├── tool_selection.py
│       ├── filter_build.py
│       ├── text_to_sql.py
│       ├── embedding.py
│       ├── hyde.py
│       ├── multi_query.py
│       ├── hybrid_search.py
│       ├── cross_encoder.py
│       ├── mmr.py
│       ├── popularity_rerank.py
│       ├── llm_generation.py
│       ├── judge.py
│       ├── self_reflection.py
│       └── memory_extractor.py
└── tests/
    ├── test_routing.py
    ├── test_nodes/
    │   ├── test_semantic_cache.py
    │   └── ...
    ├── test_graphs/
    │   └── test_baseline.py
    └── test_api.py
```

---

## Task 0: Unit Tests for Routing Functions (TDD Red Phase)

**Files:**
- Create: `backend-python/tests/test_routing.py`

先寫測試，確認 fail，再實作 routing.py。

- [ ] **Step 1: 建立 `backend-python/tests/test_routing.py`**

```python
# tests/test_routing.py
import pytest
from src.state import GraphState
from src.routing import (
    route_after_semantic_cache,
    route_after_tool_selection,
    route_after_text_to_sql,
    route_after_embedding,
    route_after_judge,
    route_after_self_reflection,
    route_agentic_decision,
    route_after_agentic_retrieve,
)

BASE_CFG = {
    "judge_regen_quality_max": 3,
    "max_pipeline_loops": 2,
    "self_reflection_min_length": 50,
    "agentic_max_steps": 5,
    "agentic_min_docs_to_answer": 3,
    "rag_strategy": "baseline",
}


def make_state(**kwargs) -> GraphState:
    base: GraphState = {
        "pipeline_config": BASE_CFG,
        "early_return": None,
        "query_type": None,
        "sql_candidates": None,
        "embedding_failed": False,
        "quality": None,
        "loop_count": 0,
        "context": None,
        "loop_back": None,
        "candidate_matches": [],
        "trace": {},
    }
    base.update(kwargs)
    return base


# --- routeAfterSemanticCache ---

def test_semantic_cache_early_return():
    state = make_state(early_return={"answer": "cached"})
    assert route_after_semantic_cache(state) == "END"


def test_semantic_cache_no_early_return():
    state = make_state()
    assert route_after_semantic_cache(state) == "toolSelection"


# --- routeAfterToolSelection ---

def test_tool_selection_early_return():
    state = make_state(early_return={"answer": "x"})
    assert route_after_tool_selection(state) == "END"


def test_tool_selection_sql():
    state = make_state(query_type="sql")
    assert route_after_tool_selection(state) == "textToSql"


def test_tool_selection_clarification():
    state = make_state(query_type="clarification-needed")
    assert route_after_tool_selection(state) == "END"


def test_tool_selection_general_knowledge():
    state = make_state(query_type="general-knowledge")
    assert route_after_tool_selection(state) == "llmGeneration"


def test_tool_selection_vector():
    state = make_state(query_type="vector")
    assert route_after_tool_selection(state) == "filterBuild"


# --- routeAfterTextToSql ---

def test_text_to_sql_early_return():
    state = make_state(early_return={"answer": "clarify"})
    assert route_after_text_to_sql(state) == "END"


def test_text_to_sql_has_results():
    state = make_state(sql_candidates=[{"id": 1}])
    assert route_after_text_to_sql(state) == "llmGeneration"


def test_text_to_sql_no_results():
    state = make_state(sql_candidates=[])
    assert route_after_text_to_sql(state) == "embedding"


def test_text_to_sql_undefined():
    state = make_state(sql_candidates=None)
    assert route_after_text_to_sql(state) == "embedding"


# --- routeAfterEmbedding ---

def test_embedding_failed():
    state = make_state(embedding_failed=True)
    assert route_after_embedding(state) == "hybridSearch"


def test_embedding_success():
    state = make_state(embedding_failed=False)
    assert route_after_embedding(state) == "hyde"


# --- routeAfterJudge ---

def test_judge_low_quality_triggers_reflection():
    state = make_state(quality=2, loop_count=0, context="x" * 100)
    assert route_after_judge(state) == "selfReflection"


def test_judge_good_quality():
    state = make_state(quality=5, loop_count=0, context="x" * 100)
    assert route_after_judge(state) == "memoryExtractor"


def test_judge_loop_limit_reached():
    state = make_state(quality=2, loop_count=2, context="x" * 100)
    assert route_after_judge(state) == "memoryExtractor"


# --- routeAfterSelfReflection ---

def test_self_reflection_retrieval_loopback():
    state = make_state(loop_back={"target_phase": "retrieval"})
    assert route_after_self_reflection(state) == "hybridSearch"


def test_self_reflection_no_loopback():
    state = make_state(loop_back=None)
    assert route_after_self_reflection(state) == "llmGeneration"


def test_self_reflection_generation_loopback():
    state = make_state(loop_back={"target_phase": "generation"})
    assert route_after_self_reflection(state) == "llmGeneration"


# --- routeAgenticDecision ---

def test_agentic_decision_early_return():
    state = make_state(early_return={"answer": "x"})
    assert route_agentic_decision(state) == "END"


def test_agentic_decision_answer_action():
    state = make_state(trace={"last_agentic_action": "ANSWER"})
    assert route_agentic_decision(state) == "llmGeneration"


def test_agentic_decision_retrieve_action():
    state = make_state(trace={"last_agentic_action": "RETRIEVE"})
    assert route_agentic_decision(state) == "agenticRetrieve"


# --- routeAfterAgenticRetrieve ---

def test_agentic_retrieve_max_steps():
    state = make_state(loop_count=5, candidate_matches=[])
    assert route_after_agentic_retrieve(state) == "llmGeneration"


def test_agentic_retrieve_enough_docs():
    state = make_state(loop_count=1, candidate_matches=[{}, {}, {}])
    assert route_after_agentic_retrieve(state) == "llmGeneration"


def test_agentic_retrieve_continue():
    state = make_state(loop_count=1, candidate_matches=[{}])
    assert route_after_agentic_retrieve(state) == "agenticDecision"
```

- [ ] **Step 2: 執行測試，確認全部 fail（routing.py 尚未實作）**

```bash
cd backend-python
uv run pytest tests/test_routing.py -v
```

Expected:
```
ERROR tests/test_routing.py - ModuleNotFoundError: No module named 'src'
```

- [ ] **Step 3: commit**

```bash
git add backend-python/tests/test_routing.py
git commit -m "test(python-ai): add unit tests for routing functions (TDD red phase)"
```

---

## Task 1: Project Setup (FastAPI + uv + directory structure)

**Files:**
- Create: `backend-python/pyproject.toml`
- Create: `backend-python/src/__init__.py`
- Create: `backend-python/src/config.py`
- Create: `backend-python/.env.example`

- [ ] **Step 1: 初始化 uv 專案**

```bash
mkdir -p backend-python
cd backend-python
uv init --python 3.12
uv add fastapi "uvicorn[standard]" langgraph langfuse httpx pydantic pydantic-settings sse-starlette
uv add --dev pytest pytest-asyncio pytest-httpx respx
```

- [ ] **Step 2: 確認安裝成功**

```bash
cd backend-python
uv run python -c "import langgraph; import langfuse; import fastapi; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: 建立 `backend-python/pyproject.toml` 中的 pytest 設定**

確認 `pyproject.toml` 包含：

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
pythonpath = ["."]

[tool.uv]
dev-dependencies = [
  "pytest>=8.0",
  "pytest-asyncio>=0.23",
  "pytest-httpx>=0.30",
  "respx>=0.21",
]
```

- [ ] **Step 4: 建立 `backend-python/src/config.py`**

```python
# src/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Cloudflare
    cloudflare_account_id: str
    cloudflare_api_token: str
    cloudflare_ai_gateway_url: str | None = None  # optional AI Gateway proxy

    # Cloudflare D1
    cloudflare_d1_database_id: str

    # Cloudflare Vectorize
    cloudflare_vectorize_index_name: str = "nobodyclimb-routes"

    # Langfuse
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_base_url: str = "https://cloud.langfuse.com"

    # Service
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    max_pipeline_loops: int = 2


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 5: 建立 `.env.example`**

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_D1_DATABASE_ID=your_d1_database_id
CLOUDFLARE_VECTORIZE_INDEX_NAME=nobodyclimb-routes

LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

- [ ] **Step 6: 建立最小可執行 `backend-python/src/main.py`**

```python
# src/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 啟動時可預熱連線
    yield
    # 關閉時清理


app = FastAPI(title="NobodyClimb Python AI Service", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 7: 啟動確認**

```bash
cd backend-python
uv run uvicorn src.main:app --reload --port 8000
```

Expected: Uvicorn running on `http://0.0.0.0:8000`. `curl http://localhost:8000/health` → `{"status":"ok"}`

- [ ] **Step 8: commit**

```bash
git add backend-python/
git commit -m "feat(python-ai): project setup with FastAPI, uv, and base config"
```

---

## Task 2: Cloudflare AI + Vectorize + D1 REST Client

**Files:**
- Create: `backend-python/src/cf_client.py`
- Create: `backend-python/tests/test_cf_client.py`

Python 無法使用 Cloudflare Workers bindings，改用 REST API。

- [ ] **Step 1: 建立 `backend-python/tests/test_cf_client.py`（先寫測試）**

```python
# tests/test_cf_client.py
import pytest
import respx
import httpx
from src.cf_client import CloudflareClient


@pytest.fixture
def cf(settings_override):
    from src.config import Settings
    settings = Settings(
        cloudflare_account_id="test-account",
        cloudflare_api_token="test-token",
        cloudflare_d1_database_id="test-db",
        cloudflare_vectorize_index_name="test-index",
    )
    return CloudflareClient(settings)


@respx.mock
@pytest.mark.asyncio
async def test_text_embedding(cf):
    respx.post(
        "https://api.cloudflare.com/client/v4/accounts/test-account/ai/run/@cf/baai/bge-m3"
    ).mock(return_value=httpx.Response(200, json={
        "result": {"data": [[0.1, 0.2, 0.3]]},
        "success": True,
    }))

    vectors = await cf.embed(["hello world"])
    assert len(vectors) == 1
    assert vectors[0] == [0.1, 0.2, 0.3]


@respx.mock
@pytest.mark.asyncio
async def test_vectorize_query(cf):
    respx.post(
        "https://api.cloudflare.com/client/v4/accounts/test-account/vectorize/v2/indexes/test-index/query"
    ).mock(return_value=httpx.Response(200, json={
        "result": {
            "matches": [{"id": "route-1", "score": 0.95, "metadata": {"name": "龍洞南壁"}}]
        },
        "success": True,
    }))

    matches = await cf.vectorize_query(vector=[0.1, 0.2], top_k=5)
    assert len(matches) == 1
    assert matches[0]["id"] == "route-1"


@respx.mock
@pytest.mark.asyncio
async def test_d1_query(cf):
    respx.post(
        "https://api.cloudflare.com/client/v4/accounts/test-account/d1/database/test-db/query"
    ).mock(return_value=httpx.Response(200, json={
        "result": [{"results": [{"id": 1, "name": "龍洞"}], "success": True}],
        "success": True,
    }))

    rows = await cf.d1_query("SELECT * FROM crags WHERE id = ?", [1])
    assert rows[0]["name"] == "龍洞"
```

- [ ] **Step 2: 執行測試確認 fail**

```bash
cd backend-python && uv run pytest tests/test_cf_client.py -v
```

Expected: `ModuleNotFoundError: No module named 'src.cf_client'`

- [ ] **Step 3: 建立 `backend-python/src/cf_client.py`**

```python
# src/cf_client.py
import httpx
from typing import Any
from src.config import Settings

CF_BASE = "https://api.cloudflare.com/client/v4/accounts"
AI_MODEL_EMBED = "@cf/baai/bge-m3"
AI_MODEL_LLM_DEFAULT = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"


class CloudflareClient:
    """Cloudflare REST API client for Workers AI, Vectorize, and D1."""

    def __init__(self, settings: Settings):
        self._acct = settings.cloudflare_account_id
        self._headers = {
            "Authorization": f"Bearer {settings.cloudflare_api_token}",
            "Content-Type": "application/json",
        }
        self._vectorize_index = settings.cloudflare_vectorize_index_name
        self._d1_db = settings.cloudflare_d1_database_id
        self._client = httpx.AsyncClient(timeout=30.0, headers=self._headers)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings via Workers AI."""
        url = f"{CF_BASE}/{self._acct}/ai/run/{AI_MODEL_EMBED}"
        resp = await self._client.post(url, json={"text": texts})
        resp.raise_for_status()
        return resp.json()["result"]["data"]

    async def chat(
        self,
        messages: list[dict[str, str]],
        model: str = AI_MODEL_LLM_DEFAULT,
        stream: bool = False,
        max_tokens: int = 2048,
    ) -> dict[str, Any]:
        """Call Workers AI chat completions (non-streaming for now)."""
        url = f"{CF_BASE}/{self._acct}/ai/run/{model}"
        resp = await self._client.post(url, json={
            "messages": messages,
            "max_tokens": max_tokens,
            "stream": stream,
        })
        resp.raise_for_status()
        return resp.json()["result"]

    async def vectorize_query(
        self,
        vector: list[float],
        top_k: int = 20,
        filter: dict[str, Any] | None = None,
        return_metadata: str = "all",
    ) -> list[dict[str, Any]]:
        """Query Cloudflare Vectorize index."""
        url = f"{CF_BASE}/{self._acct}/vectorize/v2/indexes/{self._vectorize_index}/query"
        payload: dict[str, Any] = {
            "vector": vector,
            "topK": top_k,
            "returnMetadata": return_metadata,
        }
        if filter:
            payload["filter"] = filter
        resp = await self._client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()["result"]["matches"]

    async def d1_query(self, sql: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
        """Execute SQL query against Cloudflare D1."""
        url = f"{CF_BASE}/{self._acct}/d1/database/{self._d1_db}/query"
        resp = await self._client.post(url, json={"sql": sql, "params": params or []})
        resp.raise_for_status()
        results = resp.json()["result"]
        # D1 returns list of statement results; take first
        return results[0]["results"] if results else []

    async def close(self):
        await self._client.aclose()
```

- [ ] **Step 4: 執行測試確認通過**

```bash
cd backend-python && uv run pytest tests/test_cf_client.py -v
```

Expected:
```
tests/test_cf_client.py::test_text_embedding PASSED
tests/test_cf_client.py::test_vectorize_query PASSED
tests/test_cf_client.py::test_d1_query PASSED
3 passed in 0.xx s
```

- [ ] **Step 5: commit**

```bash
git add backend-python/src/cf_client.py backend-python/tests/test_cf_client.py
git commit -m "feat(python-ai): add Cloudflare REST client (AI, Vectorize, D1)"
```

---

## Task 2.5: AI Provider Abstraction Layer

**Files:**
- Create: `backend-python/app/providers/base.py`
- Create: `backend-python/app/providers/cloudflare.py`
- Create: `backend-python/app/providers/openai.py`
- Create: `backend-python/app/providers/anthropic.py`
- Create: `backend-python/app/providers/google.py`
- Create: `backend-python/app/providers/__init__.py`
- Modify: `backend-python/app/config.py`
- Modify: `backend-python/src/state.py`
- Create: `backend-python/tests/test_providers.py`

目前 `cf_client.py` 完全耦合於 Cloudflare Workers AI REST API。本 task 引入抽象 `AIProvider` base class，讓 LLM 提供商（Cloudflare / OpenAI / Anthropic / Google）可透過 Settings 設定切換，embedding provider 可獨立設定，統一介面供 nodes 使用。

> **⚠️ Embedding 維度警告（重要）**：不同 provider 的向量嵌入維度不同：
> - Cloudflare BGE-M3：**1024 維**
> - OpenAI text-embedding-3-small：**1536 維**
> - Google text-embedding-004：**768 維**
>
> **切換 `EMBEDDING_PROVIDER` 後必須重新索引 Vectorize 中的所有文件**，否則新舊向量維度不符會導致搜尋結果錯誤或 API 報錯。`LLM_PROVIDER` 可隨時切換，無須重新索引。

- [ ] **Step 1: 建立 `backend-python/app/providers/base.py`**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator

@dataclass
class ChatMessage:
    role: str  # "system" | "user" | "assistant"
    content: str

@dataclass
class LLMResponse:
    content: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    tool_name: str | None = None
    tool_arguments: dict | None = None

@dataclass
class EmbeddingResult:
    vectors: list[list[float]]

class AIProvider(ABC):
    """Abstract base for all LLM providers."""

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        model: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        tools: list[dict] | None = None,
    ) -> LLMResponse: ...

    @abstractmethod
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        *,
        model: str | None = None,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]: ...

    @abstractmethod
    async def embed(self, text: str, *, model: str | None = None) -> list[float]: ...

    @abstractmethod
    async def embed_batch(self, texts: list[str], *, model: str | None = None) -> list[list[float]]: ...
```

- [ ] **Step 2: 建立 `backend-python/app/providers/cloudflare.py`（REST API 呼叫 Cloudflare Workers AI）**

```python
import httpx
from typing import AsyncIterator
from .base import AIProvider, ChatMessage, LLMResponse

class CloudflareProvider(AIProvider):
    """Calls Cloudflare Workers AI via REST API."""

    def __init__(
        self,
        account_id: str,
        api_token: str,
        default_model: str = "@cf/meta/llama-3.1-8b-instruct",
        default_embedding_model: str = "@cf/baai/bge-m3",
        gateway_slug: str | None = None,
    ):
        self.account_id = account_id
        self.api_token = api_token
        self.default_model = default_model
        self.default_embedding_model = default_embedding_model
        base = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run"
        if gateway_slug:
            base = f"https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_slug}/workers-ai"
        self.base_url = base

    @property
    def name(self) -> str:
        return "cloudflare"

    async def chat(self, messages: list[ChatMessage], *, model=None, max_tokens=1024, temperature=0.7, tools=None) -> LLMResponse:
        m = model or self.default_model
        payload = {"messages": [{"role": msg.role, "content": msg.content} for msg in messages], "max_tokens": max_tokens}
        if tools:
            payload["tools"] = tools
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/{m}",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_token}"},
                timeout=30.0,
            )
            r.raise_for_status()
            data = r.json()
        content = data.get("result", {}).get("response", "")
        usage = data.get("result", {}).get("usage", {})
        return LLMResponse(
            content=content,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
        )

    async def stream_chat(self, messages: list[ChatMessage], *, model=None, max_tokens=1024) -> AsyncIterator[str]:
        m = model or self.default_model
        payload = {"messages": [{"role": msg.role, "content": msg.content} for msg in messages], "max_tokens": max_tokens, "stream": True}
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST", f"{self.base_url}/{m}",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_token}"},
                timeout=60.0,
            ) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if line.startswith("data:"):
                        import json
                        try:
                            chunk = json.loads(line[5:])
                            token = chunk.get("response", "")
                            if token:
                                yield token
                        except json.JSONDecodeError:
                            pass

    async def embed(self, text: str, *, model=None) -> list[float]:
        vectors = await self.embed_batch([text], model=model)
        return vectors[0]

    async def embed_batch(self, texts: list[str], *, model=None) -> list[list[float]]:
        m = model or self.default_embedding_model
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/{m}",
                json={"text": texts},
                headers={"Authorization": f"Bearer {self.api_token}"},
                timeout=30.0,
            )
            r.raise_for_status()
            data = r.json()
        return data["result"]["data"]
```

- [ ] **Step 3: 建立 `backend-python/app/providers/openai.py`**

```python
import httpx
import json
from typing import AsyncIterator
from .base import AIProvider, ChatMessage, LLMResponse

class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str, default_model: str = "gpt-4o-mini", default_embedding_model: str = "text-embedding-3-small"):
        self.api_key = api_key
        self.default_model = default_model
        self.default_embedding_model = default_embedding_model
        self.base_url = "https://api.openai.com/v1"

    @property
    def name(self) -> str:
        return "openai"

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

    async def chat(self, messages: list[ChatMessage], *, model=None, max_tokens=1024, temperature=0.7, tools=None) -> LLMResponse:
        body: dict = {
            "model": model or self.default_model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if tools:
            body["tools"] = [{"type": "function", "function": t} for t in tools]
            body["tool_choice"] = "auto"
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{self.base_url}/chat/completions", json=body, headers=self._headers(), timeout=30.0)
            r.raise_for_status()
            data = r.json()
        choice = data["choices"][0]["message"]
        tool_call = None
        if choice.get("tool_calls"):
            tc = choice["tool_calls"][0]["function"]
            tool_call = {"name": tc["name"], "arguments": json.loads(tc["arguments"])}
        usage = data.get("usage", {})
        return LLMResponse(
            content=choice.get("content") or "",
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            tool_name=tool_call["name"] if tool_call else None,
            tool_arguments=tool_call["arguments"] if tool_call else None,
        )

    async def stream_chat(self, messages: list[ChatMessage], *, model=None, max_tokens=1024) -> AsyncIterator[str]:
        body = {"model": model or self.default_model, "messages": [{"role": m.role, "content": m.content} for m in messages], "max_tokens": max_tokens, "stream": True}
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", f"{self.base_url}/chat/completions", json=body, headers=self._headers(), timeout=60.0) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if line.startswith("data: ") and line[6:] != "[DONE]":
                        try:
                            chunk = json.loads(line[6:])
                            token = chunk["choices"][0].get("delta", {}).get("content", "")
                            if token:
                                yield token
                        except Exception:
                            pass

    async def embed(self, text: str, *, model=None) -> list[float]:
        results = await self.embed_batch([text], model=model)
        return results[0]

    async def embed_batch(self, texts: list[str], *, model=None) -> list[list[float]]:
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{self.base_url}/embeddings", json={"model": model or self.default_embedding_model, "input": texts}, headers=self._headers(), timeout=30.0)
            r.raise_for_status()
            data = r.json()
        return [item["embedding"] for item in sorted(data["data"], key=lambda x: x["index"])]
```

- [ ] **Step 4: 建立 `backend-python/app/providers/anthropic.py`**

```python
import httpx
import json
from typing import AsyncIterator
from .base import AIProvider, ChatMessage, LLMResponse

class AnthropicProvider(AIProvider):
    def __init__(self, api_key: str, default_model: str = "claude-haiku-4-5-20251001"):
        self.api_key = api_key
        self.default_model = default_model
        self.base_url = "https://api.anthropic.com/v1"

    @property
    def name(self) -> str:
        return "anthropic"

    def _headers(self) -> dict:
        return {"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"}

    async def chat(self, messages: list[ChatMessage], *, model=None, max_tokens=1024, temperature=0.7, tools=None) -> LLMResponse:
        system = next((m.content for m in messages if m.role == "system"), None)
        non_system = [{"role": m.role, "content": m.content} for m in messages if m.role != "system"]
        body: dict = {"model": model or self.default_model, "max_tokens": max_tokens, "messages": non_system}
        if system:
            body["system"] = system
        if tools:
            body["tools"] = [{"name": t["name"], "description": t.get("description",""), "input_schema": t.get("parameters", {})} for t in tools]
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{self.base_url}/messages", json=body, headers=self._headers(), timeout=30.0)
            r.raise_for_status()
            data = r.json()
        text = next((b["text"] for b in data["content"] if b["type"] == "text"), "")
        tool_use = next((b for b in data["content"] if b["type"] == "tool_use"), None)
        usage = data.get("usage", {})
        return LLMResponse(
            content=text,
            prompt_tokens=usage.get("input_tokens", 0),
            completion_tokens=usage.get("output_tokens", 0),
            total_tokens=usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            tool_name=tool_use["name"] if tool_use else None,
            tool_arguments=tool_use["input"] if tool_use else None,
        )

    async def stream_chat(self, messages: list[ChatMessage], *, model=None, max_tokens=1024) -> AsyncIterator[str]:
        system = next((m.content for m in messages if m.role == "system"), None)
        non_system = [{"role": m.role, "content": m.content} for m in messages if m.role != "system"]
        body: dict = {"model": model or self.default_model, "max_tokens": max_tokens, "messages": non_system, "stream": True}
        if system:
            body["system"] = system
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", f"{self.base_url}/messages", json=body, headers=self._headers(), timeout=60.0) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if line.startswith("data:"):
                        try:
                            ev = json.loads(line[5:])
                            if ev.get("type") == "content_block_delta" and ev.get("delta", {}).get("type") == "text_delta":
                                yield ev["delta"]["text"]
                        except Exception:
                            pass

    async def embed(self, text: str, *, model=None) -> list[float]:
        raise NotImplementedError("Anthropic does not support embeddings. Use CloudflareProvider or OpenAIProvider for embeddings.")

    async def embed_batch(self, texts: list[str], *, model=None) -> list[list[float]]:
        raise NotImplementedError("Anthropic does not support embeddings.")
```

- [ ] **Step 5: 建立 `backend-python/app/providers/google.py`**

```python
import httpx
import json
from typing import AsyncIterator
from .base import AIProvider, ChatMessage, LLMResponse

class GoogleProvider(AIProvider):
    def __init__(self, api_key: str, default_model: str = "gemini-2.0-flash", default_embedding_model: str = "text-embedding-004"):
        self.api_key = api_key
        self.default_model = default_model
        self.default_embedding_model = default_embedding_model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    @property
    def name(self) -> str:
        return "google"

    def _to_google_messages(self, messages: list[ChatMessage]) -> tuple[str | None, list[dict]]:
        system = next((m.content for m in messages if m.role == "system"), None)
        contents = [{"role": "model" if m.role == "assistant" else "user", "parts": [{"text": m.content}]} for m in messages if m.role != "system"]
        return system, contents

    async def chat(self, messages: list[ChatMessage], *, model=None, max_tokens=1024, temperature=0.7, tools=None) -> LLMResponse:
        m = model or self.default_model
        system, contents = self._to_google_messages(messages)
        body: dict = {"contents": contents, "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature}}
        if system:
            body["systemInstruction"] = {"parts": [{"text": system}]}
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{self.base_url}/models/{m}:generateContent?key={self.api_key}", json=body, timeout=30.0)
            r.raise_for_status()
            data = r.json()
        content = data["candidates"][0]["content"]["parts"][0]["text"]
        usage = data.get("usageMetadata", {})
        return LLMResponse(
            content=content,
            prompt_tokens=usage.get("promptTokenCount", 0),
            completion_tokens=usage.get("candidatesTokenCount", 0),
            total_tokens=usage.get("totalTokenCount", 0),
        )

    async def stream_chat(self, messages: list[ChatMessage], *, model=None, max_tokens=1024) -> AsyncIterator[str]:
        m = model or self.default_model
        system, contents = self._to_google_messages(messages)
        body: dict = {"contents": contents}
        if system:
            body["systemInstruction"] = {"parts": [{"text": system}]}
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", f"{self.base_url}/models/{m}:streamGenerateContent?key={self.api_key}&alt=sse", json=body, timeout=60.0) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if line.startswith("data:"):
                        try:
                            chunk = json.loads(line[5:])
                            text = chunk["candidates"][0]["content"]["parts"][0].get("text", "")
                            if text:
                                yield text
                        except Exception:
                            pass

    async def embed(self, text: str, *, model=None) -> list[float]:
        results = await self.embed_batch([text], model=model)
        return results[0]

    async def embed_batch(self, texts: list[str], *, model=None) -> list[list[float]]:
        m = model or self.default_embedding_model
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/models/{m}:batchEmbedContents?key={self.api_key}",
                json={"requests": [{"model": f"models/{m}", "content": {"parts": [{"text": t}]}} for t in texts]},
                timeout=30.0,
            )
            r.raise_for_status()
            data = r.json()
        return [e["values"] for e in data["embeddings"]]
```

- [ ] **Step 6: 建立 `backend-python/app/providers/__init__.py`**

```python
from .base import AIProvider, ChatMessage, LLMResponse, EmbeddingResult
from .cloudflare import CloudflareProvider
from .openai import OpenAIProvider
from .anthropic import AnthropicProvider
from .google import GoogleProvider
from typing import Literal

ProviderName = Literal["cloudflare", "openai", "anthropic", "google"]

def create_provider(name: ProviderName, settings: "Settings") -> AIProvider:
    """Factory for AI providers. Settings is the app config object."""
    match name:
        case "cloudflare":
            return CloudflareProvider(
                account_id=settings.CF_ACCOUNT_ID,
                api_token=settings.CF_API_TOKEN,
                gateway_slug=settings.CF_AI_GATEWAY_SLUG,
            )
        case "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is not configured")
            return OpenAIProvider(api_key=settings.OPENAI_API_KEY)
        case "anthropic":
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY is not configured")
            return AnthropicProvider(api_key=settings.ANTHROPIC_API_KEY)
        case "google":
            if not settings.GOOGLE_AI_API_KEY:
                raise ValueError("GOOGLE_AI_API_KEY is not configured")
            return GoogleProvider(api_key=settings.GOOGLE_AI_API_KEY)
        case _:
            raise ValueError(f"Unknown provider: {name}")

def create_providers(settings: "Settings") -> tuple[AIProvider, AIProvider]:
    """Returns (llm_provider, embedding_provider)."""
    from .cloudflare import CloudflareProvider
    llm = create_provider(settings.LLM_PROVIDER, settings)
    emb_name = settings.EMBEDDING_PROVIDER or settings.LLM_PROVIDER
    try:
        emb = create_provider(emb_name, settings)
        # Anthropic has no embedding support — fallback to Cloudflare
        if isinstance(emb, AnthropicProvider):
            emb = CloudflareProvider(account_id=settings.CF_ACCOUNT_ID, api_token=settings.CF_API_TOKEN)
    except Exception:
        emb = CloudflareProvider(account_id=settings.CF_ACCOUNT_ID, api_token=settings.CF_API_TOKEN)
    return llm, emb
```

- [ ] **Step 7: 更新 `backend-python/app/config.py` — 在 `Settings` 加入 provider 欄位**

在 `Settings` class 加入：

```python
LLM_PROVIDER: ProviderName = "cloudflare"
EMBEDDING_PROVIDER: ProviderName | None = None  # defaults to LLM_PROVIDER
OPENAI_API_KEY: str | None = None
ANTHROPIC_API_KEY: str | None = None
GOOGLE_AI_API_KEY: str | None = None
```

並在 `.env.example` 加入：

```env
# AI Provider selection (cloudflare | openai | anthropic | google)
LLM_PROVIDER=cloudflare
# Embedding provider (cloudflare | openai | google); defaults to LLM_PROVIDER
# WARNING: Changing EMBEDDING_PROVIDER requires full re-index of all Vectorize documents
EMBEDDING_PROVIDER=cloudflare
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
```

- [ ] **Step 8: 更新 `backend-python/src/state.py` — 在 `GraphState` 加入 provider 欄位**

在 `GraphState` TypedDict 的 `# --- Cloudflare client` 區塊之後加入：

```python
# --- AI Providers（由 GraphService 注入）---
llm_provider: Any | None   # AIProvider instance for chat/streaming
embedding_provider: Any | None  # AIProvider instance for embed
```

> **Node 使用方式**：各 node（llm_generation, judge, hyde, multi_query, tool_selection）應改用 `state["llm_provider"].chat()` 取代直接呼叫 `cf.chat()`。Embedding node 應改用 `state["embedding_provider"].embed()` / `state["embedding_provider"].embed_batch()`。

- [ ] **Step 9: 建立 `backend-python/tests/test_providers.py`**

```python
import pytest
from unittest.mock import AsyncMock, patch
from app.providers import create_provider, CloudflareProvider, OpenAIProvider, AnthropicProvider, GoogleProvider

class MockSettings:
    CF_ACCOUNT_ID = "test-account"
    CF_API_TOKEN = "test-token"
    CF_AI_GATEWAY_SLUG = None
    OPENAI_API_KEY = "sk-test"
    ANTHROPIC_API_KEY = "ant-test"
    GOOGLE_AI_API_KEY = "gai-test"

def test_create_cloudflare_provider():
    p = create_provider("cloudflare", MockSettings())
    assert p.name == "cloudflare"
    assert isinstance(p, CloudflareProvider)

def test_create_openai_provider():
    p = create_provider("openai", MockSettings())
    assert p.name == "openai"

def test_create_anthropic_provider():
    p = create_provider("anthropic", MockSettings())
    assert p.name == "anthropic"

def test_create_google_provider():
    p = create_provider("google", MockSettings())
    assert p.name == "google"

def test_missing_openai_key_raises():
    settings = MockSettings()
    settings.OPENAI_API_KEY = None
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        create_provider("openai", settings)

@pytest.mark.asyncio
async def test_anthropic_embed_raises():
    p = AnthropicProvider(api_key="test")
    with pytest.raises(NotImplementedError):
        await p.embed("test")
```

- [ ] **Step 10: 執行測試**

```bash
cd backend-python && uv run pytest tests/test_providers.py -v
```

Expected: 6 passed

- [ ] **Step 11: commit**

```bash
git add backend-python/app/providers/ \
        backend-python/tests/test_providers.py \
        backend-python/app/config.py \
        backend-python/src/state.py \
        backend-python/.env.example
git commit -m "feat(python-ai): add multi-provider abstraction layer (Cloudflare/OpenAI/Anthropic/Google)"
```

---

## Task 3: LangGraph State Definition

**Files:**
- Create: `backend-python/src/state.py`

Python LangGraph 使用 `TypedDict` 定義 state（不是 JS 的 `Annotation.Root`）。

- [ ] **Step 1: 建立 `backend-python/src/state.py`**

```python
# src/state.py
from typing import TypedDict, Any, Callable, Awaitable


class LoopBack(TypedDict, total=False):
    target_phase: str  # 'retrieval' | 'generation'


class EarlyReturn(TypedDict, total=False):
    answer: str
    type: str  # 'cache-hit' | 'clarification' | 'error'


class GraphState(TypedDict, total=False):
    """
    LangGraph state，對應 TS PipelineContext。
    使用 TypedDict with total=False（所有欄位可選），
    讓每個 node 只需回傳它更新的欄位。
    """
    # --- 請求 ---
    query: str
    user_id: str | None
    session_id: str | None

    # --- Config ---
    pipeline_config: dict[str, Any]
    prompts: dict[str, str]

    # --- 快取 ---
    cache_key: str | None
    cache_ttl: int
    early_query_vector: list[float] | None
    recent_history: list[dict[str, Any]] | None
    is_anonymous_no_history: bool

    # --- Pre-retrieval ---
    query_type: str | None   # 'sql' | 'vector' | 'general-knowledge' | 'clarification-needed'
    effective_llm_model: str | None
    parsed_query: dict[str, Any] | None
    tool_confidence: float
    fallback_enabled: bool
    alternative_tool: str | None
    hyde_doc: str | None
    expanded_queries: list[str] | None
    vector_filter: dict[str, Any] | None
    query_vector: list[float] | None
    hyde_vector: list[float] | None
    expanded_vectors: list[list[float]] | None

    # --- Text-to-SQL ---
    sql_template: str | None
    sql_params: dict[str, Any] | None
    clarification_type: str | None
    sql_candidates: list[dict[str, Any]] | None
    sql_context: str | None

    # --- Retrieval ---
    candidate_matches: list[dict[str, Any]]
    documents: list[dict[str, Any]]
    retrieval_score: float | None

    # --- Reranking ---
    scored_candidates: list[dict[str, Any]]
    reranked_matches: list[dict[str, Any]]
    sources: list[dict[str, Any]]
    context: str | None

    # --- Generation ---
    raw_answer: str | None
    answer: str | None
    suggested_questions: list[str] | None

    # --- Evaluation ---
    groundedness: float | None
    quality: float | None

    # --- 流程控制 ---
    early_return: EarlyReturn | None
    final_response: dict[str, Any] | None
    streaming_mode: bool
    # NOTE: streaming callback 在 Python 中以 asyncio.Queue 傳遞，不是函式
    token_queue: Any | None   # asyncio.Queue[str] | None

    # --- 個人化 ---
    memory_summary: str | None
    ascent_context: str | None
    ability_level: float | None

    # --- Looping ---
    loop_count: int
    loop_back: LoopBack | None

    # --- Agentic ---
    trace: dict[str, Any]     # 含 last_agentic_action, plan_steps 等

    # --- Plan-and-Execute ---
    multi_tool_plan: dict[str, Any] | None
    branch_results: list[dict[str, Any]]

    # --- 其他 ---
    retrieval_method: str | None
    strategy_hint: str | None
    skip_post_retrieval: bool
    # NOTE: Record[string, X] 而非 Map，確保 JSON 序列化相容
    video_count_map: dict[str, int] | None
    latest_video_map: dict[str, str] | None
    self_reflection_triggered: int
    cannot_answer: bool
    embedding_failed: bool
    degraded_stages: list[str]

    # --- Cloudflare client（由 GraphService 注入）---
    cf: Any  # CloudflareClient instance

    # --- Langfuse（由 GraphService 注入）---
    langfuse_trace: Any | None  # langfuse.client.StatefulTraceClient | None
```

- [ ] **Step 2: 執行 mypy 型別檢查**

```bash
cd backend-python
uv run mypy src/state.py --strict
```

Expected: `Success: no issues found in 1 source file`

- [ ] **Step 3: commit**

```bash
git add backend-python/src/state.py
git commit -m "feat(python-ai): define LangGraph TypedDict state"
```

---

## Task 4: Langfuse Setup + Tracing Utilities

**Files:**
- Create: `backend-python/src/langfuse_utils.py`
- Create: `backend-python/tests/test_langfuse_utils.py`

- [ ] **Step 1: 建立測試**

```python
# tests/test_langfuse_utils.py
from unittest.mock import MagicMock, patch
from src.langfuse_utils import get_langfuse_client, create_trace, start_span, end_span


def test_get_langfuse_client_no_keys():
    from src.config import Settings
    settings = Settings(
        cloudflare_account_id="x",
        cloudflare_api_token="x",
        cloudflare_d1_database_id="x",
    )
    # No LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY → returns None
    client = get_langfuse_client(settings)
    assert client is None


def test_get_langfuse_client_returns_new_instance_each_call():
    """每次呼叫應回傳新實例，不共享 singleton（request-scoped）"""
    from src.config import Settings
    settings = Settings(
        cloudflare_account_id="x",
        cloudflare_api_token="x",
        cloudflare_d1_database_id="x",
        langfuse_public_key="pk-lf-test",
        langfuse_secret_key="sk-lf-test",
    )
    with patch("src.langfuse_utils.Langfuse") as MockLangfuse:
        MockLangfuse.return_value = MagicMock()
        c1 = get_langfuse_client(settings)
        c2 = get_langfuse_client(settings)
        assert MockLangfuse.call_count == 2  # 兩次呼叫，建立兩個實例


def test_create_trace_with_none_langfuse():
    trace = create_trace(None, name="test", input={"query": "hello"})
    assert trace is None


def test_start_span_with_none_trace():
    span = start_span(None, "test-node")
    assert span is None


def test_end_span_with_none_span():
    end_span(None, output={"result": "ok"})  # should not raise
```

- [ ] **Step 2: 建立 `backend-python/src/langfuse_utils.py`**

```python
# src/langfuse_utils.py
"""
Langfuse client 工具。

設計原則：
- get_langfuse_client() 每次呼叫都建立新實例（request-scoped）
  不使用 module-level singleton，避免在長期運行的 Python 服務中跨請求共享 trace 狀態
- 所有函式都 gracefully 處理 None（Langfuse keys 未設定時靜默降級）
"""
from typing import Any
from src.config import Settings

try:
    from langfuse import Langfuse
    _LANGFUSE_AVAILABLE = True
except ImportError:
    _LANGFUSE_AVAILABLE = False


def get_langfuse_client(settings: Settings) -> Any | None:
    """建立新的 Langfuse client（每次請求一個新實例）。
    未設定 keys 時回傳 None（靜默降級）。
    """
    if not _LANGFUSE_AVAILABLE:
        return None
    if not settings.langfuse_public_key or not settings.langfuse_secret_key:
        return None
    return Langfuse(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        host=settings.langfuse_base_url,
        flush_at=10,
        flush_interval=5,
    )


def create_trace(
    langfuse: Any | None,
    *,
    name: str,
    user_id: str | None = None,
    session_id: str | None = None,
    input: Any = None,
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    if langfuse is None:
        return None
    return langfuse.trace(
        name=name,
        user_id=user_id,
        session_id=session_id,
        input=input,
        metadata=metadata,
    )


def start_span(trace: Any | None, name: str, input: Any = None) -> Any | None:
    if trace is None:
        return None
    return trace.span(name=name, input=input)


def end_span(
    span: Any | None,
    *,
    output: Any = None,
    metadata: dict[str, Any] | None = None,
    level: str = "DEFAULT",
) -> None:
    if span is None:
        return
    span.end(output=output, metadata=metadata, level=level)


async def flush_langfuse(langfuse: Any | None) -> None:
    if langfuse is None:
        return
    langfuse.flush()
```

- [ ] **Step 3: 執行測試**

```bash
cd backend-python && uv run pytest tests/test_langfuse_utils.py -v
```

Expected: 5 passed

- [ ] **Step 4: commit**

```bash
git add backend-python/src/langfuse_utils.py backend-python/tests/test_langfuse_utils.py
git commit -m "feat(python-ai): add Langfuse tracing utilities (request-scoped, graceful degradation)"
```

---

## Task 5: Pre-Retrieval Nodes

**Files:**
- Create: `backend-python/src/nodes/semantic_cache.py`
- Create: `backend-python/src/nodes/tool_selection.py`
- Create: `backend-python/src/nodes/filter_build.py`
- Create: `backend-python/src/nodes/embedding.py`

每個 node 簽名：`async def xxx_node(state: GraphState) -> GraphState`（回傳完整 state 或 dict，LangGraph Python 自動 merge）。

- [ ] **Step 1: 建立 `backend-python/src/nodes/semantic_cache.py`**

```python
# src/nodes/semantic_cache.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span


async def semantic_cache_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "semantic-cache", input={
        "query": state.get("query"),
        "cache_key": state.get("cache_key"),
    })
    try:
        cf = state["cf"]
        cache_key = state.get("cache_key")
        if not cache_key:
            end_span(span, output={"cache_hit": False})
            return {}

        # 嘗試從 D1 取得快取
        rows = await cf.d1_query(
            "SELECT answer, created_at FROM semantic_cache WHERE cache_key = ? "
            "AND created_at > datetime('now', ? || ' seconds')",
            [cache_key, f"-{state.get('cache_ttl', 3600)}"],
        )

        if rows:
            end_span(span, output={"cache_hit": True})
            return {
                "early_return": {"answer": rows[0]["answer"], "type": "cache-hit"},
            }

        end_span(span, output={"cache_hit": False})
        return {}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        # cache miss on error → continue pipeline
        return {}
```

- [ ] **Step 2: 建立 `backend-python/src/nodes/tool_selection.py`**

```python
# src/nodes/tool_selection.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span
import json


TOOL_SELECTION_SYSTEM = """你是 NobodyClimb 的查詢分類器。
根據使用者查詢，輸出 JSON：
{"query_type": "sql"|"vector"|"general-knowledge"|"clarification-needed", "confidence": 0.0-1.0}
- sql: 統計、計數、排行類問題
- vector: 需要檢索攀岩路線資訊
- general-knowledge: 通用攀岩知識，不需要查詢資料庫
- clarification-needed: 問題不清楚，需要澄清"""


async def tool_selection_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "tool-selection", input={
        "query": state.get("query"),
    })
    try:
        cf = state["cf"]
        result = await cf.chat(messages=[
            {"role": "system", "content": TOOL_SELECTION_SYSTEM},
            {"role": "user", "content": state.get("query", "")},
        ], max_tokens=100)

        content = result.get("response", "{}")
        parsed = json.loads(content)
        query_type = parsed.get("query_type", "vector")
        confidence = parsed.get("confidence", 0.8)

        end_span(span, output={"query_type": query_type, "confidence": confidence})
        return {
            "query_type": query_type,
            "tool_confidence": confidence,
        }
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"query_type": "vector", "tool_confidence": 0.5}
```

- [ ] **Step 3: 建立 `backend-python/src/nodes/filter_build.py`**

```python
# src/nodes/filter_build.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span


async def filter_build_node(state: GraphState) -> dict:
    """根據 parsed_query 建立 Vectorize filter 條件。
    此 node 介於 toolSelection 和 embedding 之間，決定向量搜尋的 metadata filter。
    """
    span = start_span(state.get("langfuse_trace"), "filter-build", input={
        "parsed_query": state.get("parsed_query"),
    })
    parsed = state.get("parsed_query") or {}
    filters: dict = {}

    # 範例：若有指定的岩場名稱、難度範圍，轉成 Vectorize filter 格式
    if crag := parsed.get("crag"):
        filters["crag_name"] = {"$eq": crag}
    if grade_min := parsed.get("grade_min"):
        filters["grade_numeric"] = {"$gte": grade_min}
    if grade_max := parsed.get("grade_max"):
        filters.setdefault("grade_numeric", {}).update({"$lte": grade_max})
    if route_type := parsed.get("route_type"):
        filters["route_type"] = {"$eq": route_type}

    end_span(span, output={"filter_count": len(filters)})
    return {"vector_filter": filters if filters else None}
```

- [ ] **Step 4: 建立 `backend-python/src/nodes/embedding.py`**

```python
# src/nodes/embedding.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span


async def embedding_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "embedding", input={
        "query": state.get("query"),
    })
    try:
        cf = state["cf"]
        query = state.get("query", "")
        vectors = await cf.embed([query])
        query_vector = vectors[0]
        end_span(span, output={"vector_dim": len(query_vector)})
        return {"query_vector": query_vector, "embedding_failed": False}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"embedding_failed": True}
```

- [ ] **Step 5: 建立對應的 unit tests**

```python
# tests/test_nodes/test_semantic_cache.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.nodes.semantic_cache import semantic_cache_node


@pytest.fixture
def base_state():
    return {
        "query": "龍洞有什麼路線？",
        "cache_key": "test-key-123",
        "cache_ttl": 3600,
        "cf": AsyncMock(),
        "langfuse_trace": None,
    }


@pytest.mark.asyncio
async def test_cache_hit(base_state):
    base_state["cf"].d1_query = AsyncMock(return_value=[{"answer": "cached answer"}])
    result = await semantic_cache_node(base_state)
    assert result["early_return"]["type"] == "cache-hit"
    assert result["early_return"]["answer"] == "cached answer"


@pytest.mark.asyncio
async def test_cache_miss(base_state):
    base_state["cf"].d1_query = AsyncMock(return_value=[])
    result = await semantic_cache_node(base_state)
    assert result == {}


@pytest.mark.asyncio
async def test_cache_error_graceful(base_state):
    base_state["cf"].d1_query = AsyncMock(side_effect=Exception("DB error"))
    result = await semantic_cache_node(base_state)
    assert result == {}  # 出錯時靜默 fallback
```

- [ ] **Step 6: 執行測試**

```bash
cd backend-python && uv run pytest tests/test_nodes/test_semantic_cache.py -v
```

Expected: 3 passed

- [ ] **Step 7: typecheck**

```bash
cd backend-python && uv run mypy src/nodes/ --ignore-missing-imports
```

- [ ] **Step 8: commit**

```bash
git add backend-python/src/nodes/semantic_cache.py backend-python/src/nodes/tool_selection.py \
        backend-python/src/nodes/filter_build.py backend-python/src/nodes/embedding.py \
        backend-python/tests/test_nodes/
git commit -m "feat(python-ai): add pre-retrieval nodes (semantic-cache, tool-selection, filter-build, embedding)"
```

---

## Task 6: Query Enhancement Nodes (HyDE, Multi-Query, Text-to-SQL)

**Files:**
- Create: `backend-python/src/nodes/hyde.py`
- Create: `backend-python/src/nodes/multi_query.py`
- Create: `backend-python/src/nodes/text_to_sql.py`

- [ ] **Step 1: 建立 `backend-python/src/nodes/hyde.py`**

```python
# src/nodes/hyde.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span


HYDE_SYSTEM = """你是一個攀岩資料庫。根據使用者的問題，假設資料庫中存在一個完美的回答文件，
生成該文件的內容（不超過 150 字）。只輸出文件內容，不加任何說明。"""


async def hyde_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "hyde", input={"query": state.get("query")})
    try:
        cf = state["cf"]
        result = await cf.chat(messages=[
            {"role": "system", "content": HYDE_SYSTEM},
            {"role": "user", "content": state.get("query", "")},
        ], max_tokens=200)
        hyde_doc = result.get("response", "")

        # 生成 HyDE document 的 embedding
        vectors = await cf.embed([hyde_doc])
        hyde_vector = vectors[0]

        end_span(span, output={"hyde_doc_length": len(hyde_doc)})
        return {"hyde_doc": hyde_doc, "hyde_vector": hyde_vector}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {}
```

- [ ] **Step 2: 建立 `backend-python/src/nodes/multi_query.py`**

```python
# src/nodes/multi_query.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span
import asyncio
import json


MULTI_QUERY_SYSTEM = """生成 3 個不同角度的搜尋查詢，用於找到回答原始問題所需的資訊。
輸出 JSON 陣列，例如：["查詢1", "查詢2", "查詢3"]"""


async def multi_query_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "multi-query", input={"query": state.get("query")})
    try:
        cf = state["cf"]
        result = await cf.chat(messages=[
            {"role": "system", "content": MULTI_QUERY_SYSTEM},
            {"role": "user", "content": state.get("query", "")},
        ], max_tokens=200)

        raw = result.get("response", "[]")
        expanded_queries: list[str] = json.loads(raw)

        # 並行生成所有擴展查詢的 embeddings
        if expanded_queries:
            vectors = await cf.embed(expanded_queries)
        else:
            vectors = []

        end_span(span, output={"expanded_count": len(expanded_queries)})
        return {"expanded_queries": expanded_queries, "expanded_vectors": vectors}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {}
```

- [ ] **Step 3: 建立 `backend-python/src/nodes/text_to_sql.py`**

```python
# src/nodes/text_to_sql.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span
import json


TEXT_TO_SQL_SYSTEM = """你是 NobodyClimb 資料庫的 SQL 專家。
根據使用者問題生成 SQLite 查詢。
資料表：routes(id, name, grade, route_type, crag_id), crags(id, name, area_id)
輸出 JSON：{"sql": "SELECT ...", "params": [], "clarification": null}
若問題不夠明確，設定 clarification 而非 sql。"""


async def text_to_sql_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "text-to-sql", input={"query": state.get("query")})
    try:
        cf = state["cf"]
        result = await cf.chat(messages=[
            {"role": "system", "content": TEXT_TO_SQL_SYSTEM},
            {"role": "user", "content": state.get("query", "")},
        ], max_tokens=300)

        parsed = json.loads(result.get("response", "{}"))

        if clarification := parsed.get("clarification"):
            end_span(span, output={"type": "clarification"})
            return {
                "early_return": {"answer": clarification, "type": "clarification"},
                "clarification_type": "intent",
            }

        sql = parsed.get("sql", "")
        params = parsed.get("params", [])

        if not sql:
            end_span(span, output={"type": "no-sql"})
            return {}

        rows = await cf.d1_query(sql, params)
        end_span(span, output={"row_count": len(rows)})
        return {
            "sql_candidates": rows,
            "sql_context": json.dumps(rows, ensure_ascii=False),
            "sql_template": sql,
            "sql_params": params,
        }
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"sql_candidates": [], "early_return": {"answer": "SQL 執行錯誤", "type": "error"}}
```

- [ ] **Step 4: 執行 typecheck + commit**

```bash
cd backend-python && uv run mypy src/nodes/hyde.py src/nodes/multi_query.py src/nodes/text_to_sql.py --ignore-missing-imports
git add backend-python/src/nodes/hyde.py backend-python/src/nodes/multi_query.py backend-python/src/nodes/text_to_sql.py
git commit -m "feat(python-ai): add query enhancement nodes (hyde, multi-query, text-to-sql)"
```

---

## Task 7: Retrieval & Reranking Nodes

**Files:**
- Create: `backend-python/src/nodes/hybrid_search.py`
- Create: `backend-python/src/nodes/cross_encoder.py`
- Create: `backend-python/src/nodes/mmr.py`
- Create: `backend-python/src/nodes/popularity_rerank.py`

- [ ] **Step 1: 建立 `backend-python/src/nodes/hybrid_search.py`**

```python
# src/nodes/hybrid_search.py
import asyncio
from src.state import GraphState
from src.langfuse_utils import start_span, end_span


async def hybrid_search_node(state: GraphState) -> dict:
    """並行執行向量搜尋 + BM25 全文搜尋，合併結果（RRF）。"""
    span = start_span(state.get("langfuse_trace"), "hybrid-search")
    try:
        cf = state["cf"]
        query_vector = state.get("query_vector")
        hyde_vector = state.get("hyde_vector")
        expanded_vectors = state.get("expanded_vectors") or []
        vector_filter = state.get("vector_filter")

        # 並行：向量搜尋 + BM25 (D1 FTS)
        tasks = []

        # 主 query 向量搜尋
        if query_vector:
            tasks.append(cf.vectorize_query(
                vector=query_vector, top_k=20, filter=vector_filter
            ))

        # HyDE 向量搜尋
        if hyde_vector:
            tasks.append(cf.vectorize_query(
                vector=hyde_vector, top_k=10, filter=vector_filter
            ))

        # 擴展查詢向量搜尋
        for ev in expanded_vectors[:2]:
            tasks.append(cf.vectorize_query(vector=ev, top_k=10, filter=vector_filter))

        # BM25 全文搜尋
        query_text = state.get("query", "")
        tasks.append(cf.d1_query(
            "SELECT id, name, description, grade, crag_name, bm25_score "
            "FROM routes_fts WHERE routes_fts MATCH ? ORDER BY bm25_score DESC LIMIT 20",
            [query_text],
        ))

        all_results = await asyncio.gather(*tasks, return_exceptions=True)

        # RRF 合併
        rrf_scores: dict[str, float] = {}
        id_to_doc: dict[str, dict] = {}
        K = 60  # RRF constant

        for rank_list in all_results:
            if isinstance(rank_list, Exception):
                continue
            for rank, doc in enumerate(rank_list):
                doc_id = str(doc.get("id", doc.get("metadata", {}).get("id", "")))
                if not doc_id:
                    continue
                rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1 / (K + rank + 1)
                id_to_doc[doc_id] = doc

        sorted_ids = sorted(rrf_scores, key=lambda x: rrf_scores[x], reverse=True)
        candidate_matches = [id_to_doc[id_] for id_ in sorted_ids[:30]]

        end_span(span, output={"candidate_count": len(candidate_matches)})
        return {
            "candidate_matches": candidate_matches,
            "embedding_failed": not bool(query_vector),
        }
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"candidate_matches": []}
```

- [ ] **Step 2: 建立 `backend-python/src/nodes/cross_encoder.py`**

```python
# src/nodes/cross_encoder.py
import asyncio
from src.state import GraphState
from src.langfuse_utils import start_span, end_span

RERANKER_MODEL = "@cf/baai/bge-reranker-base"


async def cross_encoder_node(state: GraphState) -> dict:
    """使用 Workers AI cross-encoder 重新排序 candidate_matches。"""
    span = start_span(state.get("langfuse_trace"), "cross-encoder")
    try:
        cf = state["cf"]
        candidates = state.get("candidate_matches") or []
        query = state.get("query", "")

        if not candidates:
            end_span(span, output={"scored_count": 0})
            return {"scored_candidates": []}

        # 呼叫 reranker（Workers AI）
        pairs = [{"query": query, "passage": c.get("description", c.get("name", ""))} for c in candidates]
        resp = await asyncio.wait_for(
            cf._client.post(
                f"https://api.cloudflare.com/client/v4/accounts/{cf._acct}/ai/run/{RERANKER_MODEL}",
                json={"query": query, "passages": [p["passage"] for p in pairs]},
            ),
            timeout=10.0,
        )
        scores = resp.json().get("result", {}).get("scores", [])

        scored = [
            {**c, "_rerank_score": scores[i] if i < len(scores) else 0.0}
            for i, c in enumerate(candidates)
        ]
        scored.sort(key=lambda x: x["_rerank_score"], reverse=True)

        end_span(span, output={"scored_count": len(scored)})
        return {"scored_candidates": scored}
    except asyncio.TimeoutError:
        # 超時：降級，直接使用原始 RRF 排序
        return {
            "scored_candidates": state.get("candidate_matches") or [],
            "degraded_stages": (state.get("degraded_stages") or []) + ["cross-encoder"],
        }
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"scored_candidates": state.get("candidate_matches") or []}
```

- [ ] **Step 3: 建立 `backend-python/src/nodes/mmr.py`**

```python
# src/nodes/mmr.py
import math
from src.state import GraphState
from src.langfuse_utils import start_span, end_span


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x ** 2 for x in a))
    mag_b = math.sqrt(sum(x ** 2 for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


async def mmr_node(state: GraphState) -> dict:
    """Maximal Marginal Relevance 多樣性重排序。"""
    span = start_span(state.get("langfuse_trace"), "mmr")
    try:
        candidates = state.get("scored_candidates") or []
        query_vector = state.get("query_vector") or []
        config = state.get("pipeline_config") or {}
        mmr_lambda = config.get("mmr_lambda", 0.7)
        top_k = config.get("mmr_top_k", 10)

        if not candidates or not query_vector:
            end_span(span, output={"reranked_count": len(candidates)})
            return {"reranked_matches": candidates[:top_k]}

        selected: list[dict] = []
        remaining = list(candidates)

        for _ in range(min(top_k, len(candidates))):
            if not remaining:
                break
            best = max(
                remaining,
                key=lambda c: mmr_lambda * cosine_similarity(
                    c.get("_embedding", query_vector), query_vector
                ) - (1 - mmr_lambda) * max(
                    (cosine_similarity(c.get("_embedding", query_vector), s.get("_embedding", query_vector))
                     for s in selected),
                    default=0.0,
                )
            )
            selected.append(best)
            remaining.remove(best)

        end_span(span, output={"reranked_count": len(selected)})
        return {"reranked_matches": selected}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"reranked_matches": state.get("scored_candidates") or []}
```

- [ ] **Step 4: 建立 `backend-python/src/nodes/popularity_rerank.py`**

```python
# src/nodes/popularity_rerank.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span
import json


async def popularity_rerank_node(state: GraphState) -> dict:
    """最終重排：結合人氣（ascent count）微調排序，組裝 sources 和 context。"""
    span = start_span(state.get("langfuse_trace"), "popularity-rerank")
    try:
        candidates = state.get("reranked_matches") or []
        video_count_map = state.get("video_count_map") or {}
        config = state.get("pipeline_config") or {}
        popularity_weight = config.get("popularity_weight", 0.1)

        def popularity_score(c: dict) -> float:
            route_id = str(c.get("id", ""))
            video_count = video_count_map.get(route_id, 0)
            ascent_count = c.get("ascent_count", 0)
            rerank_score = c.get("_rerank_score", 0.5)
            return rerank_score + popularity_weight * (video_count * 0.5 + ascent_count * 0.01)

        sorted_candidates = sorted(candidates, key=popularity_score, reverse=True)

        # 組裝最終 sources + context 字串
        sources = [
            {
                "id": c.get("id"),
                "name": c.get("name"),
                "grade": c.get("grade"),
                "crag_name": c.get("crag_name"),
                "description": c.get("description", "")[:200],  # truncate
            }
            for c in sorted_candidates[:8]
        ]
        context_parts = [
            f"[{i+1}] {s['name']} ({s['grade']}) at {s['crag_name']}: {s['description']}"
            for i, s in enumerate(sources)
        ]
        context = "\n\n".join(context_parts)

        end_span(span, output={"source_count": len(sources)})
        return {"sources": sources, "context": context, "reranked_matches": sorted_candidates}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {}
```

- [ ] **Step 5: typecheck + commit**

```bash
cd backend-python && uv run mypy src/nodes/hybrid_search.py src/nodes/cross_encoder.py \
    src/nodes/mmr.py src/nodes/popularity_rerank.py --ignore-missing-imports
git add backend-python/src/nodes/
git commit -m "feat(python-ai): add retrieval and reranking nodes (hybrid-search, cross-encoder, mmr, popularity-rerank)"
```

---

## Task 8: Generation & Evaluation Nodes

**Files:**
- Create: `backend-python/src/nodes/llm_generation.py`
- Create: `backend-python/src/nodes/judge.py`
- Create: `backend-python/src/nodes/self_reflection.py`
- Create: `backend-python/src/nodes/memory_extractor.py`

- [ ] **Step 1: 建立 `backend-python/src/nodes/llm_generation.py`**

```python
# src/nodes/llm_generation.py
import asyncio
from src.state import GraphState
from src.langfuse_utils import start_span, end_span

GENERATION_SYSTEM = """你是 NobodyClimb 攀岩助理，根據提供的攀岩路線資訊回答問題。
只使用提供的資訊，若資訊不足請誠實說明。回答使用繁體中文。"""


async def llm_generation_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "llm-generation", input={
        "query": state.get("query"),
        "context_length": len(state.get("context") or ""),
    })
    try:
        cf = state["cf"]
        context = state.get("context") or state.get("sql_context") or ""
        memory_summary = state.get("memory_summary") or ""

        user_message = state.get("query", "")
        if context:
            user_message = f"問題：{user_message}\n\n參考資料：\n{context}"
        if memory_summary:
            user_message = f"使用者背景：{memory_summary}\n\n{user_message}"

        result = await cf.chat(
            messages=[
                {"role": "system", "content": GENERATION_SYSTEM},
                {"role": "user", "content": user_message},
            ],
            max_tokens=2048,
        )

        answer = result.get("response", "")
        token_usage = result.get("usage", {})

        end_span(span, output={
            "answer_length": len(answer),
            "prompt_tokens": token_usage.get("prompt_tokens", 0),
            "completion_tokens": token_usage.get("completion_tokens", 0),
        })
        return {"raw_answer": answer, "answer": answer}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"answer": "抱歉，生成回答時發生錯誤。"}
```

- [ ] **Step 2: 建立 `backend-python/src/nodes/judge.py`**

```python
# src/nodes/judge.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span
import json

JUDGE_SYSTEM = """評估 AI 回答的品質。輸出 JSON：
{"groundedness": 1-5, "quality": 1-5}
groundedness: 回答是否有根據提供的資料
quality: 回答的整體品質與實用性"""


async def judge_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "judge")
    try:
        cf = state["cf"]
        answer = state.get("answer") or ""
        context = state.get("context") or ""
        query = state.get("query") or ""

        result = await cf.chat(messages=[
            {"role": "system", "content": JUDGE_SYSTEM},
            {"role": "user", "content": f"問題：{query}\n回答：{answer}\n資料：{context[:500]}"},
        ], max_tokens=50)

        parsed = json.loads(result.get("response", "{}"))
        groundedness = float(parsed.get("groundedness", 4))
        quality = float(parsed.get("quality", 4))

        end_span(span, output={"groundedness": groundedness, "quality": quality})
        return {"groundedness": groundedness, "quality": quality}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"groundedness": 4.0, "quality": 4.0}  # 降級：假設品質良好
```

- [ ] **Step 3: 建立 `backend-python/src/nodes/self_reflection.py`**

```python
# src/nodes/self_reflection.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span

REFLECTION_SYSTEM = """你是一個自我反思的攀岩 AI。
分析當前回答的不足之處，然後生成一個更好的回答。
輸出格式：先分析問題，再輸出改進後的回答（用 === 分隔）"""


async def self_reflection_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "self-reflection", input={
        "loop_count": state.get("loop_count", 0),
        "quality": state.get("quality"),
    })
    try:
        cf = state["cf"]
        query = state.get("query", "")
        current_answer = state.get("answer", "")
        context = state.get("context", "")

        result = await cf.chat(messages=[
            {"role": "system", "content": REFLECTION_SYSTEM},
            {"role": "user", "content": f"問題：{query}\n當前回答：{current_answer}\n資料：{context[:1000]}"},
        ], max_tokens=1500)

        raw = result.get("response", "")
        parts = raw.split("===", 1)
        improved_answer = parts[1].strip() if len(parts) > 1 else current_answer

        loop_count = (state.get("loop_count") or 0) + 1
        end_span(span, output={"loop_count": loop_count, "improved_length": len(improved_answer)})
        return {
            "answer": improved_answer,
            "loop_count": loop_count,
            "self_reflection_triggered": (state.get("self_reflection_triggered") or 0) + 1,
        }
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"loop_count": (state.get("loop_count") or 0) + 1}
```

- [ ] **Step 4: 建立 `backend-python/src/nodes/memory_extractor.py`**

```python
# src/nodes/memory_extractor.py
"""
memory_extractor_node 是非阻塞的（non-blocking）：
- 使用 asyncio.create_task 將實際工作排入背景
- 立即 return {}，graph 繼續到 END
- 不等待記憶體萃取完成
"""
import asyncio
import logging
from src.state import GraphState
from src.langfuse_utils import start_span, end_span

logger = logging.getLogger(__name__)

MEMORY_SYSTEM = """萃取使用者的攀岩偏好和能力資訊（不超過 50 字）。
只輸出摘要，沒有可萃取的資訊時輸出空字串。"""


async def _extract_memory_async(state: GraphState) -> None:
    """實際的記憶體萃取邏輯，在背景執行。"""
    try:
        cf = state["cf"]
        query = state.get("query", "")
        answer = state.get("answer", "")
        user_id = state.get("user_id")
        if not user_id:
            return

        result = await cf.chat(messages=[
            {"role": "system", "content": MEMORY_SYSTEM},
            {"role": "user", "content": f"問題：{query}\n回答：{answer}"},
        ], max_tokens=100)

        memory = result.get("response", "").strip()
        if memory:
            await cf.d1_query(
                "INSERT OR REPLACE INTO user_memory (user_id, summary, updated_at) VALUES (?, ?, datetime('now'))",
                [user_id, memory],
            )
    except Exception as e:
        logger.warning(f"memory extractor background task failed: {e}")


async def memory_extractor_node(state: GraphState) -> dict:
    """非阻塞：排入背景工作，立即 return {} 讓 graph 結束。"""
    # 只 start span，不 end（背景工作完成時無法再更新 span）
    start_span(state.get("langfuse_trace"), "memory-extractor", input={
        "user_id": state.get("user_id"),
    })
    # fire-and-forget
    asyncio.create_task(_extract_memory_async(state))
    return {}  # 立即返回，不等待
```

- [ ] **Step 5: typecheck + commit**

```bash
cd backend-python && uv run mypy src/nodes/ --ignore-missing-imports
git add backend-python/src/nodes/
git commit -m "feat(python-ai): add generation and evaluation nodes (llm-generation, judge, self-reflection, memory-extractor)"
```

---

## Task 9: Routing Functions (Implementation — TDD Green Phase)

**Files:**
- Create: `backend-python/src/routing.py`

- [ ] **Step 1: 建立 `backend-python/src/routing.py`**

```python
# src/routing.py
"""
LangGraph conditional edge functions.
所有函式都是純函式（pure functions），無副作用，輸入 GraphState 輸出 node 名稱字串。
"""
from src.state import GraphState


def route_after_semantic_cache(state: GraphState) -> str:
    if state.get("early_return"):
        return "END"
    return "toolSelection"


def route_after_tool_selection(state: GraphState) -> str:
    if state.get("early_return"):
        return "END"
    query_type = state.get("query_type")
    if query_type == "sql":
        return "textToSql"
    if query_type == "clarification-needed":
        return "END"
    if query_type == "general-knowledge":
        return "llmGeneration"  # 跳過 retrieval
    return "filterBuild"  # vector 路徑：先建 filter，再 embedding


def route_after_text_to_sql(state: GraphState) -> str:
    if state.get("early_return"):
        return "END"  # 澄清需求或 SQL error
    candidates = state.get("sql_candidates")
    if candidates and len(candidates) > 0:
        return "llmGeneration"  # SQL 有結果，直接生成回答
    return "embedding"  # 無結果，fallback 到向量搜尋


def route_after_embedding(state: GraphState) -> str:
    if state.get("embedding_failed"):
        return "hybridSearch"  # BM25-only fallback
    return "hyde"


def route_after_judge(state: GraphState) -> str:
    config = state.get("pipeline_config") or {}
    quality = state.get("quality") or 4.0
    loop_count = state.get("loop_count") or 0
    context = state.get("context") or ""

    if (
        quality <= config.get("judge_regen_quality_max", 3)
        and loop_count < config.get("max_pipeline_loops", 2)
        and len(context) >= config.get("self_reflection_min_length", 50)
    ):
        return "selfReflection"
    return "memoryExtractor"


def route_after_self_reflection(state: GraphState) -> str:
    """
    loopBack.target_phase === 'retrieval' → 回到 hybridSearch（重新搜尋）
    否則 → 回到 llmGeneration（重新生成）
    """
    loop_back = state.get("loop_back") or {}
    if loop_back.get("target_phase") == "retrieval":
        return "hybridSearch"
    return "llmGeneration"


def route_agentic_decision(state: GraphState) -> str:
    if state.get("early_return"):
        return "END"
    trace = state.get("trace") or {}
    if trace.get("last_agentic_action") == "ANSWER":
        return "llmGeneration"
    return "agenticRetrieve"


def route_after_agentic_retrieve(state: GraphState) -> str:
    config = state.get("pipeline_config") or {}
    loop_count = state.get("loop_count") or 0
    candidates = state.get("candidate_matches") or []

    if loop_count >= config.get("agentic_max_steps", 5):
        return "llmGeneration"
    if len(candidates) >= config.get("agentic_min_docs_to_answer", 3):
        return "llmGeneration"
    return "agenticDecision"
```

- [ ] **Step 2: 執行測試，確認全部通過（TDD Green phase）**

```bash
cd backend-python && uv run pytest tests/test_routing.py -v
```

Expected:
```
tests/test_routing.py::test_semantic_cache_early_return PASSED
tests/test_routing.py::test_semantic_cache_no_early_return PASSED
... (all 20+ tests PASSED)
20 passed in 0.xx s
```

- [ ] **Step 3: commit**

```bash
git add backend-python/src/routing.py
git commit -m "feat(python-ai): implement routing functions (TDD green phase, all tests pass)"
```

---

## Task 10: Baseline Graph Assembly

**Files:**
- Create: `backend-python/src/graphs/baseline.py`
- Create: `backend-python/tests/test_graphs/test_baseline.py`

- [ ] **Step 1: 先寫整合測試**

```python
# tests/test_graphs/test_baseline.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.graphs.baseline import build_baseline_graph
from src.state import GraphState


@pytest.fixture
def mock_cf():
    cf = AsyncMock()
    cf.d1_query.return_value = []  # cache miss
    cf.chat.return_value = {"response": '{"query_type": "vector", "confidence": 0.9}'}
    cf.embed.return_value = [[0.1, 0.2, 0.3]]
    cf.vectorize_query.return_value = [
        {"id": "1", "name": "龍洞南壁 5.10a", "description": "經典入門路線", "grade": "5.10a", "crag_name": "龍洞"}
    ]
    return cf


@pytest.fixture
def base_state(mock_cf) -> GraphState:
    return {
        "query": "台灣有哪些適合初學者的攀岩路線？",
        "user_id": "user-1",
        "cf": mock_cf,
        "langfuse_trace": None,
        "pipeline_config": {
            "rag_strategy": "baseline",
            "judge_regen_quality_max": 3,
            "max_pipeline_loops": 2,
            "self_reflection_min_length": 50,
            "mmr_lambda": 0.7,
            "mmr_top_k": 8,
            "popularity_weight": 0.1,
        },
        "cache_key": "test-cache-key",
        "cache_ttl": 3600,
        "loop_count": 0,
        "degraded_stages": [],
        "candidate_matches": [],
        "trace": {},
    }


@pytest.mark.asyncio
async def test_baseline_graph_runs_to_completion(base_state, mock_cf):
    """Baseline graph 應該能夠執行完整 pipeline 並回傳 answer。"""
    # Judge → memoryExtractor（品質良好，不觸發 self-reflection）
    mock_cf.chat.side_effect = [
        {"response": '{"query_type": "vector", "confidence": 0.9}'},  # tool-selection
        {"response": "龍洞南壁有多條 5.10a 路線，非常適合初學者。"},  # llm-generation
        {"response": '{"groundedness": 5, "quality": 5}'},             # judge
    ]

    graph = build_baseline_graph()
    final_state = await graph.ainvoke(base_state)

    assert final_state.get("answer") is not None
    assert len(final_state["answer"]) > 0


@pytest.mark.asyncio
async def test_baseline_cache_hit_short_circuits(base_state, mock_cf):
    """Cache hit 時應直接 early return，不執行 retrieval。"""
    mock_cf.d1_query.return_value = [{"answer": "快取的回答"}]  # cache hit

    graph = build_baseline_graph()
    final_state = await graph.ainvoke(base_state)

    assert final_state.get("early_return") is not None
    assert final_state["early_return"]["type"] == "cache-hit"
    # 確認沒有呼叫 vectorize_query（沒有做 retrieval）
    mock_cf.vectorize_query.assert_not_called()
```

- [ ] **Step 2: 執行測試確認 fail**

```bash
cd backend-python && uv run pytest tests/test_graphs/test_baseline.py -v
```

Expected: `ModuleNotFoundError: No module named 'src.graphs.baseline'`

- [ ] **Step 3: 建立 `backend-python/src/graphs/baseline.py`**

```python
# src/graphs/baseline.py
from langgraph.graph import StateGraph, END, START
from src.state import GraphState
from src.nodes.semantic_cache import semantic_cache_node
from src.nodes.tool_selection import tool_selection_node
from src.nodes.filter_build import filter_build_node
from src.nodes.text_to_sql import text_to_sql_node
from src.nodes.embedding import embedding_node
from src.nodes.hyde import hyde_node
from src.nodes.multi_query import multi_query_node
from src.nodes.hybrid_search import hybrid_search_node
from src.nodes.cross_encoder import cross_encoder_node
from src.nodes.mmr import mmr_node
from src.nodes.popularity_rerank import popularity_rerank_node
from src.nodes.llm_generation import llm_generation_node
from src.nodes.judge import judge_node
from src.nodes.self_reflection import self_reflection_node
from src.nodes.memory_extractor import memory_extractor_node
from src.routing import (
    route_after_semantic_cache,
    route_after_tool_selection,
    route_after_text_to_sql,
    route_after_embedding,
    route_after_judge,
    route_after_self_reflection,
)


def build_baseline_graph():
    graph = StateGraph(GraphState)

    # Nodes
    graph.add_node("semanticCache", semantic_cache_node)
    graph.add_node("toolSelection", tool_selection_node)
    graph.add_node("filterBuild", filter_build_node)       # Issue 1: between toolSelection and embedding
    graph.add_node("textToSql", text_to_sql_node)
    graph.add_node("embedding", embedding_node)
    graph.add_node("hyde", hyde_node)
    graph.add_node("multiQuery", multi_query_node)
    graph.add_node("hybridSearch", hybrid_search_node)
    graph.add_node("crossEncoder", cross_encoder_node)
    graph.add_node("mmr", mmr_node)
    graph.add_node("popularityRerank", popularity_rerank_node)
    graph.add_node("llmGeneration", llm_generation_node)
    graph.add_node("judge", judge_node)
    graph.add_node("selfReflection", self_reflection_node)
    graph.add_node("memoryExtractor", memory_extractor_node)

    # Edges
    graph.add_edge(START, "semanticCache")
    graph.add_conditional_edges("semanticCache", route_after_semantic_cache, {
        "END": END,
        "toolSelection": "toolSelection",
    })
    graph.add_conditional_edges("toolSelection", route_after_tool_selection, {
        "textToSql": "textToSql",
        "filterBuild": "filterBuild",       # vector 路徑
        "llmGeneration": "llmGeneration",   # general-knowledge 路徑
        "END": END,
    })
    graph.add_edge("filterBuild", "embedding")  # filterBuild → embedding
    graph.add_conditional_edges("textToSql", route_after_text_to_sql, {
        "llmGeneration": "llmGeneration",   # SQL 有結果
        "embedding": "embedding",           # fallback
        "END": END,
    })
    graph.add_conditional_edges("embedding", route_after_embedding, {
        "hyde": "hyde",
        "hybridSearch": "hybridSearch",
    })
    graph.add_edge("hyde", "multiQuery")
    graph.add_edge("multiQuery", "hybridSearch")
    graph.add_edge("hybridSearch", "crossEncoder")
    graph.add_edge("crossEncoder", "mmr")
    graph.add_edge("mmr", "popularityRerank")
    graph.add_edge("popularityRerank", "llmGeneration")
    graph.add_edge("llmGeneration", "judge")
    graph.add_conditional_edges("judge", route_after_judge, {
        "selfReflection": "selfReflection",
        "memoryExtractor": "memoryExtractor",
    })
    # Issue 3: selfReflection 可以 loopback 到 retrieval 或 generation 階段
    graph.add_conditional_edges("selfReflection", route_after_self_reflection, {
        "hybridSearch": "hybridSearch",   # retrieval-phase loopback
        "llmGeneration": "llmGeneration", # generation-phase loopback (default)
    })
    graph.add_edge("memoryExtractor", END)

    return graph.compile()


baseline_graph = build_baseline_graph()
```

- [ ] **Step 4: 執行測試確認通過**

```bash
cd backend-python && uv run pytest tests/test_graphs/test_baseline.py -v
```

Expected: 2 passed

- [ ] **Step 5: commit**

```bash
git add backend-python/src/graphs/baseline.py backend-python/tests/test_graphs/test_baseline.py
git commit -m "feat(python-ai): assemble baseline RAG strategy LangGraph"
```

---

## Task 11: Agentic Graph Assembly

**Files:**
- Create: `backend-python/src/nodes/agentic_decision.py`
- Create: `backend-python/src/nodes/agentic_retrieve.py`
- Create: `backend-python/src/graphs/agentic.py`

- [ ] **Step 1: 建立 `backend-python/src/nodes/agentic_decision.py`**

```python
# src/nodes/agentic_decision.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span
import json

AGENTIC_DECISION_SYSTEM = """你是 ReAct 攀岩查詢 AI。決定下一步動作：
RETRIEVE:<query> - 搜尋更多資料
ANSWER - 已有足夠資料，準備生成回答
輸出 JSON：{"action": "RETRIEVE"|"ANSWER", "retrieve_query": "搜尋詞（RETRIEVE 時）"}"""


async def agentic_decision_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "agentic-decision")
    try:
        cf = state["cf"]
        candidates = state.get("candidate_matches") or []
        context_summary = "\n".join([
            c.get("description", c.get("name", ""))[:100]
            for c in candidates[:5]
        ])
        result = await cf.chat(messages=[
            {"role": "system", "content": AGENTIC_DECISION_SYSTEM},
            {"role": "user", "content": f"問題：{state.get('query')}\n已知資料：{context_summary}"},
        ], max_tokens=100)

        parsed = json.loads(result.get("response", "{}"))
        action = parsed.get("action", "ANSWER")

        trace = dict(state.get("trace") or {})
        trace["last_agentic_action"] = action
        trace["agentic_retrieve_query"] = parsed.get("retrieve_query", "")

        end_span(span, output={"action": action})
        return {"trace": trace}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        trace = dict(state.get("trace") or {})
        trace["last_agentic_action"] = "ANSWER"
        return {"trace": trace}
```

- [ ] **Step 2: 建立 `backend-python/src/nodes/agentic_retrieve.py`**

```python
# src/nodes/agentic_retrieve.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span


async def agentic_retrieve_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "agentic-retrieve")
    try:
        cf = state["cf"]
        trace = state.get("trace") or {}
        retrieve_query = trace.get("agentic_retrieve_query") or state.get("query", "")

        # Embed the retrieve query
        vectors = await cf.embed([retrieve_query])
        query_vector = vectors[0]

        # Vector search
        new_matches = await cf.vectorize_query(
            vector=query_vector,
            top_k=10,
            filter=state.get("vector_filter"),
        )

        # Merge with existing candidates (deduplicate by id)
        existing = {str(c.get("id")): c for c in (state.get("candidate_matches") or [])}
        for m in new_matches:
            existing[str(m.get("id", ""))] = m

        merged = list(existing.values())
        loop_count = (state.get("loop_count") or 0) + 1

        end_span(span, output={"new_matches": len(new_matches), "total_matches": len(merged)})
        return {
            "candidate_matches": merged,
            "loop_count": loop_count,
            "query_vector": query_vector,
        }
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"loop_count": (state.get("loop_count") or 0) + 1}
```

- [ ] **Step 3: 建立 `backend-python/src/graphs/agentic.py`**

```python
# src/graphs/agentic.py
from langgraph.graph import StateGraph, END, START
from src.state import GraphState
from src.nodes.semantic_cache import semantic_cache_node
from src.nodes.tool_selection import tool_selection_node
from src.nodes.filter_build import filter_build_node
from src.nodes.agentic_decision import agentic_decision_node
from src.nodes.agentic_retrieve import agentic_retrieve_node
from src.nodes.llm_generation import llm_generation_node
from src.nodes.judge import judge_node
from src.nodes.memory_extractor import memory_extractor_node
from src.routing import (
    route_after_semantic_cache,
    route_after_tool_selection,
    route_agentic_decision,
    route_after_agentic_retrieve,
    route_after_judge,
)


def build_agentic_graph():
    graph = StateGraph(GraphState)

    graph.add_node("semanticCache", semantic_cache_node)
    graph.add_node("toolSelection", tool_selection_node)
    graph.add_node("filterBuild", filter_build_node)        # Issue 1
    graph.add_node("agenticDecision", agentic_decision_node)
    graph.add_node("agenticRetrieve", agentic_retrieve_node)
    graph.add_node("llmGeneration", llm_generation_node)
    graph.add_node("judge", judge_node)
    graph.add_node("memoryExtractor", memory_extractor_node)

    graph.add_edge(START, "semanticCache")
    graph.add_conditional_edges("semanticCache", route_after_semantic_cache, {
        "END": END,
        "toolSelection": "toolSelection",
    })
    graph.add_conditional_edges("toolSelection", route_after_tool_selection, {
        "filterBuild": "filterBuild",
        "llmGeneration": "llmGeneration",   # general-knowledge
        "textToSql": "agenticDecision",     # SQL in agentic handled by agenticDecision
        "END": END,
    })
    graph.add_edge("filterBuild", "agenticDecision")
    graph.add_conditional_edges("agenticDecision", route_agentic_decision, {
        "agenticRetrieve": "agenticRetrieve",
        "llmGeneration": "llmGeneration",
        "END": END,
    })
    graph.add_conditional_edges("agenticRetrieve", route_after_agentic_retrieve, {
        "agenticDecision": "agenticDecision",
        "llmGeneration": "llmGeneration",
    })
    graph.add_edge("llmGeneration", "judge")
    graph.add_conditional_edges("judge", route_after_judge, {
        "selfReflection": "llmGeneration",  # agentic: 直接重新生成
        "memoryExtractor": "memoryExtractor",
    })
    graph.add_edge("memoryExtractor", END)

    return graph.compile()


agentic_graph = build_agentic_graph()
```

- [ ] **Step 4: typecheck + commit**

```bash
cd backend-python && uv run mypy src/graphs/agentic.py src/nodes/agentic_*.py --ignore-missing-imports
git add backend-python/src/nodes/agentic_decision.py backend-python/src/nodes/agentic_retrieve.py \
        backend-python/src/graphs/agentic.py
git commit -m "feat(python-ai): assemble agentic ReAct strategy LangGraph"
```

---

## Task 12: Plan-and-Execute Graph Assembly (Native Python Async Parallelism)

**Files:**
- Create: `backend-python/src/nodes/planning.py`
- Create: `backend-python/src/nodes/execute_plan_step.py`
- Create: `backend-python/src/nodes/synthesis.py`
- Create: `backend-python/src/graphs/plan_execute.py`

Python 版的 Plan-and-Execute 可以利用 `asyncio.gather` 原生並行，不依賴 LangGraph `Send` API（Python `Send` API 也支援，但 `asyncio.gather` 更直觀）。

- [ ] **Step 1: 建立 `backend-python/src/nodes/planning.py`**

```python
# src/nodes/planning.py
from src.state import GraphState
from src.langfuse_utils import start_span, end_span
import json

PLANNING_SYSTEM = """分解使用者的複雜攀岩查詢為 2-4 個獨立的子查詢。
輸出 JSON 陣列，每個步驟包含：
[{"id": 1, "query": "子查詢", "tool": "vector"|"sql", "filters": {}}]"""


async def planning_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "planning", input={"query": state.get("query")})
    try:
        cf = state["cf"]
        result = await cf.chat(messages=[
            {"role": "system", "content": PLANNING_SYSTEM},
            {"role": "user", "content": state.get("query", "")},
        ], max_tokens=300)

        plan_steps = json.loads(result.get("response", "[]"))
        end_span(span, output={"step_count": len(plan_steps)})
        return {
            "multi_tool_plan": {"steps": plan_steps},
            "trace": {**(state.get("trace") or {}), "plan_steps": plan_steps},
        }
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        # Fallback: 單步計畫
        return {"multi_tool_plan": {"steps": [{"id": 1, "query": state.get("query", ""), "tool": "vector", "filters": {}}]}}
```

- [ ] **Step 2: 建立 `backend-python/src/nodes/execute_plan_step.py`**

```python
# src/nodes/execute_plan_step.py
"""
執行單一 plan step 的搜尋。
在 plan_execute graph 中，由 dispatch_plan_steps 並行呼叫多次。
"""
from src.state import GraphState
from src.langfuse_utils import start_span, end_span


async def execute_plan_step_node(state: GraphState, step: dict) -> dict:
    """執行單一 plan step（vector 或 SQL 搜尋）"""
    span = start_span(state.get("langfuse_trace"), f"execute-plan-step-{step.get('id')}", input=step)
    try:
        cf = state["cf"]
        tool = step.get("tool", "vector")
        query = step.get("query", "")
        filters = step.get("filters", {})

        if tool == "sql":
            rows = await cf.d1_query(query, [])
            end_span(span, output={"row_count": len(rows)})
            return {"step_id": step["id"], "results": rows, "type": "sql"}
        else:
            vectors = await cf.embed([query])
            matches = await cf.vectorize_query(vector=vectors[0], top_k=10, filter=filters or None)
            end_span(span, output={"match_count": len(matches)})
            return {"step_id": step["id"], "results": matches, "type": "vector"}
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {"step_id": step.get("id"), "results": [], "type": "error"}
```

- [ ] **Step 3: 建立 `backend-python/src/nodes/synthesis.py`**

```python
# src/nodes/synthesis.py
import json
from src.state import GraphState
from src.langfuse_utils import start_span, end_span

SYNTHESIS_SYSTEM = """根據多個子查詢的結果，組裝完整的搜尋上下文。
合併去重，保留最相關的資訊。"""


async def synthesis_node(state: GraphState) -> dict:
    span = start_span(state.get("langfuse_trace"), "synthesis")
    try:
        branch_results = state.get("branch_results") or []

        # Deduplicate by id
        seen_ids: set = set()
        merged: list[dict] = []
        for result in branch_results:
            for item in result.get("results", []):
                item_id = str(item.get("id", ""))
                if item_id and item_id not in seen_ids:
                    seen_ids.add(item_id)
                    merged.append(item)

        # Build context string
        context_parts = [
            f"[{i+1}] {item.get('name', '')} ({item.get('grade', '')}): {item.get('description', '')[:200]}"
            for i, item in enumerate(merged[:10])
        ]
        context = "\n\n".join(context_parts)

        end_span(span, output={"merged_count": len(merged)})
        return {
            "candidate_matches": merged,
            "context": context,
            "sources": merged[:8],
        }
    except Exception as e:
        end_span(span, output=None, level="ERROR", metadata={"error": str(e)})
        return {}
```

- [ ] **Step 4: 建立 `backend-python/src/graphs/plan_execute.py`**

```python
# src/graphs/plan_execute.py
"""
Plan-and-Execute graph.

Python 版使用原生 asyncio.gather 實現並行步驟執行，
比 LangGraph Send API 更直觀，且支援循序依賴步驟（可在 dispatch node 內串接）。

注意：若需要循序執行（step B 依賴 step A），在 dispatch_plan_steps_node 中
使用迴圈依序 await，而非 asyncio.gather。
"""
import asyncio
from langgraph.graph import StateGraph, END, START
from src.state import GraphState
from src.nodes.semantic_cache import semantic_cache_node
from src.nodes.planning import planning_node
from src.nodes.execute_plan_step import execute_plan_step_node
from src.nodes.synthesis import synthesis_node
from src.nodes.llm_generation import llm_generation_node
from src.nodes.judge import judge_node
from src.nodes.memory_extractor import memory_extractor_node
from src.routing import route_after_semantic_cache, route_after_judge


async def dispatch_plan_steps_node(state: GraphState) -> dict:
    """
    並行分派所有 plan steps（asyncio.gather）。

    限制：假設所有步驟互相獨立可並行。
    若有循序依賴，改用迴圈依序 await execute_plan_step_node。
    """
    plan = state.get("multi_tool_plan") or {}
    steps = plan.get("steps", [])

    if not steps:
        return {"branch_results": []}

    # 所有步驟並行執行
    step_results = await asyncio.gather(
        *[execute_plan_step_node(state, step) for step in steps],
        return_exceptions=True,
    )

    # 過濾掉 exception
    valid_results = [r for r in step_results if not isinstance(r, Exception)]
    return {"branch_results": valid_results}


def build_plan_execute_graph():
    graph = StateGraph(GraphState)

    graph.add_node("semanticCache", semantic_cache_node)
    graph.add_node("planning", planning_node)
    graph.add_node("dispatchPlanSteps", dispatch_plan_steps_node)  # 並行執行所有步驟
    graph.add_node("synthesis", synthesis_node)
    graph.add_node("llmGeneration", llm_generation_node)
    graph.add_node("judge", judge_node)
    graph.add_node("memoryExtractor", memory_extractor_node)

    graph.add_edge(START, "semanticCache")
    graph.add_conditional_edges("semanticCache", route_after_semantic_cache, {
        "END": END,
        "toolSelection": "planning",   # 跳過 toolSelection，直接進入 planning
    })
    graph.add_edge("planning", "dispatchPlanSteps")
    graph.add_edge("dispatchPlanSteps", "synthesis")
    graph.add_edge("synthesis", "llmGeneration")
    graph.add_edge("llmGeneration", "judge")
    graph.add_conditional_edges("judge", route_after_judge, {
        "selfReflection": "llmGeneration",  # plan-execute: 直接重新生成
        "memoryExtractor": "memoryExtractor",
    })
    graph.add_edge("memoryExtractor", END)

    return graph.compile()


plan_execute_graph = build_plan_execute_graph()
```

- [ ] **Step 5: typecheck + commit**

```bash
cd backend-python && uv run mypy src/graphs/plan_execute.py --ignore-missing-imports
git add backend-python/src/graphs/ backend-python/src/nodes/planning.py \
        backend-python/src/nodes/execute_plan_step.py backend-python/src/nodes/synthesis.py
git commit -m "feat(python-ai): assemble plan-and-execute strategy with native asyncio.gather parallelism"
```

---

## Task 13: FastAPI App + SSE Streaming Endpoint

**Files:**
- Modify: `backend-python/src/main.py`
- Create: `backend-python/tests/test_api.py`

- [ ] **Step 1: 先寫 API 測試**

```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock


@pytest.fixture
def client():
    with patch("src.main.get_settings") as mock_settings, \
         patch("src.main.CloudflareClient") as MockCF:

        mock_settings.return_value.cloudflare_account_id = "test"
        mock_settings.return_value.cloudflare_api_token = "test"
        mock_settings.return_value.cloudflare_d1_database_id = "test"
        mock_settings.return_value.langfuse_public_key = None
        mock_settings.return_value.langfuse_secret_key = None

        cf_instance = AsyncMock()
        cf_instance.d1_query.return_value = []
        cf_instance.chat.return_value = {"response": '{"query_type": "vector", "confidence": 0.9}'}
        cf_instance.embed.return_value = [[0.1] * 768]
        cf_instance.vectorize_query.return_value = []
        MockCF.return_value = cf_instance

        from src.main import app
        with TestClient(app) as c:
            yield c


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_ask_endpoint_returns_200(client):
    resp = client.post("/ask", json={
        "query": "台灣有什麼攀岩路線？",
        "user_id": "user-1",
        "rag_strategy": "baseline",
    })
    assert resp.status_code == 200
```

- [ ] **Step 2: 更新 `backend-python/src/main.py`**

```python
# src/main.py
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from src.config import get_settings
from src.cf_client import CloudflareClient
from src.langfuse_utils import get_langfuse_client, create_trace, flush_langfuse
from src.graphs.baseline import build_baseline_graph
from src.graphs.agentic import build_agentic_graph
from src.graphs.plan_execute import build_plan_execute_graph
from src.state import GraphState

logger = logging.getLogger(__name__)

# Pre-compile graphs at startup
_baseline_graph = build_baseline_graph()
_agentic_graph = build_agentic_graph()
_plan_execute_graph = build_plan_execute_graph()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Python AI Service starting up")
    yield
    logger.info("Python AI Service shutting down")


app = FastAPI(
    title="NobodyClimb Python AI Service",
    version="0.1.0",
    lifespan=lifespan,
)


class AskRequest(BaseModel):
    query: str
    user_id: str | None = None
    session_id: str | None = None
    rag_strategy: str = "baseline"
    stream: bool = False
    pipeline_config: dict = {}


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    filter: dict | None = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/ask")
async def ask(req: AskRequest):
    settings = get_settings()
    cf = CloudflareClient(settings)
    langfuse = get_langfuse_client(settings)

    default_config = {
        "rag_strategy": req.rag_strategy,
        "judge_regen_quality_max": 3,
        "max_pipeline_loops": 2,
        "self_reflection_min_length": 50,
        "mmr_lambda": 0.7,
        "mmr_top_k": 8,
        "popularity_weight": 0.1,
        "agentic_max_steps": 5,
        "agentic_min_docs_to_answer": 3,
    }
    config = {**default_config, **req.pipeline_config}

    trace = create_trace(langfuse, name="ai-pipeline", user_id=req.user_id,
                         session_id=req.session_id, input={"query": req.query},
                         metadata={"strategy": req.rag_strategy})

    initial_state: GraphState = {
        "query": req.query,
        "user_id": req.user_id,
        "session_id": req.session_id,
        "pipeline_config": config,
        "cache_key": f"ask:{req.query[:100]}",
        "cache_ttl": 3600,
        "loop_count": 0,
        "degraded_stages": [],
        "candidate_matches": [],
        "trace": {},
        "cf": cf,
        "langfuse_trace": trace,
        "streaming_mode": req.stream,
        "branch_results": [],
    }

    # Select graph
    if req.rag_strategy == "agentic":
        graph = _agentic_graph
    elif req.rag_strategy == "plan-execute":
        graph = _plan_execute_graph
    else:
        graph = _baseline_graph

    if req.stream:
        token_queue: asyncio.Queue = asyncio.Queue()
        initial_state["token_queue"] = token_queue

        async def event_generator() -> AsyncGenerator[dict, None]:
            async def run_graph():
                final_state = await graph.ainvoke(initial_state, {"recursion_limit": 20})
                # Issue 5: update trace BEFORE flush
                if trace:
                    trace.update(output=final_state.get("answer"))
                await flush_langfuse(langfuse)
                await cf.close()
                await token_queue.put(None)  # sentinel

            asyncio.create_task(run_graph())

            while True:
                token = await token_queue.get()
                if token is None:
                    break
                yield {"data": json.dumps({"token": token})}

            yield {"data": json.dumps({"done": True})}

        return EventSourceResponse(event_generator())
    else:
        final_state = await graph.ainvoke(initial_state, {"recursion_limit": 20})
        # Issue 5: update trace BEFORE flush
        if trace:
            trace.update(output=final_state.get("answer"))
        await flush_langfuse(langfuse)
        await cf.close()

        return {
            "answer": final_state.get("answer"),
            "sources": final_state.get("sources") or [],
            "suggested_questions": final_state.get("suggested_questions") or [],
            "early_return": final_state.get("early_return"),
            "degraded_stages": final_state.get("degraded_stages") or [],
        }


@app.get("/search")
async def search(query: str, top_k: int = 10):
    settings = get_settings()
    cf = CloudflareClient(settings)
    try:
        vectors = await cf.embed([query])
        matches = await cf.vectorize_query(vector=vectors[0], top_k=top_k)
        return {"results": matches}
    finally:
        await cf.close()
```

- [ ] **Step 3: 執行 API 測試**

```bash
cd backend-python && uv run pytest tests/test_api.py -v
```

Expected: 2 passed

- [ ] **Step 4: 手動測試（non-streaming）**

```bash
cd backend-python && uv run uvicorn src.main:app --reload --port 8000 &
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "台灣有哪些攀岩路線？", "rag_strategy": "baseline"}'
```

- [ ] **Step 5: commit**

```bash
git add backend-python/src/main.py backend-python/tests/test_api.py
git commit -m "feat(python-ai): add FastAPI app with /ask (SSE streaming) and /search endpoints"
```

---

## Task 14: Proxy Integration in TS Backend

**Files:**
- Modify: `backend/src/services/query/index.ts`
- Modify: `backend/src/services/pipeline/types.ts`

TS backend 加入 `use_python_ai_service` feature flag，將請求 proxy 至 Python 服務。

- [ ] **Step 1: 在 `PipelineConfig` 加入 `use_python_ai_service`**

```typescript
// backend/src/services/pipeline/types.ts
use_python_ai_service?: boolean;
python_ai_service_url?: string;  // 預設 'http://localhost:8000'
```

- [ ] **Step 2: 在 `Env` 型別加入 Python 服務 URL**

```typescript
// backend/src/types/index.ts
PYTHON_AI_SERVICE_URL?: string;
```

- [ ] **Step 3: 在 QueryService 加入 proxy 邏輯**

```typescript
// backend/src/services/query/index.ts

async function proxyToPythonAiService(
  ctx: PipelineContext,
  pythonServiceUrl: string,
): Promise<PipelineContext> {
  const response = await fetch(`${pythonServiceUrl}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: ctx.request.query,
      user_id: ctx.userId,
      session_id: ctx.request.sessionId,
      rag_strategy: ctx.pipelineConfig.rag_strategy ?? 'baseline',
      stream: ctx.streamingMode ?? false,
      pipeline_config: ctx.pipelineConfig,
    }),
    signal: ctx.abortSignal,
  });

  if (!response.ok) {
    throw new Error(`Python AI service responded with ${response.status}`);
  }

  const data = await response.json() as {
    answer: string;
    sources: unknown[];
    early_return: unknown | null;
  };

  return {
    ...ctx,
    answer: data.answer,
    sources: data.sources as PipelineContext['sources'],
    finalResponse: { answer: data.answer, sources: data.sources as PipelineContext['sources'] },
  };
}

// 在主流程中：
const usePythonService = ctx.pipelineConfig.use_python_ai_service === true;
const pythonServiceUrl = ctx.env.PYTHON_AI_SERVICE_URL ?? 'http://localhost:8000';

if (usePythonService) {
  const result = await proxyToPythonAiService(ctx, pythonServiceUrl);
  return result.finalResponse!;
} else if (useNewEngine) {
  const result = await runAIGraph(ctx);
  return result.finalResponse!;
} else {
  await engine.run(ctx);
  return ctx.finalResponse!;
}
```

- [ ] **Step 4: 加入 wrangler.toml 環境變數說明**

```toml
# Python AI Service proxy（optional）
# PYTHON_AI_SERVICE_URL = "https://your-python-service.fly.dev"
```

- [ ] **Step 5: typecheck**

```bash
cd backend && pnpm typecheck
```

- [ ] **Step 6: commit**

```bash
git add backend/src/services/query/index.ts backend/src/services/pipeline/types.ts \
        backend/src/types/index.ts backend/wrangler.toml
git commit -m "feat(ai): add use_python_ai_service feature flag, proxy to Python AI service"
```

---

## Task 15: Docker Setup + Deployment

**Files:**
- Create: `backend-python/Dockerfile`
- Create: `backend-python/docker-compose.yml`
- Create: `backend-python/.dockerignore`

- [ ] **Step 1: 建立 `backend-python/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Install dependencies (no dev deps)
RUN uv sync --no-dev

# Copy source
COPY src/ ./src/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

- [ ] **Step 2: 建立 `backend-python/docker-compose.yml`（本機開發用）**

```yaml
version: "3.9"
services:
  python-ai:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    environment:
      - LOG_LEVEL=debug
    volumes:
      - ./src:/app/src  # hot reload during dev
    command: uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

- [ ] **Step 3: 建立 `.dockerignore`**

```
.git
.venv
__pycache__
*.pyc
*.pyo
.pytest_cache
tests/
.env
.env.*
!.env.example
```

- [ ] **Step 4: 本機 Docker 建置測試**

```bash
cd backend-python
docker build -t nobodyclimb-python-ai .
docker run --rm -p 8000:8000 --env-file .env nobodyclimb-python-ai &
sleep 5
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: 部署至 Fly.io（選擇性，視需求）**

```bash
cd backend-python
fly launch --name nobodyclimb-python-ai --region nrt --no-deploy
# 設定 secrets
fly secrets set CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_TOKEN=xxx \
    CLOUDFLARE_D1_DATABASE_ID=xxx LANGFUSE_PUBLIC_KEY=xxx LANGFUSE_SECRET_KEY=xxx
# 部署
fly deploy
```

- [ ] **Step 6: 驗測 Fly.io 部署**

```bash
curl https://nobodyclimb-python-ai.fly.dev/health
curl -X POST https://nobodyclimb-python-ai.fly.dev/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "龍洞有什麼路線？", "rag_strategy": "baseline"}'
```

- [ ] **Step 7: 在 TS backend 設定 Fly.io URL**

```bash
wrangler secret put PYTHON_AI_SERVICE_URL --env preview
# 輸入：https://nobodyclimb-python-ai.fly.dev
```

- [ ] **Step 8: 執行全部測試**

```bash
cd backend-python && uv run pytest --tb=short
```

Expected: 全部通過

- [ ] **Step 9: commit**

```bash
git add backend-python/Dockerfile backend-python/docker-compose.yml backend-python/.dockerignore
git commit -m "feat(python-ai): add Docker setup and Fly.io deployment config"
```

---

## 關鍵注意事項

1. **TypedDict vs Annotation**：Python LangGraph 使用 `TypedDict`（`total=False`），讓 node 只需回傳更新的欄位。LangGraph 自動 merge state（last-write-wins）。若需要 append reducer（如 `degraded_stages`），在 node 內手動 merge：`(state.get("degraded_stages") or []) + ["new-stage"]`。

2. **asyncio.gather 並行**：Plan-and-Execute 使用 `asyncio.gather` 原生並行，比 JS 的 `Send` API 更直觀。所有步驟共享同一個 event loop，無需特殊配置。

3. **Langfuse Python SDK**：使用 `@observe` decorator 可以自動追蹤 function 呼叫（比 JS 版的手動 span 更方便）。但本計畫為了與 JS 版保持架構一致，使用手動 span 方式。若要更 Pythonic，可改用 `@observe`：
   ```python
   from langfuse.decorators import observe, langfuse_context
   @observe()
   async def semantic_cache_node(state: GraphState) -> dict:
       ...
   ```

4. **request-scoped `CloudflareClient`**：每個請求建立一個新的 `httpx.AsyncClient`，請求結束後呼叫 `cf.close()` 釋放連線。不使用 module-level singleton。

5. **Langfuse client 不共享**：`get_langfuse_client()` 每次呼叫建立新實例（無 singleton）。Python 是長期運行的進程（不像 Workers 是 request-scoped），更需要確保不同請求的 trace 不混用。

6. **JSON 序列化**：`video_count_map` 和 `latest_video_map` 使用 `dict[str, X]` 而非 `dict[str, X]`（Python 原生 dict 可 JSON 序列化，不需要特別處理）。

7. **SSE Streaming**：使用 `sse-starlette` 套件實作 Server-Sent Events。LLM token streaming 透過 `asyncio.Queue` 在 graph 執行與 HTTP response 之間傳遞，不阻塞 event loop。

8. **Worker 數量**：Docker CMD 使用 `--workers 2`，適合 I/O-bound 的 AI pipeline。若需要更高並發，可改用 `--workers 4` 或搭配 Gunicorn。

9. **Python 與 TS 版本並行**：兩個服務共享同一個 Cloudflare D1 / Vectorize 資料，透過 `use_python_ai_service` / `use_langgraph_engine` 兩個獨立的 feature flag 控制路由，可以逐步從舊引擎遷移。

10. **mypy 型別檢查**：`langgraph` 和 `langfuse` 的 Python stubs 不完整，使用 `--ignore-missing-imports`。核心業務邏輯（state.py, routing.py）應嚴格型別化。
