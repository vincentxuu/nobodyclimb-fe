## ADDED Requirements

### Requirement: Translation message files
系統 SHALL 在 `apps/web/messages/` 維護三個 JSON 翻譯檔：`zh.json`（繁中，必須完整）、`en.json`、`ja.json`。訊息以 namespace 分層（e.g., `Navbar`、`HomePage`、`CragPage`）。

#### Scenario: Missing key fallback
- **WHEN** `en.json` 缺少某個 key
- **THEN** next-intl 拋出型別錯誤（TypeScript），build 時即可發現遺漏

#### Scenario: Namespace access in Server Component
- **WHEN** Server Component 呼叫 `const t = await getTranslations('Navbar')`
- **THEN** 回傳當前 locale 對應的翻譯函式

### Requirement: Type-safe translation keys
系統 SHALL 透過 next-intl TypeScript 整合，對翻譯 key 提供型別檢查。`apps/web/src/i18n.ts` 設定 `Messages` 型別指向 `zh.json`。

#### Scenario: Invalid key causes TypeScript error
- **WHEN** 開發者使用 `t('nonExistentKey')`
- **THEN** TypeScript 回報型別錯誤

### Requirement: Client Component translation access
系統 SHALL 允許 Client Components 透過 `useTranslations` hook 取用翻譯，前提是祖先 layout 已包裹 `NextIntlClientProvider`。

#### Scenario: Hook returns correct locale string
- **WHEN** Client Component 在 `/ja/gym` 頁面呼叫 `useTranslations('GymPage')`
- **THEN** 回傳日文翻譯字串
