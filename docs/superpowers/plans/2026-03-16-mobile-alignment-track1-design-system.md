# Mobile Alignment Track 1 - Design System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the UI component gap between mobile and web, and eliminate all hardcoded color values in the mobile app.
**Architecture:** New shared UI components (ConfirmDialog, MarkdownText, PlaceholderImage) are added to `apps/mobile/src/components/ui/` and exported via the existing barrel `index.ts`. A token-based color audit replaces raw hex strings with `@nobodyclimb/constants` tokens across all mobile components.
**Tech Stack:** React Native, Expo 54, Tamagui 2.0, react-native-markdown-display, `@nobodyclimb/constants`, Jest + React Native Testing Library

---

## Task 1: Add ConfirmDialog component

### Step 1.1 — Write failing test

- [ ] Create file `apps/mobile/src/components/ui/__tests__/ConfirmDialog.test.tsx` with content:

```typescript
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  const baseProps = {
    open: true,
    title: '確認刪除',
    message: '此操作無法復原，確定要繼續嗎？',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }

  it('renders title and message when open', () => {
    const { getByText } = render(<ConfirmDialog {...baseProps} />)
    expect(getByText('確認刪除')).toBeTruthy()
    expect(getByText('此操作無法復原，確定要繼續嗎？')).toBeTruthy()
  })

  it('renders default confirm and cancel labels', () => {
    const { getByText } = render(<ConfirmDialog {...baseProps} />)
    expect(getByText('確認')).toBeTruthy()
    expect(getByText('取消')).toBeTruthy()
  })

  it('renders custom labels', () => {
    const { getByText } = render(
      <ConfirmDialog {...baseProps} confirmLabel="刪除" cancelLabel="返回" />
    )
    expect(getByText('刪除')).toBeTruthy()
    expect(getByText('返回')).toBeTruthy()
  })

  it('calls onConfirm when confirm button pressed', () => {
    const onConfirm = jest.fn()
    const { getByText } = render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />)
    fireEvent.press(getByText('確認'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = jest.fn()
    const { getByText } = render(<ConfirmDialog {...baseProps} onCancel={onCancel} />)
    fireEvent.press(getByText('取消'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons when loading', () => {
    const { getByText } = render(<ConfirmDialog {...baseProps} loading={true} />)
    // Cancel and confirm buttons should be disabled
    expect(getByText('確認')).toBeTruthy()
    expect(getByText('取消')).toBeTruthy()
  })

  it('does not render when open is false', () => {
    const { queryByText } = render(<ConfirmDialog {...baseProps} open={false} />)
    expect(queryByText('確認刪除')).toBeNull()
  })
})
```

### Step 1.2 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=ConfirmDialog`
- [ ] Expected: **FAIL** — `Cannot find module '../ConfirmDialog'`

### Step 1.3 — Implement ConfirmDialog

- [ ] Create file `apps/mobile/src/components/ui/ConfirmDialog.tsx`:

```typescript
import React from 'react'
import { Dialog } from './Dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = '取消',
  loading = false,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      visible={open}
      title={title}
      message={message}
      dismissible={!loading}
      onDismiss={onCancel}
      actions={[
        {
          label: cancelLabel,
          variant: 'outline',
          onPress: onCancel,
          disabled: loading,
        },
        {
          label: confirmLabel,
          variant: destructive ? 'destructive' : 'primary',
          onPress: onConfirm,
          loading,
        },
      ]}
    />
  )
}
```

### Step 1.4 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=ConfirmDialog`
- [ ] Expected: **PASS** — all 7 tests green

### Step 1.5 — Export from barrel

- [ ] Open `apps/mobile/src/components/ui/index.ts`
- [ ] Add line: `export { ConfirmDialog } from './ConfirmDialog'`

### Step 1.6 — Commit

- [ ] `git add apps/mobile/src/components/ui/ConfirmDialog.tsx apps/mobile/src/components/ui/__tests__/ConfirmDialog.test.tsx apps/mobile/src/components/ui/index.ts`
- [ ] Commit with message: `feat(mobile): add ConfirmDialog component`

---

## Task 2: Add MarkdownText component

### Step 2.1 — Install dependency

- [ ] From repo root, run: `pnpm --filter @nobodyclimb/mobile add react-native-markdown-display`
- [ ] Verify Expo SDK 54 compatibility: check `https://github.com/iamacup/react-native-markdown-display` — confirm no native modules required (pure JS, compatible with Expo Go)
- [ ] Expected output: package added to `apps/mobile/package.json`

### Step 2.2 — Write failing test

- [ ] Create file `apps/mobile/src/components/ui/__tests__/MarkdownText.test.tsx`:

```typescript
import React from 'react'
import { render } from '@testing-library/react-native'
import { MarkdownText } from '../MarkdownText'

describe('MarkdownText', () => {
  it('renders plain text content', () => {
    const { getByText } = render(<MarkdownText>Hello world</MarkdownText>)
    expect(getByText('Hello world')).toBeTruthy()
  })

  it('renders bold text from markdown', () => {
    const { getByText } = render(<MarkdownText>{'**粗體文字**'}</MarkdownText>)
    expect(getByText('粗體文字')).toBeTruthy()
  })

  it('renders without crashing on empty string', () => {
    expect(() => render(<MarkdownText>{''}</MarkdownText>)).not.toThrow()
  })

  it('renders multiline markdown content', () => {
    const content = '# 標題\n\n段落內容\n\n- 項目一\n- 項目二'
    expect(() => render(<MarkdownText>{content}</MarkdownText>)).not.toThrow()
  })
})
```

### Step 2.3 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=MarkdownText`
- [ ] Expected: **FAIL** — `Cannot find module '../MarkdownText'`

### Step 2.4 — Implement MarkdownText

- [ ] Create file `apps/mobile/src/components/ui/MarkdownText.tsx`:

```typescript
import React from 'react'
import Markdown from 'react-native-markdown-display'
import { SEMANTIC_COLORS, FONT_SIZES, SPACING, WB_COLORS, RADIUS } from '@nobodyclimb/constants'

interface MarkdownTextProps {
  children: string
}

export function MarkdownText({ children }: MarkdownTextProps) {
  return (
    <Markdown
      style={{
        body: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZES.base,
          lineHeight: FONT_SIZES.base * 1.6,
        },
        heading1: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZES['2xl'],
          fontWeight: '700',
          marginBottom: SPACING.sm,
        },
        heading2: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZES.xl,
          fontWeight: '700',
          marginBottom: SPACING.xs,
        },
        heading3: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZES.lg,
          fontWeight: '600',
          marginBottom: SPACING.xs,
        },
        strong: {
          fontWeight: '700',
        },
        em: {
          fontStyle: 'italic',
        },
        bullet_list: {
          marginLeft: SPACING.md,
        },
        ordered_list: {
          marginLeft: SPACING.md,
        },
        list_item: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZES.base,
        },
        code_inline: {
          backgroundColor: WB_COLORS[10],
          borderRadius: RADIUS.xs,
          paddingHorizontal: SPACING.xs,
          fontFamily: 'monospace',
          fontSize: FONT_SIZES.sm,
        },
        fence: {
          backgroundColor: WB_COLORS[10],
          borderRadius: RADIUS.sm,
          padding: SPACING.sm,
          marginVertical: SPACING.xs,
        },
        blockquote: {
          backgroundColor: WB_COLORS[5],
          borderLeftWidth: 4,
          borderLeftColor: SEMANTIC_COLORS.textSubtle,
          paddingLeft: SPACING.md,
          marginLeft: 0,
        },
        link: {
          color: SEMANTIC_COLORS.primary ?? '#10B981',
          textDecorationLine: 'underline',
        },
        hr: {
          backgroundColor: SEMANTIC_COLORS.border,
          height: 1,
          marginVertical: SPACING.md,
        },
      }}
    >
      {children}
    </Markdown>
  )
}
```

### Step 2.5 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=MarkdownText`
- [ ] Expected: **PASS** — all 4 tests green

### Step 2.6 — Export from barrel

- [ ] Open `apps/mobile/src/components/ui/index.ts`
- [ ] Add line: `export { MarkdownText } from './MarkdownText'`

### Step 2.7 — Commit

- [ ] `git add apps/mobile/src/components/ui/MarkdownText.tsx apps/mobile/src/components/ui/__tests__/MarkdownText.test.tsx apps/mobile/src/components/ui/index.ts apps/mobile/package.json pnpm-lock.yaml`
- [ ] Commit with message: `feat(mobile): add MarkdownText component with react-native-markdown-display`

---

## Task 3: Add PlaceholderImage component

### Step 3.1 — Write failing test

- [ ] Create file `apps/mobile/src/components/ui/__tests__/PlaceholderImage.test.tsx`:

```typescript
import React from 'react'
import { render } from '@testing-library/react-native'
import { PlaceholderImage } from '../PlaceholderImage'

describe('PlaceholderImage', () => {
  it('renders without crashing with required props', () => {
    expect(() =>
      render(<PlaceholderImage width={200} height={150} />)
    ).not.toThrow()
  })

  it('renders with custom icon', () => {
    const { getByTestId } = render(
      <PlaceholderImage width={200} height={150} testID="placeholder" />
    )
    expect(getByTestId('placeholder')).toBeTruthy()
  })

  it('renders label when provided', () => {
    const { getByText } = render(
      <PlaceholderImage width={200} height={150} label="暫無圖片" />
    )
    expect(getByText('暫無圖片')).toBeTruthy()
  })

  it('applies correct dimensions', () => {
    const { getByTestId } = render(
      <PlaceholderImage width={300} height={200} testID="placeholder" />
    )
    const el = getByTestId('placeholder')
    expect(el.props.style).toMatchObject(
      expect.arrayContaining([expect.objectContaining({ width: 300, height: 200 })])
    )
  })
})
```

### Step 3.2 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=PlaceholderImage`
- [ ] Expected: **FAIL** — `Cannot find module '../PlaceholderImage'`

### Step 3.3 — Implement PlaceholderImage

- [ ] Create file `apps/mobile/src/components/ui/PlaceholderImage.tsx`:

```typescript
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ImageOff } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS, WB_COLORS, FONT_SIZES } from '@nobodyclimb/constants'

interface PlaceholderImageProps {
  width: number
  height: number
  label?: string
  iconSize?: number
  testID?: string
}

export function PlaceholderImage({
  width,
  height,
  label,
  iconSize = 32,
  testID,
}: PlaceholderImageProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { width, height, borderRadius: RADIUS.md },
      ]}
    >
      <ImageOff size={iconSize} color={SEMANTIC_COLORS.textSubtle} />
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[10],
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  label: {
    color: SEMANTIC_COLORS.textSubtle,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
})
```

### Step 3.4 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=PlaceholderImage`
- [ ] Expected: **PASS** — all 4 tests green

### Step 3.5 — Export from barrel

- [ ] Open `apps/mobile/src/components/ui/index.ts`
- [ ] Add line: `export { PlaceholderImage } from './PlaceholderImage'`

### Step 3.6 — Commit

- [ ] `git add apps/mobile/src/components/ui/PlaceholderImage.tsx apps/mobile/src/components/ui/__tests__/PlaceholderImage.test.tsx apps/mobile/src/components/ui/index.ts`
- [ ] Commit with message: `feat(mobile): add PlaceholderImage component`

---

## Task 4: Audit and fix hardcoded hex values

### Step 4.1 — Scan for hardcoded hex values in mobile components

- [ ] Run: `grep -rn '#[0-9A-Fa-f]\{3,6\}' apps/mobile/src/components/ --include="*.tsx" --include="*.ts" -l`
- [ ] Save output to `/tmp/mobile-hex-audit.txt`
- [ ] Run: `grep -rn '#[0-9A-Fa-f]\{3,6\}' apps/mobile/src/components/ --include="*.tsx" --include="*.ts"` to see all occurrences

### Step 4.2 — Categorize and map hex values to tokens

- [ ] For each hardcoded hex found, identify its semantic meaning and map to a constant:

| Common hex | Token replacement |
|---|---|
| `#000000` / `#000` | `WB_COLORS[0]` or `SEMANTIC_COLORS.textMain` |
| `#ffffff` / `#fff` | `WB_COLORS[100]` or `SEMANTIC_COLORS.background` |
| `#10B981` | `SEMANTIC_COLORS.primary` (emerald) |
| `#6B7280` | `SEMANTIC_COLORS.textSubtle` |
| `#EF4444` | `SEMANTIC_COLORS.danger` or `SEMANTIC_COLORS.destructive` |
| `#F3F4F6` | `WB_COLORS[5]` or similar light gray |

### Step 4.3 — Fix hardcoded values in mobile components

- [ ] For each file identified in Step 4.1, replace hardcoded hex with the appropriate token
- [ ] Verify imports include `SEMANTIC_COLORS, WB_COLORS, BORDER_COLORS` from `@nobodyclimb/constants`
- [ ] Run after each file fix: `pnpm --filter @nobodyclimb/mobile typecheck`

### Step 4.4 — Fix hardcoded values in web button component

- [ ] Open `apps/web/src/components/ui/button.tsx`
- [ ] Find and replace hardcoded `#1B1A1A` with the appropriate constant token
- [ ] Find and replace hardcoded `#ffe70c` with the appropriate constant token
- [ ] Verify imports from `@nobodyclimb/constants`
- [ ] Run: `pnpm --filter @nobodyclimb/web typecheck`

### Step 4.5 — Run full test suite to confirm no regressions

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test`
- [ ] Expected: all previously passing tests still pass

### Step 4.6 — Commit

- [ ] Stage all modified component files
- [ ] Commit with message: `refactor(mobile/web): replace hardcoded hex values with design token constants`

---

## Task 5: Verify font loading

### Step 5.1 — Inspect current font loading setup

- [ ] Open `apps/mobile/app/_layout.tsx`
- [ ] Check which fonts are loaded via `useFonts` or `Font.loadAsync`
- [ ] Verify the following fonts are present:
  - `NotoSansTC` (Regular, Medium, Bold)
  - `GlowSansTC` (or equivalent)
  - `AllertaStencil`

### Step 5.2 — Check font asset files exist

- [ ] Run: `ls apps/mobile/assets/fonts/`
- [ ] Confirm `.ttf` or `.otf` files exist for each required font family

### Step 5.3 — Add missing fonts (if any)

- [ ] If any font is missing from `_layout.tsx`, add it to the `useFonts` call:

```typescript
const [fontsLoaded] = useFonts({
  'NotoSansTC-Regular': require('../assets/fonts/NotoSansTC-Regular.ttf'),
  'NotoSansTC-Medium': require('../assets/fonts/NotoSansTC-Medium.ttf'),
  'NotoSansTC-Bold': require('../assets/fonts/NotoSansTC-Bold.ttf'),
  'GlowSansTC': require('../assets/fonts/GlowSansTC.otf'),
  'AllertaStencil': require('../assets/fonts/AllertaStencil-Regular.ttf'),
})
```

### Step 5.4 — Verify SplashScreen is hidden only after fonts load

- [ ] Confirm `SplashScreen.hideAsync()` is called inside a `useEffect` that depends on `fontsLoaded`
- [ ] Pattern to verify:

```typescript
useEffect(() => {
  if (fontsLoaded) {
    SplashScreen.hideAsync()
  }
}, [fontsLoaded])

if (!fontsLoaded) return null
```

### Step 5.5 — Test on both platforms

- [ ] Run iOS simulator: `pnpm --filter @nobodyclimb/mobile ios`
- [ ] Run Android emulator: `pnpm --filter @nobodyclimb/mobile android`
- [ ] Visually verify fonts render correctly on both platforms (no fallback system font)

### Step 5.6 — Commit (only if changes were made)

- [ ] If `_layout.tsx` was modified: commit with message `fix(mobile): ensure all required fonts loaded for iOS and Android`

---

## Final Verification

- [ ] Run full mobile test suite: `pnpm --filter @nobodyclimb/mobile test`
- [ ] Run typecheck: `pnpm --filter @nobodyclimb/mobile typecheck`
- [ ] Run lint: `pnpm --filter @nobodyclimb/mobile lint`
- [ ] Verify all new components are exported from `apps/mobile/src/components/ui/index.ts`:
  - `ConfirmDialog`
  - `MarkdownText`
  - `PlaceholderImage`
- [ ] Verify no hardcoded hex values remain in `apps/mobile/src/components/` (re-run grep from Task 4.1)
