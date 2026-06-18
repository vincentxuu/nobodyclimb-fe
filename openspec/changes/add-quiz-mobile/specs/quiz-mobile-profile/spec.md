## ADDED Requirements

### Requirement: Profile 人格徽章

Profile 頁面（`app/(tabs)/profile.tsx`）SHALL 在用戶頭像 / 基本資訊區塊下方顯示人格徽章。

徽章資料來源：
- 已登入用戶：`GET /api/v1/quiz/results/me` 取得 `latest` 結果的 `personality_type`
- 或由 `users.personality_type` 欄位直接從 auth store 取得

#### Scenario: 已測驗用戶顯示徽章

- **WHEN** 已登入用戶的 `personality_type` 不為 null
- **THEN** 顯示人格徽章：型態 SVG 圖示（小尺寸 32x32）+ 型態代碼（如「PGB」）+ 中文名稱（如「碎岩者」），背景使用型態淺色。點擊可導航至 `/quiz/result/[type]` 查看完整結果

#### Scenario: 未測驗用戶顯示 CTA

- **WHEN** 已登入用戶的 `personality_type` 為 null
- **THEN** 顯示 CTA 區塊：「探索你的攀岩人格」文字 + 「測測看」按鈕，點擊導航至 `/quiz`

#### Scenario: 未登入用戶

- **WHEN** 未登入用戶查看 Profile Tab
- **THEN** 不顯示人格徽章區塊（Profile Tab 已有登入導流，無需重複）

### Requirement: QuizProfileBadge 元件

`apps/mobile/src/components/quiz/QuizProfileBadge.tsx` SHALL 為獨立可複用元件，接收以下 props：

```typescript
interface QuizProfileBadgeProps {
  personalityType: PersonalityTypeCode | null
  size?: 'sm' | 'md'  // sm 用於 Profile 列表，md 用於 Profile 主頁
  onPress?: () => void
}
```

使用現有 UI 元件（`Card`、`Text`、`Button`、`Badge`）組合，遵循 `SEMANTIC_COLORS`、`SPACING` 設計規範。

#### Scenario: 小尺寸徽章

- **WHEN** `size="sm"`
- **THEN** 僅顯示 SVG 圖示（24x24）+ 代碼文字，適合 inline 展示

#### Scenario: 中尺寸徽章

- **WHEN** `size="md"`（預設）
- **THEN** 顯示完整徽章：SVG 圖示（32x32）+ 代碼 + 中文名稱 + 背景色
