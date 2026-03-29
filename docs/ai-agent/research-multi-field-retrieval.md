# 多欄位混合語意搜尋的屬性衝突問題與解決方案

> 研究主題：當向量搜尋混淆「名稱相似」與「屬性相似」時，如何正確檢索結構化實體？
> 適用情境：攀岩路線推薦系統（名稱 + 難度 + 類型 + 地點等多欄位實體）

---

## 1. 問題描述

在攀岩路線推薦系統中，一條路線包含多個結構化欄位：

| 欄位     | 範例     |
| -------- | -------- |
| 路線名稱 | 美人照鏡 |
| 難度等級 | 5.11b    |
| 岩場     | 龍洞     |
| 路線類型 | Sport    |
| 岩質     | 砂岩     |

當使用者查詢「我完攀了美人照鏡 5.11b，推薦我類似難度的路線」時，系統使用 bge-m3 將查詢文字轉為向量進行相似度搜尋。問題在於：embedding 模型會將「美人照鏡」和「5.11b」的語意信號混合成單一向量，而名稱作為獨特的文字片段往往佔據更強的語意權重，導致搜尋結果偏向**名稱相似**的路線，而非**難度相似**的路線。

---

## 2. 問題根因分析

### 2.1 Embedding 的屬性混淆（Attribute Conflation）

Dense embedding 模型（如 bge-m3、text-embedding-3-small）的設計目的是捕捉**整體語意相似度**。當一段文字同時包含多種屬性時，模型無法區分使用者關注的是哪一個屬性。這在資訊檢索領域被稱為 **attribute conflation** 或 **dimension collapse**。

具體原因：

1. **詞彙稀有性偏差（Lexical Rarity Bias）**：「美人照鏡」作為專有名詞，在 embedding 空間中的區辨力遠高於「5.11b」這類常見的難度標記。模型傾向給予稀有詞更高的語意權重。

2. **單向量瓶頸（Single-Vector Bottleneck）**：將多個獨立屬性壓縮進單一向量，必然造成資訊損失。難度「5.11b」和名稱「美人照鏡」在向量空間中無法被獨立操作。

3. **訓練分佈偏差**：通用語言模型在預訓練時，「名稱→名稱」的共現模式遠多於「難度→難度」的結構化比對模式，導致模型更擅長名稱匹配。

### 2.2 BM25 的侷限

BM25 作為詞彙匹配方法，雖然能精確匹配「5.11b」，但同樣會受到「美人照鏡」的 TF-IDF 高分影響。在 hybrid search 中，兩個信號可能互相強化錯誤的排序方向。

---

## 3. 業界與學術界的解決方案

### 3.1 Metadata Filtering（元資料過濾）

**核心思路**：將結構化屬性從語意搜尋中抽離，改用精確的元資料過濾。

```
查詢：「推薦類似 5.11b 難度的路線」
→ metadata filter: grade IN ['5.11a', '5.11b', '5.11c']
→ vector search: 僅在過濾後的子集中搜尋語意相似路線
```

**優勢**：

- 難度比對變成精確匹配，不受 embedding 干擾
- 所有主流向量資料庫（Pinecone、Weaviate、Qdrant、Cloudflare Vectorize）皆支援
- 實作成本最低

**侷限**：

- 需要事先解析查詢中的結構化條件（需要 query parser）
- 過濾條件太嚴格可能導致結果過少

**相關實踐**：

- Pinecone 的 [Metadata Filtering](https://docs.pinecone.io/docs/metadata-filtering) 文件明確建議：「對於精確匹配的屬性（如分類、等級），優先使用 metadata filter 而非依賴 embedding 相似度」
- Weaviate 的 Hybrid Search 架構也採用「filter → search」的兩階段模式

### 3.2 結構化查詢分解（Structured Query Decomposition）

**核心思路**：在查詢進入檢索系統前，先用 LLM 或規則引擎將自然語言查詢分解為結構化意圖。

```
原始查詢：「我完攀了美人照鏡 5.11b，推薦我類似難度的路線」

分解結果：
{
  "intent": "recommendation",
  "reference_route": "美人照鏡",
  "reference_grade": "5.11b",
  "criteria": "similar_grade",
  "grade_filter": ["5.11a", "5.11b", "5.11c", "5.11d"],
  "semantic_query": "推薦攀岩路線"
}
```

這個方法在 RAG 系統中被廣泛採用，通常稱為 **Query Understanding** 或 **Query Planning**。

**代表性框架**：

- **LlamaIndex 的 Query Pipeline**：支援將自然語言查詢轉換為結構化查詢，再分發到不同的檢索器
- **LangChain 的 Self-Query Retriever**：用 LLM 自動從查詢中提取 metadata filter 條件
- **Microsoft 的 GraphRAG**：將查詢分解為子問題，分別檢索後合成

**在 Cloudflare Workers 中的實作方式**：

由於 Cloudflare Workers 環境限制（無法使用重量級框架），可以用輕量的規則引擎 + LLM 兩階段方式：

1. **規則引擎優先**：用正則表達式提取已知模式（難度格式如 `5.\d+[a-d]`、`V\d+`）
2. **LLM 補充**：對規則無法處理的複雜查詢，呼叫 Cloudflare AI 的 LLM 進行意圖分解

### 3.3 多欄位 Embedding / Field-Aware Retrieval

**核心思路**：為不同欄位建立獨立的 embedding，在檢索時根據查詢意圖選擇性地使用。

#### 3.3.1 多向量索引（Multi-Vector Indexing）

為每條路線建立多個向量：

```
route_vectors = {
  "name_vector": embed("美人照鏡"),           // 名稱向量
  "description_vector": embed("龍洞經典路線..."), // 描述向量
  "composite_vector": embed("美人照鏡 5.11b Sport 龍洞 砂岩") // 組合向量
}
```

根據查詢意圖選擇使用哪個向量進行搜尋。

**代表性研究**：

- **ColBERT**（Khattab & Zaharia, 2020）：使用 late interaction 機制，為文件中的每個 token 保留獨立向量，在查詢時逐 token 比對。這從根本上解決了單向量瓶頸問題。
- **Multi-Vector Retrieval**：Qdrant 和 Milvus 已支援在同一個 collection 中存儲多個 named vectors，並在查詢時指定使用哪個向量。

#### 3.3.2 Field-Aware Embedding

將欄位名稱作為 prefix 注入 embedding 輸入：

```
embed("grade: 5.11b")       // 而非 embed("5.11b")
embed("route_name: 美人照鏡") // 而非 embed("美人照鏡")
embed("crag: 龍洞")          // 而非 embed("龍洞")
```

這個技巧源自 **Sentence-BERT** 的研究，透過 prefix 提示模型「這段文字的語意角色是什麼」，可以顯著改善同類屬性之間的相似度計算。E5 和 bge 系列模型的 instruction-tuned 版本天然支援這種用法。

#### 3.3.3 Hybrid Structured + Semantic Retrieval

將結構化欄位完全從 embedding 中移除，改用獨立的匹配邏輯：

```
最終分數 = α × semantic_similarity(description)
         + β × grade_distance(query_grade, route_grade)
         + γ × location_match(query_location, route_location)
```

其中 `grade_distance` 是一個確定性函數（如 5.11b 與 5.11a 的距離為 1，與 5.10d 的距離為 2），不經過 embedding。

### 3.4 Query Rewriting / Intent Decomposition

**核心思路**：在檢索前重寫查詢，移除或弱化會干擾語意搜尋的元素。

#### 3.4.1 移除結構化屬性的 Query Rewriting

```
原始查詢：「我完攀了美人照鏡 5.11b，推薦我類似難度的路線」

重寫後：
- semantic_query: "推薦類似風格的攀岩路線"  // 移除名稱和難度
- metadata_filter: { grade_range: ["5.11a", "5.11c"] }  // 結構化條件
```

#### 3.4.2 Multi-Query Retrieval

將一個查詢拆分成多個子查詢，分別檢索後合併：

```
子查詢 1（難度維度）：filter by grade ~5.11b → top 20
子查詢 2（風格維度）：vector search "類似美人照鏡風格" → top 20
合併：intersection or weighted union
```

**相關研究**：

- **RAG-Fusion**（Raudaschl, 2023）：生成多個查詢變體，分別檢索後用 Reciprocal Rank Fusion 合併結果
- **FLARE**（Jiang et al., 2023）：根據生成過程中的不確定性動態觸發檢索
- **Query2Doc**（Wang et al., 2023）：用 LLM 先生成假設性文件，再用該文件去檢索

### 3.5 Learned Sparse Retrieval（學習式稀疏檢索）

bge-m3 模型本身支援三種檢索模式：dense、sparse（learned sparse）、和 ColBERT-style multi-vector。其中 learned sparse retrieval 可以讓模型學習為結構化 token（如「5.11b」）賦予適當的權重，而非依賴 BM25 的 TF-IDF 統計。

**在 bge-m3 中的應用**：

bge-m3 的 sparse 輸出是一個 token → weight 的字典，理論上可以手動調整特定 token 的權重來強化結構化欄位的匹配。但在 Cloudflare Workers 環境中，目前 Workers AI 僅暴露 dense embedding 接口，無法直接使用 sparse 和 ColBERT 模式。

---

## 4. 針對本系統的推薦方案

### 4.1 系統現況

- **Runtime**：Cloudflare Workers（運算資源受限）
- **Embedding**：`@cf/baai/bge-m3`（1024 維 dense vector）
- **向量資料庫**：Cloudflare Vectorize（支援 metadata filtering）
- **搜尋架構**：Vector + BM25 hybrid search
- **查詢分類**：已有 QueryClassifier 和 NLP 過濾器（extractGradeFilter 等）

### 4.2 推薦方案：分層檢索架構（Layered Retrieval）

根據系統限制和問題特性，推薦以下分層方案：

#### 第一層：Query Understanding（查詢理解）

利用現有的 NLP 過濾器強化結構化屬性提取：

```typescript
// 已有的基礎設施
const gradeFilter = extractGradeFilter(query); // 提取難度
const locationFilter = extractLocationFilter(query); // 提取地點
const typeFilter = extractTypeFilter(query); // 提取類型

// 新增：意圖權重判斷
const intentWeights = analyzeQueryIntent(query);
// { grade_weight: 0.8, style_weight: 0.2 } ← "類似難度" 明確指向難度
```

#### 第二層：Metadata Pre-filtering（元資料預過濾）

對已提取的結構化條件，直接使用 Vectorize 的 metadata filter：

```typescript
const results = await vectorize.query(queryVector, {
  topK: 20,
  filter: {
    grade: { $in: getGradeRange("5.11b", (range = 2)) },
    // ["5.11a", "5.11b", "5.11c"] 或更寬的範圍
  },
});
```

#### 第三層：Query Rewriting（查詢重寫）

將查詢中的結構化成分移除後再做 embedding：

```typescript
// 原始查詢 embedding：「我完攀了美人照鏡 5.11b，推薦我類似難度的路線」
// 重寫後 embedding：「推薦攀岩路線」或「類似風格的 sport 路線」
const cleanedQuery = removeStructuredTokens(query, { grade, routeName });
const queryVector = await embed(cleanedQuery);
```

#### 第四層：Score Fusion（分數融合）

```typescript
finalScore = α × vectorSimilarity      // 語意相似度（風格、描述）
           + β × gradeProximity        // 難度接近度（確定性計算）
           + γ × bm25Score             // 詞彙匹配
           + δ × locationBoost         // 地點加分（同岩場/同地區）
```

其中 `gradeProximity` 是一個確定性函數，不經過 embedding：

```typescript
function gradeProximity(queryGrade: string, routeGrade: string): number {
  const distance = Math.abs(
    gradeToNumeric(queryGrade) - gradeToNumeric(routeGrade),
  );
  return Math.max(0, 1 - distance * 0.2); // 每差一級扣 0.2
}
```

### 4.3 實作優先序

| 優先序 | 方案                                             | 實作成本 | 預期效果 |
| ------ | ------------------------------------------------ | -------- | -------- |
| P0     | Metadata pre-filtering（難度範圍過濾）           | 低       | 高       |
| P1     | Query rewriting（移除結構化 token 後再 embed）   | 低       | 中       |
| P2     | Score fusion（加入 gradeProximity 確定性分數）   | 中       | 高       |
| P3     | Intent weight analysis（根據意圖調整各分數權重） | 中       | 中       |

**P0 是最關鍵的改善**：只要在 Vectorize query 時加上 grade 的 metadata filter，就能立即解決「名稱相似蓋過難度相似」的核心問題。這不需要修改 embedding 策略，只需確保路線的 metadata 中包含 grade 欄位。

### 4.4 長期演進方向

1. **Field-Aware Embedding**：在建立路線 embedding 時，為不同欄位加上 prefix（如 `"route_description: ..."` 而非將所有欄位拼接），改善 embedding 品質
2. **Multi-Index Strategy**：為「按難度找路線」和「按風格找路線」建立不同的向量索引
3. **Contextual Compression**：檢索後用 LLM 重新排序（reranking），根據使用者明確的意圖過濾不相關結果

---

## 5. 參考文獻

### 核心論文

1. **Khattab, O., & Zaharia, M.** (2020). _ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT._ Proceedings of SIGIR 2020. — 提出 multi-vector late interaction 機制，解決 single-vector 的資訊瓶頸問題。

2. **Chen, J., Xiao, S., Zhang, P., Luo, K., Lian, D., & Liu, Z.** (2024). _BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity Text Embeddings Through Self-Knowledge Distillation._ Proceedings of ACL 2024. — bge-m3 模型論文，涵蓋 dense、sparse、ColBERT 三種檢索模式。

3. **Wang, L., Yang, N., Huang, X., Jiao, B., Yang, L., Jiang, D., Majumder, R., & Wei, F.** (2023). _Text Embeddings by Weakly-Supervised Contrastive Pre-training._ arXiv:2212.03533. — E5 embedding 模型，證明 instruction prefix 可以顯著改善特定任務的 embedding 品質。

4. **Reimers, N., & Gurevych, I.** (2019). _Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks._ Proceedings of EMNLP 2019. — 奠定了現代 sentence embedding 的基礎架構。

### RAG 與查詢分解

5. **Raudaschl, A.** (2023). _RAG-Fusion: a New Take on Retrieval-Augmented Generation._ arXiv:2402.03367. — 提出多查詢變體 + Reciprocal Rank Fusion 的檢索策略。

6. **Jiang, Z., Xu, F. F., Gao, L., Sun, Z., Liu, Q., Dwivedi-Yu, J., Yang, Y., Callan, J., & Neubig, G.** (2023). _Active Retrieval Augmented Generation._ Proceedings of EMNLP 2023. — FLARE 方法，根據生成不確定性動態觸發檢索。

7. **Wang, L., Yang, N., & Wei, F.** (2023). _Query2Doc: Query Expansion with Large Language Models._ Proceedings of EMNLP 2023. — 用 LLM 生成假設性文件作為查詢擴展。

8. **Ma, X., Gong, Y., He, P., Zhao, H., & Duan, N.** (2023). _Query Rewriting in Retrieval-Augmented Large Language Models._ Proceedings of EMNLP 2023. — 系統性研究查詢重寫對 RAG 效能的影響。

### 結構化檢索與多欄位搜尋

9. **Edge, D., Trinh, H., Cheng, N., Bradley, J., Chao, A., Mody, A., Truber, S., & Larson, J.** (2024). _From Local to Global: A Graph RAG Approach to Query-Focused Summarization._ arXiv:2404.16130. — Microsoft GraphRAG，將查詢分解為子問題再分別檢索。

10. **Gao, Y., Xiong, Y., Jaiswal, A., Srinivasan, H., Li, L., Downey, D., & Mei, H.** (2024). _Retrieval-Augmented Generation for Large Language Models: A Survey._ arXiv:2312.10997. — RAG 綜述論文，涵蓋 pre-retrieval（query rewriting）、retrieval（hybrid search）、post-retrieval（reranking）三階段的最佳實踐。

11. **Formal, T., Piwowarski, B., & Clinchant, S.** (2021). _SPLADE: Sparse Lexical and Expansion Model for First Stage Ranking._ Proceedings of SIGIR 2021. — Learned sparse retrieval 的代表性工作，展示如何讓模型學習 token 級別的重要性權重。

12. **Luan, Y., Eisenstein, J., Toutanova, K., & Collins, M.** (2021). _Sparse, Dense, and Attentional Representations for Text Retrieval._ Transactions of the Association for Computational Linguistics, 9. — 系統性比較 sparse、dense、和 attention-based 檢索方法在不同查詢類型上的表現。

### 產業實踐

13. **Pinecone Documentation.** _Metadata Filtering Best Practices._ — 建議對精確匹配屬性優先使用 metadata filter。

14. **Weaviate Documentation.** _Hybrid Search Architecture._ — 展示 filter-first 的兩階段檢索架構。

15. **LangChain Documentation.** _Self-Query Retriever._ — 用 LLM 自動從自然語言查詢中提取 metadata filter 條件的實作範例。

---

_本文件撰寫於 2026-03-27，針對 NobodyClimb 攀岩社群平台的 RAG 推薦系統問題進行研究整理。_
