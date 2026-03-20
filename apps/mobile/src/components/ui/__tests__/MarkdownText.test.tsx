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
