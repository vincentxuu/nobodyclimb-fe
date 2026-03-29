import { fireEvent, render } from '@testing-library/react-native'
import { RecommendationCard } from '../RecommendationCard'

jest.mock('@/components/ui', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    ...jest.requireActual('@/components/ui'),
    MarkdownText: ({ children }: { children: string }) => React.createElement(Text, null, children),
  }
})

const MOCK_REC = {
  id: 'r1',
  triggered_by: 'ascent' as const,
  status: 'success' as const,
  recommendation: {
    answer: '推薦你嘗試龍洞南壁的 5.10a 路線，適合你目前的程度。',
    sources: [
      {
        id: 's1',
        type: 'route' as const,
        title: '藍色海灣',
        excerpt: '經典路線',
        url: 'https://example.com',
        score: 0.9,
      },
    ],
    context_ascents: [{ id: 'a1' }],
  },
  created_at: '2024-01-15T10:00:00Z',
}

describe('RecommendationCard', () => {
  it('renders trigger label and ascent count', () => {
    const { getByText } = render(<RecommendationCard recommendation={MOCK_REC} />)
    expect(getByText('完攀後推薦')).toBeTruthy()
    expect(getByText('1 條完攀記錄')).toBeTruthy()
  })

  it('is collapsed by default', () => {
    const { queryByText } = render(<RecommendationCard recommendation={MOCK_REC} />)
    expect(queryByText('藍色海灣')).toBeNull()
  })

  it('expands when header is pressed', () => {
    const { getByTestId, getByText } = render(<RecommendationCard recommendation={MOCK_REC} />)
    fireEvent.press(getByTestId('recommendation-header'))
    expect(getByText('藍色海灣')).toBeTruthy()
  })

  it('collapses when header is pressed again', () => {
    const { getByTestId, queryByText } = render(<RecommendationCard recommendation={MOCK_REC} />)
    fireEvent.press(getByTestId('recommendation-header'))
    fireEvent.press(getByTestId('recommendation-header'))
    expect(queryByText('藍色海灣')).toBeNull()
  })

  it('renders manual trigger label', () => {
    const { getByText } = render(
      <RecommendationCard recommendation={{ ...MOCK_REC, triggered_by: 'manual' }} />
    )
    expect(getByText('手動觸發')).toBeTruthy()
  })

  it('renders failed status gracefully', () => {
    expect(() =>
      render(<RecommendationCard recommendation={{ ...MOCK_REC, status: 'failed' }} />)
    ).not.toThrow()
  })
})
