import React from 'react'
import Markdown from 'react-native-markdown-display'
import { SEMANTIC_COLORS, FONT_SIZE, SPACING, WB_COLORS, RADIUS } from '@nobodyclimb/constants'

export interface MarkdownTextProps {
  children: string
}

export function MarkdownText({ children }: MarkdownTextProps) {
  return (
    <Markdown
      style={{
        body: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZE.base,
          lineHeight: FONT_SIZE.base * 1.6,
        },
        heading1: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZE['2xl'],
          fontWeight: '700',
          marginBottom: SPACING.sm,
        },
        heading2: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZE.xl,
          fontWeight: '700',
          marginBottom: SPACING.xs,
        },
        heading3: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZE.lg,
          fontWeight: '600',
          marginBottom: SPACING.xs,
        },
        strong: { fontWeight: '700' },
        em: { fontStyle: 'italic' },
        bullet_list: { marginLeft: SPACING.md },
        ordered_list: { marginLeft: SPACING.md },
        list_item: {
          color: SEMANTIC_COLORS.textMain,
          fontSize: FONT_SIZE.base,
        },
        code_inline: {
          backgroundColor: WB_COLORS[10],
          borderRadius: RADIUS.xs,
          paddingHorizontal: SPACING.xs,
          fontSize: FONT_SIZE.sm,
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
          color: SEMANTIC_COLORS.success,
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
