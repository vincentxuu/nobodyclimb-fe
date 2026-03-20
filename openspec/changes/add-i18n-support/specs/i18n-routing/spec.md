## ADDED Requirements

### Requirement: Locale prefix routing
系統 SHALL 透過 URL prefix 區分語言：繁中為預設語言（無 prefix），英文使用 `/en/...`，日文使用 `/ja/...`。middleware 使用 next-intl `createMiddleware`，`localePrefix: 'as-needed'`。

#### Scenario: Default locale no prefix
- **WHEN** 使用者訪問 `/crag`
- **THEN** 系統顯示繁體中文介面，URL 保持 `/crag` 不變

#### Scenario: English locale with prefix
- **WHEN** 使用者訪問 `/en/crag`
- **THEN** 系統顯示英文介面

#### Scenario: Japanese locale with prefix
- **WHEN** 使用者訪問 `/ja/crag`
- **THEN** 系統顯示日文介面

#### Scenario: Unknown locale fallback
- **WHEN** 使用者訪問不存在的語言 prefix（如 `/fr/crag`）
- **THEN** middleware redirect 至預設語言 `/crag`

### Requirement: Locale-aware App Router layout
系統 SHALL 在 `app/[locale]/layout.tsx` 設定 `<html lang={locale}>`，並初始化 `NextIntlClientProvider`，使 Client Components 可取用翻譯。

#### Scenario: HTML lang attribute set correctly
- **WHEN** 頁面以 `/en/...` 訪問
- **THEN** `<html lang="en">` 被渲染

#### Scenario: Client Component translation access
- **WHEN** Client Component 呼叫 `useTranslations('Navbar')`
- **THEN** 回傳當前語言的翻譯字串

### Requirement: Locale switcher navigation
系統 SHALL 提供語言切換 UI，切換時保留當前頁面路徑，僅替換語言 segment。

#### Scenario: Switch language preserves path
- **WHEN** 使用者在 `/en/crag/12` 點擊切換至日文
- **THEN** 瀏覽器導航至 `/ja/crag/12`

#### Scenario: Switch from default locale
- **WHEN** 使用者在 `/crag/12`（繁中）點擊切換至英文
- **THEN** 瀏覽器導航至 `/en/crag/12`
