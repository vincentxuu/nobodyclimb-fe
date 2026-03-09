# RAG 評估測試案例填寫指南

## 黃金測試集欄位規格

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | string | 是 | 格式 `GT-NNN`，三位數字流水號 |
| `query` | string | 是 | 使用者自然語言查詢（繁中） |
| `category` | enum | 是 | `simple` / `complex` / `general-knowledge` / `edge-case` |
| `expected_tool` | enum | 是 | `search_routes` / `search_crags` / `general_knowledge` / `search_sql` / `hybrid` |
| `expected_answer_keywords` | string[] | 是 | 預期回答應包含的關鍵字（大小寫不敏感） |
| `ci` | boolean | 否 | 是否納入 CI 快速子集（至少 50 筆，四種 category 各 ≥5） |
| `expected_filters` | object | 否 | 預期 NLP 解析出的篩選條件 |
| `expected_min_results` | number | 否 | 預期至少回傳筆數 |
| `expected_source_ids` | string[] | 否 | 預期在 top-5 sources 中出現的 ID |
| `ground_truth_answer` | string | 否 | 參考標準答案（供人工比對） |

## expected_tool 選擇指南

| Tool | 適用場景 | 查詢範例 |
|------|----------|----------|
| `search_routes` | 語義搜尋路線，含主觀/描述性詞彙 | 「找一些風景好的路線」「適合練先鋒的路線」 |
| `search_crags` | 查岩場資訊、特色、交通、警告 | 「關子嶺岩場的特色」「龍洞怎麼去」 |
| `general_knowledge` | 攀岩通識、裝備、技巧、安全 | 「什麼是先鋒攀登」「如何選岩鞋」 |
| `search_sql` | 精確計數、統計、列表篩選 | 「龍洞有幾條 5.12 路線」「各岩場路線數量排名」 |
| `hybrid` | 推薦型查詢（SQL 候選 + LLM 排序） | 「推薦我一些 5.10 的 sport 路線」 |

## expected_filters 欄位對照

```json
{
  "location": "龍洞",          // 精確匹配岩場名
  "grade_gte": "5.10a",        // 難度下限（含）
  "grade_lte": "5.11d",        // 難度上限（含）
  "type": "sport"              // route_type: sport / trad / boulder / mixed
}
```

## category 分類指南

- **simple**：單一事實查詢，可直接對應一個 tool + 明確 filter
- **complex**：比較、推薦、多條件、跨岩場統計
- **general-knowledge**：不涉及特定岩場/路線的攀岩通識
- **edge-case**：無結果查詢、模糊查詢、幻覺誘導（不存在的岩場/路線）

## 可用岩場資料

| 岩場 | 地區 | 岩質 | 攀登類型 | 路線數 | 難度範圍 |
|------|------|------|----------|--------|----------|
| 龍洞 | 北部 | 四稜砂岩 | mixed | 616 | 5.6–5.12d |
| 墾丁 | 南部 | 珊瑚礁石灰岩 | sport | 120 | 5.10–5.13d |
| 壽山 | 南部 | 珊瑚礁石灰岩 | sport | 107 | 5.10a–5.13a |
| 關子嶺 | 南部 | 珊瑚礁石灰岩 | sport | 50 | 5.10a–5.13b |
| 德芙蘭 | 中部 | 石英質砂岩 | mixed | 53 | 5.6–5.12b |

## 範例路線（用於 expected_answer_keywords）

- 龍洞：肥牛(5.6)、瘦馬(5.9)、最後懸岩(5.11d)、直上(5.12b)
- 墾丁：小精靈(5.10b)、遺落海岸(5.11a)、亞克路(5.11b)
- 壽山：安心亞(5.10d)、福德正神(5.11b)、一顆小樹(5.12c)
- 關子嶺：小樹(5.11b)、野地飛鼠(5.12c)、天龍八步(5.13b)
- 德芙蘭：花果山十三太保(5.9)、想吃自己打(5.10b)、迎向光明(5.11b)
