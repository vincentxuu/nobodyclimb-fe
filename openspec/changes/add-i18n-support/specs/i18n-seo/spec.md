## ADDED Requirements

### Requirement: Locale-aware generateMetadata
系統 SHALL 在每個頁面的 `generateMetadata` 中接受 `{ params: { locale } }`，並回傳對應語言的 `title`、`description`，以及所有語言版本的 `alternates.languages` hreflang。

#### Scenario: Metadata title in correct language
- **WHEN** 搜尋引擎抓取 `/en/crag`
- **THEN** `<title>` 為英文標題，`<html lang="en">`

#### Scenario: hreflang alternate links present
- **WHEN** 任意語言頁面被渲染
- **THEN** `<head>` 包含三個 `<link rel="alternate" hreflang="...">` 標籤（zh、en、ja）及一個 `hreflang="x-default"`（指向繁中 URL）

### Requirement: Multilingual sitemap
系統 SHALL 更新 `sitemap.ts`，為每個靜態及動態頁面輸出三語言 URL，以符合 Google 多語言 SEO 最佳實踐。

#### Scenario: Sitemap includes all locale variants
- **WHEN** 搜尋引擎抓取 `/sitemap.xml`
- **THEN** 每個頁面 URL 出現三次（無 prefix、`/en/`、`/ja/`）

#### Scenario: Dynamic pages in sitemap
- **WHEN** 岩場 `/crag/12` 存在
- **THEN** sitemap 包含 `/crag/12`、`/en/crag/12`、`/ja/crag/12`

### Requirement: Open Graph locale metadata
系統 SHALL 在 `generateMetadata` 的 `openGraph.locale` 欄位設定當前語言，並在 `openGraph.alternateLocale` 列出其他語言，使社群分享卡片顯示正確語言。

#### Scenario: OG locale matches page language
- **WHEN** `/en/gym` 被分享至社群媒體
- **THEN** OG `locale` 為 `en_US`，`alternateLocale` 包含 `zh_TW`、`ja_JP`
