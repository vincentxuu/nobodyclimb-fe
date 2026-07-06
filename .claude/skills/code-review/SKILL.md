---
name: code-review
description: Push 前 review 整個 branch 的變更，檢查邏輯錯誤、安全問題、效能問題、架構一致性
---

# Code Review

Review 當前 branch 相對於 base branch 的所有變更。

## 步驟 1：取得變更範圍

Base branch 是 **`origin/develop`**（本 repo 的 default branch；`main` 是 production）。

1. 執行 `git log --oneline origin/develop...HEAD` 確認 commit 數量
2. 執行 `git diff origin/develop...HEAD --stat` 確認變更檔案範圍

## 步驟 2：機械檢查先行

先執行 `bash scripts/check-conventions.sh`，把可機械判定的慣例違規先抓出來，
review 火力集中在機器抓不到的問題。

## 步驟 3：逐檔 Review

對每個變更的檔案，執行 `git diff origin/develop...HEAD -- <file>` 讀取 diff，檢查：

- **不變量**：是否違反 `project-rules` skill 的不變量清單（回應信封、共用型別位置、
  schema/migration 同步、dist 消費等）——逐條對照
- **邏輯錯誤**：edge case、null/undefined 未處理、async 錯誤處理
- **安全問題**：XSS、硬編碼 secret、SQL 字串拼接（D1 一律 prepare + bind）、JWT 處理
- **效能問題**：不必要的 re-render、D1 query 效能（N+1）、KV/R2 過度呼叫、bundle size
- **架構一致性**：是否照抄了正確的範例檔（各 playbook skill 內有指定範例）

## 步驟 4：回報結果

以表格格式列出發現的問題：

| 嚴重度 | 檔案 | 問題 | 建議 |
|--------|------|------|------|

嚴重度分三級：
- **High**：必須修，有 bug 或安全風險
- **Medium**：建議修，效能或可維護性問題
- **Low**：可選，風格或小優化

## 步驟 5：處理問題

- High 問題 → 詢問使用者是否要修復
- Medium / Low → 列出即可，由使用者決定
